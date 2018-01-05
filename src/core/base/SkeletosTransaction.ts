// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
/* tslint:disable:max-classes-per-file */
import {SkeletosDb, TreeNodeValueType, SkeletosDbSetterOptions, ISkeletosDbTransaction, ITreeNode} from "./SkeletosDb";

/**
 * Records all modifications done in the SkeletosDb, and allows for rollback of all these modifications.
 */
export class SkeletosTransaction implements ISkeletosDbTransaction {

    private _purpose: string;
    private _db: SkeletosDb;
    private _log: TransactionEntry[];
    private _alreadyRolledBack: boolean;

    /**
     * Records all modifications done in the SkeletosDb, and allows for rollback of all these modifications.
     * 
     * @param SkeletosDb
     * @param purpose
     */
    constructor(purpose: string, db: SkeletosDb) {
        this._purpose = purpose;
        this._db = db;
        this._log = [];
    }

    /**
     * Records the value of the set call to the database
     * 
     * @param path
     * @param newValue
     * @param oldValue
     */
    recordSet(path: string[], newValue: TreeNodeValueType, oldValue: TreeNodeValueType): void {
        this.add(path, newValue, oldValue, false);
    }

    /**
     * Records the value of the setReference call to the database.
     * 
     * @param path
     * @param newValue
     * @param oldValue
     */
    recordSetReference(path: string[], newValue: string[], oldValue: string[]): void {
        this.add(path, newValue, oldValue, true);
    }

    /**
     * Records the unset of a node. We store the entire node to restore later if needed.
     *
     * @param path
     * @param oldNode
     */
    recordUnset(path: string[], oldNode: ITreeNode): void {
        this.addUnset(path, oldNode);
    }

    /**
     * Rolls back all the modifications made to the database made so far as part of this transaction.
     *
     * @param {string} reason
     */
    rollback(reason?: string|Error): void {
        if (!this._alreadyRolledBack) {
            for (let i: number = this._log.length - 1; i >= 0; i--) {
                const entry: TransactionEntry = this._log[i];
                if (entry.isReference) {
                    this._db.setReference(entry.path, entry.oldValue as string[]);
                } else if (entry.isUnset) {
                    // restore the entire node that was unset
                    this._db.set(
                        entry.path, entry.oldNode, null,
                        SkeletosDbSetterOptions.DO_NOT_VERIFY_VALUE_TYPE
                    );
                } else {
                    this._db.set(
                        entry.path, entry.oldValue as TreeNodeValueType, null,
                        SkeletosDbSetterOptions.DO_NOT_VERIFY_VALUE_TYPE
                    );
                }
            }

            // Release all entries
            this._log = [];
            this._alreadyRolledBack = true;
        }
    }

    private add(path: string[], newValue: any, oldValue: any, isReference: boolean): void {
        this.checkIfUnrolled();

        if (newValue === oldValue) {
            // fast skip check
            return;
        }

        const entry: TransactionEntry = new TransactionEntry(path, newValue, oldValue, null, false, isReference);
        this._log.push(entry);
    }

    private addUnset(path: string[], oldNode: ITreeNode): void {
        this.checkIfUnrolled();
        const entry: TransactionEntry = new TransactionEntry(path, null, null, oldNode, true, false);
        this._log.push(entry);
    }

    private checkIfUnrolled(): void {
        if (this._alreadyRolledBack) {
            throw new Error("SkeletosTransaction: someone already called .rollback() on me. I cannot be used again.");
        }
    }
}


/**
 * The entry is a single modification that happened (either db.set or db.setReference).
 * 
 * It is unwise to keep this in memory for longer than the life of the transaction.
 */
class TransactionEntry {
    path: string[];
    newValue: TreeNodeValueType|string[];
    oldValue: TreeNodeValueType|string[];
    oldNode: ITreeNode;
    isReference: boolean;
    isUnset: boolean;

    constructor(path: string[],
                newValue: TreeNodeValueType|string[],
                oldValue: TreeNodeValueType|string[],
                oldNode: ITreeNode,
                isUnset: boolean,
                isReference: boolean) {
        this.path = path;
        this.newValue = newValue;
        this.oldValue = oldValue;
        this.oldNode = oldNode;
        this.isUnset = isUnset;
        this.isReference = isReference;
    }
}