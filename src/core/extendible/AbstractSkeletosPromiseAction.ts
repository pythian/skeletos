// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import Promise = require("bluebird");
import {AbstractSkeletosAction} from "./AbstractSkeletosAction";

/**
 * This is simply a wrapper for the AbstractSkeletosAction that allows to to wrap
 * the .execute() function in a promise. This is useful when we which to interpret any callback
 * errors.
 *
 */
export abstract class AbstractSkeletosPromiseAction<ReturnType> extends AbstractSkeletosAction {

    protected returnValue: ReturnType;

    protected _resolve: (value?: ReturnType) => void;
    protected _reject: (error?: any) => void;

    /**
     * Returns the action as a promise using the ReturnType as specified by the subclass.
     *
     * Do *not* use this in conjunction with `execute()`.
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