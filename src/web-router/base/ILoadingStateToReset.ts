// This interface is used to track the ref of a particular loading state and to get a snapshot of its loading count.
import {LoadingState} from "../../core";

export interface ILoadingStateToReset {
    loadingState: LoadingState;
    amountToDecrement: number;
}