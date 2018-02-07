
/**
 * Interface for indexes property in ITableOptions
 *
 * @see DefineOptions from Sequelize
 */
export interface ITableIndexesOptions {

    /**
     * The name of the index. Defaults to model name + _ + fields concatenated
     */
    name?: string;

    /**
     * Index type. Only used by mysql. One of `UNIQUE`, `FULLTEXT` and `SPATIAL`
     */
    index?: string;

    /**
     * The method to create the index by (`USING` statement in SQL). BTREE and HASH are supported by mysql and
     * postgres, and postgres additionally supports GIST and GIN.
     */
    method?: string;

    /**
     * Should the index by unique? Can also be triggered by setting type to `UNIQUE`
     *
     * Defaults to false
     */
    unique?: boolean;

    /**
     * PostgreSQL will build the index without taking any write locks. Postgres only
     *
     * Defaults to false
     */
    concurrently?: boolean;

    /**
     * An array of the fields to index. Each field can either be a string containing the name of the field,
     * a sequelize object (e.g `sequelize.fn`), or an object with the following attributes: `attribute`
     * (field name), `length` (create a prefix index of length chars), `order` (the direction the column
     * should be sorted in), `collate` (the collation (sort order) for the column)
     */
    fields?: Array<string | { attribute: string, length: number, order: string, collate: string }>;

    /**
     * Method the index should use, for example 'gin' index.
     */
    using?: string;

    /**
     * Operator that should be used by gin index, see Built-in GIN Operator Classes
     */
    operator?: string;

}