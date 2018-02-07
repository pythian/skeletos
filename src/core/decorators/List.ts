import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosList} from "../reusable/SkeletosList";
import {PropTypeInfo, EPropType} from "./helpers/PropTypeInfo";

/**
 * Decorator factory to mark a property as a Skeletos List.
 *
 * @param type the type of state to store in the List.
 * @param nameOfCursor use this if you want to name the cursor something other than the property name, otherwise leave
 *     blank
 */
export function List(type: () => typeof AbstractSkeletosState, nameOfCursor?: string): PropertyDecorator {
    return function ListDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        nameOfCursor = nameOfCursor || propertyKey;

        // property getter
        const getter: () => any = function(): any {
            return new SkeletosList<any>(this.cursor.select(nameOfCursor), type());
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
            .setPropType(EPropType.list)
            .setNameOfCursor(nameOfCursor)
            .setStateType(type);
    };
}