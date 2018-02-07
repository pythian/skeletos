import * as React from "react";
import {AbstractRouteComponent} from "../../../../../../../react-web-router";
import {DummyUiState} from "../../../../states/DummyUiState";
import {HomeRoute} from "../../../../routes/HomeRoute";
import {LoadingState} from "../../../../../../../core";
import {OrgSettingsRoute} from "../../../../routes/home/profile/settings/OrgSettingsRoute";
import {OrgAuthenticationSettingsComponent} from "./orgsettings/OrgAuthenticationSettingsComponent";
import {OrgMemberSettingsComponent} from "./orgsettings/OrgMemberSettingsComponent";

export class OrgSettingsComponent extends AbstractRouteComponent<DummyUiState, OrgSettingsRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                OrgSettingsComponent
                <div style={{marginLeft: 30}}>
                    <OrgAuthenticationSettingsComponent skeletosState={this.skeletosState} route={this.route.orgAuthentication} />
                    <OrgMemberSettingsComponent skeletosState={this.skeletosState} route={this.route.orgMemberSettings} />
                </div>
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}