// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import {SimpleSkeletosAction} from "./SimpleSkeletosAction";
import Promise = require("bluebird");

/**
 * This is simply a wrapper for the SimpleSkeletosAction that allows to to wrap
 * the .execute() function in a promise. This is useful when we want to interpret any callback
 * errors, while still using a new transaction.
 *
 */
export abstract class SimpleSkeletosPromiseAction<ReturnType> extends SimpleSkeletosAction {

    protected returnValue: ReturnType;

    protected _resolve: (value?: ReturnType) => void;
    protected _reject: (error?: any) => void;

    /**
     * Returns the action as a promise using the ReturnType as specified by the subclass.
     *
     * @returns {Promise<T>|Promise}
     */
    public asPromise(): Promise<ReturnType> {
        return new Promise(
            (resolve: (value?: ReturnType) => void, reject: (error?: any) => void): void => {
                this._resolve = resolve;
                this._reject = reject;
                this.execute();
            }
        );
    }

    /**
     * We override the doAfterExecute(..) function in order to reject or resolve the promise
     *
     * @param err
     */
    protected doAfterExecute(err?: Error): void {
        super.doAfterExecute(err);
        if (err) {
            if (this._reject) {
                this._reject(err);
            }
        } else {
            if (this._resolve) {
                this._resolve(this.returnValue);
            }
        }
    }

}