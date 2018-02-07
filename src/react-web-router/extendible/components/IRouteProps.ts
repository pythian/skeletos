import {AbstractRouteState} from "../../../web-router";

export interface IRouteProps<T extends AbstractRouteState> {
    route: T;
}