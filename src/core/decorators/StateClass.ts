import _ = require("lodash");
import {ClassTypeInfo} from "./helpers/ClassTypeInfo";
import {MetadataRegistry} from "./helpers/MetadataRegistry";

export const STATE_META_DATA_KEY: string = "Skeletos.IStateMetaDataOptions";

/**
 * The structure to store for the @StateClass decorator
 */
export interface IStateClassMetaDataOptions {

    /**
     * The name of the class helps in various things like deserialization of subclasses or error reporting.
     */
    className?: string;
}


export function StateClass(className: string) {
    // tslint:disable-next-line:ban-types
    return function StateClassDecorator(targetConstr: Function): any {

        // tslint:disable-next-line:ban-types
        const original: Function = targetConstr;

        const classTypeInfo: ClassTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(original.prototype);
        const existingPersistOptions: IStateClassMetaDataOptions = classTypeInfo.getExtension(STATE_META_DATA_KEY);
        if (existingPersistOptions) {
            _.merge(existingPersistOptions, {
                className: className
            });
        } else {
            classTypeInfo.putExtension(STATE_META_DATA_KEY, {
                className: className
            });
        }

        MetadataRegistry.constructorDict[className] = targetConstr as any;

        return original;
    };
}