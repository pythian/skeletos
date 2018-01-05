// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import {AbstractSkeletosProgressFeedbackAction} from "./AbstractSkeletosProgressFeedbackAction";

/**
 * A simple action that executes just one command.
 */
export abstract class SimpleSkeletosAction extends AbstractSkeletosProgressFeedbackAction {
    protected static DO_EXECUTE_COMMAND_KEY: string = "doExecute";

    /**
     * Override this to do something
     */
    protected doExecute(): void {
        // nothing...subclasses to override.
    }

    protected getCommands(): object {
        return {
            [SimpleSkeletosAction.DO_EXECUTE_COMMAND_KEY]: this.callFunctionSynchronously(this.doExecute)
        };
    }
}