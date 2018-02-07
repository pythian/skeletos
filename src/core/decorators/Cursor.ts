import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {PropTypeInfo, EPropType} from "./helpers/PropTypeInfo";
import {ErrorUtil} from "../helpers/logging/ErrorUtil";

/**
 * Decorator to mark a property as a Skeletos cursor.
 *
 * Note 1: Getting a cursor does not get the referenced cursor. You will need to do cursor.selectReferencedCursor() to
 * get the referenced cursor.
 *
 * Note 2: Setting a cursor will create a reference from the right hand of = to the left hand of =.
 *
 * @param nameOfCursor the name of the cursor. If this is not supplied, I will try to parse the name of the property
 *     and remove the Cursor suffix from the name to derive the cursor name. If you have not supplied nameOfCursor and
 *     if there is no  Cursor suffix in the property name, then I will throw an error.
 */
export function Cursor(nameOfCursor?: string) {
    return function CursorDecorator(target: AbstractSkeletosState, propertyKey: string): void {
        if (!nameOfCursor) {
            const cursorIndex: number = propertyKey.indexOf("Cursor");
            if (cursorIndex > 0) {
                nameOfCursor = propertyKey.substring(0, cursorIndex);
            } else {
                throw new Error("For the decorator on " + propertyKey + " in " + ErrorUtil.getDebugName(target) +
                    " you have not supplied either a nameOfCursor or do not have Cursor as the suffix in the name of this field.");
            }
        }

        // property getter
        const getter: () => any = function(): any {
            return this.cursor.select(nameOfCursor);
        };

        // property setter
        const setter: (v: any) => void = function(newVal: any): void {
            this.setReference(newVal, this.cursor.select(nameOfCursor));
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
            .setPropType(EPropType.cursor)
            .setNameOfCursor(nameOfCursor);
    };
}