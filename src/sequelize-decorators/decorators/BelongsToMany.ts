import {EInternalRelationshipType, IInternalRelationshipOptions, RELATIONSHIP_PROP_KEY} from "./IInternalRelationshipOptions";
import {IBelongsToManyOptions} from "./IBelongsToManyOptions";
import {PersistedStatesRegistry} from "../base/PersistedStatesRegistry";
import {ITableOptions} from "./ITableOptions";
import {TABLE_KEY} from "./Table";
import {IInternalTableOptions} from "./IInternalTableOptions";
import {AbstractSkeletosState, ClassTypeInfo, ErrorUtil, PropTypeInfo, SkeletosCursor} from "../../core";

/**
 * Decorator to mark a property as a belongs-to-many relationship.
 *
 * See http://docs.sequelizejs.com/en/latest/docs/associations/#belongs-to-many-associations
 *
 * @param options the options for the BelongsToMany relationship in sequelize.
 * @param constraint Whether or not to disable the relationship constraints that are automatically created. Set to true
 *     by default, which means constraints are enabled. See
 *     http://docs.sequelizejs.com/en/latest/docs/associations/#enforcing-a-foreign-key-reference-without-constraints
 */
export function BelongsToMany(options: IBelongsToManyOptions, constraint: boolean = true) {
    return function BelongsToManyDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        if (!options) {
            throw new Error("Options not defined for a BelongsToMany decorator " + ErrorUtil.getDebugName(target));
        }

        const propTypeInfo: PropTypeInfo = PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey);

        propTypeInfo
            .putExtension(RELATIONSHIP_PROP_KEY, {
                relationshipType: EInternalRelationshipType.belongsToMany,
                targetOrForeignKey: options.propInClass,
                belongsToManyOtherKey: options.otherPropInClass,
                relationshipConstraint: constraint,
                belongsToManyAssociationType: options.associationType,
                lazyLoadRelationship: (relationshipOptions: IInternalRelationshipOptions) => {
                    // also get the class name and property key of the other class.
                    const relatedClassInstance: AbstractSkeletosState = propTypeInfo.stateTypeInstance;
                    const relatedClassTypeInfo: ClassTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(relatedClassInstance);
                    const relatedClassPersistStateOptions: ITableOptions =
                        (relatedClassTypeInfo.getExtension(TABLE_KEY) as ITableOptions);

                    // before we lazy load the relationship, we need to ensure that association type is initialized
                    if (!relationshipOptions.belongsToManyAssociationTypeInstance) {
                        const associationInstance: AbstractSkeletosState =
                            new (options.associationType())(new SkeletosCursor());

                        const cachedInstance: AbstractSkeletosState = PersistedStatesRegistry.persistedStates[(ClassTypeInfo
                            .getOrCreateClassTypeInfo(associationInstance)
                            .getIfExistsOrPutExtension(TABLE_KEY) as ITableOptions)
                            .name];

                        if (cachedInstance) {
                            relationshipOptions.belongsToManyAssociationTypeInstance = cachedInstance;
                        } else {
                            relationshipOptions.belongsToManyAssociationTypeInstance = associationInstance;
                        }
                    }

                    const associationClassInstance: AbstractSkeletosState = relationshipOptions.belongsToManyAssociationTypeInstance;
                    const associationClassTypeInfo: ClassTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(associationClassInstance);
                    const associationClassPersistStateOptions: IInternalTableOptions =
                        (associationClassTypeInfo.getExtension(TABLE_KEY) as IInternalTableOptions);

                    if (!relatedClassPersistStateOptions) {
                        throw new Error("Related class does not have @Persist specified: " +
                            ErrorUtil.getDebugName(relatedClassInstance));
                    }
                    if (!associationClassPersistStateOptions) {
                        throw new Error("Association class does not have @Persist specified: " +
                            ErrorUtil.getDebugName(relatedClassInstance));
                    }

                    if (!associationClassPersistStateOptions.allProps[options.propInClass]) {
                        throw new Error(
                            "There is no property called " + options.propInClass + " defined in " +
                            ErrorUtil.getDebugName(associationClassInstance)
                        );
                    }

                    if (!associationClassPersistStateOptions.allProps[options.otherPropInClass]) {
                        throw new Error(
                            "There is no property called " + options.otherPropInClass + " defined in " +
                            ErrorUtil.getDebugName(associationClassInstance)
                        );
                    }

                    // now store the instantiated type
                    relationshipOptions.relatedInstantiatedType = relatedClassInstance;
                }
            } as IInternalRelationshipOptions);
    };
}