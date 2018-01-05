// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import _ = require("lodash");
import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosCursor} from "../base/SkeletosCursor";
import {SkeletosTransaction} from "../base/SkeletosTransaction";
import {generateUniqueId} from "../helpers/generateUniqueId";
import {SkeletosDbSetterOptions} from "../base/SkeletosDb";

/**
 * A SkeletosList allows you to build a list of AbstractSkeletosState types. Note that you cannot store
 * arrays or complex objects in the tree database. A SkeletosList allows you to store a list
 * of AbstractSkeletosStates where each item in the list is a complete AbstractSkeletosState that you can make
 * references to and from.
 *
 * A SkeletosList is an AbstractSkeletosState itself, so the list points to some cursor, and the children
 * cursors of that become the list items (that's the general idea, actual implementation is a bit
 * more complex).
 *
 * You can build a list where the items in the list are references to state stored elsewhere in the
 * tree. So you can imagine building a centralized (dictionary) cache A of all your users indexed by their ID, then
 * build out a list of users in a project using SkeletosList where the the items in the list are
 * a reference to the values in the cache A.
 *
 * Note that the items in the list do not support polymorphic types. That is, you cannot initialize
 * a list with StateTypeA, add(..) a value of type StateTypeB, then expect StateTypeB to be returned on a
 * get(..) call. If StateTypeB is a subclass of StateTypeA, then an object of StateTypeA will be returned. If not,
 * an error will be thrown. To work around this, you can implement polymorphism in a container state type that
 * holds what type of object you are storing.
 *
 * The list also does not support values of generic types. For example, you cannot expect the list to
 * work with
 * class MyGenericState<SomeType> extends AbstractSkeletosState { .. }
 *
 * This form is a compile type dependency that is currently not supported.
 */
export class SkeletosList<T extends AbstractSkeletosState> extends AbstractSkeletosState {

    /**
     * The internal structure of the list looks like:
     *
     * {
     *      ____SKELETOSLIST_KEYLIST: ["item1_GenID", "item2_GenID", "item3_GenID"],
     *      ____SKELETOSLIST_KEYMAP: {
     *          "item1_GenID": {
     *              ____SKELETOSLIST_KEY_ID: "item1_GenID",
     *              ____SKELETOSLIST_VALUE: { ... Item A }
     *          },
     *          "item2_GenID": {
     *              ____SKELETOSLIST_KEY_ID: "item2_GenID",
     *              ____SKELETOSLIST_VALUE: { ... Item B }
     *          },
     *          "item3_GenID": {
     *              ____SKELETOSLIST_KEY_ID: "item3_GenID",
     *              ____SKELETOSLIST_VALUE: { ... Item C }
     *          },
     *      }
     * }
     *
     * Some notes:
     *
     * 1. This structure ensures that any removals and additions from the array does not screw up any references to
     * other items within the list (i.e., there is no incorrect resolutions due to array "shifting").
     *
     * 2. Doing a get(index) on an item means doing a get(index) on the KEYLIST (which should be O(1) in most browsers),
     * and then using the value at that point to look up the item from the KEYMAP (which is O(1)). So we get O(1)
     * look up time on get(1).
     *
     * 3. Similarly, for insert(index) on an item we get worst case scenario O(n) if index=0 since KEYLIST would have to
     * be shifted. In most scenarios, we are adding items at the end of the list, so this should be O(1) as well.
     *
     * 4. For remove(item), this is an interesting case. When we are supplied an item of type T from the list, how do
     * we know what index to remove? The way we do it from this structure is that from the cursor of the supplied item,
     * we go up() one level on the cursor (from VALUE to item that contains KEY_ID and VALUE) and then select the KEY_ID.
     * We look at the KEY_ID and search for it in the KEYLIST. When found, we remove the item with that KEY_ID. At worst,
     * this is an O(n) removal because of the list search.
     *
     * 5. The GenID are IDs that the SkeletosList will internally generate to maintain an internal structure of items.
     *
     * 2. If you are wondering how do we store an array for KEYLIST, it is because we bypass the type check for value
     * on the SkeletosDb. But wait, doesn't that mean that Transactions will not work since arrays are not immutable? No,
     * because we generate a new array every time we modify the list, ensuring oldArray !== newArray. This is O(n) so
     * points (1,2,3) are really whatever+O(n), but in practice this tends to be fast. If we come across performance
     * problems, we may look at some other way of solving this.
     *
     */

    private static PROP_KEYLIST: string = "____SKELETOSLIST_KEYLIST";
    private static PROP_KEYMAP: string = "____SKELETOSLIST_KEYMAP";
    private static PROP_ITEM_ID: string = "____SKELETOSLIST_KEY_ID";
    private static PROP_VALUE: string = "____SKELETOSLIST_VALUE";

    private _typeConstructor: typeof AbstractSkeletosState;

    /**
     * Create a new SkeletosList at the supplied cursor.
     *
     * You will also need to supply the constructor of the type of value that you wish to store in
     * the list. The list will use this constructor to create a new object on get(..) calls.
     *
     * @param  {SkeletosCursor} cursor
     * @param typeConstructor
     * @return {[type]}
     */
    constructor(cursor: SkeletosCursor, typeConstructor: typeof AbstractSkeletosState);

