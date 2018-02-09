// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
/* tslint:disable:max-classes-per-file */
import _ = require("lodash");
import {getDefaultLogger} from "../helpers/logging/DefaultLogger";

/**
 * A tree database that you can use to centrally store your application state in. Application
 * develops are encouraged not to use the SkeletosDb API directly, but rather build on top
 * of AbstractSkeletosState instead.
 *
 * ----------------------
 * AbstractSkeletosState
 * ----------------------
 * SkeletosCursor
 * ----------------------
 * SkeletosDb       <--- We are here
 * ----------------------
 *
 * Internal details are provided in the constructor documentation.
 */
export class SkeletosDb {

    /**
     * This is the root node in the tree.
     */
    private _rootNode: ITreeNode;

    /**
     * Whenever we need to fetch a node from the tree, we need to do it from the root. However, this
     * results in O(lg n) access. By using a random access cache however allows us to do it in O(1) time.
     *
     * However, this cache would be reset with every set because calculating when needs to be removed
     * after a set can be very expensive (think about the nested children, parents, referencing, etc. and
     * you will see it is an O(n) traversal, which we cannot afford on a simple set).
     *
     * @type {{}}
     * @private
     */
    private _nodeCache: ITreeNodeIndex = {};

    /**
     * The listeners that need to be notified after a set takes place.
     *
     * @type {Array}
     * @private
     */
    private _listeners: ISkeletosDbListener[] = [];

    /**
     * The timestamp of when we triggered listeners last. Helps in dirty node hash recalculation.
     *
     * @type {number}
     * @private
     */
    private _lastListenerTriggerTimestamp: number = new Date().getTime();

    /**
     * This value gets incremented every time we generate a new hash value. It acts as a seed to
     * the unique value generation.
     *
     * @type {number}
     * @private
     */
    private _hashSeedCounter: number = 0;

    /**
     * These are paths that had set called upon them. We need to use these paths to walk up the
     * parent hierarchy, as well as items referencing the dirty paths and the parent hierarchy
     * of those referencing items, to update the hashes of all nodes affected.
     *
     * @type {{}}
     * @private
     */
    private _dirtyPathIndex: IPathBooleanIndex = {};

    /**
     * Whether we should run the update job to figure out, given all the dirty paths in the
     * dirty path index, what paths require their hashes to be updated.
     * updated.
     *
     * @type {boolean}
     * @private
     */
    private _shouldRunUpdate: boolean = false;

    /**
     * A fast and efficient tree database that supports cross node references (behaves like a directed
     * graph), as well as support for transactions and unique hash values.
     *
     * Full list of features:
     *
     * 1. Every node has a unique hash value assigned. When you set a value on a node, the hash value of
     * that node gets updated. In addition, all the hash values from that node up to the root (path too root)
     * are changed. This is perfect when you want to build UI applications with a technology like React as
     * each node can represent a Node, and updating a value will allow all components to the root to get updated.
     *
     * 2. A node can be a reference to another node. A referencing node will always take up the same value
     * as the node it references. However, the hash value of a referencing node and a referenced node will be
     * different.
     *
     * 3. Given (1) and (2), when a node is updated, it is not just the path to root that gets a new hash value,
     * but all referencing nodes, and all their paths to root, are also updated. If you are building nested UI
     * components, this is invaluable as it allows you to make mutations in one place and have UI updated across
     * a different hierarcy of components. For example, if you are building a new errorMessage counter in the top
     * navbar, and you also display new errorMessage counter in the sidebar, you can update both those fields simply by
     * mutating one node.
     *
     * 4. Hash values for all dirty nodes are changed in the next event loop. If each node is a prop for a React
     * component, this allows for batched UI updates.
     *
     * 5. All gets and sets are O(1) at best and O(lg n) at worst, where n is the total number of nodes
     * in the path supplied.
     *
     * 6. Each non-leaf node can also have a value set.
     *
     * 7. Values can only be of primitive immutable types (string, number, boolean, Date).
     *
     * 8. Collections (lists, dictionaries) are not part of this tree database.
     */
    constructor() {
        // root node is always empty path.
        this._rootNode = this.createNode("", false, null);
    }

    /**
     * Gets the value at the given path.
     *
     * @param path
     * @returns {any}
     */
    get(path: string[]): any {
        const node: ITreeNode = this.getNode(path);
        if (node) {
            return node.value;
        } else {
            return undefined;
        }
    }

