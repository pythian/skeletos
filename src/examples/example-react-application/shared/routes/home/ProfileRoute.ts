import {SettingsRoute} from "./profile/SettingsRoute";
import {State} from "../../../../../core";
import {DummyRouteTreeSyncAction} from "../DummyRouteTreeSyncAction";
import {DummyRouteSyncAction} from "../DummyRouteSyncAction";
import {DummyRouteAsyncAction} from "../DummyRouteAsyncAction";
import {DummyRouteTreeAsyncAction} from "../DummyRouteTreeAsyncAction";
import {AbstractRouteAction, AbstractRouteState, Segment} from "../../../../../web-router";

export class ProfileRoute extends AbstractRouteState {

    @Segment()
    @State(() => SettingsRoute)
    settings: SettingsRoute;

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