// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosCursor} from "../base/SkeletosCursor";

/**
 * Represents a state that holds a single Boolean value. Use this state to build a typed collection
 * using SkeletosList or SkeletosDictionary.
 */
export class BooleanState extends AbstractSkeletosState {

    /**
     * The value
     *
     */
    get valueCursor(): SkeletosCursor {
        return this.cursor.select("value");
    }

    /**
     * The value
     *
     */
    get value(): boolean {
        return this.valueCursor.get();
    }

    /**
     * The value
     *
     */
    set value(value: boolean) {
        this.valueCursor.set(value);
    }
}