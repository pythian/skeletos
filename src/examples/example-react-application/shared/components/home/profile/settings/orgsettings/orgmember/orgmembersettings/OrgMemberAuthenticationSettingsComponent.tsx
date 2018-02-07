import * as React from "react";
import {OrgMemberAuthenticationSettingsRoute} from "../../../../../../../routes/home/profile/settings/orgsettings/orgmember/orgmembersettings/OrgMemberAuthenticationSettingsRoute";
import {HomeRoute} from "../../../../../../../routes/HomeRoute";
import {DummyUiState} from "../../../../../../../states/DummyUiState";
import {AbstractRouteComponent} from "../../../../../../../../../../react-web-router";
import {LoadingState} from "../../../../../../../../../../core";

export class OrgMemberAuthenticationSettingsComponent extends AbstractRouteComponent<DummyUiState, OrgMemberAuthenticationSettingsRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                OrgMemberAuthenticationSettingsComponent
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}