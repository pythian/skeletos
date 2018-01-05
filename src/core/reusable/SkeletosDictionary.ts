// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import _ = require("lodash");
import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosCursor} from "../base/SkeletosCursor";
import {SkeletosTransaction} from "../base/SkeletosTransaction";
import {SkeletosDbSetterOptions} from "../base/SkeletosDb";

/**
 * A SkeletosDictionary allows you to build a dictionary where the keys are of type string and the
 * values are typed according to the generic template parameters, where the type needs to be a
 * subclass of AbstractSkeletosState.
 *
 * All key-value pairs in the dictionary are stored in the SkeletosDb. Additionally, every value
 * is a complete AbstractSkeletosState that you can make references to.
 *
 * A SkeletosDictionary is an AbstractSkeletosState itself, so the dictionary points to some cursor, and the
 * children cursors of that becomes the key-value pairs of the dictionary.
 *
 * You can also build a dictionary where the values are references to state stored elsewhere in the
 * tree. So you can imagine building a centralized cache A of all your users indexed by their ID, then
 * build out specific cache B indexed by username where the values are a reference to those in A. Or
 * you can build out a list of users in a project using SkeletosList where the the items in the list are
 * a reference to the values in the cache A.
 *
 * Note that the values in the dictionary do not support polymorphic types. That is, you cannot initialize
 * a dictionary with StateTypeA, put(..) a value of type StateTypeB, then expect StateTypeB to be returned on a
 * get(..) call. If StateTypeB is a subclass of StateTypeA, then an object of StateTypeA will be returned. If not,
 * an error will be thrown. To work around this, you can implement polymorphism in a container state type that
 * holds what type of object you are storing.
 *
 * The dictionary also does not support values of generic types. For example, you cannot expect the dictionary to
 * work with
 * class MyGenericState<SomeType> extends AbstractSkeletosState { .. }
 *
 * This form is a compile type dependency that is currently not supported.
 */
export class SkeletosDictionary<T extends AbstractSkeletosState> extends AbstractSkeletosState {

    private _typeConstructor: typeof AbstractSkeletosState;
    private _nameOfAttributeOfValueToCopyIntoKeyInto: string;

    /**
     * Create a new SkeletosDictionary at the supplied cursor.
     *
     * You will also need to supply the constructor of the type of value that you wish to store in
     * the dictionary. The dictionary will use this constructor to create a new object on get(..) calls.
     *
     * -------------------------------------------------------
     *
     * The last argument, nameOfAttributeOfValueToCopyIntoKeyInto, is as interesting and neat to use as it is
     * confusing at first. Let's say you have a UserDataState that looks like this:
     *
     * UserDataState
     *  -- id
     *  -- name
     *  -- age
     *
     * Now you are building a cache of users, where the key is the ID of the user. Let's say, you want to add a new
     * user you retrieved from the server:
     *
     * <code>
     * const userDict = new SkeletosDictionary<UserDataState>(usersCursor, UserDataState);
     *
     * const newUser: UserDataState = userDict.put(userDto.id);
     * newUser.id = userDto.id; // See comment below for this line
     * newUser.name = userDto.name;
     * newUser.age = userDto.age;
     * </code>
     *
     * For the line marked with the comment, notice how you had to assign the ID of the user, even though you have
     * supplied the ID of the user as the key into the dictionary? This is redundant. Instead, check this out:
     *
     * <code>
     * const userDict = new SkeletosDictionary<UserDataState>(usersCursor, UserDataState, "id");
     *
     * const newUser: UserDataState = userDict.put(userDto.id);
     * newUser.name = userDto.name;
     * newUser.age = userDto.age;
     * </code>
     *
     * Here, we did not have to assign the ID. How did that work? Because we supplied, in the constructor,
     * "id" for nameOfAttributeOfValueToCopyIntoKeyInto argument. Thus, on every put(..), the SkeletosDictionary
     * will use the value of nameOfAttributeOfValueToCopyIntoKeyInto as the attribute of the value to insert
     * the key into.
     *
     * -------------------------------------------------------
     *
     * @param cursor
     * @param typeConstructor
     * @param nameOfAttributeOfValueToCopyIntoKeyInto
     * @return {[type]}
     */
    constructor(
        cursor: SkeletosCursor,
        typeConstructor: typeof AbstractSkeletosState,
        nameOfAttributeOfValueToCopyIntoKeyInto?: string);

    /**
     * Create a copy of the SkeletosDictionary from the given SkeletosDictionary, and make this new copy a modifiable
     * copy by supplying a SkeletosTransaction.
     *
     * @param stateToMakeCopyOf
     * @param transaction
     */
    constructor(stateToMakeCopyOf: SkeletosDictionary<T>, transaction: SkeletosTransaction);

