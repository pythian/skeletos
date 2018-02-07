import * as React from "react";
import {AbstractRouteComponent} from "../../../../../../react-web-router";
import {DummyUiState} from "../../../states/DummyUiState";
import {TodoRoute} from "../../../routes/home/todos/TodoRoute";
import {HomeRoute} from "../../../routes/HomeRoute";
import {LoadingState} from "../../../../../../core";

export class TodoComponent extends AbstractRouteComponent<DummyUiState, TodoRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                TodoComponent
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}