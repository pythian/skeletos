import * as React from "react";
import {AbstractRouteComponent} from "../../../../../../../react-web-router";
import {DummyUiState} from "../../../../states/DummyUiState";
import {HomeRoute} from "../../../../routes/HomeRoute";
import {LoadingState} from "../../../../../../../core";
import {OrgSelectorRoute} from "../../../../routes/home/profile/settings/OrgSelectorRoute";
import {OrgSettingsComponent} from "./OrgSettingsComponent";

export class OrgSelectorComponent extends AbstractRouteComponent<DummyUiState, OrgSelectorRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                OrgSelectorComponent (Org ID: {this.route.orgId})
                <div style={{marginLeft: 30}}>
                    <OrgSettingsComponent skeletosState={this.skeletosState} route={this.route.orgSettings} />
                </div>
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}