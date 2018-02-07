import * as React from "react";
import {OrgMemberSettingsRoute} from "../../../../../routes/home/profile/settings/orgsettings/OrgMemberSettingsRoute";
import {AbstractRouteComponent} from "../../../../../../../../react-web-router";
import {HomeRoute} from "../../../../../routes/HomeRoute";
import {DummyUiState} from "../../../../../states/DummyUiState";
import {LoadingState} from "../../../../../../../../core";
import {OrgMemberSettingsTabComponent} from "./orgmember/OrgMemberSettingsTabComponent";

export class OrgMemberSettingsComponent extends AbstractRouteComponent<DummyUiState, OrgMemberSettingsRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                OrgMemberSettingsComponent (Member ID: {this.route.orgMemberId})
                <div style={{marginLeft: 30}}>
                    <OrgMemberSettingsTabComponent skeletosState={this.skeletosState} route={this.route.orgMemberSettingsTab} />
                </div>
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}