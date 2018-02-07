import {DummyRouteTreeSyncAction} from "../../../../../../DummyRouteTreeSyncAction";
import {DummyRouteSyncAction} from "../../../../../../DummyRouteSyncAction";
import {DummyRouteAsyncAction} from "../../../../../../DummyRouteAsyncAction";
import {DummyRouteTreeAsyncAction} from "../../../../../../DummyRouteTreeAsyncAction";
import {AbstractRouteAction, AbstractRouteState} from "../../../../../../../../../../web-router";

export class OrgMemberProfileSettingsRoute extends AbstractRouteState {


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