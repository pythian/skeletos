// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import {SkeletosTransaction} from "../base/SkeletosTransaction";
import {SkeletosCursor} from "../base/SkeletosCursor";

/**
 * The AbstractSkeletosState is what you, as an application developer, would use to build out your
 * application. The AbstractSkeletosState would be the superclass of all your application state,
 * whether it is state that you need to store as random data retrieved from the server,
 * or temporary data that the user has generated, or UI properties that need to be supplied
 * to your UI components.
 *
 * An AbstractSkeletosState is built on top of a SkeletosCursor, which in turn is built on top of SkeletosDb,
 * which is a tree database. A SkeletosCursor points to a specific node in the tree.
 *
 * The AbstractSkeletosState is the top layer in the data access stack:
 *
 * ----------------------
 * AbstractSkeletosState    <--- We are here
 * ----------------------
 * SkeletosCursor
 * ----------------------
 * SkeletosDb
 * ----------------------
 *
 * An AbstractSkeletosState is extremely lightweight: it only owns two properties: one that represents
 * the cursor with which it gets/sets data, and another a unique hash of the cursor.
 *
 * By associating AbstractSkeletosState to a single SkeletosCursor, we know that an AbstractSkeletosState can only
 * represent a particular node in the tree and nothing else. Each property of an AbstractSkeletosState that you code in
 * your application, however, will represent a child cursor. And thus, you can build out an entire class-typed
 * application state tree using AbstractSkeletosStates.
 *
 * ---------------------------------------
 *
 * So you know a single AbstractSkeletosState refers to a single SkeletosCursor and thus a single node in the tree.
 * But AbstractSkeletosState in reality refers to a single SkeletosCursor at a specific time. It does this by storing
 * a unique hash when the AbstractSkeletosState is constructed.
 *
 * So what is a unique hash?
 * Every node in the tree db has a unique hash value assigned. When you set a value on a node, the hash value of
 * that node gets updated. In addition, all the hash values from that node up to the root (path too root)
 * are changed. This is perfect when you want to build UI applications with a technology like React as
 * each node can represent a Node, and updating a value will allow all components to the root to get updated.
 *
 * What this means is that AbstractSkeletosState is extremely lightweight and temporary: create a new one every time
 * you want to supply it to your UI components for example. And don't ever cache AbstractSkeletosState!
 *
 * This brings us to the next point: An AbstractSkeletosState does not represent an immutable value. This is because
 * SkeletosDb is not an immutable tree store: it turns out immutability is a huge performance inhibitor in
 * large applications. What Skeletos does provide you with is a unique hash to compare the state of modifications
 * to the values, which you can do fast equality checks on in your UI components.
 *
 * ---------------------------------------
 *
 * Finally, note that an AbstractSkeletosState can exist in two forms: read-only and writable.
 *
 * A read-only AbstractSkeletosState is created out of a read-only cursor, and a writable AbstractSkeletosState is
 * created out of a writable cursor. A writable cursor has a SkeletosTransaction associated with it, whereas a
 * read-only cursor does not.
 *
 * An AbstractSkeletosState cannot change from read-only to writable or vice-versa. To make a writable
 * AbstractSkeletosState out of a read-only AbstractSkeletosState, you would do something like:
 *
 * const myReadOnlyState: MyState = new MyState(someCursor);
 * const myWritableState: MyState = new MyState(myReadOnlyState, transaction);
 *
 * Here, myWritableState is a writable copy of myReadOnlyState.
 *
 * ---------------------------------------
 *
 * Note: this class is purposely not marked abstract because it needs to be instantiated as a standalone in certain cases.
 */
export class AbstractSkeletosState {
    private _cursor: SkeletosCursor;
    private _hash: string;

    /**
     * Create a copy of the AbstractSkeletosState from the given AbstractSkeletosState, or create a copy of the
     * SkeletosCursor from the given SkeletosCursor, and make this new copy a modifiable copy
     * by supplying a SkeletosTransaction. If transaction = null, then a read-only cursor is created. If transaction
     * argument is not used, then the transaction argument from the given cursor is used.
     */
    constructor(stateOrCursorToMakeCopyOf: AbstractSkeletosState|SkeletosCursor, transaction?: SkeletosTransaction);

