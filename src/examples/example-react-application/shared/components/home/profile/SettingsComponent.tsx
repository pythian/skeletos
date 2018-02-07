import * as React from "react";
import {AbstractRouteComponent} from "../../../../../../react-web-router";
import {DummyUiState} from "../../../states/DummyUiState";
import {SettingsRoute} from "../../../routes/home/profile/SettingsRoute";
import {HomeRoute} from "../../../routes/HomeRoute";
import {LoadingState} from "../../../../../../core";
import {AuthenticationComponent} from "./settings/AuthenticationComponent";
import {AvatarComponent} from "./settings/AvatarComponent";
import {OrgSelectorComponent} from "./settings/OrgSelectorComponent";

export class SettingsComponent extends AbstractRouteComponent<DummyUiState, SettingsRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                SettingsComponent
                <div style={{marginLeft: 30}}>
                    <AuthenticationComponent skeletosState={this.skeletosState} route={this.route.authentication} />
                    <AvatarComponent skeletosState={this.skeletosState} route={this.route.avatarSettings} />
                    <OrgSelectorComponent skeletosState={this.skeletosState} route={this.route.orgSelector} />
                </div>
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}