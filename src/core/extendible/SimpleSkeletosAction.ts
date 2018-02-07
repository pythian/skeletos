// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************

import {AbstractSkeletosAction} from "./AbstractSkeletosAction";

/**
 * A simple action that executes just one command.
 */
export abstract class SimpleSkeletosAction extends AbstractSkeletosAction {
    protected static DO_EXECUTE_COMMAND_KEY: string = "doExecute";

    /**
     * Override this to do something
     */
    protected abstract doExecute(): void;

    protected getCommands(): object {
        return {
            [SimpleSkeletosAction.DO_EXECUTE_COMMAND_KEY]: this.callFunctionSynchronously(this.doExecute)
        };
    }
}