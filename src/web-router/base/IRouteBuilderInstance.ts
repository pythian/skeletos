import Promise = require("bluebird");
import {AbstractRouteState} from "../extendible/state/AbstractRouteState";

export interface IRouteBuilderInstance<T extends AbstractRouteState, RootStateType extends AbstractRouteState> {

    /**
     * Synchronizes the Route state tree to the given URL.
     *
     * @param {string} url
     * @returns {IRouteBuilderInstance<T extends AbstractRouteState, RootStateType extends AbstractRouteState>}
     */
    syncFromUrl(url: string): IRouteBuilderInstance<T, RootStateType>;

    /**
     * Start from a particular Route. Use the selector to choose the Route to skip to.
     *
     * You can either:
     * 1. Supply an AbstractRouteState to directly start building a URL from that point onwards. This assumes that
     * you want to keep everything preceding this route the same as the RootState.
     *
     * or
     *
     * 2. Supply a function which takes an argument of the current segment and uses it to return a Route till which
     * you should skip.
     *
     * @param {(input: T) => X} selector
     * @returns {IRouteBuilderInstance<X extends AbstractRouteState>}
     */
    skipTo<X extends AbstractRouteState>(selector: X | ((input: T) => X)): IRouteBuilderInstance<X, RootStateType>;

    /**
     * Allows you to specify a segment in the URL that corresponds to a Skeletos Route.
     */
    segment<X extends AbstractRouteState>(selector: (input: T) => X): IRouteBuilderInstance<X, RootStateType>;

    /**
     * Allows you to specify an arbitrary segment in the URL. For example, the 123 in /todos/123 is a parameter segment.
     */
    segmentParam(selector: string|number): IRouteBuilderInstance<T, RootStateType>;

    /**
     * Allows you to set query portion of the URL using the Route.
     */
    queryParam(selector: (input: T) => string|number|boolean, value: any): IRouteBuilderInstance<T, RootStateType>;

    /**
     * Resets all the query parameters.
     *
     * @returns {IRouteBuilderInstance<T extends AbstractRouteState, RootStateType extends AbstractRouteState>}
     */
    resetAllQueryParams(): IRouteBuilderInstance<T, RootStateType>;

    /**
     * The default behavior when you call .build() or any other function that uses .build() -- such as `.buildString()` --
     * is that all the child routes are reset.
     *
     * If you do not want the child routes to be reset, call this function.
     *
     * @returns {IRouteBuilderInstance<T extends AbstractRouteState, RootStateType extends AbstractRouteState>}
     */
    doNotResetChildRoutes(): IRouteBuilderInstance<T, RootStateType>;

    /**
     * Builds the Route state and returns it.
     *
     * @returns {RootStateType}
     */
    build(): RootStateType;

    /**
     * Merges the route this builder has built with either the original route this builder was given (if anotherRoute
     * is not supplied) or with the given anotherRoute.
     *
     * Use this to modify the central tree state in order to change the URL.
     *
     * Returns a Promise that is resolved once all the route actions have executed.
     *
     * @param {RootStateType} another
     */
    merge(anotherRoute?: RootStateType): Promise<void>;

    /**
     * Same as merge(..) above but does not run any route actions.
     *
     * @param {RootStateType} anotherRoute
     */
    mergeWithoutRouteActions(anotherRoute?: RootStateType): void;

    /**
     * Builds a string representing the URL.
     */
    buildString(): string;
}