    /**
     * Gets an ITreeNode at the given path. This is the raw database value.
     *
     * @param path
     * @returns {any}
     */
    getNode(path: string[]|string): ITreeNode {
        // firstly, we check in the cache for fast retrieval
        let pathVal: string;
        if (_.isArray(path)) {
            pathVal = (path as string[]).join("/");
        } else {
            pathVal = path as string;
        }

        let node: ITreeNode = this.getFromCache(pathVal);
        if (node) {
            return node;
        }

        if (pathVal.length === 0) {
            node = this._rootNode;
        } else {
            // recursively walk up the hierarchy.
            const parentNode: ITreeNode = this.getNode(pathVal.substring(0, pathVal.lastIndexOf("/")));
            if (parentNode) {
                const lastSegment: string = pathVal.substring(pathVal.lastIndexOf("/") + 1);
                node = parentNode.children[lastSegment];
            }
        }

        this.addToCache(pathVal, node);

        return node;
    }

    /**
     * Sets a value for a node at the given path, where the path is represented as an array. Note that you do not need
     * to have the entire parent hierarchy already set. You can set a value at the path a/b/c/d even though
     * a/b/c may not exist.
     *
     * If you supply a null or undefined as the value, then the path will be deleted. This also means
     * that if you supply a null or undefined at a parent path, then all children of that path will be deleted.
     *
     * You can also supply a SkeletosTransaction that will record the mutation in case a rollback needs to be done.
     *
     * @param path
     * @param value
     * @param transaction
     */
    set(path: string[],
        value: TreeNodeValueType|object,
        transaction?: ISkeletosDbTransaction,
        options?: SkeletosDbSetterOptions): void {

        options = options || {} as any;

        // DefinePlugin removes this as dead code in production
        if (process.env.NODE_ENV !== "production") {
            this.checkPath(path);
        }

        const pathVal: string = path.join("/");

        if ((value === null || value === undefined) && !options.doNotDeleteOnNullValue) {
            // remove the existing path
            const existingNode: ITreeNode = this.getNode(pathVal);
            if (existingNode) {

                // if this is not a referenced node, and it has other referencing paths, then we need to remove those
                // referencing paths as well to prevent memory leak.
                if (existingNode.path === pathVal &&
                    existingNode.referencingPaths && existingNode.referencingPaths.length > 0) {
                    _.forEach(existingNode.referencingPaths, (referencingPath: string) => {
                        this.setReference(referencingPath.split("/"), null, transaction);
                    });
                }

                if (existingNode.children && _.keys(existingNode.children).length > 0) {
                    // Invalidate the entire cache. See cache documentation for more on why we do this.
                    this.clearCache();
                } else {
                    // if it doesn't have any children, we can be sure we don't need to invalidate the
                    // entire cache
                    this.removeFromCache(pathVal);
                }
                // else -> what about referencing items? Don't we care that referencing items may exist in the
                // cache? No, we don't. Because when we resolve the references of those referencing items,
                // the referenced item will no longer exist anyway. :)

                // remove this item from dirty paths as it no longer exists (it's removed after all)
                this.removeFromDirtyPathIndex(pathVal);

                // add to transaction log.
                if (transaction) {
                    transaction.recordUnset(path, existingNode);
                }

                // now actually remove the node.
                const parentPathVal: string = removeLastSegment(pathVal);
                const parentNode: ITreeNode = this.getNode(parentPathVal);

                if (parentNode) {
                    delete parentNode.children[path[path.length - 1]];

                    // add the parent to the dirty paths index since the parent is changed
                    this.addToDirtyPathIndex(parentPathVal);
                }
            }
        } else {
            const node: ITreeNode = this.getOrCreateNode(pathVal, false, transaction);

            const doNotVerifyValueType: boolean = options && options.doNotVerifyValueType;

            // for performance reasons, we can override primitive check at production time
            // because it is expected all the debugging has revealed any problems till production.
            if (process.env.NODE_ENV !== "production") {

                // We may want to override primitive check in certain cases, like when building
                // collections of nodes. This should be used sparingly and carefully.
                if (!doNotVerifyValueType &&
                    !_.isNumber(value) &&
                    !_.isString(value) &&
                    !_.isBoolean(value) &&
                    !_.isDate(value)) {
                    throw new Error(
                        "You can only use values of type string, boolean, Date and number to store in SkeletosDb.");
                }
            }

            if (node.value === value) {
                // If the old value and new value are equal, why go further?
                return;
            } else {
                if (doNotVerifyValueType && isITreeNode(value)) {
                    // special case: the transaction log sets a node directly
                    // in this case, we don't record anything because we are likely
                    // doing this as part of a rollback
                    node.value = (value as ITreeNode).value;
                    node.children = (value as ITreeNode).children;
                    node.referencingPaths = (value as ITreeNode).referencingPaths;
                } else {
                    if (transaction) {
                        transaction.recordSet(path, value as TreeNodeValueType, node.value);
                    }

                    node.value = value as TreeNodeValueType;
                }

                // add to dirty path index
                this.addToDirtyPathIndex(pathVal);
            }
        }

        // trigger listeners because hey something must've changed.
        this.fireListeners();
    }

