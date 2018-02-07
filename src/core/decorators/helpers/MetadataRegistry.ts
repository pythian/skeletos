import _ = require("lodash");
import {AbstractSkeletosState} from "../../extendible/AbstractSkeletosState";

export class MetadataRegistry {

    static constructorDict: _.Dictionary<typeof AbstractSkeletosState> = {};
}