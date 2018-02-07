import {EInternalRelationshipType, IInternalRelationshipOptions, RELATIONSHIP_PROP_KEY} from "./IInternalRelationshipOptions";
import {ITableOptions} from "./ITableOptions";
import {TABLE_KEY} from "./Table";
import {AbstractSkeletosState, ClassTypeInfo, ErrorUtil, PropTypeInfo} from "../../core";

/**
 * Decorator to mark a property as a belongs-to-one relationship.
 *
 * See http://docs.sequelizejs.com/en/latest/docs/associations/#belongsto
 *
 * @param type The other class to make the relationship with.
 * @param constraint Whether or not to disable the relationship constraints that are automatically created. Set to true
 *     by default, which means constraints are enabled. See
 *     http://docs.sequelizejs.com/en/latest/docs/associations/#enforcing-a-foreign-key-reference-without-constraints
 */
export function BelongsToOne(targetKey?: string, constraint: boolean = true) {
    return function BelongsToOneDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        const propTypeInfo: PropTypeInfo = PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey);

        propTypeInfo
            .putExtension(RELATIONSHIP_PROP_KEY, {
                relationshipType: EInternalRelationshipType.belongsToOne,
                relationshipConstraint: constraint,
                targetOrForeignKey: targetKey,
                lazyLoadRelationship: (relationshipOptions: IInternalRelationshipOptions) => {

                    // also get the class name and property key of the other class.
                    const relatedClassInstance: AbstractSkeletosState = propTypeInfo.stateTypeInstance;
                    const classTypeInfo: ClassTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(relatedClassInstance);
                    const persistStateOptions: ITableOptions =
                        (classTypeInfo.getExtension(TABLE_KEY) as ITableOptions);

                    if (!persistStateOptions) {
                        throw new Error("Related class does not have @Persist specified: " +
                            ErrorUtil.getDebugName(relatedClassInstance));
                    }

                    // now store the instantiated type
                    relationshipOptions.relatedInstantiatedType = relatedClassInstance;
                }
            } as IInternalRelationshipOptions);
    };
}