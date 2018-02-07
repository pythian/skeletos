import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosCursor} from "../base/SkeletosCursor";
import {PropTypeInfo, EPropType} from "./helpers/PropTypeInfo";

/**
 * Decorator to mark a property as a reference to a Skeletos primitive.
 *
 * Note: this only allows to retrieve a primitive from a reference. It does not allow you to set a primitive
 * as a reference, because primitives don't hold any intrinsic information about cursors. That is, where a State object
 * has a field called cursor that holds the path of the cursor where it is located in the tree, a primitive has no such
 * field (because it cannot). As such, you should pair this up with a @Cursor decorator on a cursor field.
 *
 * @param nameOfCursor use this if you want to name the cursor something other than the property name, otherwise leave
 *     blank
 */
export function PrimitiveRef(nameOfCursor?: string) {
    return function PrimitiveRefDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        nameOfCursor = nameOfCursor || propertyKey;

        // property getter
        const getter: () => any = function(): any {
            const cursor: SkeletosCursor = this.cursor.select(nameOfCursor);
            if (cursor.exists()) {
                return cursor.selectReferencedCursor().get();
            } else {
                return undefined;
            }
        };

        // Delete property.
        if (delete target[propertyKey]) {

            // Create new property with getter and setter
            Object.defineProperty(
                target, propertyKey, {
                    get: getter,
                    enumerable: true,
                    configurable: true
                }
            );
        }

        PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey)
            .setPropType(EPropType.primitiveRef)
            .setNameOfCursor(nameOfCursor);
    };
}