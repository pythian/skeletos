import {IColumnOptions} from "./IColumnOptions";
import {IInternalTableOptions} from "./IInternalTableOptions";
import {AbstractSkeletosState, ClassTypeInfo, ErrorUtil, Id, PropTypeInfo} from "../../core";

export const COLUMN_KEY: string = "skeletos-sequelize.column";

/**
 * Decorator to mark a property to be persisted in the database using Sequelize.
 *
 * @param options the options for persistence
 */
export function Column(options?: IColumnOptions) {
    return function SequelizeDecorator(...args: any[]): any {
        switch (args.length) {
            case 2:
            case 3:
                return sequelizeProp.apply(this, [args[0], args[1], options]);
            default:
                throw new Error("@Column decorator cannot be applied here. " + args);
        }
    };
}

function sequelizeProp(target: AbstractSkeletosState, propertyKey: string, options?: IColumnOptions): void {
    options = options || {};
    options.name = options.name || propertyKey;

    PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey)
        .putExtension(COLUMN_KEY, options);

    const extensions: IInternalTableOptions = ClassTypeInfo.getOrCreateClassTypeInfo(target)
        .getIfExistsOrPutExtension(COLUMN_KEY) as IInternalTableOptions;

    if (!extensions.allProps) {
        extensions.allProps = {};
    }

    extensions.allProps[propertyKey] = options;

    if (options.primaryKey) {
        if (extensions.primaryKey && extensions.primaryKey.persistPropOptions.name !== options.name) {
            throw new Error("Cannot define more than one primary key on " + ErrorUtil.getDebugName(target));
        }

        extensions.primaryKey = {
            jsPropName: propertyKey,
            persistPropOptions: options
        };

        // also set it as the @Id as a convenience
        Id()(target, propertyKey);
    }
}