/**
 * Options for use in @Column on state props.
 */
export interface IColumnOptions {
    /**
     * The name that will be used to persist in the database. If undefined, will use
     * the name of the property.
     */
    name?: string;

    /**
     * Any description you want to add. This is a chance for you to add documentation
     * for external API.
     */
    description?: string;

    /**
     * Whether this property is the primary key.
     *
     * Note: I have disabled support for multiple primary keys because:
     * 1. Sequelize does not fully and officially support composite primary keys yet.
     * 2. Feathersjs does not support fetching an object using multiple primary key fields.
     *
     * If you need multiple primary keys, first consider if you can do without in the situation
     * where you can have duplicate data with cascade delete enabled. This means duplicate data
     * does not really pose a logical nuisance in the app ... just there can possibly be duplicates.
     *
     * If it's really unacceptable, then consider a single column that you manually join the primary
     * keys with (for example, "userId-orgId" as a string).
     */
    primaryKey?: boolean;

    /**
     * Whether this property will auto increment. Does not apply when a relationship decorator is also applied.
     */
    autoIncrement?: boolean;

    /**
     * If true, the column will get a unique constraint. If a string is provided, the column will be part of a
     * composite unique index. If multiple columns have the same string, they will be part of the same unique
     * index
     */
    unique?: boolean | string | { name: string, msg: string };

    /**
     * If false, the column will have a NOT NULL constraint, and a not null validation will be run before an
     * instance is saved.
     *
     * Note that if you don't set this then the required() value will be taken from @Validate instead.
     */
    allowNull?: boolean;

    /**
     * What should happen when the referenced key is updated. One of CASCADE, RESTRICT, SET DEFAULT, SET NULL or
     * NO ACTION
     */
    onUpdate?: string;

    /**
     * What should happen when the referenced key is deleted. One of CASCADE, RESTRICT, SET DEFAULT, SET NULL or
     * NO ACTION
     */
    onDelete?: string;
}