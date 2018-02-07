import * as React from "react";
import {OrgMemberSettingsTabRoute} from "../../../../../../routes/home/profile/settings/orgsettings/orgmember/OrgMemberSettingsTabRoute";
import {AbstractRouteComponent} from "../../../../../../../../../react-web-router";
import {DummyUiState} from "../../../../../../states/DummyUiState";
import {HomeRoute} from "../../../../../../routes/HomeRoute";
import {OrgMemberAuthenticationSettingsComponent} from "./orgmembersettings/OrgMemberAuthenticationSettingsComponent";
import {OrgMemberProfileSettingsComponent} from "./orgmembersettings/OrgMemberProfileSettingsComponent";
import {LoadingState} from "../../../../../../../../../core";

export class OrgMemberSettingsTabComponent extends AbstractRouteComponent<DummyUiState, OrgMemberSettingsTabRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                OrgMemberSettingsTabComponent
                <div style={{marginLeft: 30}}>
                    <OrgMemberAuthenticationSettingsComponent skeletosState={this.skeletosState} route={this.route.orgMemberAuthentication} />
                    <OrgMemberProfileSettingsComponent skeletosState={this.skeletosState} route={this.route.orgMemberProfile} />
                </div>
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}