    /**
     * Create a copy of the SkeletosList from the given SkeletosList, and make this new copy a modifiable copy
     * by supplying a SkeletosTransaction.
     *
     * @param  {SkeletosList} stateToMakeCopyOf
     * @param  {SkeletosTransaction} transaction
     * @return {[type]}
     */
    constructor(stateToMakeCopyOf: SkeletosList<T>, transaction: SkeletosTransaction);

    /**
     * Implementation
     */
    constructor(arg1: SkeletosCursor|SkeletosList<T>, arg2: (typeof AbstractSkeletosState)|SkeletosTransaction) {
        if (arg1 instanceof SkeletosCursor) {
            super(arg1 as SkeletosCursor);
            this._typeConstructor = arg2 as typeof AbstractSkeletosState;
        } else {
            super(arg1 as SkeletosList<T>, arg2 as SkeletosTransaction);
            this._typeConstructor = (arg1 as SkeletosList<T>)._typeConstructor;
        }
    }

    /**
     * Returns the value at the given index.
     *
     * @param  {number} index
     * @return {T}
     */
    get(index: number): T {
        this.rangeCheck(index);

        const idArray: string[] = this.keylistCursor.get() || [];
        const id: string = idArray[index];

        const referencedCursor: SkeletosCursor =
            this.keymapCursor.select(id, SkeletosList.PROP_VALUE).selectReferencedCursor();

        if (!referencedCursor.exists()) {
            return null;
        } else {
            return this.newValue(referencedCursor);
        }
    }

    /**
     * Returns the index of the given item.
     *
     * @param  {T} item
     * @return {number}
     */
    indexOf(item: T): number {
        return _.findIndex(this.asArray(),
            (search: T): boolean =>
            item.cursor.getHash() === search.cursor.getHash()
        );
    }

    /**
     * Adds a new element in the SkeletosList and returns it.
     *
     * This API is a bit different than regular List or Vector add or insert API. Instead of looking like this:
     *
     * value.id = "123";
     * value.name = "Blah";
     * list.add(value);
     *
     * It looks like this:
     *
     * var value = list.add();
     * value.id = "123";
     * value.name = "Blah";
     *
     * The reason for the no-argument .add API is that this list is backed by a tree database, and every
     * element in the list belongs in that central database. And the tree database only accepts primitive
     * types to be stored in every node, so you cannot insert a complex object. Thus, when you call add() on the
     * list, we reserve a spot for a new element, which you can then modify. The type of value
     * returned is the one that is used as the generic template parameter to create this list.
     *
     * @param {T} item
     */
    add(): T;

    /**
     * Adds a new element at the given index and returns it. See the add() API for more details.
     *
     * @param {number} index
     * @param {T}      item
     */
    add(index: number): T;

    /**
     * Implementation.
     */
    add(arg1?: number): T {
        const key: string = generateUniqueId();

        let arr: any[] = this.keylistCursor.get();

        if (!arr) {
            arr = [];
        }

        // for transaction rollback to work properly, we need to create a copy of the array
        arr = _.clone(arr);

        if (arguments.length >= 1) {
            if (arg1 < 0 || arg1 > arr.length) {
                throw new RangeError("SkeletosList: index out of range. Attempted to insert at a " +
                    "position in the array that is out of bounds. Position: " + arg1 + " and length " +
                    "of array: " + arr.length);
            }
            arr.splice(arg1, 0, key);
        } else {
            arr.push(key);
        }

        this.keylistCursor.set(arr, SkeletosDbSetterOptions.DO_NOT_VERIFY_VALUE_TYPE);

        // set the key
        this.keymapCursor.set([key, SkeletosList.PROP_ITEM_ID], key);

        // set the value as the new element. This just initializes it to a default new object.
        this.keymapCursor.set([key, SkeletosList.PROP_VALUE], {}, SkeletosDbSetterOptions.DO_NOT_VERIFY_VALUE_TYPE);

        return this.newValue(this.keymapCursor.select(
            key, SkeletosList.PROP_VALUE));
    }

    /**
     * Inserts an element into the list where the element actually exists outside of the list. That is,
     * the list does not own the element -- deleting the list would not delete the element.
     *
     * @param {T} referenceTo
     */
    addReference(referenceTo: T): T;

    /**
     * Inserts an element into the list at the given index, where the element actually exists outside of the list.
     * That is, the list does not own the element -- deleting the list would not delete the element.
     *
     * @param  {T}      referenceTo
     * @param  {number} index
     * @return {T}
     */
    addReference(referenceTo: T, index: number): T;

    /**
     * Implementation.
     */
    addReference(referenceTo: T, index?: number): T {
        let added: T;
        if (arguments.length > 1) {
            added = this.add(index);
        } else {
            added = this.add();
        }

        this.setReference(referenceTo.cursor, added.cursor);

        return referenceTo;
    }

    /**
     * Add many items at once into the list.
     *
     * @param {T} item
     */
    addMany(howMany: number): T[];

