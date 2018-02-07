// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************

/// <reference types="async"/>

/**
 * A command is something that can be run by an action. It is the smallest piece of executable code in the Skeletos
 * framework.
 *
 * Typically, you do not need to implement this interface yourself. You can simply call the functions:
 *
 * 1. AbstractAction.callFunctionSynchronously(mySyncFunc)
 * 2. AbstractAction.callFunctionAsynchronously(myAsyncFunc)
 * 3. AbstractAction.callAnotherAction(myAction)
 *
 * And these functions will return an ISkeletosCommand for the action to execute.
 */
export type ISkeletosCommand = (
    prevResultsOrCallback: async.ErrorCallback<Error> | any,
    callback?: async.ErrorCallback<Error>) => any;