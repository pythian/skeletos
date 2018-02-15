import * as React from "react";
import {ProfileRoute} from "../../routes/home/ProfileRoute";
import {HomeRoute} from "../../routes/HomeRoute";
import {DummyUiState} from "../../states/DummyUiState";
import {SettingsComponent} from "./profile/SettingsComponent";
import {AbstractDummyComponent} from "../AbstractDummyComponent";

export class ProfileComponent extends AbstractDummyComponent<DummyUiState, ProfileRoute, HomeRoute> {
    protected getComponentName(): string {
        return "ProfileComponent";
    }

    protected getSubComponents(): JSX.Element | JSX.Element[] {
        return <SettingsComponent skeletosState={this.skeletosState} route={this.route.settings} />;
    }


}