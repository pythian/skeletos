// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import _ = require("lodash");
import {AbstractProgressAction, LoadingState, SimpleSkeletosAction, SkeletosCursor} from "../../";

/**
 * This action decrements each loading state's loading count be an amount to decremented that was recorded in
 * BrowserHistorySyncAction.
 */
export class ResetLoadingStatesAction extends SimpleSkeletosAction {

    private _loadingStatesToReset: ILoadingStateToReset[];

    constructor(rootCursor: SkeletosCursor, loadingStatesToReset: ILoadingStateToReset[]) {
        super(rootCursor);
        this._loadingStatesToReset = loadingStatesToReset;
    }

    protected doExecute(): void {
        if (!_.isNil(this._loadingStatesToReset)) {
            _.forEach(
                this._loadingStatesToReset,
                (loadingState: ILoadingStateToReset) => {
                    const state: LoadingState = new LoadingState(loadingState.loadingState, this.transaction);
                    state.decrementLoadingCount(loadingState.amountToDecrement);
                }
            );
        }

        if (process.env.RENDER_ENV !== "server") {
            // Complete the global progress bar
            if (AbstractProgressAction.globalCompleteProgressBarFn) {
                AbstractProgressAction.globalCompleteProgressBarFn();
            }
        }
    }
}

/**
 * This interface is used to track the ref of a particular loading state and to get a snapshot of its loading count.
 */
export interface ILoadingStateToReset {
    loadingState: LoadingState;
    amountToDecrement: number;
}