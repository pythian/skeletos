import {State} from "../../../../../../../core";
import {OrgMemberSettingsRoute} from "./orgsettings/OrgMemberSettingsRoute";
import {OrgAuthenticationRoute} from "./orgsettings/OrgAuthenticationRoute";
import {DummyRouteTreeSyncAction} from "../../../DummyRouteTreeSyncAction";
import {DummyRouteSyncAction} from "../../../DummyRouteSyncAction";
import {DummyRouteAsyncAction} from "../../../DummyRouteAsyncAction";
import {DummyRouteTreeAsyncAction} from "../../../DummyRouteTreeAsyncAction";
import {AbstractRouteAction, AbstractRouteState, Segment} from "../../../../../../../web-router";

export class OrgSettingsRoute extends AbstractRouteState {

    @Segment("auth")
    @State(() => OrgAuthenticationRoute)
    orgAuthentication: OrgAuthenticationRoute;

    @Segment("member")
    @State(() => OrgMemberSettingsRoute)
    orgMemberSettings: OrgMemberSettingsRoute;

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