import {AbstractSkeletosState} from "../../core";

/**
 * Options for use in @BelongsToMany on state props
 */
export interface IBelongsToManyOptions {
    /**
     * The association class.
     */
    associationType: () => typeof AbstractSkeletosState;

    /**
     * Refers to the foreign key in the associationType.
     */
    propInClass: string;

    /**
     * Refers to the `otherKey` in the associationType when defining Sequelize relationship.
     */
    otherPropInClass: string;
}