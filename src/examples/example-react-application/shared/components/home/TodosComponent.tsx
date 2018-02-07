import {AbstractRouteComponent} from "../../../../../react-web-router";
import {HomeRoute} from "../../routes/HomeRoute";
import {LoadingState} from "../../../../../core";
import {TodosRoute} from "../../routes/home/TodosRoute";
import {DummyUiState} from "../../states/DummyUiState";
import * as React from "react";
import {TodoComponent} from "./todos/TodoComponent";

export class TodosComponent extends AbstractRouteComponent<DummyUiState, TodosRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                TodosComponent (Todo ID: {this.route.todoId})
                <div style={{marginLeft: 30}}>
                    <TodoComponent skeletosState={this.skeletosState} route={this.route.todo} />
                </div>
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}