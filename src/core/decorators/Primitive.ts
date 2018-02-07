import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {PropTypeInfo, EPropType} from "./helpers/PropTypeInfo";

/**
 * Decorator to mark a property as a Skeletos primitive.
 *
 * @param nameOfCursor use this if you want to name the cursor something other than the property name, otherwise leave
 *     blank
 */
export function Primitive(nameOfCursor?: string): PropertyDecorator {
    return function PrimitiveDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        nameOfCursor = nameOfCursor || propertyKey;

        // property getter
        const getter: () => any = function(): any {
            return this.cursor.select(nameOfCursor).get();
        };

        // property setter
        const setter: (v: any) => void = function(newVal: any): void {
            this.cursor.select(nameOfCursor).set(newVal);
        };

        // Delete property.
        if (delete target[propertyKey]) {

            // Create new property with getter and setter
            Object.defineProperty(
                target, propertyKey, {
                    get: getter,
                    set: setter,
                    enumerable: true,
                    configurable: true
                }
            );
        }

        PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey)
            .setPropType(EPropType.primitive)
            .setNameOfCursor(nameOfCursor);
    };
}