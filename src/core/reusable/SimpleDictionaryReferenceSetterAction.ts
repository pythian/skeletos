// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import _ = require("lodash");

import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SimpleSkeletosAction} from "../extendible/SimpleSkeletosAction";
import {SkeletosDictionary} from "./SkeletosDictionary";

export interface ISimpleDictionaryReferenceSetterActionArg<T extends AbstractSkeletosState> {
    dictionaryToSet: SkeletosDictionary<T>;
    id: string;
    objectToRef: T;
}

/**
 * This action is used for conveniently setting a reference in a skeletos dictionary. The concept is similar to that of
 * the SimpleStateSetterAction. In this action's case, we accept
 * 1) dictionaryToSet   - The dictionary that the reference will be created in
 * 2) id                - The id (key value) that the reference will be created under
 * 3) objectToRef       - The object that will be referenced
 *
 * Example Usage:
 * new SimpleDictionaryReferenceSetterAction(
 *      {
 *          dictionaryToSet: this.skeletosState.selectedStaffMembersDictionary,
 *          id: "" + staffMemberState.id,
 *          objectToRef: staffMemberState
 *      }
 * )
 *
 * Additionally, you can use this action to make multiple separate references.
 */
export class SimpleDictionaryReferenceSetterAction<T extends AbstractSkeletosState> extends SimpleSkeletosAction {

    private _args: Array<ISimpleDictionaryReferenceSetterActionArg<T>>;

    constructor(...args: Array<ISimpleDictionaryReferenceSetterActionArg<T>>) {
        super(args[0].dictionaryToSet.cursor.root());

        this._args = _.map(
            args, (arg: ISimpleDictionaryReferenceSetterActionArg<T>): ISimpleDictionaryReferenceSetterActionArg<T> => {
                return {
                    dictionaryToSet: new SkeletosDictionary(arg.dictionaryToSet, this.transaction),
                    id: arg.id,
                    objectToRef: arg.objectToRef
                };
            }
        );
    }

    protected doExecute(): void {
        _.forEach(
            this._args, (arg: ISimpleDictionaryReferenceSetterActionArg<T>) => {
                arg.dictionaryToSet.putReference(arg.id, arg.objectToRef);
            }
        );
    }
}