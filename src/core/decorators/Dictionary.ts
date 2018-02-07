import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosDictionary} from "../reusable/SkeletosDictionary";
import {PropTypeInfo, EPropType} from "./helpers/PropTypeInfo";
import {ClassTypeInfo} from "./helpers/ClassTypeInfo";
import {ID_PROP_KEY} from "./Id";

/**
 * Decorator factory to mark a property as a Skeletos Dictionary.
 *
 * @param type the type of state to store in the Dictionary.
 * @param nameOfKeyAttribute. You can skip this attribute if you have already defined @Id on a property in the type
 *     class.
 * @param nameOfCursor use this if you want to name the cursor something other than the property name, otherwise leave
 *     blank
 */
export function Dictionary(
    type: () => typeof AbstractSkeletosState, nameOfKeyAttribute?: string, nameOfCursor?: string): PropertyDecorator {
    return function DictionaryDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        nameOfCursor = nameOfCursor || propertyKey;

        // property getter
        const getter: () => any = function(): any {
            return new SkeletosDictionary<any>(this.cursor.select(nameOfCursor), type(), nameOfKeyAttribute);
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

        if (!nameOfKeyAttribute) {
            nameOfKeyAttribute = ClassTypeInfo.maybeGetExtension(type(), ID_PROP_KEY);
        }

        PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey)
            .setPropType(EPropType.dictionary)
            .setNameOfCursor(nameOfCursor)
            .setStateType(type)
            .setNameOfKeyAttribute(nameOfKeyAttribute);
    };
}