import * as React from "react";
import {DummyUiState} from "../../../states/DummyUiState";
import {SettingsRoute} from "../../../routes/home/profile/SettingsRoute";
import {HomeRoute} from "../../../routes/HomeRoute";
import {AuthenticationComponent} from "./settings/AuthenticationComponent";
import {AvatarComponent} from "./settings/AvatarComponent";
import {OrgSelectorComponent} from "./settings/OrgSelectorComponent";
import {AbstractDummyComponent} from "../../AbstractDummyComponent";

export class SettingsComponent extends AbstractDummyComponent<DummyUiState, SettingsRoute, HomeRoute> {
    protected getComponentName(): string {
        return "SettingsComponent";
    }

    protected getSubComponents(): JSX.Element | JSX.Element[] {
        return [
            <AuthenticationComponent key="auth" skeletosState={this.skeletosState} route={this.route.authentication} />,
            <AvatarComponent key="avatar" skeletosState={this.skeletosState} route={this.route.avatarSettings} />,
            <OrgSelectorComponent key="org" skeletosState={this.skeletosState} route={this.route.orgSelector} />
        ];
    }


}