    /**
     * Sets a reference from the supplied path to the node at the toPath. After doing so, doing a get()
     * on the referencing path will always return the value at toPath.  Note that you do not need
     * to have the entire parent hierarchy already set. You can set a value at the path a/b/c/d even though
     * a/b/c may not exist.
     *
     * !!Careful!! If the toPath does not exist, then we will warn you. Because you may think, "hey my
     * reference node exists, but when I do a get() on the reference, it returns null...wth??". That's because
     * you are pointing to something that does not exist.
     *
     * If you want to remove the existing reference, supply a null or undefined value.
     *
     * Supply a Transaction object to record this modification.
     *
     * The needs
     * @param path
     * @param toPath
     * @param transaction
     */
    setReference(path: string[],
                 toPath: string[],
                 transaction?: ISkeletosDbTransaction,
                 options?: SkeletosDbSetterOptions): void {

        options = options || {} as any;

        // DefinePlugin removes this as dead code in production
        if (process.env.NODE_ENV !== "production") {
            // only validate path, because toPath can be null.
            this.checkPath(path);
        }

        const pathVal: string = path.join("/");
        let oldPath: string[];

        // remove the existing reference
        const previousRefNode: ITreeNode = this.getNode(pathVal);
        const fromNodeParentPath: string = removeLastSegment(pathVal);

        if (previousRefNode) {
            if (toPath && toPath.join("/") === previousRefNode.path) {
                // fast return because toPaths are the same.
                return;
            }

            oldPath = previousRefNode.path.split("/");

            previousRefNode.referencingPaths = _.without(previousRefNode.referencingPaths, pathVal);

            const parentNode: ITreeNode = this.getNode(fromNodeParentPath);
            if (parentNode) {
                delete parentNode.children[path[path.length - 1]];

                // parent path got changed
                this.addToDirtyPathIndex(fromNodeParentPath);
            }

            // Note: the value of the node we used to point to did not change, only
            // the node that was point to the that node changed. Hence, we don't have to
            // add previousRefNode to dirty paths.

            // reference nodes do not have children, and so we don't need to invalidate entire
            // cache. If they had children, it would be difficult to determine what to remove at which
            // point we ould have cleared the entire cache.
            this.removeFromCache(pathVal);

            // remove from dirty path index
            this.removeFromDirtyPathIndex(pathVal);
        }

        if (toPath) {
            // DefinePlugin removes this as dead code in production
            if (process.env.NODE_ENV !== "production") {
                this.checkPath(toPath);
            }

            const toNode: ITreeNode = this.getNode(toPath);
            if (toNode) {
                toNode.referencingPaths.push(pathVal);

                // the path got dirty.
                this.addToDirtyPathIndex(pathVal);

                this.addToCache(pathVal, toNode);

                this.getOrCreateNode(fromNodeParentPath, false, transaction)
                    .children[path[path.length - 1]] = toNode;

            } else {

                // if there is no transaction associated with this, skip this warning entirely
                // this call is likely being made by rollback
                if (transaction) {
                    // note: separate the if statement for dead code removal.
                    if (process.env.NODE_ENV !== "production") {
                        if (!options.suppressWarnings) {
                            getDefaultLogger().warn(
                                "You tried to set a reference from a node at path " + pathVal + " to another node " +
                                "that does not exist, at path " + toPath.join("/") +
                                ". Make sure you are not surprised when " +
                                "retrieving the value for " + pathVal + " yields null or undefined."
                            );
                        }
                    }
                }
            }
        }

        if (transaction) {
            transaction.recordSetReference(path, toPath, oldPath);
        }

        this.fireListeners();
    }

    /**
     * Given a path for a node X that points to a node Y, returns the path for node Y.
     *
     * @param referencingPath
     * @returns {string[]}
     */
    getReferencedPathFromReferencingPath(referencingPath: string[]): string[] {
        const node: ITreeNode = this.getNode(referencingPath);
        if (node) {
            return node.path.split("/");
        } else {
            return referencingPath;
        }
    }

    /**
     * Returns a hash of the value at the node on the given path. See constructor() for more details
     * on how this works.
     *
     * @param path
     */
    getNodeHash(path: string[]): any {
        const node: ITreeNode = this.getNode(path);

        if (node) {
            if (node.dirty) {
                // need to generate a new hash. Make sure we are not generating something
                // we already may have generated.
                const prevHashTimestamp: number = parseInt(node.hash.split("-")[0], 10);
                if (this._lastListenerTriggerTimestamp !== prevHashTimestamp) {
                    // this guy needs a new hash
                    node.hash = this.generateUniqueHash();
                }

                node.dirty = false;

                this.removeFromDirtyPathIndex(path.join("/"));
            }

            return node.hash;
        } else {
            return null;
        }
    }

    /**
     * Add a new database listener. Will be called whenever anything changes.
     *
     * Note: the exact specifics of what changed will not be supplied.
     *
     * @param listener
     */
    addListener(listener: ISkeletosDbListener): void {
        this._listeners.push(listener);
    }

