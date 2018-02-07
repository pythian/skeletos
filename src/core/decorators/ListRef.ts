import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosList} from "../reusable/SkeletosList";
import {SkeletosCursor} from "../base/SkeletosCursor";
import {PropTypeInfo, EPropType} from "./helpers/PropTypeInfo";

/**
 * Decorator factory to mark a property as a reference to a Skeletos List.
 *
 * @param type the type of state to store in the List.
 * @param nameOfCursor use this if you want to name the cursor something other than the property name, otherwise leave
 *     blank
 */
export function ListRef(type: () => typeof AbstractSkeletosState, nameOfCursor?: string): PropertyDecorator {
    return function ListRefDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        nameOfCursor = nameOfCursor || propertyKey;

        // property getter
        const getter: () => any = function(): any {
            const cursor: SkeletosCursor = this.cursor.select(nameOfCursor);
            if (cursor.exists()) {
                return new SkeletosList<any>(cursor.selectReferencedCursor(), type());
            } else {
                return undefined;
            }
        };

        // property setter
        const setter: (v: SkeletosList<any>) => void = function(newVal: SkeletosList<any>): void {
            this.setReference(newVal, this.cursor.select(nameOfCursor));
        };

        // Delete property.
        if (delete target[propertyKey]) {

            // Create new property with getter and setter
            Object.defineProperty(target, propertyKey, {
                get: getter,
                set: setter,
                enumerable: true,
                configurable: true
            });
        }

        PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey)
            .setPropType(EPropType.listRef)
            .setNameOfCursor(nameOfCursor)
            .setStateType(type);
    };
}