import {HomeRoute} from "../../routes/HomeRoute";
import {TodosRoute} from "../../routes/home/TodosRoute";
import {DummyUiState} from "../../states/DummyUiState";
import * as React from "react";
import {TodoComponent} from "./todos/TodoComponent";
import {AbstractDummyComponent} from "../AbstractDummyComponent";

export class TodosComponent extends AbstractDummyComponent<DummyUiState, TodosRoute, HomeRoute> {
    protected getComponentName(): string {
        if (this.canRender() && this.route.todoId) {
            return `TodosComponent (Todo ID: ${this.route.todoId})`;
        } else {
            return "TodosComponent";
        }
    }

    protected getSubComponents(): JSX.Element | JSX.Element[] {
        return <TodoComponent skeletosState={this.skeletosState} route={this.route.todo} />;
    }


}