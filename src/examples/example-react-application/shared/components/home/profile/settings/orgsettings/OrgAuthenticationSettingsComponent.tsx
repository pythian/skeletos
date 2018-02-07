import * as React from "react";
import {OrgAuthenticationRoute} from "../../../../../routes/home/profile/settings/orgsettings/OrgAuthenticationRoute";
import {DummyUiState} from "../../../../../states/DummyUiState";
import {AbstractRouteComponent} from "../../../../../../../../react-web-router";
import {HomeRoute} from "../../../../../routes/HomeRoute";
import {LoadingState} from "../../../../../../../../core";

export class OrgAuthenticationSettingsComponent extends AbstractRouteComponent<DummyUiState, OrgAuthenticationRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                OrgAuthenticationSettingsComponent
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}