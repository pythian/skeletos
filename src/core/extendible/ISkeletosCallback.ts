// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************

/// <reference types="async"/>

/**
 * A generic callback interface
 */
export type ISkeletosCallback<T> = (results: T, callback?: async.ErrorCallback<Error>) => void;