import _ = require("lodash");
import Url = require("domurl");
import Promise = require("bluebird");
import {ClassTypeInfo, EPropType, ErrorUtil, PropTypeInfo, SkeletosCursor} from "../../core";
import {IRouteBuilderInstance} from "./IRouteBuilderInstance";
import {IQueryParamProp, QUERY_PARAM_PROP_KEY} from "../decorators/QueryParam";
import {IRouteStateClassInfo, ROUTESTATE_CLASS_KEY} from "./IRouteStateClassInfo";
import {AbstractRouteState} from "../extendible/state/AbstractRouteState";
import {NotFoundError} from "../reusable/NotFoundError";
import {AbstractRootRouteState} from "../extendible/state/AbstractRootRouteState";
import {FireRouteUpdateAction} from "../reusable/FireRouteUpdateAction";
import {Request, Response} from "../../shared-interfaces/ExpressInterfaces";


export class InternalRouteBuilder<T extends AbstractRouteState, RootStateType extends AbstractRootRouteState> implements IRouteBuilderInstance<T, RootStateType> {

    routeToClone: RootStateType;
    clonedRoute: RootStateType;

    currentState: T;

    serverRequest: Request;
    serverResponse: Response;

    fireRouteUpdateActionClass: typeof FireRouteUpdateAction;

    constructor(routeToClone: RootStateType, serverRequest?: Request, serverResponse?: Response,
                fireRouteUpdateActionClass: typeof FireRouteUpdateAction = FireRouteUpdateAction) {
        this.routeToClone = routeToClone;

        // clone the route
        const db = routeToClone.cursor.db;
        const routeToClonePath = routeToClone.cursor.path;

        let serialized: string;
        if (!db.getNode(routeToClonePath)) {
            serialized = JSON.stringify({});
        } else {
            serialized = db.serialize(routeToClonePath);
        }

        const newCursor: SkeletosCursor = new SkeletosCursor(true);
        newCursor.db.deserialize(serialized);
        this.clonedRoute = new (routeToClone as any).constructor(newCursor);

        // initially, the current state is the cloned route.
        this.currentState = this.clonedRoute as any;

        this.serverRequest = serverRequest;
        this.serverResponse = serverResponse;
        this.fireRouteUpdateActionClass = fireRouteUpdateActionClass;
    }

    syncFromUrl(urlStr: string): IRouteBuilderInstance<T, RootStateType> {
        const url: Url = new Url(urlStr);
        const segments: string[] = url.paths();

        if (!segments || segments.length === 0) {
            return this as any;
        }

        let currentRouteState: AbstractRouteState = this.currentState;
        let i: number = 0;

        /*
            the first thing we do is go out and reset all the currentRoute and query parameters to give us a clean slate
            this avoids bugs such as:
               1. Current Route set to : /x/y/z
               2. We reset to: /x/a
                    - Note that y.currentRoute = z still.
               3. Now we go to: /x/y
                    - However, because y.currentRoute = z from (1), we instead end up going to /x/y/z
         */

        const routesToReset: AbstractRouteState[] = [];
        while (currentRouteState) {
            routesToReset.push(currentRouteState);
            currentRouteState = currentRouteState.getCurrentRouteState();
        }

        this.resetRoutes(routesToReset);

        currentRouteState = this.currentState;

        while (currentRouteState && i < segments.length) {
            if (segments[i].length === 0) {
                i++;
                continue;
            }

            const classInfo: IRouteStateClassInfo = ClassTypeInfo.maybeGetExtension(currentRouteState, ROUTESTATE_CLASS_KEY);
            let nextRoute: AbstractRouteState;

            if (classInfo.hasSegments) {
                const propertyKey: string = classInfo.segments[segments[i]];
                if (!propertyKey) {
                    throw new NotFoundError("The URL " + urlStr + " cannot be found.");
                }

                currentRouteState.currentRoute = segments[i];
                nextRoute = currentRouteState[propertyKey];
            } else if (classInfo.hasSegmentParams) {
                currentRouteState.currentRoute = segments[i];

                // set any @Primitive props to segments[i] and then use the @State prop for the nextRoute

                const segmentParamsPropertyKeys: string[] = _.keys(classInfo.segmentParams);
                for (const propKey of segmentParamsPropertyKeys) {
                    const propTypeInfo = PropTypeInfo.getPropTypeInfo(currentRouteState, propKey);
                    if (propTypeInfo.propType === EPropType.state) {
                        nextRoute = currentRouteState[propKey];
                    } else if (propTypeInfo.propType === EPropType.primitive) {
                        currentRouteState[propKey] = segments[i];
                    }
                }

            } else {
                throw new Error("RouteState " + ErrorUtil.getDebugName(currentRouteState) +
                    " does not have any @Segment or @SegmentParam annotations.");
            }

            if (classInfo.queryParams && !_.isEmpty(classInfo.queryParams)) {
                _.forEach(classInfo.queryParams, (propertyKey: string, queryParam: string) => {
                    let queryValue: string|number|boolean = url.query[queryParam];

                    // Should we use @Validate to check the primitive type? Don't want to put skeletos-validate
                    // a dependency from the router :\
                    if (!_.isNil(queryValue)) {
                        if (queryValue === "true" || queryValue === "false") {
                            queryValue = (queryValue === "true");
                        } else {
                            const num: number = parseInt(queryValue as string, 10);
                            if (!_.isNaN(num)) {
                                queryValue = num;
                            }
                        }

                        currentRouteState[propertyKey] = queryValue;
                    }
                });
            }

            currentRouteState = nextRoute;

            i++;
        }

        // indicate to the URL listener that we now need to change
        this.clonedRoute.changeUrlToReflectCurrentState = true;

        return this as any;
    }

