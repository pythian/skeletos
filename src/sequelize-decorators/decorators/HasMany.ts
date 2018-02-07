import {EInternalRelationshipType, IInternalRelationshipOptions, RELATIONSHIP_PROP_KEY} from "./IInternalRelationshipOptions";
import {TABLE_KEY} from "./Table";
import {IInternalTableOptions} from "./IInternalTableOptions";
import {AbstractSkeletosState, ClassTypeInfo, ErrorUtil, PropTypeInfo} from "../../core";

/**
 * Decorator to mark a property as a has-many relationship.
 *
 * See http://docs.sequelizejs.com/en/latest/docs/associations/#one-to-many-associations
 *
 * @param propInClass The name of the JS property in the other class that will become the foreign key.
 * @param constraint Whether or not to disable the relationship constraints that are automatically created. Set to true
 *     by default, which means constraints are enabled. See
 *     http://docs.sequelizejs.com/en/latest/docs/associations/#enforcing-a-foreign-key-reference-without-constraints
 */
export function HasMany(propInClass: string, constraint: boolean = true) {
    return function HasManyDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        const propTypeInfo: PropTypeInfo = PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey);

        propTypeInfo
            .putExtension(RELATIONSHIP_PROP_KEY, {
                relationshipType: EInternalRelationshipType.hasMany,
                targetOrForeignKey: propInClass,
                relationshipConstraint: constraint,
                lazyLoadRelationship: (relationshipOptions: IInternalRelationshipOptions) => {

                    // also get the class name and property key of the other class.
                    const relatedClassInstance: AbstractSkeletosState = propTypeInfo.stateTypeInstance;
                    const classTypeInfo: ClassTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(relatedClassInstance);
                    const persistStateOptions: IInternalTableOptions =
                        (classTypeInfo.getExtension(TABLE_KEY) as IInternalTableOptions);

                    if (!persistStateOptions) {
                        throw new Error("Related class does not have @Persist specified: " +
                            ErrorUtil.getDebugName(relatedClassInstance));
                    }

                    if (!persistStateOptions.allProps[propInClass]) {
                        throw new Error(
                            "There is no @Persist'ed property called " + propInClass + " defined in " +
                            ErrorUtil.getDebugName(relatedClassInstance));
                    }

                    // now store the instantiated type
                    relationshipOptions.relatedInstantiatedType = relatedClassInstance;
                }
            } as IInternalRelationshipOptions);
    };
}