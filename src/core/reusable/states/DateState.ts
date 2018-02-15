// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import {AbstractSkeletosState} from "../../extendible/AbstractSkeletosState";
import {SkeletosCursor} from "../../base/SkeletosCursor";

/**
 * Represents a state that holds a single Date value. Use this state to build a typed collection
 * using SkeletosList or SkeletosDictionary.
 */
export class DateState extends AbstractSkeletosState {

    /**
     * The value.
     *
     */
    get valueCursor(): SkeletosCursor {
        return this.cursor.select("value");
    }

    /**
     * The value.
     *
     */
    get value(): Date {
        return this.valueCursor.get();
    }

    /**
     * The value.
     *
     */
    set value(value: Date) {
        this.valueCursor.set(value);
    }

}