    skipTo<X extends AbstractRouteState>(selector: X | ((input: T) => X)): IRouteBuilderInstance<X, RootStateType> {
        // from just acts like a "skip" these route states
        if (!selector) {
            throw new Error(
                "No skip selector specified. Either supply a Route or a function that returns a Route using the given current Route.");
        }

        if (_.isFunction(selector)) {
            const toState: X = selector(this.currentState);
            if (!toState) {
                throw new Error(
                    "When using RouteBuilder.skip(selector: Function), you must only return a value from the " +
                    "selector that is of type AbstractRouteState, and you must do it using the provided argument.");
            }

            this.currentState = toState as any;
        } else {
            if (!(selector instanceof AbstractRouteState)) {
                throw new Error(
                    "When using RouteBuilder.skip(selector: X), you must only supply a value for the " +
                    "selector that is of type AbstractRouteState.");
            }

            const selectorPath = selector.cursor.path.join("/");
            const routeToClonePath = this.routeToClone.cursor.path.join("/");

            // the clonedRoute starts off after the routeToClone's path from it's root.
            // e.g. if routeToClone.path = root/route
            // and if selector here is root/route/profile
            // then clonedRoute needs to be = profile
            // the extra + 1 is to get rid of the / at the end.
            let path: string[];
            if (selectorPath.startsWith(routeToClonePath)) {
                if (selectorPath.length > routeToClonePath.length) {
                    path = selectorPath.substring(routeToClonePath.length + 1).split("/");
                } else {
                    path = [];
                }
            } else {
                path = selector.cursor.path;
            }

            this.currentState =
                new (selector as any).constructor.prototype.constructor(
                    this.clonedRoute.cursor.root().select(...path));
        }

        return this as any;
    }

