import * as React from "react";
import {AbstractRouteComponent} from "../../../../../../react-web-router";
import {DummyUiState} from "../../../states/DummyUiState";
import {UsersRoute} from "../../../routes/home/UsersRoute";
import {HomeRoute} from "../../../routes/HomeRoute";
import {LoadingState} from "../../../../../../core";

export class UserComponent extends AbstractRouteComponent<DummyUiState, UsersRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                UserComponent
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}