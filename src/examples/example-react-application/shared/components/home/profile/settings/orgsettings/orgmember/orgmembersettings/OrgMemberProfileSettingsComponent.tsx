import * as React from "react";
import {DummyUiState} from "../../../../../../../states/DummyUiState";
import {AbstractRouteComponent} from "../../../../../../../../../../react-web-router";
import {HomeRoute} from "../../../../../../../routes/HomeRoute";
import {LoadingState} from "../../../../../../../../../../core";
import {OrgMemberProfileSettingsRoute} from "../../../../../../../routes/home/profile/settings/orgsettings/orgmember/orgmembersettings/OrgMemberProfileSettingsRoute";

export class OrgMemberProfileSettingsComponent extends AbstractRouteComponent<DummyUiState, OrgMemberProfileSettingsRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                OrgMemberProfileSettingsComponent
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}