    /**
     * Removes the previously added listener. See #addListener(..).
     *
     * @param listener
     */
    removeListener(listener: ISkeletosDbListener): void {
        _.remove(this._listeners, (_listener: ISkeletosDbListener): boolean => {
            return listener === _listener;
        });
    }

    /**
     * Serializes the contents of the tree and returns a string that can be transported and called with deserialize(..)
     *
     * @returns {string}
     */
    serialize(pathToStartFrom?: string[]): string {
        const alreadyProcessed: IPathBooleanIndex = {};
        const serializedPaths: _.Dictionary<true> = {};

        const retVal: ISerializedNode = {};
        const retValPathToObjectCache: _.Dictionary<ISerializedNode> = {};

        let nodeToStartFrom: ITreeNode = this._rootNode;
        let nodeQueue: ITreeNode[] = [nodeToStartFrom];

        // if we have a place to start off from, then...
        let pathPrefix: string = null;
        if (pathToStartFrom && pathToStartFrom.length > 0) {
            nodeToStartFrom = this.getNode(pathToStartFrom);
            if (!nodeToStartFrom) {
                // exit early, there's nothing to serialize
                getDefaultLogger().warn("There's no node at the path \"/" + pathToStartFrom + "\".");
                return "{}";
            }

            pathPrefix = nodeToStartFrom.path;

            // our node queue are all the children of the node we found
            nodeQueue = _.values<ITreeNode>(nodeToStartFrom.children);

        }

        const pathQueue: string[] = _.map(nodeQueue, (node: ITreeNode): string => node.path);
        let currentIndex: number = 0;

        while (currentIndex < nodeQueue.length) {
            const currentPath: string = pathQueue[currentIndex];
            const currentNode: ITreeNode = nodeQueue[currentIndex];

            currentIndex++;

            if (alreadyProcessed[currentPath]) {
                continue;
            } else {
                alreadyProcessed[currentPath] = true;

                // this node might be the original path or the referenced path...
                // need to determine first and only process non-referenced paths
                if (currentNode.path === currentPath) {

                    let referencingPaths: string[];
                    let pathToUseInSerializedPaths: string = currentPath;
                    if (!pathPrefix) {
                        referencingPaths = _.clone(currentNode.referencingPaths);
                    } else {
                        pathToUseInSerializedPaths = _.trim(
                            currentPath.substring(pathPrefix.length), "/");

                        _.forEach(currentNode.referencingPaths, (referencingPath: string) => {
                            // any references outside the tree from the point of pathToStartFrom is discarded.
                            // and those that are not are converted to relative paths
                            if (_.startsWith(referencingPath, pathPrefix)) {
                                referencingPaths.push(_.trim(referencingPath.substring(pathPrefix.length), "/"));
                            }
                        });
                    }

                    // backslashes and double-quotes are problematic when serializing JSON
                    // we have to ensure an even number of backslashes
                    pathToUseInSerializedPaths = this.escapeSpecialJsonCharacters(pathToUseInSerializedPaths);
                    let currentNodeValue: any = currentNode.value;
                    if (_.isString(currentNodeValue)) {
                        currentNodeValue = this.escapeSpecialJsonCharacters(currentNodeValue);
                    }

                    let isEmptyObject: boolean = false;
                    let isDate: boolean;
                    if (_.isDate(currentNodeValue)) {
                        isDate = true;
                    } else if (!_.isArray(currentNodeValue) &&
                        _.isObject(currentNodeValue) && _.isEmpty(currentNodeValue)) {
                        isEmptyObject = true;
                    }

                    serializedPaths[pathToUseInSerializedPaths] = true;

                    retValPathToObjectCache[pathToUseInSerializedPaths] = {};

                    if (!isEmptyObject) {
                        retValPathToObjectCache[pathToUseInSerializedPaths].__v = _.clone(currentNodeValue);
                    }
                    if (isDate) {
                        retValPathToObjectCache[pathToUseInSerializedPaths].__d = true;
                    }
                    if (referencingPaths && referencingPaths.length > 0) {
                        retValPathToObjectCache[pathToUseInSerializedPaths].__r = _.map(
                            referencingPaths,
                            (referencingPath: string) => this.escapeSpecialJsonCharacters(referencingPath)
                        );
                    }

                    // make sure the referenced paths are all set as processed (optimization)
                    _.forEach(currentNode.referencingPaths,
                        (referencedPath: string) => alreadyProcessed[referencedPath] = true);

                    // now we need to process the children
                    if (currentNode.children) {
                        _.forEach(currentNode.children, (value: ITreeNode, key: string) => {
                            nodeQueue.push(value);
                            if (currentPath.length === 0) {
                                pathQueue.push(key);
                            } else {
                                pathQueue.push(_.trim(currentPath + "/" + key, "/"));
                            }
                        });
                    }
                }
            }
        }

        // before we stringify, let's optimize the storage by making the serializedPaths hierarchical
        _.forEach(serializedPaths, (value: true, path: string) => {
            const childObject: ISerializedNode = retValPathToObjectCache[path];

            let parentObject: ISerializedNode;
            let lastSegment: string;

            const lastIndexOfSlash: number = path.lastIndexOf("/");
            if (lastIndexOfSlash < 0) {
                parentObject = retVal;
                lastSegment = path;
            } else {
                const parentPath: string = path.substring(0, lastIndexOfSlash);
                parentObject = retValPathToObjectCache[parentPath];
                lastSegment = path.substring(lastIndexOfSlash + 1);
            }

            parentObject[lastSegment] = childObject;
        });

        // another optimization: remove all those nodes that are empty
        // start backwards to remove leaf nodes first, making their parents leaf nodes, recursively
        const pathsOnly: string[] = _.keys(retValPathToObjectCache);
        for (let i: number = pathsOnly.length - 1; i >= 0; i--) {
            const path: string = pathsOnly[i];
            const node: ISerializedNode = retValPathToObjectCache[path];
            if (_.isEmpty(node)) {
                let parentObject: ISerializedNode;
                let segment: string;
                if (path.length === 0) {
                    parentObject = retVal;
                    segment = path;
                } else {
                    const lastSlashIndex: number = path.lastIndexOf("/");
                    if (lastSlashIndex < 0) {
                        parentObject = retVal;
                        segment = path;
                    } else {
                        parentObject = retValPathToObjectCache[path.substring(0, lastSlashIndex)];
                        segment = path.substring(lastSlashIndex + 1);
                    }
                }

                delete parentObject[segment];
            }
        }

        return JSON.stringify(retVal);
    }

