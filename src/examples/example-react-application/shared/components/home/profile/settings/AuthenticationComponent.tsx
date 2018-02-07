import * as React from "react";
import {AbstractRouteComponent} from "../../../../../../../react-web-router";
import {DummyUiState} from "../../../../states/DummyUiState";
import {AuthenticationRoute} from "../../../../routes/home/profile/settings/AuthenticationRoute";
import {HomeRoute} from "../../../../routes/HomeRoute";
import {LoadingState} from "../../../../../../../core";

export class AuthenticationComponent extends AbstractRouteComponent<DummyUiState, AuthenticationRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                AuthenticationComponent
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}