    /**
     * Add many items at once into the list at the given index.
     *
     * @param {number} index
     * @param {T}      item
     */
    addMany(howMany: number, index: number): T[];

    /**
     * Implementation.
     */
    addMany(howMany: number, index?: number): T[] {
        const items: T[] = [];
        for (let i: number = 0; i < howMany; i++) {
            if (arguments.length > 1) {
                items.push(this.add(index));
            } else {
                items.push(this.add());
            }
        }

        return items;
    }

    /**
     * Add many referenced items at once into the list.
     *
     * @param {T} item
     */
    addManyReferences(referenceTo: T[]): T[];

    /**
     * Add many referenced items at once into the list at the given index.
     *
     * @param {number} index
     * @param {T}      item
     */
    addManyReferences(referenceTo: T[], index: number): T[];

    /**
     * Implementation.
     */
    addManyReferences(referenceTo: T[], index?: number): T[] {
        const items: T[] = [];
        for (let i: number = 0; i < referenceTo.length; i++) {
            if (arguments.length > 1) {
                items.push(this.addReference(referenceTo[i], index));
            } else {
                items.push(this.addReference(referenceTo[i]));
            }
        }

        return items;
    }

    /**
     * Removes the given item.
     *
     * @param item
     */
    remove(item: T): void {
        this.removeAtIndex(this.indexOf(item));
    }

    /**
     * Removes the item at the given index.
     *
     * @param {number} index
     */
    removeAtIndex(index: number): void {
        this.rangeCheck(index);

        let idArray: string[] = this.keylistCursor.get();
        const id: string = idArray[index];

        // for transaction rollback to work properly, we need to create a copy of the array
        idArray = _.clone(idArray);

        this.keymapCursor.select(id).unset();
        idArray.splice(index, 1);
        this.keylistCursor.set(idArray, SkeletosDbSetterOptions.DO_NOT_VERIFY_VALUE_TYPE);
    }

    /**
     * Removes all elements.
     */
    clear(): void {
        this.keylistCursor.unset();
        this.keymapCursor.unset();
    }

    /**
     * Convenience method for list.length === 0;
     *
     * @return {boolean}
     */
    get isEmpty(): boolean {
        return this.length === 0;
    }

    /**
     * Returns the length of the list.
     *
     * @return {number}
     */
    get length(): number {
        const idArray: string[] = this.keylistCursor.get() || [];
        return idArray.length;
    }

    /**
     * Convenience method to _.find(list.asArray(), ...)
     *
     * @param  {_.ListIterator<T, boolean>} predicate
     * @param  {any}                  thisArg
     * @return {T}
     */
    find(predicate?: _.ListIterator<T, boolean>,
         thisArg?: any): T {
        const items: T[] = this.asArray();
        return _.find<T>(items, predicate, thisArg);
    }

    /**
     * Returns all items as an array.
     *
     * Note: any changes made to the returned array would not be reflected back in this SkeletosList.
     *
     * @return {T[]}
     */
    asArray(): T[] {
        const retArr: T[] = [];
        const length: number = this.length;
        for (let i: number = 0; i < length; i++) {
            retArr.push(this.get(i));
        }

        return retArr;
    }

    /**
     * Convenience method for _.map(list.asArray(), ...)
     *
     * @type {[type]}
     */
    map<TResult>(iteratee: _.ListIterator<T, TResult>, thisArg?: any): TResult[] {
        const items: T[] = this.asArray();
        return _.map(items, _.bind(iteratee, thisArg));
    }

    /**
     * Convenience method for _.forEach(list.asArray(), ...)
     *
     * Note: you can return false in the iteratee to exit the loop early.
     *
     * @param  {_.ListIterator<T, boolean|void>} iteratee
     * @param  {any}                  thisArg
     * @return {T[]}
     */
    forEach(iteratee: _.ListIterator<T, boolean|void>, thisArg?: any): T[] {
        const items: T[] = this.asArray();
        return _.forEach(items, _.bind(iteratee, thisArg));
    }

    /**
     * Ensures that the cursor to the list exists even when there are no items in the list.
     */
    ensureCreated(): void {
        if (this.isEmpty) {
            // just add and remove a dummy value
            this.add();
            this.removeAtIndex(0);
        }
    }

    /**
     * Gets the cursor to KEYLIST.
     *
     * @returns {SkeletosCursor}
     */
    private get keylistCursor(): SkeletosCursor {
        return this.cursor.select(SkeletosList.PROP_KEYLIST);
    }

    /**
     * Gets the cursor to KEYMAP.
     *
     * @returns {SkeletosCursor}
     */
    private get keymapCursor(): SkeletosCursor {
        return this.cursor.select(SkeletosList.PROP_KEYMAP);
    }

    /**
     * Checks if index is within the array bounds.
     *
     * @param index
     */
    private rangeCheck(index: number): void {
        if (index < 0 || index >= this.length) {
            throw new RangeError("Index out of bounds");
        }
    }

    /**
     * Constructs a new instance of the supplied type for this list.
     *
     * @param cursor
     * @returns {T}
     */
    private newValue(cursor: SkeletosCursor): T {
        return new this._typeConstructor(cursor) as T;
    }
}
