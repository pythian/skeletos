import * as React from "react";
import {AbstractRouteComponent} from "../../../../../react-web-router";
import {ProfileRoute} from "../../routes/home/ProfileRoute";
import {HomeRoute} from "../../routes/HomeRoute";
import {LoadingState} from "../../../../../core";
import {DummyUiState} from "../../states/DummyUiState";
import {SettingsComponent} from "./profile/SettingsComponent";

export class ProfileComponent extends AbstractRouteComponent<DummyUiState, ProfileRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                ProfileComponent
                <div style={{marginLeft: 30}}>
                    <SettingsComponent skeletosState={this.skeletosState} route={this.route.settings} />
                </div>
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}