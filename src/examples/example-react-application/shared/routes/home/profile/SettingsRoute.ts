import {AuthenticationRoute} from "./settings/AuthenticationRoute";
import {Primitive, State} from "../../../../../../core";
import {AvatarSettingsRoute} from "./settings/AvatarSettingsRoute";
import {OrgSelectorRoute} from "./settings/OrgSelectorRoute";
import {DummyRouteTreeSyncAction} from "../../DummyRouteTreeSyncAction";
import {DummyRouteSyncAction} from "../../DummyRouteSyncAction";
import {DummyRouteAsyncAction} from "../../DummyRouteAsyncAction";
import {DummyRouteTreeAsyncAction} from "../../DummyRouteTreeAsyncAction";
import {AbstractRouteAction, AbstractRouteState, QueryParam, Segment} from "../../../../../../web-router";

export class SettingsRoute extends AbstractRouteState {

    @Segment("auth")
    @State(() => AuthenticationRoute)
    authentication: AuthenticationRoute;

    @Segment("avatar")
    @State(() => AvatarSettingsRoute)
    avatarSettings: AvatarSettingsRoute;

    @Segment("org")
    @State(() => OrgSelectorRoute)
    orgSelector: OrgSelectorRoute;

    @QueryParam("org")
    @Primitive()
    showOrg: boolean;

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