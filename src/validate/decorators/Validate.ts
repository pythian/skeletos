// tslint:disable-next-line
///<reference path="../helpers/joi.d.ts"/>

import _ = require("lodash");
import Joi = require("joi-full");
import {AbstractSkeletosState, PropTypeInfo} from "../../core";

export const VALIDATE_PROP_KEY: string = "skeletos-validate.IValidationInfo";


export interface IRule {
    name: string;
    arg: string | number;
}

export interface IDescribeSchema {
    type: string;
    flags: {
        presence: "required" | "optional";
        trim: boolean;
    };
    label: string;
    description: string;
    notes: string[];
    tags: string[];
    meta: string[];
    examples: any[];
    unit: string;
    valids: string[];
    invalids: string[];
    rules: IRule[];
}

export interface IInternalValidationOptions {
    schema: Joi.Schema;
    description: IDescribeSchema;
}

export interface IValidationContext {
    property?: string;
}

/**
 * Decorator to mark a property to be validated before setting it.
 *
 * @param joi the validation rules for Joi.
 */
export function Validate(validation: Joi.Schema | ((joi: Joi) => Joi.Schema)) {
    return function ValidateDecorator(target: AbstractSkeletosState, propertyKey: string): void {

        const oldPropertyDescriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey);

        let joi: Joi.Schema;
        if (_.isFunction(validation)) {
            joi = validation(Joi);
        } else {
            joi = validation as any;
        }

        const typeInfo: PropTypeInfo = PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey);
        typeInfo
            .putExtension(VALIDATE_PROP_KEY, {
                schema: joi,
                description: joi.describe()
            } as IInternalValidationOptions);

        // property setter
        const setter: (v: any) => void = function(newVal: any): void {
            const {error, value} = Joi.validate(newVal, joi);
            if (error) {
                if (error.details && error.details.length > 0) {
                    error.details[0].path =
                        this.cursor.select(typeInfo.nameOfCursor).path.join("/");

                    let context: IValidationContext = error.details[0].context;
                    if (!context) {
                        context = {};
                    }
                    context.property = propertyKey;

                    error.details[0].context = context;
                }
                throw error;
            }
            if (oldPropertyDescriptor && oldPropertyDescriptor.set) {
                oldPropertyDescriptor.set.call(this, value);
            }
        };

        // Delete property.
        if (delete target[propertyKey]) {

            // Create new property with getter and setter
            Object.defineProperty(
                target, propertyKey, {
                    get: oldPropertyDescriptor ? oldPropertyDescriptor.get : undefined,
                    set: setter,
                    enumerable: true,
                    configurable: true
                }
            );
        }
    };
}