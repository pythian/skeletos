// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import {AbstractSkeletosState} from "./AbstractSkeletosState";
import {SkeletosCursor} from "../base/SkeletosCursor";

/**
 * Convenience class to include error displaying state in your application.
 */
export class ErrorState extends AbstractSkeletosState {

    /**
     * Is the error being shown in the UI?
     *
     * @returns {SkeletosCursor}
     */
    get isErrorShownCursor(): SkeletosCursor {
        return this.cursor.select("isErrorShown");
    }

    /**
     * Is the error being shown in the UI?
     *
     * @returns {any}
     */
    get isErrorShown(): boolean {
        return this.isErrorShownCursor.get();
    }

    /**
     * Is the error being shown in the UI?
     *
     * @param showError
     */
    set isErrorShown(showError: boolean) {
        this.isErrorShownCursor.set(showError);
    }

    /**
     * What is the title that should be displayed above the error message?
     *
     * @returns {SkeletosCursor}
     */
    get errorTitleCursor(): SkeletosCursor {
        return this.cursor.select("errorTitle");
    }

    /**
     * What is the title that should be displayed above the error message?
     *
     * @returns {any}
     */
    get errorTitle(): string {
        return this.errorTitleCursor.get();
    }

    /**
     * What is the title that should be displayed above the error message?
     *
     * @param title
     */
    set errorTitle(title: string) {
        this.errorTitleCursor.set(title);
    }

    /**
     * What is the main content of the error message?
     *
     * @returns {SkeletosCursor}
     */
    get errorMessageCursor(): SkeletosCursor {
        return this.cursor.select("errorMessage");
    }

    /**
     * What is the main content of the error message?
     *
     * @returns {any}
     */
    get errorMessage(): string {
        return this.errorMessageCursor.get();
    }

    /**
     * What is the main content of the error message?
     *
     * @param message
     */
    set errorMessage(message: string) {
        this.errorMessageCursor.set(message);
    }

    /**
     * Any stack associated with the error.
     *
     * @returns {SkeletosCursor}
     */
    get stackCursor(): SkeletosCursor {
        return this.cursor.select("stack");
    }

    /**
     * Any stack associated with the error.
     *
     * @returns {string}
     */
    get stack(): string {
        return this.stackCursor.get();
    }

    /**
     * Any stack associated with the error.
     *
     * @param stack
     */
    set stack(stack: string) {
        this.stackCursor.set(stack);
    }

    /**
     * Further details about the error.
     *
     */
    get detailsCursor(): SkeletosCursor {
        return this.cursor.select("details");
    }

    /**
     * Further details about the error. This may include a custom object.
     *
     */
    get details(): object|string|number|boolean {
        const details: string = this.detailsCursor.get();
        if (details) {
            return JSON.parse(details);
        } else {
            return details;
        }
    }

    /**
     * Further details about the error.
     *
     */
    set details(details: object|string|number|boolean) {
        if (details) {
            this.detailsCursor.set(JSON.stringify(details));
        } else {
            this.detailsCursor.set(details);
        }
    }
}