    /**
     * Deserializes the output from serialize(..) and populates the tree.
     *
     * @param payload
     */
    deserialize(payload: string|object,
                resetEverything: boolean = true,
                deserializeAtPath?: string[],
                transaction?: ISkeletosDbTransaction): void {
        // first, reset everything if needed
        if (resetEverything && (!deserializeAtPath || deserializeAtPath.length === 0)) {
            this._rootNode = this.createNode("", false, null);
            this._dirtyPathIndex = {};
            this._nodeCache = {};
        }

        let serialized: ISerializedNode;
        if (_.isString(payload) || !payload) {
            serialized = JSON.parse((payload || "{}") as string);
        } else {
            serialized = payload as ISerializedNode;
        }

        let pathPrefix: string = "";
        if (deserializeAtPath && deserializeAtPath.length > 0) {
            pathPrefix = deserializeAtPath.join("/") + "/";
        }

        interface IDeserializedNodeQueueItem {
            node: ISerializedNode;
            path: string;
        }

        const queue: IDeserializedNodeQueueItem[] = [{
            node: serialized,
            path: ""
        }];
        let currentQueueIndex: number = 0;

        const pathsThatExist: _.Dictionary<boolean> = {};
        while (currentQueueIndex < queue.length) {
            const key: string = queue[currentQueueIndex].path;
            const deserializedNode: ISerializedNode = queue[currentQueueIndex].node;

            currentQueueIndex++;

            // backslashes are problematic when serializing JSON
            // we have to ensure an even number of backslashes
            const realPath: string = this.unescapeSpecialJsonCharacters(_.trim(pathPrefix + key, "/"));
            pathsThatExist[realPath] = true;

            if (_.isString(deserializedNode.__v)) {
                deserializedNode.__v = this.unescapeSpecialJsonCharacters(deserializedNode.__v);

                // dates don't get serialized as Dates but as strings
                if (deserializedNode.__d) {
                    deserializedNode.__v = new Date(deserializedNode.__v);
                }
            } else if (deserializedNode.__v === undefined) {
                // undefined means empty object {}
                deserializedNode.__v = {} as any;
            }

            if (deserializedNode.__r) {
                for (let i: number = 0; i < deserializedNode.__r.length; i++) {
                    deserializedNode.__r[i] = this.unescapeSpecialJsonCharacters(deserializedNode.__r[i]);
                }
            } else if (deserializedNode.__r === undefined) {
                // undefined means empty referencing paths
                deserializedNode.__r = [];
            }

            this.set(realPath.split("/"), deserializedNode.__v, transaction, SkeletosDbSetterOptions.DO_NOT_VERIFY_VALUE_TYPE);

            if (deserializedNode.__r) {
                _.forEach(deserializedNode.__r,
                    (referencingPath: string) =>
                        this.setReference((pathPrefix + referencingPath).split("/"), realPath.split("/"), transaction)
                );
            }

            _.forEach(deserializedNode, (value: any, segment: string) => {
                if (!RESERVED_KEYWORDS[segment]) {
                    let path: string;
                    if (key.length === 0) {
                        path = segment;
                    } else {
                        path = key + "/" + segment;
                    }

                    queue.push({
                        node: value,
                        path: path
                    });
                }
            });
        }

        // now remove all the paths under deserialized at path that don't exist

        if (resetEverything && deserializeAtPath && deserializeAtPath.length > 0) {
            let nodesToProcess: ITreeNode[];
            const nodesAlreadyProcessed: _.Dictionary<boolean> = {};
            let index: number = 0;
            if (deserializeAtPath) {
                nodesToProcess = [this.getNode(deserializeAtPath)];
            } else {
                nodesToProcess = [this._rootNode];
            }

            while (index < nodesToProcess.length) {

                // avoid forever looping because of cyclic references
                if (nodesAlreadyProcessed[nodesToProcess[index].path]) {
                    continue;
                }

                // skip all referenced nodes outside the tree.
                if (_.startsWith(nodesToProcess[index].path + "/", pathPrefix)) {
                    nodesAlreadyProcessed[nodesToProcess[index].path] = true;

                    if (!pathsThatExist[nodesToProcess[index].path]) {
                        this.set(nodesToProcess[index].path.split("/"), null);
                    } else {
                        // add all the children to process as well
                        _.forEach(
                            nodesToProcess[index].children,
                            (childNode: ITreeNode) => nodesToProcess.push(childNode)
                        );
                    }
                }
                index++;
            }
        }
    }

