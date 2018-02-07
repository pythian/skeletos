import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosCursor} from "../base/SkeletosCursor";
import {EPropType, PropTypeInfo} from "./helpers/PropTypeInfo";

/**
 * Decorator factory to mark a property as a reference to a Skeletos State.
 *
 * @param type the type is required to create new instances of it.
 * @param nameOfCursor use this if you want to name the cursor something other than the property name, otherwise leave
 *     blank
 */
export function StateRef(type: () => typeof AbstractSkeletosState, nameOfCursor?: string): PropertyDecorator {
    return function StateRefDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        nameOfCursor = nameOfCursor || propertyKey;

        // property getter
        const getter: () => any = function(): any {
            const cursor: SkeletosCursor = this.cursor.select(nameOfCursor);
            if (cursor.exists()) {
                return new (type())(cursor.selectReferencedCursor());
            } else {
                return undefined;
            }
        };

        // property setter
        const setter: (v: any) => void = function(newVal: any): void {
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
            .setPropType(EPropType.stateRef)
            .setNameOfCursor(nameOfCursor)
            .setStateType(type);
    };
}