import {ILogger} from "./ILogger";
import {inspect} from "util";
import {ELogLevel} from "./ELogLevel";
import {ErrorUtil} from "./ErrorUtil";

export class ConsoleLogger implements ILogger {

    constructor() {
        // do nothing
    }

    error(message: string|Error, context?: any): void {
        // tslint:disable-next-line:no-console
        console.error(this.combineIntoString(message, context));
    }

    warn(message: string|Error, context?: any): void {
        // tslint:disable-next-line:no-console
        if (console.warn) {
            // tslint:disable-next-line:no-console
            console.warn(this.combineIntoString(message, context));
        } else {
            // tslint:disable-next-line:no-console
            console.log(this.combineIntoString(message, context));
        }
    }

    info(message: string|Error, context?: any): void {
        // tslint:disable-next-line:no-console
        console.log(this.combineIntoString(message, context));
    }

    debug(message: string|Error, context?: any): void {
        // tslint:disable-next-line:no-console
        console.log(this.combineIntoString(message, context));
    }

    log(level: ELogLevel, message: string|Error, context?: any): void {
        switch (level) {
            case ELogLevel.error:
                this.error(message, context);
                break;
            case ELogLevel.warn:
                this.warn(message, context);
                break;
            case ELogLevel.info:
                this.info(message, context);
                break;
            case ELogLevel.debug:
                this.debug(message, context);
                break;
            default:
                this.error(message, context);
                break;
        }
    }

    private combineIntoString(message: string|Error, context?: any): string {
        const strMessage: string = ErrorUtil.stringify(message);
        if (context) {
            return `${strMessage} meta:${inspect(context)}`;
        }

        return strMessage;
    }

}

export function getConsoleLogger(): ILogger {
    return new ConsoleLogger();
}
