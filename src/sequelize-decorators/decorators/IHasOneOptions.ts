import {AbstractSkeletosState, ObjectType} from "../../core";

/**
 * HasOne associations are associations where the foreign key for the one-to-one relation exists on the target model.
 *
 * That is:
 * - The class you are defining this annotation in is the target model.
 * - The JS property you are defining this annotation on is the target key.
 * - The type of this JS property (the Skeletos State Type) is the foreign class.
 * - The foreignKey that you define is the foreign key in the foreign class.
 *
 * See http://docs.sequelizejs.com/manual/tutorial/associations.html#hasone
 *
 * Note that, for this annotation to work, you must also define @StateRef on this JS property.
 *
 * Example:
 *
 * <pre><code>
 * class User {
 *
 *      @HasOne({
 *          foreignType: () => UserDetails,
 *          foreignKey: (userDetails) => userDetails.user
 *      })
 *      @StateRef(() => UserDetails)
 *      userDetails: UserDetails;
 * }
 *
 * class UserDetails {
 *      @BelongsToOne({
 *          targetType: () => TargetType
 *
 *      })
 *      @StateRef(() => User)
 *      user: User;
 * }
 * </code></pre>
 *
 * In more simplistic terms, in the above example, because User has one UserDetails object, there will be a column
 * called user that gets created in the UserDetails table, but there will be no column created in User table for
 * UserDetails.
 */
export interface IHasOneOptions<T extends AbstractSkeletosState> {

    /**
     * constraint Whether or not to disable the relationship constraints that are automatically created. Set to true by
     * default, which means constraints are enabled. See
     * http://docs.sequelizejs.com/en/latest/docs/associations/#enforcing-a-foreign-key-reference-without-constraints
     */
    constraint?: boolean;

    /**
     * The class for which we have one instance of.
     *
     * @returns {ObjectType<T extends AbstractSkeletosState>}
     */
    foreignType(): ObjectType<T>;

    /**
     * The name of the property in the foreignType class which corresponds to this class.
     *
     * In more relational terms, the name of the JS property in the other class that will become the foreign key.
     *
     * @param {T} foreignType
     * @returns {any}
     */
    foreignKey(foreignType: T): any;
}