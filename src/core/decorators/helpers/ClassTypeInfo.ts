import _ = require("lodash");

/**
 * Helper utility that stores class type metadata.
 */
export class ClassTypeInfo {

    /**
     * Meta data extensions about the class can go in here.
     *
     * @type {{}}
     */
    private extensions: object = {};

    /**
     * Gets the property key that stores this class' metadata in the target.
     *
     * @returns {string}
     */
    static getClassTypeKey(): string {
        return "__ClassType";
    }

    /**
     * Gets the TypeInfo class on the target.
     *
     * @param target
     */
    static getOrCreateClassTypeInfo(target: any): ClassTypeInfo {
        if (!target) {
            return null;
        }

        // we never want to set the metadata on an instance. We want it always on the constructor of the object
        // because the metadata is static to the class.
        target = (target as any).constructor.prototype.constructor;

        const key: string = ClassTypeInfo.getClassTypeKey();
        let instance: ClassTypeInfo = target[key];
        let doAssign: boolean = false;

        if (!instance) {
            instance = new ClassTypeInfo();
            doAssign = true;
        } else if (!target.hasOwnProperty(key)) {
            const protoInstance: ClassTypeInfo = instance;
            instance = new ClassTypeInfo();
            instance.extensions = _.merge(instance.extensions, protoInstance.extensions);
            doAssign = true;
        }

        if (doAssign) {
            Object.defineProperty(target, key, {
                get: (): any => {
                    return instance;
                },
                enumerable: true,
                configurable: true
            });
        }

        return instance;
    }

    static getClassTypeInfo(target: any): ClassTypeInfo {
        if (!target) {
            return null;
        }

        // we never want to set the metadata on an instance. We want it always on the constructor of the object
        // because the metadata is static to the class.
        target = (target as any).constructor.prototype.constructor;

        const key: string = ClassTypeInfo.getClassTypeKey();
        return target[key];
    }

    static maybeGetExtension(target: any, extensionKey: string): any {
        const classTypeInfo: ClassTypeInfo = this.getClassTypeInfo(target);
        if (classTypeInfo) {
            return classTypeInfo.getExtension(extensionKey);
        }

        return null;
    }

    putExtension(extensionKey: string, extensionValue: any): this {
        this.extensions[extensionKey] = extensionValue;
        return this;
    }

    getExtension(extensionKey: string): any {
        return this.extensions[extensionKey];
    }

    getIfExistsOrPutExtension(extensionKey: string): any {
        if (!this.extensions[extensionKey]) {
            this.extensions[extensionKey] = {};
        }

        return this.extensions[extensionKey];
    }
}