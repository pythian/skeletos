import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosCursor} from "../base/SkeletosCursor";
import {SkeletosDictionary} from "../reusable/states/SkeletosDictionary";
import {PropTypeInfo, EPropType} from "./helpers/PropTypeInfo";

/**
 * Decorator factory to mark a property as a reference to a Skeletos Dictionary.
 *
 * @param type the type of state to store in the Dictionary.
 * @param nameOfKeyAttribute. You can skip this attribute if you have already defined @Id on a property in the type
 *     class.
 * @param nameOfCursor use this if you want to name the cursor something other than the property name, otherwise leave
 *     blank
 */
export function DictionaryRef(
    type: () => typeof AbstractSkeletosState, nameOfKeyAttribute?: string, nameOfCursor?: string): PropertyDecorator {
    return function DictionaryRefDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        nameOfCursor = nameOfCursor || propertyKey;

        // property getter
        const getter: () => any = function(): any {
            const cursor: SkeletosCursor = this.cursor.select(nameOfCursor);
            if (cursor.exists()) {
                return new SkeletosDictionary<any>(cursor.selectReferencedCursor(), type(), nameOfKeyAttribute);
            } else {
                return undefined;
            }
        };

        // property setter
        const setter: (v: SkeletosDictionary<any>) => void = function(newVal: SkeletosDictionary<any>): void {
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
            .setPropType(EPropType.dictionaryRef)
            .setNameOfCursor(nameOfCursor)
            .setStateType(type)
            .setNameOfKeyAttribute(nameOfKeyAttribute);
    };
}