    /**
     * Implementation.
     */
    constructor(
        arg1: SkeletosCursor|SkeletosDictionary<T>,
        arg2: typeof AbstractSkeletosState|SkeletosTransaction,
        arg3?: string) {
        if (arg1 instanceof SkeletosCursor) {
            super(arg1 as SkeletosCursor);
            this._typeConstructor = arg2 as (typeof AbstractSkeletosState);
            this._nameOfAttributeOfValueToCopyIntoKeyInto = arg3;
        } else {
            const otherState: SkeletosDictionary<T> = arg1 as SkeletosDictionary<T>;
            super(otherState, arg2 as SkeletosTransaction);
            this._typeConstructor = otherState._typeConstructor;
            this._nameOfAttributeOfValueToCopyIntoKeyInto = otherState._nameOfAttributeOfValueToCopyIntoKeyInto;
        }
    }

    /**
     * Returns the nameOfAttributeOfValueToCopyIntoKeyInto. What is that?
     *
     * Let's say you have a UserDataState that looks like this:
     *
     * UserDataState
     *  -- id
     *  -- name
     *  -- age
     *
     * Now you are building a cache of users, where the key is the ID of the user. Let's say, you want to add a new
     * user you retrieved from the server:
     *
     * <code>
     * const userDict = new SkeletosDictionary<UserDataState>(usersCursor, UserDataState);
     *
     * const newUser: UserDataState = userDict.put(userDto.id);
     * newUser.id = userDto.id; // See comment below for this line
     * newUser.name = userDto.name;
     * newUser.age = userDto.age;
     * </code>
     *
     * For the line marked with the comment, notice how you had to assign the ID of the user, even though you have
     * supplied the ID of the user as the key into the dictionary? This is redundant. Instead, check this out:
     *
     * <code>
     * const userDict = new SkeletosDictionary<UserDataState>(usersCursor, UserDataState, "id");
     *
     * const newUser: UserDataState = userDict.put(userDto.id);
     * newUser.name = userDto.name;
     * newUser.age = userDto.age;
     * </code>
     *
     * Here, we did not have to assign the ID. How did that work? Because we supplied, in the constructor,
     * "id" for nameOfAttributeOfValueToCopyIntoKeyInto argument. Thus, on every put(..), the SkeletosDictionary
     * will use the value of nameOfAttributeOfValueToCopyIntoKeyInto as the attribute of the value to insert
     * the key into.
     *
     * @returns {string}
     */
    get nameOfAttributeOfValueToCopyIntoKeyInto(): string {
        return this._nameOfAttributeOfValueToCopyIntoKeyInto;
    }

    /**
     * Whether or not a value for the given key exists in this dictionary.
     *
     * @param  {string}  key
     * @return {boolean}
     */
    exists(key: string): boolean {
        return this.cursor.exists(key);
    }

    /**
     * Returns the value at the given key. Returns null if the value does not exist for the given key.
     *
     * @param  {string} key
     * @return {T}
     */
    get(key: string): T {
        const childCursor: SkeletosCursor = this.cursor.select(key);

        // because of how the tree database works, childCursor === childCursor.selectReferenceCursor() when
        // the childCursor is not a reference. However, if it is a reference, then it is different. In any case,
        // we still need to retrieve the referenced cursor.

        if (!childCursor.exists() || !childCursor.selectReferencedCursor().exists()) {
            return null;
        } else {
            return this.newValue(childCursor.selectReferencedCursor());
        }
    }

    /**
     * If the value exists at the given key, then retrieves that value. If it doesn't exist, then this API behaves
     * like the put(..) API. Use this function instead of:
     *
     * var item: T;
     * if (dict.exists(key)) {
     *   item = dict.get(key);
     * } else {
     *   item = dict.put(key);
     * }
     *
     * So instead you would write:
     *
     * var item: T = dict.getOrPut(key);
     *
     * @param key
     */
    getIfExistsOrPut(key: string): T {
        let value: T = this.get(key);

        if (!value) {
            value = this.put(key);
        }

        return value;
    }

    /**
     * Reserves a spot in the SkeletosDictionary for the given key and returns the corresponding value.
     *
     * This API is a bit different than regular Map or Dictionary put API. Instead of looking like this:
     *
     * value.id = "123";
     * value.name = "Blah";
     * dict.put("123", value);
     *
     * It looks like this:
     *
     * var value = dict.put("123");
     * value.id = "123";
     * value.name = "Blah";
     *
     * The reason for the single argument .put API is that this dictionary is backed by a tree database, and every
     * key and value in this dictionary belongs in that central database. And the tree database only accepts primitive
     * types to be stored in every node, so you cannot insert a complex object. Thus, when you put a key into the
     * dictionary, we reserve a spot for that key and return a value, which you can then modify. The type of value
     * returned is the one that is used as the generic template parameter to create this dictionary.
     *
     * Note: that if a value at the given key already existed before this put call, it will be deleted first.
     * Adds a new key-value pair and returns the value so you can mutate it further.
     *
     * Note 2: if a nameOfAttributeOfValueToCopyIntoKeyInto was supplied in the constructor, then it will be used. See
     * the constructor documentation for more details.
     *
     * @param {T} item
     */
    put(key: string): T {
        return this.internalPut(key);
    }

