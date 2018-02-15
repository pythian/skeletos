import {IRouteProps} from "./IRouteProps";
import {RoutePropType} from "./RoutePropType";
import {AbstractSkeletosState, LoadingState} from "../../../core";
import {AbstractSkeletosComponent, ISkeletosProps} from "../../../react";
import {AbstractRootRouteState, AbstractRouteState, IRouteBuilderInstance, RouteBuilder} from "../../../web-router";

/**
 * Subclass this class to render components that need to be tied to some RouteState.
 */
export abstract class AbstractRouteComponent
    <
    SkeletosStateType extends AbstractSkeletosState,
    RouteStateType extends AbstractRouteState,
    RootRouteStateType extends AbstractRootRouteState=AbstractRootRouteState,
    ExtraPropsType={},
    ReactComponentStateType={}
    >
    extends AbstractSkeletosComponent<SkeletosStateType, IRouteProps<RouteStateType> & ExtraPropsType, ReactComponentStateType> {

    /**
     * Required to tell React about context types so that this component receives this type of context from parent
     * component hierarchy.
     *
     * @type {any}
     */
    static contextTypes = RoutePropType;

    /**
     * Do not override this method unless you want to customize how the doRender and doRenderLoading are called.
     *
     * @returns {JSX.Element | false | null}
     */
    render(): JSX.Element | false | null {
        // check if we need to render, and if not then return null. If we do, then call doRender
        if (this.canRender()) {
            if (this.route.loading.isLoading()) {
                return this.doRenderLoading(this.route.loading);
            } else {
                return this.doRender();
            }
        } else {
            return this.doNotRender();
        }
    }

    /**
     * Check if we can render. We can only render if the current route corresponds to this component.
     *
     * @returns {boolean}
     */
    protected canRender(): boolean {
        // routeState should represent the leaf route in the route tree of segments
        // now just check if the cursors match
        let routeState: AbstractRouteState = this.rootRoute;
        let checkRoute: AbstractRouteState = routeState;
        while (checkRoute) {
            checkRoute = routeState.getCurrentRouteState();
            if (checkRoute) {
                routeState = checkRoute;
            }
        }

        return (routeState.cursor.path.join("/").startsWith(this.route.cursor.path.join("/")));
    }

    /**
     * Returns this component's route.
     *
     * @returns {RouteStateType}
     */
    protected get route(): RouteStateType {
        return this.props.route;
    }

    /**
     * Returns a route builder for this component's route.
     *
     * @returns {IRouteBuilderInstance<RouteStateType extends AbstractRouteState, RootRouteStateType extends AbstractRootRouteState>}
     */
    protected get routeBuilder(): IRouteBuilderInstance<RouteStateType, RootRouteStateType> {
        return this.rootRouteBuilder.skipTo(this.route);
    }

    /**
     * Returns a route builder for root route.
     *
     * @returns {IRouteBuilderInstance<RootRouteStateType extends AbstractRootRouteState, RootRouteStateType extends AbstractRootRouteState>}
     */
    protected get rootRouteBuilder(): IRouteBuilderInstance<RootRouteStateType, RootRouteStateType> {
        return RouteBuilder
            .clone((this.context as IRouteProps<RootRouteStateType>).route);
    }

    /**
     * Returns the root route.
     *
     * Implementation detail: The root route is part of the React component context.
     *
     * @returns {RootRouteStateType}
     */
    protected get rootRoute(): RootRouteStateType {
        if (this.context && (this.context as IRouteProps<RootRouteStateType>).route) {
            return (this.context as IRouteProps<RootRouteStateType>).route;
        } else {
            // better than an NPE
            throw new Error("Root route state was not passed down in context.");
        }
    }

    /**
     * Once your route actions for this component's route have been run, this method will be called to do the rendering.
     *
     * @returns {JSX.Element | false | null}
     */
    protected abstract doRender(): JSX.Element | false | null;

    /**
     * This method will be called when the current route DOES NOT correspond to this component.
     *
     * Default: returns null.
     *
     * @returns {JSX.Element | false | null}
     */
    protected doNotRender(): JSX.Element | false | null {
        return null;
    }

    /**
     * If your route actions for this component's route have not been run or are currently running, this method will be
     * called so you can show some loading indicator.
     *
     * @param {LoadingState} loading
     * @returns {JSX.Element | false | null}
     */
    protected abstract doRenderLoading(loading: LoadingState): JSX.Element | false | null;

    protected areExtraPropsIdentical(
        nextProps: Readonly<ISkeletosProps<SkeletosStateType> & IRouteProps<RouteStateType> & ExtraPropsType>,
        currentProps: Readonly<ISkeletosProps<SkeletosStateType> & IRouteProps<RouteStateType> & ExtraPropsType>): boolean {
        return (nextProps && currentProps && nextProps.route && currentProps.route &&
            nextProps.route.isEqualsTo(currentProps.route));
    }
}