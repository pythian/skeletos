// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************

import async = require("async");
import _ = require("lodash");
import {getDefaultLogger} from "../helpers/logging/DefaultLogger";
import {ICommandFunction} from "./ICommandFunction";

/**
 * An action is the place where you would place any business logic that needs to be done on the server. It is a
 * nice way to handle callback hell, where you would define all your data and flow up front in the action and have it
 * all wire up the callbacks automatically.
 *
 * An action is composed of multiple commands. The action can execute these commands in parallel, sequentially or
 * in some defined order. Under the covers, the action uses async.auto(..) to determine the pipeline of commands
 * that need to be executed. See getCommands(..).
 */
export class AbstractAction {

    /**
     * The name of the action (same as name of class in development).
     *
     * @type {string}
     * @private
     */
    protected _actionName: string = "AbstractAction";

    /**
     * Whether execution has been scheduled to be aborted.
     */
    protected _executionAborted: boolean;

    /**
     * If this callback is specified, this it is used instead of the action's callback specified in the execute(..)
     * method. This allows another action to take over this action's execute callback. It is useful in situations when
     * another action wants to use this action as a command in it's own context.
     */
    protected _onDoneOverride: async.ErrorCallback<Error>;

    protected _startTime: number;

    private _actionTimeOut: number = 0; // default no timeout
    private _actionTimeOutID: any;
    private _startTimeOutCallback: async.ErrorCallback<Error>;

    /**
     * Creates a new action.
     *
     * If you have attributes/variables that you want to initialize, do it in the AbstractAction#doBeforeExecute().
     * That function is a good chance to initialize variables instead of initializing variables in the constructor.
     * The problem with initializing variables in the constructor is that if this action is encapsulated within another
     * action, then you may not currently have all the data to initialize variables with.
     */
    constructor() {
        // pretty cool mechanism to get the name of the current class. Only works server side where classes
        // aren't obfuscated. When viewing client side in the browser console names are condensed
        // to two-letter lookup symbols.
        this._actionName = this.constructor.toString().match(/\w+/g)[1];
    }

    /**
     * Use this to execute the action.
     *
     * !IMPORTANT! As a subclass, you should never override this function. Override AbstractAction#getCommands(..)
     * instead.
     */
    execute(): void {
        this.doBeforeExecute();
        if (!this._executionAborted) {
            this._startTime = new Date().getTime();

            let cmds: object = this.getCommands();
            if (this._actionTimeOut !== 0) {
                // wrap getCommands with an extra function that invokes a timeout
                cmds = this._wrapCommandsWithTimeout();
            }
            async.auto(cmds, this.doFinish.bind(this));
        }
    }

    /**
     * Allows actions to specific a timeout threshold after which the action will throw an error exception
     *
     * Part of the action chaining API, which allows actions to pass properties while calling other actions in a clean
     * and efficient way.
     */
    public setActionTimeout(actionTimeOut: number): AbstractAction {
        this._actionTimeOut = actionTimeOut ? actionTimeOut : 0;
        return this;
    }

    /**
     * Returns the action map used to feed into async.auto. Override this method and return something in the
     * following format:
     *
     * <code>
     * {
     *  Command1: this.callFunctionSynchronously(this.command1),
     *
     *  Command2: ["Command1", this.callFunctionSynchronously(this.command2)], // depends on Command 1
     *
     *  Command3: ["Command1", this.callFunctionSynchronously(this.command3)], // depends on Command 1 also
     *
     *  Command4: ["Command1", "Command2", this.callFunctionAsynchronously(this.command4)], // depends on command1 and
     *                                                                                         command2
     *
     *  Command5: this.callAnotherAction(new AnotherAction()) // does not depend on anything, executes another command
     * }
     * </code>
     *
     * See:
     * http://caolan.github.io/async/docs.html#.auto
     *
     * @param executeAsCommand whether this action is being executed as a command of another action
     */
    protected getCommands(): object {
        return {};
    }

    /**
     * This method gets called right before the action is executed. It is a good chance to initialize variables instead
     * of initializing variables in the constructor. The problem with initializing variables in the constructor is that
     * if this action is encapsulated within another action, then you may not currently have all the data to initialize
     * variables with.
     */
    protected doBeforeExecute(): void {
        // nothing
    }

    /**
     * This method gets called right after the action is executed. It is a good chance to cleanup anything you
     * initialized.
     */
    protected doAfterExecute(err?: Error): void | Promise<void> {
        // if an error occurred during execution and turnOffTimeout wasn't called, then we need to ensure the timeout
        // is cleared
        if (this._actionTimeOutID) {
            clearTimeout(this._actionTimeOutID);
        }
    }

    /**
     * Shows an error notification. By default, outputs to console.
     *
     * @param err
     */
    protected displayErrorNotification(err: Error): void {
        getDefaultLogger().error(err.message, err);
    }