    segment<X extends AbstractRouteState>(selector: (input: T) => X): IRouteBuilderInstance<X, RootStateType> {
        if (!selector) {
            throw new Error("No segment selector function specified.");
        }
        
        // because we supply a dummy state that is PropertyKey vs RoutePath, we actually get back a string
        // representing the route path that we can then use to look up the RouteState.
        const routePath: string = selector(this.createDummyObject(this.currentState) as T) as any;
        
        if (!routePath) {
            throw new Error("The property you selected in " + ErrorUtil.getDebugName(this.currentState) +
                " is not marked with @Segment or @SegmentParam");
        }

        const classInfo: IRouteStateClassInfo =
            ClassTypeInfo.maybeGetExtension(this.currentState, ROUTESTATE_CLASS_KEY);
        if (classInfo.hasSegmentParams) {
            // the route path is actually a propertyKey that points (hopefully) to some state.
            const propTypeInfo = PropTypeInfo.getPropTypeInfo(this.currentState, routePath);
            if (!propTypeInfo || propTypeInfo.propType !== EPropType.state) {
                throw new Error("The property you selected in " + ErrorUtil.getDebugName(this.currentState) +
                    " is not marked with @State");
            }

            this.currentState = this.currentState[routePath];
        } else {
            // get the property key that corresponds to this routePath
            this.currentState.currentRoute = routePath;

            const newState: AbstractRouteState = this.currentState.getCurrentRouteState();
            if (!newState) {
                throw new Error("A RouteState could not be looked up for " + routePath + " in " +
                    ErrorUtil.getDebugName(this.currentState) + ". Make sure you have a @Segment defined on the " +
                    routePath + " property.");
            }

            // using `as T` here because currentState is a *specific* type T of AbstractRouteState, not any subclass
            // of AbstractRouteState. Hence, the compiler complains.
            this.currentState = newState as T;
        }

        return this as any;
    }

    segmentParam(selector: string|number): IRouteBuilderInstance<T, RootStateType> {
        // first we need to find the property in currentState that has a primitive
        const classInfo: IRouteStateClassInfo =
            ClassTypeInfo.maybeGetExtension(this.currentState, ROUTESTATE_CLASS_KEY);

        const noSegmentParam = "There are no @SegmentParam properties defined in " +
            ErrorUtil.getDebugName(this.currentState) + ".";

        if (!classInfo || !classInfo.segmentParams) {
            throw new Error(noSegmentParam);
        }

        const segmentParamKeys: string[] = _.keys(classInfo.segmentParams);
        if (!segmentParamKeys || segmentParamKeys.length === 0) {
            throw new Error(noSegmentParam);
        }

        // now we go through all the segment parameter keys and set those that are marked as primitive
        let foundOne: boolean = false;
        for (const key of segmentParamKeys) {
            const propTypeInfo = PropTypeInfo.getPropTypeInfo(this.currentState, key);
            if (propTypeInfo && propTypeInfo.propType === EPropType.primitive) {
                // set this
                this.currentState[key] = selector;
                foundOne = true;
            }
        }

        if (!foundOne) {
            throw new Error("No properties defined in " + ErrorUtil.getDebugName(this.currentState) +
                " that have both @SegmentParam and @Primitive defined.");
        } else {
            this.currentState.currentRoute = selector;
        }

        return this as any;
    }

    queryParam(selector: (input: T) => string|number|boolean, value: any): IRouteBuilderInstance<T, RootStateType> {
        if (!selector) {
            throw new Error("No queryParam selector function specified.");
        }

        // because we supply a dummy state that is PropertyKey vs RoutePath, we actually get back a string
        // representing the route path that we can then use to look up the RouteState.
        const queryKey: string = selector(this.createQueryParamsDummyObject(this.currentState) as T) as any;

        if (!queryKey) {
            throw new Error("The property you selected in " + ErrorUtil.getDebugName(this.currentState) +
                " is not marked with @QueryParam");
        }

        // first, we need to find out if the currentState[key] is marked as a query parameter.
        const propTypeInfo: IQueryParamProp = PropTypeInfo.maybeGetExtension(
            this.currentState, queryKey, QUERY_PARAM_PROP_KEY);
        if (!propTypeInfo) {
            throw new Error("The property you selected in " + ErrorUtil.getDebugName(this.currentState) +
                " is not marked with @QueryParam");
        }

        this.currentState[queryKey] = value;

        return this as any;
    }

    build(): RootStateType {
        return this.clonedRoute;
    }

    buildString(): string {
        // start with the root state
        let currentRouteState: AbstractRouteState = this.build();
        let url: string = "";
        const queryParams: object = {};

        while (currentRouteState) {
            if (currentRouteState.currentRoute) {
                url += "/" + currentRouteState.currentRoute;
            }

            const routeStateInfo: IRouteStateClassInfo =
                ClassTypeInfo.maybeGetExtension(currentRouteState, ROUTESTATE_CLASS_KEY);

            if (routeStateInfo) {
                _.forEach(routeStateInfo.queryParams, (propertyKey: string, queryParamKey: string) => {
                    const queryParamVal: any = currentRouteState[propertyKey];
                    if (!_.isNil(queryParamVal)) {
                        queryParams[queryParamKey] = queryParamVal;
                    }
                });
            }
            currentRouteState = currentRouteState.getCurrentRouteState();
        }

        // now put together the query parameters
        let queryParamStr: string = "";
        _.forEach(queryParams, (value: string, key: string) => {
            queryParamStr += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(value);
        });

        queryParamStr = _.trim(queryParamStr, "&");

        if (queryParamStr.length > 0) {
            queryParamStr = "?" + queryParamStr;
        }

        return url + queryParamStr;
    }

