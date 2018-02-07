// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import {LoadingState} from "../extendible/LoadingState";
import {ErrorState} from "../extendible/ErrorState";
import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosCursor} from "../base/SkeletosCursor";

/**
 * Convenience super-class for display loading and error indicators in the UI. Use the loading and error props
 * to display loading and error in whichever way in your UI.
 */
export class LoadingAndErrorState extends AbstractSkeletosState {

    get loadingCursor(): SkeletosCursor {
        return this.cursor.select("loading");
    }

    get loading(): LoadingState {
        return new LoadingState(this.loadingCursor);
    }

    get errorCursor(): SkeletosCursor {
        return this.cursor.select("error");
    }

    get error(): ErrorState {
        return new ErrorState(this.errorCursor);
    }
}
