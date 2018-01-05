// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
let uniqueIdCounter: number = 0;

// TODO: look into using a third party library that generates more unique and short IDs, such as this one:
// https://www.npmjs.com/package/cuid

export function generateUniqueId(optionalPrefix?: string): string {
    if (!optionalPrefix) {
        optionalPrefix = "";
    } else {
        optionalPrefix += "-";
    }

    let d: number = ++uniqueIdCounter;
    /* tslint:disable */
    const uuid: string = optionalPrefix + "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
        });
    /* tslint:enable */

    return uuid;
}