    private escapeSpecialJsonCharacters(input: string): string {
        if (_.isEmpty(input)) {
            return input;
        }

        return (input).replace(/["\\\n\r\t\u2028\u2029]/g, (character: string) => {
            // http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
            switch (character) {
                case "\"":
                case "\'":
                case "\\":
                    return "\\" + character;
                case "\n":
                    return "\\n";
                case "\b":
                    return "\\b";
                case "\f":
                    return "\\f";
                case "\r":
                    return "\\r";
                case "\t":
                    return "\\t";
                case "\u2028": // type of line terminator
                    return "\\u2028";
                case "\u2029": // type of line terminator
                    return "\\u2029";
                default:
                    return character;
            }
        });
    }

    private unescapeSpecialJsonCharacters(input: string): string {
        if (_.isEmpty(input)) {
            return input;
        }

        let retVal: string = "";
        for (let i: number = 0; i < input.length; i++) {
            if (i === input.length - 1) {
                // last character
                retVal += input.charAt(i);
            } else {
                const char = input.charAt(i);
                const nextChar = input.charAt(i + 1);
                if (char === "\\") {
                    switch (nextChar) {
                        case "\"":
                            retVal += "\"";
                            i += 1;
                            break;
                        case "\'":
                            retVal += "\'";
                            i += 1;
                            break;
                        case "\\":
                            retVal += "\\";
                            i += 1;
                            break;
                        case "n":
                            retVal += "\n";
                            i += 1;
                            break;
                        case "b":
                            retVal += "\b";
                            i += 1;
                            break;
                        case "f":
                            retVal += "\f";
                            i += 1;
                            break;
                        case "r":
                            retVal += "\r";
                            i += 1;
                            break;
                        case "t":
                            retVal += "\t";
                            i += 1;
                            break;
                        case "\u2028":
                            retVal += "\u2028";
                            i += 1;
                            break;
                        case "\u2029":
                            retVal += "\u2029";
                            i += 1;
                            break;
                        default:
                            // something we don't recognize, treat as a slash
                            retVal += "\\";
                    }
                } else {
                    retVal += char;
                }
            }
        }

        return retVal;
    }

    /**
     * Creates a new node on the given path.
     *
     * If it is a reference path, then the path value is not set to the supplied path.
     *
     * @param pathVal
     * @returns {ITreeNode}
     */
    private createNode(pathVal: string,
                       isReferencePath: boolean = false,
                       transaction?: ISkeletosDbTransaction): ITreeNode {
        const node: ITreeNode = {} as ITreeNode;

        node.value = {}; // make sure we set this to a truthy value for anyone to do some exists maybe
        node.children = {};
        node.hash = this.generateUniqueHash();
        node.referencingPaths = [];

        if (!isReferencePath) {
            node.path = pathVal;
        }

        if (pathVal.length > 0) {
            this.getOrCreateNode(removeLastSegment(pathVal), false, transaction)
                .children[getLastSegment(pathVal)] = node;
        }

        if (transaction) {
            transaction.recordSet(pathVal.split("/"), node.value, null);
        }

        this.addToCache(pathVal, node);

        return node;
    }

    /**
     * Gets an existing or creates a new ITreeNode at the given path.
     *
     * If it is a reference path, then the path value is not set to the supplied path.
     *
     * @param path
     */
    private getOrCreateNode(path: string,
                            isReferencePath: boolean = false,
                            transaction?: ISkeletosDbTransaction): ITreeNode {

        let node: ITreeNode = this.getNode(path);

        if (!node) {
            node = this.createNode(path, isReferencePath, transaction);
        }

        return node;
    }

