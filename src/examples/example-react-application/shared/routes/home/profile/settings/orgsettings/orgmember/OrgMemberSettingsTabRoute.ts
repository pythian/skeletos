import {Primitive, State} from "../../../../../../../../../core";
import {OrgMemberProfileSettingsRoute} from "./orgmembersettings/OrgMemberProfileSettingsRoute";
import {OrgMemberAuthenticationSettingsRoute} from "./orgmembersettings/OrgMemberAuthenticationSettingsRoute";
import {DummyRouteTreeSyncAction} from "../../../../../DummyRouteTreeSyncAction";
import {DummyRouteSyncAction} from "../../../../../DummyRouteSyncAction";
import {DummyRouteAsyncAction} from "../../../../../DummyRouteAsyncAction";
import {DummyRouteTreeAsyncAction} from "../../../../../DummyRouteTreeAsyncAction";
import {AbstractRouteAction, AbstractRouteState, QueryParam, Segment} from "../../../../../../../../../web-router";

export class OrgMemberSettingsTabRoute extends AbstractRouteState {

    @QueryParam("full")
    @Primitive()
    showFullSettings: boolean;

    @Segment("profile")
    @State(() => OrgMemberProfileSettingsRoute)
    orgMemberProfile: OrgMemberProfileSettingsRoute;

    @Segment("auth")
    @State(() => OrgMemberAuthenticationSettingsRoute)
    orgMemberAuthentication: OrgMemberAuthenticationSettingsRoute;

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