/**
 * Constants for skeletos-web-router package that other packages or your application can use.
 */
export class SkeletosWebRouterConstants {

    /**
     * The name of the variable in the global window scope that contains the serialized (dehydrated) Skeletos state
     * when a page is first loaded. Deserializing this (hydrating your Skeletos state) allows you to build isomorphic
     * applications.
     *
     * @type {string}
     */
    public static SKELETOS_DEHYDRATED_STATE_GLOBAL_ID: string = "___SKELETOS_STATE";

}