    mergeWithoutRouteActions(anotherRoute?: RootStateType): void {
        const currentRoute = anotherRoute ? anotherRoute : this.routeToClone;

        // we merge the clonedRoute into routeToClone
        const serialized = this.clonedRoute.cursor.db.serialize();
        currentRoute.cursor.db.deserialize(
            serialized, false, currentRoute.cursor.path, currentRoute.cursor.transaction);
        currentRoute.changeUrlToReflectCurrentState = true;
    }

    merge(anotherRoute?: RootStateType): Promise<void> {
        const currentRoute = anotherRoute ? anotherRoute : this.routeToClone;

        // first, we clone the old route
        const oldSerialized = currentRoute.cursor.db.serialize(currentRoute.cursor.path);
        const oldClonedCursor = new SkeletosCursor(true);
        oldClonedCursor.db.deserialize(oldSerialized);
        const oldClonedRoute = new (currentRoute as any).constructor(oldClonedCursor, oldClonedCursor.transaction);

        // next we merge the clonedRoute into routeToClone
        const serialized = this.clonedRoute.cursor.db.serialize();
        currentRoute.cursor.db.deserialize(
            serialized, false, currentRoute.cursor.path, currentRoute.cursor.transaction);
        currentRoute.changeUrlToReflectCurrentState = true;

        return (new this.fireRouteUpdateActionClass(
            currentRoute, oldClonedRoute, this.serverRequest,
            this.serverResponse
        ) as FireRouteUpdateAction).asPromise();

        // TODO need to set the loading states for those states that have changed...
    }
    
    private createDummyObject(forState: AbstractRouteState): AbstractRouteState {
        const classTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(forState);
        const routeStateInfo: IRouteStateClassInfo = classTypeInfo.getIfExistsOrPutExtension(ROUTESTATE_CLASS_KEY);

        let dummy: object = {};
        if (routeStateInfo.dummyState) {
            dummy = routeStateInfo.dummyState;
        } else {
            _.forEach(routeStateInfo.segments, (propertyKey: string, routePath: string) => {
                dummy[propertyKey] = routePath;
            });
            _.forEach(routeStateInfo.segmentParams, (value: true, propertyKey: string) => {
                dummy[propertyKey] = propertyKey;
            });
            routeStateInfo.dummyState = dummy;
        }

        return dummy as AbstractRouteState;
    }

    private createQueryParamsDummyObject(forState: AbstractRouteState): AbstractRouteState {
        const classTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(forState);
        const routeStateInfo: IRouteStateClassInfo = classTypeInfo.getIfExistsOrPutExtension(ROUTESTATE_CLASS_KEY);

        let dummy: object = {};
        if (routeStateInfo.dummyQueryParams) {
            dummy = routeStateInfo.dummyQueryParams;
        } else {
            dummy = {};
            _.forEach(routeStateInfo.queryParams, (propertyKey: string, queryKey: string) => {
                dummy[propertyKey] = propertyKey;
            });
            routeStateInfo.dummyQueryParams = dummy;
        }

        return dummy as AbstractRouteState;
    }

    private resetRoutes(routesToReset: AbstractRouteState[]): void {
        for (const routeToReset of routesToReset) {
            routeToReset.currentRoute = null;
            const routeInfo: IRouteStateClassInfo = ClassTypeInfo.maybeGetExtension(routeToReset, ROUTESTATE_CLASS_KEY);
            if (routeInfo && routeInfo.queryParams) {
                _.forEach(routeInfo.queryParams, (propertyKey: string, queryKey: string) => {
                    routeToReset[propertyKey] = null;
                });
            }
        }
    }
}