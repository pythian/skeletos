// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import _ = require("lodash");
import {SkeletosTransaction} from "./SkeletosTransaction";
import {SkeletosDb, ITreeNode, TreeNodeValueType, SkeletosDbSetterOptions} from "./SkeletosDb";

/**
 * Cursors are a way of managing a slice of the tree database. A cursor
 * is literally a pointer to a specific node in the tree database. Using
 * the cursor, you can get/set the value of the node, and also walk up 
 * and down the tree from the cursor's current position.
 * 
 * Thus, you can see the Cursor being the middle layer between the database and
 * the application code:
 * 
 * ----------------------
 * AbstractSkeletosState
 * ----------------------
 * SkeletosCursor  <--- We are here
 * ----------------------
 * SkeletosDb
 * ----------------------
 * 
 * The cursor also introduces a layer of SkeletosTransaction in between, such
 * that any modifications made without a transaction are denied. Thus, it is
 * crucial that as an application developer you access the tree database through
 * cursors, and not go directly to the SkeletosDb API.
 */
export class SkeletosCursor {

    public static CANNOT_MODIFY_STATE_ERR_STR: string = "State couldn't be modified \
because there is no transaction attached to the cursor. Make sure you are \
running your modification code inside an action or a command.";

    /**
     * The underlying database.
     */
    private _db: SkeletosDb;

    /**
     * The path to the node in the database that this cursor represents.
     */
    private _path: string[];

    /**
     * Any modifications made to the value of this cursor or any derived cursor are recorded in this transaction.
     */
    private _transaction: SkeletosTransaction;

    /**
     * Constructs a new cursor that is backed by a new database.
     */
    constructor();

    /**
     * Constructs a cursor that is a copy of the given cursor. Use this to create
     * a modifiable cursor from a read-only cursor. That is, if you have a cursor
     * without a SkeletosTransaction, then use this constructor to supply one 
     * and create a modifiable cursor.
     */
    constructor(from: SkeletosCursor, transaction?: SkeletosTransaction);

    /**
     * Implementation.
     */
    constructor(arg1?: SkeletosCursor, arg2?: SkeletosTransaction) {
        if (arguments.length === 0) {
            this._db = new SkeletosDb();
            this._path = [];
        } else {
            this._db = arg1._db;
            this._path = arg1._path;
            this._transaction = arg2;
        }
    }

    /**
     * Returns the backing database.
     */
    get db(): SkeletosDb {
        return this._db;
    }

    /**
     * Returns the full path pointed by this cursor.
     */
    get path(): string[] {
        return this._path;
    }

    /**
     * Returns the transaction of this cursor (if it exists).
     */
    get transaction(): SkeletosTransaction {
        return this._transaction;
    }

    /**
     * Returns whether this is a read only cursor.
     * 
     * A read only cursor is one with which you cannot update the value, because
     * there is no associated transaction.
     */
    get isReadOnly(): boolean {
        return !this._transaction;
    }

    /**
     * Does this cursor point to the root node of the tree?
     */
    isRoot(): boolean {
        return this._path.length === 0;
    }

    /**
     * Use this function to select a derived cursor from this cursor. A derived cursor can be selected down the
     * hierarchy of this cursor. For example, if this cursor exists at path /a/b/c, then:
     *
     * 1. cursor.select("child") -> will return a cursor at path /a/b/c/child
     * 2. cursor.select("child", "grandchild") -> will return a cursor at path /a/b/c/child/grandchild
     * 3. cursor.select("child", "grandchild", "greatGrandChild") ->
     *      return a cursor at path /a/b/c/child/grandChild/greatGrandChild
     *
     * Note that derived cursors use the same transaction that was supplied to this cursor.
     */
    select(...selector: string[]): SkeletosCursor {
        const cursor: SkeletosCursor = new SkeletosCursor(this, this._transaction);

        cursor._path = this.path.concat(selector || []);

        return cursor;
    }

    /**
     * Use this function to select a derived cursor from this cursor, where the derived cursor is a reference to another
     * path/node in the tree database. For example, if this cursor exists at path /a/b/c, then:
     *
     * 1. If this cursor is a reference to /root/someOtherNode, then:
     * cursor.selectReferencedCursor() -> will return a cursor at path /root/someOtherNode.
     *
     * 2. If the cursor at path /a/b/c/someChild is a reference to /root/someOtherNode, then:
     * cursor.selectReferencedCursor("someChild") -> will return a cursor at path /root/someOtherNode.
     *
     * Note that derived cursors use the same transaction that was supplied to this cursor.
     */
    selectReferencedCursor(...selector: string[]): SkeletosCursor {
        const referenceFrom: string[] = this.path.concat(selector || []);
        const referenceTo: string[] = this._db.getReferencedPathFromReferencingPath(referenceFrom);

        const cursor: SkeletosCursor = new SkeletosCursor(this, this._transaction);
        cursor._path = referenceTo;
        return cursor;
    }

