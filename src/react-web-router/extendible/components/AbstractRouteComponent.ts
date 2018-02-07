import {IRouteProps} from "./IRouteProps";
import {RoutePropType} from "./RoutePropType";
import {AbstractSkeletosState, LoadingState} from "../../../core";
import {AbstractSkeletosComponent, ISkeletosProps} from "../../../react";
import {AbstractRootRouteState, AbstractRouteState, IRouteBuilderInstance, RouteBuilder} from "../../../web-router";


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

    render(): JSX.Element | false | null {
        // check if we need to render, and if not then return null. If we do, then call doRender
        let routeState: AbstractRouteState = this.rootRoute;
        let checkRoute: AbstractRouteState = routeState;
        while (checkRoute) {
            checkRoute = routeState.getCurrentRouteState();
            if (checkRoute) {
                routeState = checkRoute;
            }
        }

        // routeState should represent the leaf route in the route tree of segments
        // now just check if the cursors match
        if (routeState.cursor.path.join("/").startsWith(this.route.cursor.path.join("/"))) {
            if (this.route.loading.isLoading()) {
                return this.doRenderLoading(this.route.loading);
            } else {
                return this.doRender();
            }
        } else {
            return null;
        }
    }

    protected get route(): RouteStateType {
        return this.props.route;
    }

    protected get routeBuilder(): IRouteBuilderInstance<RouteStateType, RootRouteStateType> {
        return this.rootRouteBuilder.skipTo(this.route);
    }

    protected get rootRouteBuilder(): IRouteBuilderInstance<RootRouteStateType, RootRouteStateType> {
        return RouteBuilder
            .clone((this.context as IRouteProps<RootRouteStateType>).route);
    }

    protected get rootRoute(): RootRouteStateType {
        if (this.context && (this.context as IRouteProps<RootRouteStateType>).route) {
            return (this.context as IRouteProps<RootRouteStateType>).route;
        } else {
            // better than an NPE
            throw new Error("Root route state was not passed down in context.");
        }
    }

    protected abstract doRender(): JSX.Element | false | null;

    protected abstract doRenderLoading(loading: LoadingState): JSX.Element | false | null;

    protected areExtraPropsIdentical(
        nextProps: Readonly<ISkeletosProps<SkeletosStateType> & IRouteProps<RouteStateType> & ExtraPropsType>,
        currentProps: Readonly<ISkeletosProps<SkeletosStateType> & IRouteProps<RouteStateType> & ExtraPropsType>): boolean {
        return (nextProps && currentProps && nextProps.route && currentProps.route &&
            nextProps.route.isEqualsTo(currentProps.route));
    }
}