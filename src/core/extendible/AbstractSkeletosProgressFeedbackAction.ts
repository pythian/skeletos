// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************

import {AbstractSkeletosAction} from "./AbstractSkeletosAction";
import {SkeletosCursor} from "../base/SkeletosCursor";
import async = require("async");
import _ = require("lodash");
import {ICommandFunction} from "./ICommandFunction";

export abstract class AbstractSkeletosProgressFeedbackAction extends AbstractSkeletosAction {

    public static startProgressBarFn: () => void;
    public static incrementProgressBarFn: () => void;
    public static completeProgressBarFn: () => void;

    private static _ACTIONS_SHOWING_PROGRESS_COUNTER: number = 0;
    private _executingWithProgress: boolean = false;

    public static wrapWithProgressFeedback(
        rootCursor: SkeletosCursor, action: AbstractSkeletosAction): AbstractSkeletosProgressFeedbackAction {
        /* tslint:disable:max-classes-per-file */
        return new class extends AbstractSkeletosProgressFeedbackAction {
            protected getCommands(): object {
                return {
                    doWrappedAction: this.callAnotherActionWithProgress(action)
                };
            }
        }(rootCursor);
        /* tslint:disable:max-classes-per-file */
    }

    /**
     * Injects progress updates that will run around the same time as the original command.  Since the command list can
     * have a complex set of dependencies, we cannot interfere with the ordering of commands.  To ensure that progress
     * gets updated at about the same time as the dependencies of the original command have been satisfied, inject a
     * new command (which will update the progress bar) which has the same dependencies as the original.  This ensures
     * the progress bar is updated at *around* the same time as the original command will execute (either before or
     * after.)
     */
    public executeWithProgress(): void {
        // Don't show the progress feedback bar on server-side rendering
        if ("server" !== process.env.RENDER_ENV) {
            this._executingWithProgress = true;
            const prefix: string = "updateProgressBar-";
            const commandsWithProgress: object = {};
            _.each(
                this.getCommands(),
                (value: any, key: string): void => {
                    if (_.isArray(value) && value.length > 1) {
                        commandsWithProgress[prefix + key] =
                            [..._.slice(value, 0, value.length - 1), this.getIncCommand()];
                    } else {
                        commandsWithProgress[prefix + key] = this.getIncCommand();
                    }
                    commandsWithProgress[key] = value;
                }
            );
            this.getCommands = (): object => commandsWithProgress;
        }

        this.execute();
    }

    /**
     * Calls another action using its `executeWithProgress` instead of `execute`.  If the action isn't an
     * `AbstractSkeletosProgressFeedbackAction`, then the superclass' invocation of `callAnotherAction` will be called
     * instead.  Does not interfere or prevent calling `callAnotherAction`
     *
     * @param action
     * @returns {(prevResultsOrCallback:(async.ErrorCallback<Error>|any), callback?:async.ErrorCallback<Error>)=>any}
     */
    protected callAnotherActionWithProgress(action: AbstractSkeletosAction): ICommandFunction {
        if (!(action instanceof AbstractSkeletosProgressFeedbackAction)) {
            return super.callAnotherAction(action);
        }

        return function executeActionAsCommand(
            prevResultsOrCallback: async.ErrorCallback<Error> | any,
            callback?: async.ErrorCallback<Error>): any {
            if (arguments.length > 1) {
                action._onDoneOverride = callback;
            } else if (arguments.length === 1) {
                action._onDoneOverride = prevResultsOrCallback as async.ErrorCallback<Error>;
            }

            try {
                action.executeWithProgress.call(action);
            } catch (e) {
                // if nested action, then throw / propogate error up
                action._onDoneOverride(e);
            }
        };
    }

    protected doBeforeExecute(): void {
        super.doBeforeExecute();
        if (this._executingWithProgress &&
            AbstractSkeletosProgressFeedbackAction._ACTIONS_SHOWING_PROGRESS_COUNTER++ === 0) {
            this.startProgressBar();
        }
    }

    protected doAfterExecute(error?: Error): void {
        super.doAfterExecute(error);
        if (this._executingWithProgress &&
            --AbstractSkeletosProgressFeedbackAction._ACTIONS_SHOWING_PROGRESS_COUNTER === 0) {
            this.completeProgressBar();
        }
    }

    /**
     * Override this to supply your own progress bar implementation. You can also alternatively set the static
     * startProgressBarFn in this class to use that globally instead.
     */
    protected startProgressBar(): void {
        if (AbstractSkeletosProgressFeedbackAction.startProgressBarFn) {
            AbstractSkeletosProgressFeedbackAction.startProgressBarFn();
        }
    }

    /**
     * Override this to supply your own progress bar implementation. You can also alternatively set the static
     * incrementProgressBarFn in this class to use that globally instead.
     */
    protected incrementProgressBar(): void {
        if (AbstractSkeletosProgressFeedbackAction.incrementProgressBarFn) {
            AbstractSkeletosProgressFeedbackAction.incrementProgressBarFn();
        }
    }

    /**
     * Override this to supply your own progress bar implementation. You can also alternatively set the static
     * completeProgressBarFn in this class to use that globally instead.
     */
    protected completeProgressBar(): void {
        if (AbstractSkeletosProgressFeedbackAction.completeProgressBarFn) {
            AbstractSkeletosProgressFeedbackAction.completeProgressBarFn();
        }
    }

    private getIncCommand(): ICommandFunction {
        return this.callFunctionSynchronously(this.incrementProgressBar);
    }
}
