import {AbstractSkeletosState, ObjectType} from "../../core";

/**
 * Options for use in @BelongsToMany on state props
 */
export interface IBelongsToManyOptions<T extends AbstractSkeletosState> {
    /**
     * The association class.
     */
    associationType(): ObjectType<T>;

    /**
     * Refers to the foreign key in the associationType.
     */
    propInClass(associationType: T): any;

    /**
     * Refers to the `otherKey` in the associationType when defining Sequelize relationship.
     */
    otherPropInClass(associationType: T): any;
}