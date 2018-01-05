// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************

/// <reference types="async"/>

export type ICommandFunction = (
    prevResultsOrCallback: async.ErrorCallback<Error> | any,
    callback?: async.ErrorCallback<Error>) => any;