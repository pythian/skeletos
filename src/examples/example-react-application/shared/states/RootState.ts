import {AbstractSkeletosState, Primitive, State, StateClass} from "../../../../core";
import {RootDataState} from "./RootDataState";
import {HomeRoute} from "../routes/HomeRoute";
import {DummyUiState} from "./DummyUiState";

@StateClass("RootState")
export class RootState extends AbstractSkeletosState {


    @State(() => RootDataState)
    data: RootDataState;

    @State(() => HomeRoute)
    route: HomeRoute;

    @State(() => DummyUiState)
    ui: DummyUiState;

    @Primitive()
    loadedSync: string;

    @Primitive()
    loadedAsync: string;

    @Primitive()
    loadedTreeSync: string;

    @Primitive()
    loadedTreeAsync: string;
}