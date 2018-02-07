import {Primitive, State} from "../../../../../../../core";
import {OrgSettingsRoute} from "./OrgSettingsRoute";
import {DummyRouteTreeSyncAction} from "../../../DummyRouteTreeSyncAction";
import {DummyRouteSyncAction} from "../../../DummyRouteSyncAction";
import {DummyRouteAsyncAction} from "../../../DummyRouteAsyncAction";
import {DummyRouteTreeAsyncAction} from "../../../DummyRouteTreeAsyncAction";
import {AbstractRouteAction, AbstractRouteState, SegmentParam} from "../../../../../../../web-router";

export class OrgSelectorRoute extends AbstractRouteState {

    @SegmentParam()
    @Primitive()
    orgId: string;

    @SegmentParam()
    @State(() => OrgSettingsRoute)
    orgSettings: OrgSettingsRoute;

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