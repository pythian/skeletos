import {AbstractSkeletosState} from "../../extendible/AbstractSkeletosState";

/**
 * The type of property.
 */
export enum EPropType {
    cursor, dictionary, dictionaryRef, list, listRef, primitive, primitiveRef, state, stateRef
}

/**
 * The data structure stored on the property.
 */
export class PropTypeInfo {

    /**
     * What JS property is this TypeInfo for?
     */
    jsPropName: string;

    /**
     * What kind of property is this?
     */
    propType: EPropType;

    /**
     * The constructor of the referenced or prop type. Only used for dictionary, dictionaryRef, list, listRef, state,
     * stateRef.
     */
    stateType: () => typeof AbstractSkeletosState;

    /**
     * The name of the associated cursor.
     */
    nameOfCursor: string;

    /**
     * Only for dictionaries. Use to hold the name of the attribute which is used as the key to the Dictionary.
     */
    nameOfKeyAttribute: string;

    /**
     * Meta data extensions about the property can go in here.
     *
     * @type {{}}
     */
    extensions: object = {};

    /**
     * Automatically set. Used for internal operations only.
     *
     * Instantiated object of stateType().
     */
    stateTypeInstance: AbstractSkeletosState;

    /**
     * Gets the property key that stores this class in the target where the described property exists.
     *
     * @param propertyName
     * @returns {string}
     */
    static getPropTypeKey(propertyName: string): string {
        return "__" + propertyName + "PropType";
    }

    /**
     * Gets the TypeInfo class on the target.
     *
     * @param target
     * @param propertyName
     */
    static getOrCreatePropTypeInfo(target: any, propertyName: string): PropTypeInfo {
        if (!target) {
            return null;
        }

        // we never want to set the metadata on an instance, always on the class of the object
        target = (target as any).constructor.prototype.constructor;

        const propKey: string = PropTypeInfo.getPropTypeKey(propertyName);
        let instance: PropTypeInfo = target[propKey];
        if (!instance) {
            instance = new PropTypeInfo()
                .setJsPropName(propertyName)
                .setNameOfCursor(propertyName);

            target[propKey] = instance;
        }

        return instance;
    }

    static getPropTypeInfo(target: any, propertyName: string): PropTypeInfo {
        if (!target) {
            return null;
        }

        target = (target as any).constructor.prototype.constructor;

        const propKey: string = PropTypeInfo.getPropTypeKey(propertyName);
        return target[propKey];
    }

    static maybeGetExtension(target: any, propertyName: string, extensionKey: string): any {
        const propTypeInfo: PropTypeInfo = this.getPropTypeInfo(target, propertyName);
        if (!propTypeInfo) {
            return null;
        }

        return propTypeInfo.getExtension(extensionKey);
    }

    setJsPropName(name: string): this {
        this.jsPropName = name;
        return this;
    }

    setPropType(type: EPropType): this {
        this.propType = type;
        return this;
    }

    setStateType(type: () => typeof AbstractSkeletosState): this {
        this.stateType = type;
        return this;
    }

    setNameOfCursor(nameOfCursor: string): this {
        this.nameOfCursor = nameOfCursor;
        return this;
    }

    setNameOfKeyAttribute(nameOfKeyAttribute: string): this {
        this.nameOfKeyAttribute = nameOfKeyAttribute;
        return this;
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