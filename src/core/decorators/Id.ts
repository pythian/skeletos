import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {PropTypeInfo} from "./helpers/PropTypeInfo";
import {ClassTypeInfo} from "./helpers/ClassTypeInfo";


export const IS_ID_PROP_KEY: string = "Skeletos.IsId";
export const ID_PROP_KEY: string = "Skeletos.Id";

/**
 * Decorator to mark a property as the ID so that it can be used in Dictionaries automatically.
 */
export function Id() {
    return function setId(target: AbstractSkeletosState, propertyKey: string): void {
        PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey)
            .putExtension(IS_ID_PROP_KEY, true);

        ClassTypeInfo.getOrCreateClassTypeInfo(target).putExtension(ID_PROP_KEY, propertyKey);
    };
}