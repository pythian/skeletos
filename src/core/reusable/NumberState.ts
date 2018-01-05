// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import {AbstractSkeletosState} from "../extendible/AbstractSkeletosState";
import {SkeletosCursor} from "../base/SkeletosCursor";

/**
 * Represents a state that holds a single Number value. Use this state to build a typed collection
 * using SkeletosList or SkeletosDictionary.
 */
export class NumberState extends AbstractSkeletosState {

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
    get value(): number {
        return this.valueCursor.get();
    }

    /**
     * The value
     *
     */
    set value(value: number) {
        this.valueCursor.set(value);
    }
}