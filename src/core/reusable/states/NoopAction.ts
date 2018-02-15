// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import {AbstractSkeletosAction} from "../../extendible/AbstractSkeletosAction";

/**
 * An action which does nothing.  Useful particularily in the UI when, in `getCommands`, using a terniary to decide
 * what action to take, a "do nothing" option is needed.
 */
export class NoopAction extends AbstractSkeletosAction {

    protected getCommands(): object {
        return {};
    }

}