import {AbstractSkeletosState, ObjectType} from "../../core";

/**
 * BelongsTo associations are associations where the foreign key for the one-to-one relation exists on the source model.
 *
 * That is:
 * - The class you are defining this annotation in is the source model
 * - The JS property you are defining this annotation on is the foreign key.
 * - The type of this JS property (the Skeletos State Type) is the target class.
 * - You can optionally define the targetKey in the target class.
 *
 * See http://docs.sequelizejs.com/manual/tutorial/associations.html#belongsto
 *
 * Note that, for this annotation to work, you must also define @StateRef on this JS property.
 */
export interface IBelongsToOneOptions<T extends AbstractSkeletosState> {
    /**
     * Whether or not to disable the relationship constraints that are automatically created. Set to true by
     * default, which means constraints are enabled. See
     * http://docs.sequelizejs.com/en/latest/docs/associations/#enforcing-a-foreign-key-reference-without-constraints
     */
    constraint?: boolean;

    /**
     * The class for which we belong to an instance of.
     *
     * Typically, you do not need to specify this because it will be inferred from the Skeletos State type.
     *
     * @returns {ObjectType<T extends AbstractSkeletosState>}
     */
    targetType?(): ObjectType<T>;

    /**
     * The name of the property in the targetType class which corresponds to this class.
     *
     * In sequelize terms, the name of the JS property in the other class that will become the targetKey.
     *
     * Note that the JS property on which you are defining this annotation is the foreign key.
     *
     * Typically, you would not need to specify this as it will automatically point to the ID in the targetType class.
     *
     * See http://docs.sequelizejs.com/manual/tutorial/associations.html#target-keys
     *
     * @param {T} associationType
     * @returns {any}
     */
    propInClass?(associationType: T): any;
}