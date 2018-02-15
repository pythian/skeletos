// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************

import async = require("async");
import _ = require("lodash");
import {AbstractAction} from "./AbstractAction";
import {ISkeletosCommand} from "./ISkeletosCommand";

/**
 * An action that can show progress on the client side using a progress bar that you define.
 *
 * To show a progress bar, you can either:
 * 1. Set the static `globalStartProgressBarFn`, `globalIncrementProgressBarFn`, and `globalCompleteProgressBarFn`
 * fields to be functions of your global progress bar (for example, something like react-nprogress), or...
 *
 * 2. Override the class methods `startProgressBar`, `incrementProgressBar`, and `completeProgressBar`.
 */
export abstract class AbstractProgressAction extends AbstractAction {
    public static globalStartProgressBarFn: () => void;
    public static globalIncrementProgressBarFn: () => void;
    public static globalCompleteProgressBarFn: () => void;

    private static PROGRESS_COMMAND_KEY_PREFIX: string = "AbstractProgressAction-";
    private static START_PROGRESS_COMMAND_KEY: string = AbstractProgressAction.PROGRESS_COMMAND_KEY_PREFIX +
        "startProgressBar";
    private static INCREMENT_PROGRESS_COMMAND_KEY: string = AbstractProgressAction.PROGRESS_COMMAND_KEY_PREFIX +
        "incrementProgressBar-";
    private static COMPLETE_PROGRESS_COMMAND_KEY: string = AbstractProgressAction.PROGRESS_COMMAND_KEY_PREFIX +
        "completeProgressBar";

    private static _ACTIONS_SHOWING_PROGRESS_COUNTER: number = 0;

    protected wrapCommands(): ISkeletosCommand[] | object {
        const commands = super.wrapCommands();
        if (process.env.RENDER_ENV === "server") {
            return commands;
        }
        if (_.isArray(commands)) {
            const newCmds: ISkeletosCommand[] = [];
            newCmds.push(this.callFunctionAsynchronously(this._startProgressBar));
            _.forEach(commands, (value: ISkeletosCommand) => {
                newCmds.push(value);
                newCmds.push(this.callFunctionAsynchronously(this.incrementProgressBar));
            });
            newCmds.push(this.callFunctionAsynchronously(this._completeProgressBar));
            return newCmds;
        } else {
            const newCmds: object = {};
            const keys: string[] = [];

            newCmds[AbstractProgressAction.START_PROGRESS_COMMAND_KEY] =
                this.callFunctionAsynchronously(this._startProgressBar);

            _.forEach(commands, (value: any, key: string) => {
                // keys will be used for complete progress bar at the end
                keys.push(key);

                // first we need to make sure all commands depend on start progress starting first.
                if (_.isArray(value)) {
                    newCmds[key] = [AbstractProgressAction.START_PROGRESS_COMMAND_KEY, ...value];
                } else {
                    newCmds[key] = [AbstractProgressAction.START_PROGRESS_COMMAND_KEY, value];
                }

                // once the command completes, we will increment the progress
                newCmds[AbstractProgressAction.INCREMENT_PROGRESS_COMMAND_KEY + key] =
                    [key, this.callFunctionAsynchronously(this.incrementProgressBar)];
            });

            newCmds[AbstractProgressAction.COMPLETE_PROGRESS_COMMAND_KEY] =
                [...keys, this.callFunctionAsynchronously(this._completeProgressBar)];

            return newCmds;
        }
    }

    /**
     * Override this to supply your own progress bar implementation. You can also alternatively set the static
     * startProgressBarFn in this class to use that globally instead.
     */
    protected startProgressBar(callback: async.ErrorCallback<Error>): void {
        // only call the global function if we have it and if the global progress counter is zero (unstarted)
        if (AbstractProgressAction.globalStartProgressBarFn &&
            AbstractProgressAction._ACTIONS_SHOWING_PROGRESS_COUNTER === 0) {
            AbstractProgressAction.globalStartProgressBarFn();
        }

        callback();
    }

    /**
     * Override this to supply your own progress bar implementation. You can also alternatively set the static
     * incrementProgressBarFn in this class to use that globally instead.
     */
    protected incrementProgressBar(callback: async.ErrorCallback<Error>): void {
        if (AbstractProgressAction.globalIncrementProgressBarFn) {
            AbstractProgressAction.globalIncrementProgressBarFn();
        }

        callback();
    }

    /**
     * Override this to supply your own progress bar implementation. You can also alternatively set the static
     * completeProgressBarFn in this class to use that globally instead.
     */
    protected completeProgressBar(callback: async.ErrorCallback<Error>): void {
        // only call the global function if we have it and if the global progress counter is back to zero (finished)
        if (AbstractProgressAction.globalCompleteProgressBarFn &&
            AbstractProgressAction._ACTIONS_SHOWING_PROGRESS_COUNTER === 0) {
            AbstractProgressAction.globalCompleteProgressBarFn();
        }

        callback();
    }

    private _startProgressBar(callback: async.ErrorCallback<Error>) {
        AbstractProgressAction._ACTIONS_SHOWING_PROGRESS_COUNTER++;
        this.startProgressBar(callback);
    }

    private _completeProgressBar(callback: async.ErrorCallback<Error>) {
        AbstractProgressAction._ACTIONS_SHOWING_PROGRESS_COUNTER--;
        this.completeProgressBar(callback);
    }
}
