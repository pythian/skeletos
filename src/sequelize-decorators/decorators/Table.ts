import _ = require("lodash");
import {ITableOptions} from "./ITableOptions";
import {IInternalTableOptions} from "./IInternalTableOptions";
import {ClassTypeInfo, ErrorUtil} from "../../core";

export const TABLE_KEY: string = "skeletos-sequelize.table";

/**
 * Decorator to mark a Class to be persisted in the database as a Table using Sequelize.
 *
 * @param options the options for persistence
 */
export function Table(options: ITableOptions) {
    return function SequelizeDecorator(...args: any[]): any {
        switch (args.length) {
            case 1:
                return sequelizeState.apply(this, [...args, options]);
            default:
                throw new Error("@Table decorator cannot be applied here. " + args);
        }
    };
}

function sequelizeState(targetConstr: ClassDecorator, options: IInternalTableOptions): ClassDecorator {
    if (!options || !options.name || options.name.trim().length === 0) {
        throw new Error("You must supply a name to the @Table decorator for constructor: " + ErrorUtil.getDebugName(targetConstr));
    }

    const original: ClassDecorator = targetConstr;

    const classTypeInfo: ClassTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(original.prototype);
    const existingPersistOptions: IInternalTableOptions = classTypeInfo.getExtension(TABLE_KEY);
    if (existingPersistOptions) {
        _.merge(existingPersistOptions, options);
    } else {
        classTypeInfo.putExtension(TABLE_KEY, options);
    }

    return original;
}