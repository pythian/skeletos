import {IColumnOptions} from "./IColumnOptions";
import {ITableOptions} from "./ITableOptions";

/**
 * Describes a primary key attribute.
 */
export interface IPrimaryKey {
    jsPropName: string;
    persistPropOptions: IColumnOptions;
}

/**
 * Internal options that are always set automatically on fields with @Column
 */
export interface IInternalTableOptions extends ITableOptions {

    /**
     * All the properties that are in persisted in this class.
     *
     * The key here is the name of the JS property.
     */
    allProps?: {[jsPropName: string]: IColumnOptions};

    /**
     * The primary key properties meta data.
     */
    primaryKey?: IPrimaryKey;

    /**
     * This is actually Sequelize.Model but we can't reference that here because otherwises sequelize will become a
     * dependency in the client.
     *
     * Note: this is only available on the server.
     *
     * This is automatically calculated and set by the initialization.
     */
    sequelizeModel?: any;

    /**
     * This is actually Sequelize.DefineAttributes but we can't reference that here because otherwises sequelize will
     * become a dependency in the client.
     *
     * Note: this is only available on the server.
     *
     * This is automatically calculated and set by the initialization.
     */
    sequelizeAttributes?: any;
}