    /**
     * Get the cursor at the root of the tree.
     */
    root(): SkeletosCursor {
        const rootCursor: SkeletosCursor = new SkeletosCursor(this, this._transaction);
        rootCursor._path = [];
        return rootCursor;
    }

    /**
     * Returns a cursor one level up from this cursor.
     */
    up(): SkeletosCursor {
        const upCursor: SkeletosCursor = new SkeletosCursor(this, this._transaction);
        upCursor._path = _.dropRight(this._path, 1);
        return upCursor;
    }

    /**
     * Returns whether a value exists at the given path from the path of this cursor.
     *
     * For example, if this cursor exists at /a/b/c, then:
     * 1. cursor.get() -> returns true if the path /a/b/c exists in the database.
     *
     * 2. cursor.get("child", "grandChild") -> returns true if the path /a/b/c/child/grandChild exists in the database.
     */
    exists(...selector: string[]): boolean {
        const value: any = this.get(...selector);
        return value !== undefined && value !== null;
    }

    /**
     * Returns the value from the database that exists at the given path from the path of this cursor.
     *
     * For example, if this cursor exists at /a/b/c, then:
     * 1. cursor.get() -> returns the value at path /a/b/c
     *
     * 2. cursor.get("child", "grandChild") -> returns the value at path /a/b/c/child/grandChild
     *
     * If no value exists, then returns null or undefined.
     */
    get(...selector: string[]): any {
        return this._db.get(this.path.concat(selector || []));
    }

    /**
     * Returns a hash of the value that exists at the given path from the path of this cursor.
     *
     * For example, if this cursor exists at /a/b/c, then:
     * 1. cursor.get() -> returns the hash of value at path /a/b/c
     *
     * 2. cursor.get("child", "grandChild") -> returns the hash of value at path /a/b/c/child/grandChild
     *
     * If a node doesn't exist at the specified path, then returns null.
     */
    getHash(...selector: string[]): string {
        return this._db.getNodeHash(this.path.concat(selector || []));
    }

    /**
     * Returns the raw value from the database that exists at the given path from the path of this cursor.
     *
     * For example, if this cursor exists at /a/b/c, then:
     * 1. cursor.get() -> returns the raw value at path /a/b/c
     *
     * 2. cursor.get("child", "grandChild") -> returns the raw value at path /a/b/c/child/grandChild
     *
     * If no value exists, then returns null or undefined.
     */
    getTreeNode(...selector: string[]): ITreeNode {
        return this._db.getNode(this.path.concat(selector || []));
    }

    /**
     * Sets the value of the node that this cursor points to. If this cursor is a reference to another node, then the
     * value of referenced node will be changed.
     *
     * 1. If this cursor is at path /a/b/c then
     *      cursor.set("hello") ->
     *            would set the node /a/b/c in the tree to the value "hello"
     *
     * 2. If this cursor is at path /a/b/c, and this path points to /x/y/z
     *    (because you used setReference(..) before):
     *      cursor.set("hello") -> would set the node /x/y/z in the tree to the value "hello"
     *
     * Note that any Transaction that this cursor uses would be used for this modification. If no Transaction exists,
     * then the modification will be denied.
     */
    set(value: TreeNodeValueType|object, options?: SkeletosDbSetterOptions): void;

    /**
     * Using the key, selects the child cursor at that key and sets the value of the node that the child cursor points
     * to. If the child cursor is a reference to another node, then the value of referenced node will be changed.
     *
     * For example,
     *
     * 1. If this cursor is at path /a/b/c then
     *      cursor.set("child", "hello") -> would set the node /a/b/c/child in the tree to the value "hello"
     *
     * 2. If this cursor is at path /a/b/c, and /a/b/c/child points to /x/y/z (because you used setReference(..)
     * before): cursor.set("child", "hello") -> would set the node /x/y/z in the tree to the value "hello"
     *
     * Note that any Transaction that this cursor uses would be used for this modification. If no Transaction exists,
     * then the modification will be denied.
     */
    set(key: string, value: TreeNodeValueType|object, options?: SkeletosDbSetterOptions): void;

    /**
     * Using the path, selects the child cursor at that path and sets the value of the node that the child cursor points
     * to. If the child cursor is a reference to another node, then the value of referenced node will be changed.
     *
     * 1. If this cursor is at path /a/b/c then
     *      cursor.set(["child", "grandchild"], "hello") ->
     *            would set the node /a/b/c/child/grandchild in the tree to the value "hello"
     *
     * 2. If this cursor is at path /a/b/c, and /a/b/c/child/grandchild points to /x/y/z
     *    (because you used setReference(..) before):
     *      cursor.set(["child", "grandchild"], "hello") -> would set the node /x/y/z in the tree to the value "hello"
     *
     * Note that any Transaction that this cursor uses would be used for this modification. If no Transaction exists,
     * then the modification will be denied.
     */
    set(path: string[], value: TreeNodeValueType|object, options?: SkeletosDbSetterOptions): void;

