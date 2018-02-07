import {IRouteBuilderInstance} from "../base/IRouteBuilderInstance";
import {InternalRouteBuilder} from "../base/InternalRouteBuilder";
import {Request, Response} from "../../shared-interfaces/ExpressInterfaces";
import {AbstractRootRouteState} from "../extendible/state/AbstractRootRouteState";
import {FireRouteUpdateAction} from "../reusable/FireRouteUpdateAction";

export class RouteBuilder {

    public static clone<T extends AbstractRootRouteState>(
        routeToClone: T,
        serverRequest?: Request,
        serverResponse?: Response,
        fireRouteUpdateActionClass: typeof FireRouteUpdateAction = FireRouteUpdateAction): IRouteBuilderInstance<T, T> {
        return new InternalRouteBuilder<T, T>(routeToClone, serverRequest, serverResponse, fireRouteUpdateActionClass);
    }

}