import {AbstractSkeletosState} from "../../core";

/**
 * Allows you to ask the user a message and give them an option to stay on the page.
 *
 * This is a synchronous method. A read-only rootState will be supplied, and a return value of either string or null
 * can be supplied. If a string is supplied, this is the message that will be shown to the user.
 */
export type IClientPromptLeavePageListener =
    <RootStateType extends AbstractSkeletosState>(rootState: RootStateType) => string|null;