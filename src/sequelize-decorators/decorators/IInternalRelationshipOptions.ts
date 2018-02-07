import {AbstractSkeletosState} from "../../core";


export enum EInternalRelationshipType {
    hasOne = "hasOne",
    hasMany = "hasMany",
    belongsToOne = "belongsToOne",
    belongsToMany = "belongsToMany"
}

export interface IInternalRelationshipOptions {

    /**
     * A function that will be called once after it is set once, allowing you to call set** functions on relationship
     * methods lazily to avoid circular dependencies on class initialization.
     */
    lazyLoadRelationship?: (relationshipOptions: IInternalRelationshipOptions) => void;

    /**
     * Whether the lazy load has already been run.
     */
    alreadyLazyLoaded?: boolean;

    /**
     * The instantiated type of the related type.
     */
    relatedInstantiatedType?: AbstractSkeletosState;

    /**
     * The type of relationship.
     */
    relationshipType?: EInternalRelationshipType;

    /**
     * The target or foreign key depending on the relationship.
     */
    targetOrForeignKey?: string;

    /**
     * If this is a belongsToRelationship, then this field is the assocation class. This must be a class with @Persist
     */
    belongsToManyAssociationType?: () => typeof AbstractSkeletosState;

    /**
     * Instantiated object of belongsToManyAssociationType().
     */
    belongsToManyAssociationTypeInstance?: AbstractSkeletosState;

    /**
     * If this is a belongsToRelationship, then this is the other key.
     */
    belongsToManyOtherKey?: string;

    /**
     * Whether to apply the relationship constraints (true by default).
     */
    relationshipConstraint?: boolean;
}

export const RELATIONSHIP_PROP_KEY: string = "Cerebri.IRelationshipMetaInfo";
export const RELATIONSHIP_SINGULAR_PREFIX_FOR_AS: string = "_";
export const RELATIONSHIP_PLURAL_PREFIX_FOR_AS: string = "_p_";