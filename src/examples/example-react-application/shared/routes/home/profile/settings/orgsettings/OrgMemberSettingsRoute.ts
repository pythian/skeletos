import {Primitive, State} from "../../../../../../../../core";
import {OrgMemberSettingsTabRoute} from "./orgmember/OrgMemberSettingsTabRoute";
import {DummyRouteTreeSyncAction} from "../../../../DummyRouteTreeSyncAction";
import {DummyRouteSyncAction} from "../../../../DummyRouteSyncAction";
import {DummyRouteAsyncAction} from "../../../../DummyRouteAsyncAction";
import {DummyRouteTreeAsyncAction} from "../../../../DummyRouteTreeAsyncAction";
import {AbstractRouteAction, AbstractRouteState, SegmentParam} from "../../../../../../../../web-router";

export class OrgMemberSettingsRoute extends AbstractRouteState {

    @SegmentParam()
    @Primitive()
    orgMemberId: number;

    @SegmentParam()
    @State(() => OrgMemberSettingsTabRoute)
    orgMemberSettingsTab: OrgMemberSettingsTabRoute;

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