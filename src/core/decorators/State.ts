import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {PropTypeInfo, EPropType} from "./helpers/PropTypeInfo";

/**
 * Decorator factory to mark a property as a Skeletos State.
 *
 * @param type the type is required to create new instances of it.
 * @param nameOfCursor use this if you want to name the cursor something other than the property name, otherwise leave
 *     blank
 */
export function State(type: () => typeof AbstractSkeletosState, nameOfCursor?: string): PropertyDecorator {
    return function StateDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        nameOfCursor = nameOfCursor || propertyKey;

        // property getter
        const getter: () => any = function(): any {
            return new (type())(this.cursor.select(nameOfCursor));
        };

        // Delete property.
        if (delete target[propertyKey]) {

            // Create new property with getter and setter
            Object.defineProperty(target, propertyKey, {
                get: getter,
                enumerable: true,
                configurable: true
            });
        }

        PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey)
            .setPropType(EPropType.state)
            .setNameOfCursor(nameOfCursor)
            .setStateType(type);
    };
}