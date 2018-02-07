import {AbstractSkeletosState} from "../../../core";
import {IRouteProps} from "./IRouteProps";
import {RoutePropType} from "./RoutePropType";
import * as React from "react";
import {AbstractRootRouteState, IRouteBuilderInstance, RouteBuilder} from "../../../web-router";
import {AbstractRootComponent, ISkeletosProps} from "../../../react";

export abstract class AbstractRootRouteComponent
    <
        SkeletosStateType extends AbstractSkeletosState,
        RouteStateType extends AbstractRootRouteState,
        ExtraPropsType={}
    >
    extends AbstractRootComponent<SkeletosStateType, IRouteProps<RouteStateType> & ExtraPropsType>
    implements React.ChildContextProvider<IRouteProps<RouteStateType>> {

    static childContextTypes = RoutePropType;

    getChildContext(): IRouteProps<RouteStateType> {
        return {
            route: this.props.route
        } as IRouteProps<RouteStateType>;
    }

    get route(): RouteStateType {
        return this.props.route;
    }

    protected get routeBuilder(): IRouteBuilderInstance<RouteStateType, RouteStateType> {
        return RouteBuilder
            .clone((this.context as IRouteProps<RouteStateType>).route);
    }

    protected areExtraPropsIdentical(
        nextProps: Readonly<ISkeletosProps<SkeletosStateType> & IRouteProps<RouteStateType> & ExtraPropsType>,
        currentProps: Readonly<ISkeletosProps<SkeletosStateType> & IRouteProps<RouteStateType> & ExtraPropsType>): boolean {
        return (nextProps && currentProps && nextProps.route && currentProps.route &&
            nextProps.route.isEqualsTo(currentProps.route));
    }
}