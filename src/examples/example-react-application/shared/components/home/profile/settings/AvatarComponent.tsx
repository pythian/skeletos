import * as React from "react";
import {AbstractRouteComponent} from "../../../../../../../react-web-router";
import {DummyUiState} from "../../../../states/DummyUiState";
import {HomeRoute} from "../../../../routes/HomeRoute";
import {LoadingState} from "../../../../../../../core";
import {AvatarSettingsRoute} from "../../../../routes/home/profile/settings/AvatarSettingsRoute";

export class AvatarComponent extends AbstractRouteComponent<DummyUiState, AvatarSettingsRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                AvatarComponent
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}