    // subclasses may want to override this to log a problem and/or display a translatible error message
    protected getTimeoutError(): Error {
        return new Error("The action took too long to execute.  Please try again or contact your administrator...");
    }

    /**
     * Abort the action if it has not already been executed. Has no effect when called after the action is executed or
     * when it is currently executing commands.
     */
    protected abortIfNotExecuted(): void {
        this._executionAborted = true;
    }

    /**
     * When specifying the command map in getCommands(..), use this function to wrap another action within this action.
     *
     * @param action
     */
    protected callAnotherAction(action: AbstractAction): ICommandFunction {
        return function executeActionAsCommand(
            prevResultsOrCallback: async.ErrorCallback<Error> | any,
            callback?: async.ErrorCallback<Error>): any {
            if (arguments.length > 1) {
                action._onDoneOverride = callback;
            } else if (arguments.length === 1) {
                action._onDoneOverride = prevResultsOrCallback as async.ErrorCallback<Error>;
            }

            try {
                action.execute.call(action);
            } catch (e) {
                // if nested action, then throw / propogate error up
                action._onDoneOverride(e);
            }
        } as ICommandFunction;
    }

    /**
     * When specifying the command map in getCommands(..), use this function to call a function synchronously.
     *
     * That is, as soon as the supplied function exits, it will be taken as the end of that command and control will
     * be passed back to the async.auto(..) controller.
     *
     * @param fn
     * @param thisArg
     * @param params
     * @returns {function(async.ErrorCallback<Error>): any}
     */
    // tslint:disable-next-line
    protected callFunctionSynchronously(fn: Function, thisArg?: any, ...params: any[]): (
        prevResultsOrCallback: async.ErrorCallback<Error> | any,
        callback?: async.ErrorCallback<Error>) => any {
        let me: any = thisArg;
        if (!me) {
            me = this;
        }

        return function executeActionAsCommand(
            prevResultsOrCallback: async.ErrorCallback<Error> | any,
            callback?: async.ErrorCallback<Error>): any {
            let _callback: async.ErrorCallback<Error>;
            if (arguments.length > 1) {
                _callback = callback as async.ErrorCallback<Error>;
            } else if (arguments.length === 1) {
                _callback = prevResultsOrCallback as async.ErrorCallback<Error>;
            }

            try {
                fn.call(me, ...params);
                return _callback();
            } catch (e) {
                if (!me._onDoneOverride) {
                    me.displayErrorNotification(e);
                }
                return _callback(e);
            }
        };
    }

    /**
     * When specifying the command map in getCommands(..), use this function to call an function asynchronously.
     *
     * That is, the supplied function will be given a callback to call when it is done. This gives a chance for the
     * function to do some asynchronous processing.
     *
     * @param fn
     * @param thisArg
     * @returns {function((async.ErrorCallback<Error>|any), async.ErrorCallback<Error>=): any}
     */
    protected callFunctionAsynchronously(
        fn: (callback: async.ErrorCallback<Error>) => any, thisArg?: any): ICommandFunction {
        let me: any = thisArg;
        if (!me) {
            me = this;
        }

        return function callActionAsCommand(
            prevResultsOrCallback: async.ErrorCallback<Error> | any,
            callback?: async.ErrorCallback<Error>): any {
            let _callback: async.ErrorCallback<Error>;
            if (arguments.length > 1) {
                _callback = callback as async.ErrorCallback<Error>;
            } else if (arguments.length === 1) {
                _callback = prevResultsOrCallback as async.ErrorCallback<Error>;
            }

            try {
                fn.call(me, _callback);
            } catch (e) {
                if (!me._onDoneOverride) {
                    me.displayErrorNotification(e);
                }
                return _callback(e);
            }
        };
    }

    private _wrapCommandsWithTimeout(): object {
        // get the last command in the chain and use this as a pre-requisite
        const cmds: object = this.getCommands();

        // now extend commands using all command keys as pre-requisites
        return _.extend(
            {
                startTimeout: this.callFunctionAsynchronously(this._startTimeout)
            },
            cmds,
            {
                turnOffTimeout: [
                    ..._.keys(cmds),
                    this.callFunctionAsynchronously(this._turnOffTimeout)
                ]
            }
        );
    }

    private _startTimeout(callback: async.ErrorCallback<Error>) {
        this._startTimeOutCallback = callback;
        this._actionTimeOutID = setTimeout(() => {
            callback(this.getTimeoutError());
            return null;
        }, this._actionTimeOut);
    }

    private _turnOffTimeout(callback: async.ErrorCallback<Error>) {
        // clear the timeout and call the start timeout callback so the action can complete
        clearTimeout(this._actionTimeOutID);
        this._startTimeOutCallback();
        callback();
        return null;
    }

    private doFinish(err?: Error): void {
        this.doAfterExecute(err);

        if (this._onDoneOverride) {
            this._onDoneOverride(err);
        } else {
            if (err) {
                this.displayErrorNotification(err);  // leave it to subclasses to format the messages
            }
        }
    }
}
