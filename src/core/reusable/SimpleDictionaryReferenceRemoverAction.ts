// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import _ = require("lodash");

import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosDictionary} from "./SkeletosDictionary";
import {SimpleSkeletosAction} from "../extendible/SimpleSkeletosAction";

export interface ISimpleDictionaryReferenceRemoverActionArg<T extends AbstractSkeletosState> {
    dictionaryToRemoveFrom: SkeletosDictionary<T>;
    id: string;
}

/**
 * This action is used for conveniently removing a reference in a skeletos dictionary. The concept is similar to that of
 * the SimpleStateSetterAction. In this action's case, we accept
 * 1) dictionaryToRemoveFrom    - The dictionary that the reference will be removed from
 * 2) id                        - The id (key value) of the reference to remove
 *
 * Example Usage:
 * new SimpleDictionaryReferenceRemoverAction(
 *      {
 *          dictionaryToRemoveFrom: this.skeletosState.selectedStaffMembersDictionary,
 *          id: "" + staffMemberState.id
 *      }
 * )
 *
 * Additionally, you can use this action to remove multiple separate references.
 */
export class SimpleDictionaryReferenceRemoverAction<T extends AbstractSkeletosState> extends SimpleSkeletosAction {

    private _args: Array<ISimpleDictionaryReferenceRemoverActionArg<T>>;

    constructor(...args: Array<ISimpleDictionaryReferenceRemoverActionArg<T>>) {
        super(args[0].dictionaryToRemoveFrom.cursor.root());

        this._args = _.map(
            args,
            (arg: ISimpleDictionaryReferenceRemoverActionArg<T>): ISimpleDictionaryReferenceRemoverActionArg<T> => {
                return {
                    dictionaryToRemoveFrom: new SkeletosDictionary(arg.dictionaryToRemoveFrom, this.transaction),
                    id: arg.id
                };
            }
        );
    }

    protected doExecute(): void {
        _.forEach(
            this._args, (arg: ISimpleDictionaryReferenceRemoverActionArg<T>) => {
                arg.dictionaryToRemoveFrom.remove(arg.id);
            }
        );
    }
}