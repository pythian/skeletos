// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import {AbstractSkeletosState} from "./AbstractSkeletosState";
import {SkeletosCursor} from "../base/SkeletosCursor";

/**
 * Convenience class to show loading state in your application.
 */
export class LoadingState extends AbstractSkeletosState {


    /**
     * Convenience method to check if this props is loading.
     */
    isLoading(): boolean {
        return this.loadingCountCursor.exists() && this.loadingCount > 0;
    }

    /**
     * Because multiple actions can be executed asynchronously (for example, multiple server fetches can happen
     * asynchronously), we need a way to track how many times the loading indicator has been called so we don't
     * run into race conditions. For example, if we only had a boolean field to indicate loading, then
     * if one action completes before the other action then we would incorrectly hide the loading, even though we
     * are still loading. By having a numerical field, we avoid that race condition.
     *
     * Use isLoading to figure out if you need to display a loading sign in your UI.
     *
     */
    get loadingCountCursor(): SkeletosCursor {
        return this.cursor.select("loadingCount");
    }

    /**
     * Because multiple actions can be executed asynchronously (for example, multiple server fetches can happen
     * asynchronously), we need a way to track how many times the loading indicator has been called so we don't
     * run into race conditions. For example, if we only had a boolean field to indicate loading, then
     * if one action completes before the other action then we would incorrectly hide the loading, even though we
     * are still loading. By having a numerical field, we avoid that race condition.
     *
     * Use isLoading to figure out if you need to display a loading sign in your UI.
     *
     */
    get loadingCount(): number {
        return this.loadingCountCursor.get();
    }

    /**
     * Because multiple actions can be executed asynchronously (for example, multiple server fetches can happen
     * asynchronously), we need a way to track how many times the loading indicator has been called so we don't
     * run into race conditions. For example, if we only had a boolean field to indicate loading, then
     * if one action completes before the other action then we would incorrectly hide the loading, even though we
     * are still loading. By having a numerical field, we avoid that race condition.
     *
     * Use isLoading to figure out if you need to display a loading sign in your UI.
     *
     */
    set loadingCount(loadingCount: number) {
        this.loadingCountCursor.set(loadingCount);
    }

    /**
     * Helper method to decrement the loading count. Minimum possible value to decrement to is 0. By default, the
     * amount will be decremented by 1, unless an amount is specified.
     */
    decrementLoadingCount(decrementAmount?: number): void {
        // Don't decrement a value that doesn't exist
        if (this.loadingCountCursor.exists()) {
            const amount: number = decrementAmount ? decrementAmount : 1;

            if (amount >= this.loadingCount) {
                this.loadingCount = 0;
            } else {
                this.loadingCount -= amount;
            }
        }
    }

    /**
     * Helper method to increment the loading count. By default, the amount will be incremented by 1, unless an amount
     * is specified.
     */
    incrementLoadingCount(incrementAmount?: number): void {
        const amount: number = incrementAmount ? incrementAmount : 1;

        if (!this.loadingCountCursor.exists()) {
            this.loadingCount = amount;
        } else {
            this.loadingCount += amount;
        }
    }

    /**
     * Show a loading message in the UI.
     *
     * @returns {SkeletosCursor}
     */
    get loadingMessageCursor(): SkeletosCursor {
        return this.cursor.select("loadingMessage");
    }

    /**
     * Show a loading message in the UI.
     *
     * @returns {any}
     */
    get loadingMessage(): string {
        return this.loadingMessageCursor.get();
    }

    /**
     * Show a loading message in the UI.
     *
     * @param loadingMessage
     */
    set loadingMessage(loadingMessage: string) {
        this.loadingMessageCursor.set(loadingMessage);
    }
}