// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import cuid = require("cuid");

export function generateUniqueId(): string {
    return cuid();
}