    /**
     * Implementation.
     */
    set(arg1: string|string[]|TreeNodeValueType|object,
        arg2?: TreeNodeValueType|object|SkeletosDbSetterOptions,
        arg3?: SkeletosDbSetterOptions): void {

        if (!this._transaction) {
            throw new Error(SkeletosCursor.CANNOT_MODIFY_STATE_ERR_STR);
        }

        let options: SkeletosDbSetterOptions;

        let path: string[], value: TreeNodeValueType;
        if (arguments.length > 2) {
            // even though arg1 can be string or string[], typescript compiler is stupid enough to not know
            // how to distinguish. That is, I can't write arg1 as string|string[] ... and I don't want to do
            // a runtime type check just to satisfy compile time deficiencies
            path = this._path.concat((arg1 as string[]) || []);
            value = arg2 as TreeNodeValueType;
            options = arg3;
        } else if (arguments.length === 2) {
            if (arg2 instanceof SkeletosDbSetterOptions) {
                path = this._path;
                value = arg1 as TreeNodeValueType;
                options = arg2 as SkeletosDbSetterOptions;
            } else {
                // even though arg1 can be string or string[], typescript compiler is stupid enough to not know
                // how to distinguish. That is, I can't write arg1 as string|string[] ... and I don't want to do
                // a runtime type check just to satisfy compile time deficiencies
                path = this._path.concat((arg1 as string[]) || []);
                value = arg2 as TreeNodeValueType;
            }
        } else {
            path = this._path;
            value = arg1 as TreeNodeValueType;
        }

        this._db.set(path, value, this.transaction, options);
    }

    /**
     * Makes this cursor reference another path at referenceTo. For example, if this cursor is at path /a/b/c then
     *
     * cursor.setReference(["x","y","z"]) -> would set the node /a/b/c in the tree point to /x/y/z
     */
    setReference(referenceTo: string[]): void;

    /**
     * Using the key, selects the child cursor at that key and makes that child cursor reference another path at
     * referenceTo. For example, if this cursor is at path /a/b/c then
     *
     * cursor.setReference("child", ["x","y","z"]) -> would set the node /a/b/c/child in the tree point to /x/y/z
     */
    setReference(key: string, referenceTo: string[]): void;

    /**
     * Using the key, selects the child cursor at that key and makes that child cursor reference another path at
     * referenceTo. For example, if this cursor is at path /a/b/c then
     *
     * cursor.setReference(["child", "grandchild"], ["x","y","z"]) ->
     *      would set the node /a/b/c/child/grandchild in the tree point to /x/y/z
     */
    setReference(key: string[], referenceTo: string[]): void;

    /**
     * Implementation
     */
    setReference(arg1: string|string[], arg2?: string[]): void {
        if (!this._transaction) {
            throw new Error(SkeletosCursor.CANNOT_MODIFY_STATE_ERR_STR);
        }

        let from: string[], to: string[];
        if (arguments.length >= 2) {
            from = this._path.concat(arg1 as any);
            to = arg2;
        } else {
            from = this._path;
            to = arg1 as string[];
        }

        this._db.setReference(from, to, this.transaction);
    }

    /**
     * Removes the value stored in the node in the tree that this cursor points to.
     */
    unset(): void;

    /**
     * Using the key, selects the child cursor at that key and removes the value stored in the node in the tree that
     * the child cursor points to.
     */
    unset(key: string): void;

    /**
     * Using the path, selects the child cursor at that path and removes the value stored in the node in the tree that
     * the child cursor points to.
     */
    unset(key: string[]): void;

    /**
     * Implementation.
     */
    unset(arg1?: string|string[]): void {
        if (arguments.length >= 1) {
            this.set(arg1, undefined);
        } else {
            this.set(undefined);
        }
    }

    /**
     * Removes the reference to the node in the tree that this cursor points to.
     */
    unsetReference(): void;

    /**
     * Using the key, selects the child cursor at that key and removes the reference to the node in the tree that
     * the child cursor points to.
     */
    unsetReference(key: string): void;

    /**
     * Using the path, selects the child cursor at that path and removes the reference to the node in the tree that
     * the child cursor points to.
     */
    unsetReference(key: string[]): void;

    /**
     * Implementation.
     */
    unsetReference(arg1?: string|string[]): void {
        if (arguments.length >= 1) {
            this.setReference(arg1 as string[], undefined);
        } else {
            this.setReference(undefined);
        }
    }

}