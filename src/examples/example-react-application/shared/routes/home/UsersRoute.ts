import {Primitive} from "../../../../../core";
import {Validate} from "../../../../../validate";
import {DummyRouteTreeSyncAction} from "../DummyRouteTreeSyncAction";
import {DummyRouteSyncAction} from "../DummyRouteSyncAction";
import {DummyRouteAsyncAction} from "../DummyRouteAsyncAction";
import {DummyRouteTreeAsyncAction} from "../DummyRouteTreeAsyncAction";
import {AbstractRouteAction, AbstractRouteState, QueryParam} from "../../../../../web-router";

export class UsersRoute extends AbstractRouteState {


    @QueryParam()
    @Validate((joi) => joi.string())
    @Primitive()
    search: string;

    @QueryParam("id") // you can specify a different key for the query parameter
    @Validate((joi) => joi.string())
    @Primitive()
    searchById: string;

    onRouteUpdatedSync(): typeof AbstractRouteAction {
        return DummyRouteSyncAction as any;
    }

    onRouteUpdatedAsync(): typeof AbstractRouteAction {
        return DummyRouteAsyncAction as any;
    }

    onRouteTreeUpdatedSync(): typeof AbstractRouteAction {
        return DummyRouteTreeSyncAction as any;
    }

    onRouteTreeUpdatedAsync(): typeof AbstractRouteAction {
        return DummyRouteTreeAsyncAction as any;
    }
}