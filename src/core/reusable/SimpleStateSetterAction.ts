// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import _ = require("lodash");

import {SimpleSkeletosAction} from "../extendible/SimpleSkeletosAction";
import {SkeletosCursor} from "../base/SkeletosCursor";
import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";

export interface ISimpleStateSetterActionArg {
    cursorToSet: SkeletosCursor;
    valueToSet?: string|number|boolean|Date|SkeletosCursor|AbstractSkeletosState;
}

export class SimpleStateSetterAction extends SimpleSkeletosAction {

    private _args: ISimpleStateSetterActionArg[];

    constructor(...args: ISimpleStateSetterActionArg[]) {
        super(args[0].cursorToSet.root());
        this._args = _.map(args, (arg: ISimpleStateSetterActionArg): ISimpleStateSetterActionArg => {
            return {
                cursorToSet: new SkeletosCursor(arg.cursorToSet, this.transaction),
                valueToSet: arg.valueToSet,
            };
        });
    }

    protected doExecute(): void {
        _.forEach(this._args, (arg: ISimpleStateSetterActionArg) => {
            if (arg.valueToSet instanceof SkeletosCursor) {
                arg.cursorToSet.setReference((arg.valueToSet as SkeletosCursor).path);
            } else if (arg.valueToSet instanceof AbstractSkeletosState) {
                arg.cursorToSet.setReference((arg.valueToSet as AbstractSkeletosState).cursor.path);
            } else {
                arg.cursorToSet.set(arg.valueToSet);
            }
        });
    }

}