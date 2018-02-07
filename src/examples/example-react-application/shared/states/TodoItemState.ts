import {AbstractSkeletosState, Primitive, State, StateClass, StateRef} from "../../../../core";
import {UserState} from "./UserState";
import {Column, Table} from "../../../../sequelize-decorators";

@Table({name: "todos"})
@StateClass("TodoItemState")
export class TodoItemState extends AbstractSkeletosState {

    @Column()
    @StateRef(() => UserState)
    createdBy: UserState;

    @Column()
    @State(() => UserState)
    assignedTo: UserState;

    @Column()
    @Primitive()
    summary: string;

    @Column()
    @Primitive()
    content: string;
}