    /**
     * Implementation.
     */
    constructor(arg1: SkeletosCursor|AbstractSkeletosState, arg2?: SkeletosTransaction) {
        let cursor: SkeletosCursor;
        let transaction: SkeletosTransaction;

        if (arg1 instanceof SkeletosCursor) {
            cursor = arg1 as SkeletosCursor;
        } else {
            if (!(arg1 instanceof this.constructor)) {
                const thisTypeName: string = this.constructor.toString().match(/\w+/g)[1];
                const otherTypeName: string = arg1.toString().match(/\w+/g)[1];

                throw new Error(
                    "AbstractSkeletosState: Cannot create a state of type " + thisTypeName +
                    " because " + thisTypeName + " is not an instanceof " + otherTypeName
                );
            }
            cursor = (arg1 as AbstractSkeletosState).cursor;
        }

        if (arguments.length === 1) {
            transaction = cursor.transaction;
        } else {
            transaction = arg2;
        }

        this._cursor = new SkeletosCursor(cursor, transaction);

        // store the hash at the time we create the state.
        this._hash = this._cursor.getHash();
    }

    /**
     * The backing cursor of this state.
     */
    get cursor(): SkeletosCursor {
        return this._cursor;
    }

    /**
     * Returns whether this is a read only state.
     *
     * A read only state is one with which you cannot update the value, because
     * there is no associated transaction.
     */
    get isReadOnly(): boolean {
        return !!this._cursor.isReadOnly;
    }

    /**
     * An extremely fast equality check between this state and another state. This will return false
     * if the other state is of a different type, or of the same type but constructed at a different time
     * such that other state has had modifications made to the values at the time the AbstractSkeletosState was
     * constructed which this AbstractSkeletosState did not know about.
     */
    isEqualsTo(other: AbstractSkeletosState): boolean {
        return this._hash === other._hash;
    }

    /**
     * Convenience method for subclasses to use to select a child cursor from the cursor represented by this state.
     */
    protected select(name: string): SkeletosCursor {
        return this._cursor.select(name);
    }

    /**
     * Convenience method that sets a reference from the fromCursor to the toCursor.
     *
     * Recall that a cursor is built on top of SkeletosDb, and represents a particular node in the tree db.
     *
     * A node can be a reference to another node. A referencing node will always take up the same value
     * as the node it references. Additionally, any changes made to the referenced node will update the hash
     * of not just the referenced node but all the referencing nodes, as well as all the nodes in the path to
     * the root of the tree.
     *
     * This powerful construct allows you to build data dependencies that you don't every have to worry about
     * updating yourself. Additionally, all memory management is done centrally.
     */
    setReference(fromCursor: SkeletosCursor, toCursor: SkeletosCursor): void;

    /**
     * Convenience method that sets a reference from the fromCursor to the toState's cursor.
     *
     * Recall that a cursor is built on top of SkeletosDb, and represents a particular node in the tree db.
     *
     * A node can be a reference to another node. A referencing node will always take up the same value
     * as the node it references. Additionally, any changes made to the referenced node will update the hash
     * of not just the referenced node but all the referencing nodes, as well as all the nodes in the path to
     * the root of the tree.
     *
     * This powerful construct allows you to build data dependencies that you don't every have to worry about
     * updating yourself. Additionally, all memory management is done centrally.
     */
    setReference(toState: AbstractSkeletosState, fromCursor: SkeletosCursor): void;

    /**
     * Implementation
     */
    setReference(to: SkeletosCursor|AbstractSkeletosState, from: SkeletosCursor): void {
        if (!to) {
            // to is undefined. Thus, just unset the from and move on.
            from.unsetReference();
        } else {
            let cursor: SkeletosCursor;
            if (to instanceof SkeletosCursor) {
                cursor = to as SkeletosCursor;
            } else if (to instanceof AbstractSkeletosState) {
                cursor = (to as AbstractSkeletosState).cursor;
            }

            from.setReference(cursor.path);
        }
    }
}