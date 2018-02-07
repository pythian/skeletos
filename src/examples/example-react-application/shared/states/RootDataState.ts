import {AbstractSkeletosState, Dictionary, SkeletosDictionary, StateClass} from "../../../../core";
import {UserState} from "./UserState";
import {TodoItemState} from "./TodoItemState";

@StateClass("RootDataState")
export class RootDataState extends AbstractSkeletosState {

    @Dictionary(() => UserState)
    users: SkeletosDictionary<UserState>;

    @Dictionary(() => TodoItemState)
    todos: SkeletosDictionary<TodoItemState>;


}