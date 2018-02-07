
import {ITableIndexesOptions} from "./ITableIndexesOptions";
import {IColumnOptions} from "./IColumnOptions";

/**
 * Options for use in @Table on state classes.
 */
export interface ITableOptions {

    /**
     * The name of the table/collection you want the class to be persisted as.
     *
     * This must be specified.
     */
    name: string;

    /**
     * Any description you want to add. This is a chance for you to add documentation
     * to the table internally.
     */
    description?: string;

    /**
     * Don't persits null values. This means that all columns with null values will not be saved.
     */
    omitNull?: boolean;

    /**
     * Adds createdAt and updatedAt timestamps to the model. Default true.
     */
    timestamps?: boolean;

    /**
     * Calling destroy will not delete the model, but instead set a deletedAt timestamp if this is true. Needs
     * timestamps=true to work. Default false.
     */
    paranoid?: boolean;

    /**
     * Override the name of the createdAt column if a string is provided, or disable it if false. Timestamps
     * must be true. Not affected by underscored setting.
     */
    createdAt?: string | boolean;

    /**
     * Override the name of the deletedAt column if a string is provided, or disable it if false. Timestamps
     * must be true. Not affected by underscored setting.
     */
    deletedAt?: string | boolean;

    /**
     * Override the name of the updatedAt column if a string is provided, or disable it if false. Timestamps
     * must be true. Not affected by underscored setting.
     */
    updatedAt?: string | boolean;

    /**
     * Set the initial AUTO_INCREMENT value for the table in MySQL.
     */
    initialAutoIncrement?: string;

    /**
     * Indexes for the provided database table
     */
    indexes?: ITableIndexesOptions[];

    /**
     * Enable optimistic locking.  When enabled, sequelize will add a version count attribute
     * to the model and throw an OptimisticLockingError error when stale instances are saved.
     * Set to true or a string with the attribute name you want to use to enable.
     */
    version?: boolean | string;

}