    /**
     * Ensures there is no forward slash (/) in the path.
     *
     * @param path
     * @returns {boolean}
     */
    private checkPath(path: string|string[]): void {
        if (!path) {
            return;
        }

        let pathVal: string;
        if (_.isArray(path)) {
            // Note: not using forward slash here because of indexOf check below.
            pathVal = (path as string[]).join(",");
        } else {
            pathVal = path as string;
        }

        if (pathVal.indexOf("/") !== -1) {
            throw new Error("The path has a '/' character. Remove any forward slashes " +
                "from the path " + path + ". See stack trace for more details.");
        } else {
            // check for reserved keyword
            for (const disallowedKeyword of RESERVED_KEYWORDS_ARRAY) {
                if (pathVal.indexOf("," + disallowedKeyword) >= 0 ||
                    _.startsWith(pathVal, disallowedKeyword)) {
                    throw new Error("You cannot use " + disallowedKeyword + " in the path " + path +
                        " because it is reserved by the database.");
                }
            }
        }
    }

    /**
     * Generates a new hash. A hash is not specific to a value type, but rather just
     * a globally unique, never before used value. This is done not just for performance
     * reasons -- it is almost impossible to generate a unique hash for a node and all its children
     * everytime a child in the hierarchy changes.
     *
     * @returns {number}
     */
    private generateUniqueHash(): any {
        return this._lastListenerTriggerTimestamp + "-" + (++this._hashSeedCounter);
    }

    /**
     * Invoke listeners.
     */
    private fireListeners(): void {
        if (!this._shouldRunUpdate) {

            this._shouldRunUpdate = true;

            setTimeout(() => {
                this._shouldRunUpdate = false;

                this.updateDirtyPathIndex();

                this._lastListenerTriggerTimestamp = new Date().getTime();

                _.each(this._listeners, (listener: ISkeletosDbListener) => listener());

            }, 0);
        }
    }

    private addToDirtyPathIndex(path: string): void {
        this._dirtyPathIndex[path] = true;
    }

    private removeFromDirtyPathIndex(path: string): void {
        delete this._dirtyPathIndex[path];
    }

    private addToCache(fullPath: string, node: ITreeNode): void {
        this._nodeCache[fullPath] = node;
    }

    private clearCache(): void {
        this._nodeCache = {};
    }

    private removeFromCache(fullPath: string): void {
        delete this._nodeCache[fullPath];
    }

    private getFromCache(fullPath: string): ITreeNode {
        return this._nodeCache[fullPath];
    }

    private updateDirtyPathIndex(): void {
        const alreadyUpdated: IPathBooleanIndex = {};

        _.forEach(this._dirtyPathIndex, (value: boolean, key: string) => {
            this.updateDirtyFlagForPath(key, alreadyUpdated);
        });

        // root always gets modified
        this._rootNode.dirty = true;

        this._dirtyPathIndex = {};
    }

    /**
     * Updates all the paths up the parent hierachy.
     *
     * @param path
     * @param memoizedIndex -- the memoized paths
     */
    private updateDirtyFlagForPath(path: string, memoizedIndex: IPathBooleanIndex): void {
        let currentIndex: number = 0;
        const queue: string[] = [path];

        while (currentIndex < queue.length) {
            let walker: string = queue[currentIndex];

            while (walker.length > 0) {

                if (memoizedIndex[walker]) {
                    break;
                }

                memoizedIndex[walker] = true;

                const node: ITreeNode = this.getNode(walker);

                if (node) {
                    node.dirty = true;

                    for (let i: number = 0; i < node.referencingPaths.length; i++) {
                        const refPath: string = node.referencingPaths[i];
                        if (!this.getNode(refPath)) {
                            node.referencingPaths = _.without(node.referencingPaths, node.referencingPaths[i]);
                        } else if (!memoizedIndex[refPath]) {
                            queue.push(refPath);
                        }
                    }
                }

                walker = removeLastSegment(walker);
            }

            currentIndex++;
        }
    }
}


// HELPER INTERFACES AND CLASSES ----------------------------------------

/**
 * Any value that is set for a tree node can be only of the following types.
 *
 * Note: arrays are not supported.
 *
 * Also, I may add support for TypedArrays in the future to support binary data,
 * but for now because of arrays not being supported, TypedArrays are not supported.
 */
export type TreeNodeValueType = number | string | boolean | Date;

/**
 * Represents a node that is stored in the tree.
 */
export interface ITreeNode {

    /**
     * The actual value stored by the client. This could be anything but we limit the API
     * for set to be TreeNodeValueType.
     */
    value: any;

    /**
     * Only used when serializing/deserializing
     */
    isDate?: boolean;

    /**
     * The path from the root this node is stored at.
     *
     * Each node in the path is separated with a forward slash separator.
     */
    path: string;

