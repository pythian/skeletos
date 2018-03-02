// tslint:disable

/**
 * Represents a constructor / type of an object. Use this over `typeof X` because you benefit from generic types
 * that are inheritable.
 */
export type ObjectType<T> = { new (): T } | Function;