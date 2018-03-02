import _ = require("lodash");
import {EInternalRelationshipType, IInternalRelationshipOptions, RELATIONSHIP_PROP_KEY} from "./IInternalRelationshipOptions";
import {IBelongsToManyOptions} from "./IBelongsToManyOptions";
import {PersistedStatesRegistry} from "../base/PersistedStatesRegistry";
import {ITableOptions} from "./ITableOptions";
import {TABLE_KEY} from "./Table";
import {IInternalTableOptions} from "./IInternalTableOptions";
import {AbstractSkeletosState, ClassTypeInfo, ErrorUtil, PropTypeInfo, SkeletosCursor} from "../../core";
import {IColumnOptions} from "./IColumnOptions";

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
export function BelongsToMany<T extends AbstractSkeletosState>(options: IBelongsToManyOptions<T>, constraint: boolean = true) {
    return function BelongsToManyDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        if (!options) {
            throw new Error("Options not defined for a BelongsToMany decorator " + ErrorUtil.getDebugName(target));
        }

        const propTypeInfo: PropTypeInfo = PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey);

        propTypeInfo
            .putExtension(RELATIONSHIP_PROP_KEY, {
                relationshipType: EInternalRelationshipType.belongsToMany,
                relationshipConstraint: constraint,
                belongsToManyAssociationType: options.associationType(),
                lazyLoadRelationship: (relationshipOptions: IInternalRelationshipOptions) => {
                    // also get the class name and property key of the other class.
                    const relatedClassInstance: AbstractSkeletosState = propTypeInfo.stateTypeInstance;
                    const relatedClassTypeInfo: ClassTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(relatedClassInstance);
                    const relatedClassPersistStateOptions: ITableOptions =
                        (relatedClassTypeInfo.getExtension(TABLE_KEY) as ITableOptions);

                    // before we lazy load the relationship, we need to ensure that association type is initialized
                    if (!relationshipOptions.belongsToManyAssociationTypeInstance) {
                        const associationInstance: AbstractSkeletosState =
                            new (options.associationType() as any)(new SkeletosCursor());

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
                        throw new Error("Related class does not have @Table specified: " +
                            ErrorUtil.getDebugName(relatedClassInstance));
                    }
                    if (!associationClassPersistStateOptions) {
                        throw new Error("Association class does not have @Table specified: " +
                            ErrorUtil.getDebugName(relatedClassInstance));
                    }

                    // construct a dummy object to give to the functions that tell us the properties to use
                    const dummyObj: {[name: string]: string} = {};
                    _.forEach(associationClassPersistStateOptions.allProps, (value: IColumnOptions, jsProp: string) => {
                        dummyObj[jsProp] = jsProp;
                    });

                    const propInClass: string = options.propInClass(dummyObj as any);
                    const otherPropInClass: string = options.otherPropInClass(dummyObj as any);

                    if (!associationClassPersistStateOptions.allProps[propInClass]) {
                        throw new Error(
                            "There is no @Column property called " + propInClass + " defined in " +
                            ErrorUtil.getDebugName(associationClassInstance)
                        );
                    }

                    if (!associationClassPersistStateOptions.allProps[otherPropInClass]) {
                        throw new Error(
                            "There is no @Column property called " + otherPropInClass + " defined in " +
                            ErrorUtil.getDebugName(associationClassInstance)
                        );
                    }

                    // set the properties in our relationship options.
                    relationshipOptions.targetOrForeignKey = propInClass;
                    relationshipOptions.belongsToManyOtherKey = otherPropInClass;

                    // also store the instantiated type
                    relationshipOptions.relatedInstantiatedType = relatedClassInstance;
                }
            } as IInternalRelationshipOptions);
    };
}