    /**
     * This is a list of all the other paths that point to this node.
     */
    referencingPaths: string[];

    /**
     * In a strict tree structure, the children of those node are those nodes that are wholly
     * contained by this node. That is, deleting this node will delete all the children.
     */
    children: ITreeNodeIndex;

    /**
     * Whenever the value of this node changes, a new hash is assigned. Note that two identical values
     * over time may not have the same hash unlike in other systems for the purpose of performance.
     * The hash will be unique in the system though, and a value never before assigned.
     */
    hash: string;

    /**
     * Hashes are calculated lazily. This is a flag that indicates whether to update the hash.
     */
    dirty: boolean;
}

/**
 * Helps maintain an index/cache of path to nodes.
 */
export interface ITreeNodeIndex {
    /**
     * Key here can be full paths from the root or partial paths to indicate, e.g., direct children.
     */
    [path: string]: ITreeNode;
}

/**
 * An index of a path in single string form to a Boolean value.
 */
export interface IPathBooleanIndex {
    /**
     * Key is the full path with forward slashes.
     */
    [path: string]: boolean;
}

/**
 * Setter options when calling the .set(..) API on the database.
 */
export class SkeletosDbSetterOptions {
    static DO_NOT_VERIFY_VALUE_TYPE: SkeletosDbSetterOptions = new SkeletosDbSetterOptions(true);

    doNotVerifyValueType: boolean;
    doNotDeleteOnNullValue: boolean;
    suppressWarnings: boolean;

    /**
     *
     * @param doNotVerifyValueType skips checking for the type of value at debug time.
     */
    constructor(doNotVerifyValueType?: boolean,
                doNotDeleteOnNullValue?: boolean,
                suppressWarnings?: boolean) {
        this.doNotVerifyValueType = doNotVerifyValueType;
        this.doNotDeleteOnNullValue = doNotDeleteOnNullValue;
        this.suppressWarnings = suppressWarnings;
    }
}

/**
 * Interface that represents a recorder for modifications that happen in the database (a Transaction).
 *
 * This interface is only meant to be used by SkeletosTransaction. The only reason it exists is to avoid
 * circular dependencies between SkeletosDb and SkeletosTransaction.
 */
export interface ISkeletosDbTransaction {

    /**
     * Records the value of the set call to the database
     *
     * @param path
     * @param newValue
     * @param oldValue
     */
    recordSet: (path: string[], newValue: TreeNodeValueType, oldValue: TreeNodeValueType) => void;

    /**
     * Records the value of the setReference call to the database.
     *
     * @param path
     * @param newValue
     * @param oldValue
     */
    recordSetReference: (path: string[], newValue: string[], oldValue: string[]) => void;

    /**
     * Records an unset of a node
     */
    recordUnset: (path: string[], oldNode: ITreeNode) => void;

    /**
     * Rolls back all the modifications made to the database made so far as part of this transaction.
     *
     * @param {string} reason
     */
    rollback: (reason?: string|Error) => void;
}

export type ISkeletosDbListener = () => void;

/**
 * When nodes are serialized to be sent across the wire
 */
export interface ISerializedNode {
    /**
     * Maps to value
     */
    __v?: TreeNodeValueType;

    /**
     * Maps to isDate
     */
    __d?: boolean;

    /**
     * Maps to referencingPaths
     */
    __r?: string[];
}

/**
 * Keys that are disallowed in the database because they are reserved by the database.
 *
 * @type {{__v: boolean; __d: boolean; __r: boolean}}
 */
export const RESERVED_KEYWORDS: _.Dictionary<true> = {
    __v: true,
    __d: true,
    __r: true
};
export const RESERVED_KEYWORDS_ARRAY: string[] = _.keys(RESERVED_KEYWORDS);

// UTILITY METHODS ----------------------------------------

/**
 * Figures out if this value is a ITreeNode. Note we can't do an instanceof check because
 * it is just an interface.
 *
 * @param value
 * @returns {boolean}
 */
export function isITreeNode(value: any): boolean {
    if (value === null || value === undefined) {
        return false;
    } else {
        const node: ITreeNode = value as ITreeNode;
        return node.hasOwnProperty("value") &&
            node.hasOwnProperty("children") &&
            node.hasOwnProperty("hash");
    }
}

/**
 * In a path separated by forward slashes, removes the last segment.
 *
 * @param path
 * @returns {string}
 */
function removeLastSegment(path: string): string {
    const indexOfLastSlash: number = path.lastIndexOf("/");
    if (indexOfLastSlash === -1) {
        return "";
    } else {
        return path.substring(0, indexOfLastSlash);
    }
}

/**
 * Returns the last segment in a path that is separated by forward slashes.
 *
 * @param path
 * @returns {string}
 */
function getLastSegment(path: string): string {
    return path.substring(path.lastIndexOf("/") + 1);
}