    /**
     * Puts a key-value pair in the dictionary where the key is as specified and the value is a reference that points
     * to
     * referenceTo state. The referenceTo state object must be of the same type as what this dictionary was initialized
     * with.
     *
     * Note: that if a value at the given key already existed before this put call, it will be deleted first.
     * Adds a new key-value pair and returns the value so you can mutate it further.
     *
     * Note 2: calling internalPut() and setting the doNotCopyIntoKey arg to true will ensure that even if
     * _nameOfAttributeOfValueToCopyIntoKeyInto has been defined, putReference() will still not create an attribute
     * into this key (since this key is a reference).
     *
     * @param key
     * @param referenceTo
     * @returns {T}
     */
    putReference(key: string, referenceTo: T): T {
        const cursor: SkeletosCursor = this.internalPut(key, true).cursor;

        this.setReference(referenceTo.cursor, cursor);

        // no need to copy _nameOfAttributeOfValueToCopyIntoKeyInto into value because value is a reference

        return referenceTo;
    }

    /**
     * A wrapper around `putReferences` which accepts a key attribute (which should be the unique ID of the object),
     * and a list of objects to put references to.
     *
     * @param keyAttr The name of the unique identifying attribute in each of the values, ex:
     *     CommonConstants.ATTRIBUTE_ID
     * @param values The values to put references to.
     * @see #putReference
     */
    putReferencesToall(keyAttr: string, values: T[]): T[] {
        _.forEach(
            values,
            (value: T): void => {
                const key: string = "" + value[keyAttr];
                this.putReference(key, value);
            }
        );

        return values;
    }

    /**
     * Removes the key-value pair for the given key from the dictionary.
     *
     * @param {string} key
     */
    remove(key: string): void {
        if (!this.exists(key)) {
            return;
        }

        this.cursor.unset(key);
    }

    /**
     * Clears the entire dictionary by removing all the entries in this map.
     */
    clear(): void {
        this.cursor.unset();
    }

    /**
     * Returns the dictionary as a _.Dictionary<T> so that you can do other operations from lodash on the dictionary.
     *
     * Note: any changes made to the returned _.Dictionary<T> would not be reflected back in this SkeletosDictionary.
     *
     * @return {_.Dictionary<T>}
     */
    asDictionary(): _.Dictionary<T> {
        const dictionary: _.Dictionary<T> = {};
        let children: any = this.cursor.getTreeNode();
        if (children) {
            children = children.children;
        } else {
            children = {};
        }

        _.forEach(
            children, (value: any, key: string, thisArg?: any): void => {
                const state: T = this.newValue(this.cursor.select(key));
                dictionary[key] = state;
            }
        );

        return dictionary;
    }

    /**
     * Convenience method for _.keys(dict.asDictionary(), ...).
     *
     * @returns {string[]}
     */
    keys(): string[] {
        return _.keys(this.asDictionary());
    }

    /**
     * Convenience method for returning all the values as an array of States.
     *
     * @returns {T[]}
     */
    values(): T[] {
        return this.map((value: T) => value);
    }

    /**
     * Convenience method for _.forEach(dict.asDictionary(), ...).
     *
     * @type {[type]}
     */
    forEach(iteratee: _.DictionaryIterator<T, boolean|void>, thisArg?: any): _.Dictionary<T> {
        return _.forEach(
            this.asDictionary(),
            _.bind(iteratee, thisArg)
        );
    }

    /**
     * Convenience method for _.map(dict.asDictionary(), ...).
     *
     * @type {[type]}
     */
    map<TResult>(iteratee: _.DictionaryIterator<T, TResult>, thisArg?: any): TResult[] {
        return _.map(
            this.asDictionary(),
            _.bind(iteratee, thisArg)
        );
    }

    /**
     * Convieince method for _.isEmpty(this.asDictionary())
     *
     * @returns {boolean}
     */
    isEmpty(): boolean {
        return _.isEmpty(this.asDictionary());
    }

    /**
     * Ensures that the cursor to the dictionary exists even when there are no items in the dictionary.
     *
     * Useful when you want to make a reference to the dictionary.
     */
    ensureCreated(): void {
        if (this.isEmpty()) {
            // just put and remove a dummy value
            this.put("dummy");
            this.remove("dummy");
        }
    }

    /**
     * Constructs a new instance of the supplied type for this dictionary.
     *
     * @param cursor
     * @returns {T}
     */
    private newValue(cursor: SkeletosCursor): T {
        return new this._typeConstructor(cursor) as T;
    }

    /**
     * Puts a key into the db. Optionally supply a boolean to force-control whether to copy key into.
     *
     * @param key
     * @param doNotCopyIntoKey
     * @returns {T}
     */
    private internalPut(key: string, doNotCopyIntoKey?: boolean): T {
        if (key === undefined || key === null) {
            throw new Error("Key cannot be null or undefined.");
        }

        if (this.exists(key)) {
            this.remove(key);
        }

        this.cursor.set(key, {}, SkeletosDbSetterOptions.DO_NOT_VERIFY_VALUE_TYPE);

        if (this._nameOfAttributeOfValueToCopyIntoKeyInto && !doNotCopyIntoKey) {
            this.cursor.set([key, this._nameOfAttributeOfValueToCopyIntoKeyInto], key);
        }

        return this.newValue(this.cursor.select(key));
    }
}
