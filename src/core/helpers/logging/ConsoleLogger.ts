import {ILogger} from "./ILogger";
import {inspect} from "util";
import {ELogLevel} from "./ELogLevel";

export class ConsoleLogger implements ILogger {

    constructor() {
        // do nothing
    }

    error(message: string, meta?: any): void {
        // tslint:disable-next-line:no-console
        console.error(this.combineIntoString(message, meta));
    }

    warn(message: string, meta?: any): void {
        // tslint:disable-next-line:no-console
        if (console.warn) {
            // tslint:disable-next-line:no-console
            console.warn(this.combineIntoString(message, meta));
        } else {
            // tslint:disable-next-line:no-console
            console.log(this.combineIntoString(message, meta));
        }
    }

    info(message: string, meta?: any): void {
        // tslint:disable-next-line:no-console
        console.log(this.combineIntoString(message, meta));
    }

    debug(message: string, meta?: any): void {
        // tslint:disable-next-line:no-console
        console.log(this.combineIntoString(message, meta));
    }

    log(level: ELogLevel, message: string, meta?: any): void {
        switch (level) {
            case ELogLevel.error:
                this.error(message, meta);
                break;
            case ELogLevel.warn:
                this.warn(message, meta);
                break;
            case ELogLevel.info:
                this.info(message, meta);
                break;
            case ELogLevel.debug:
                this.debug(message, meta);
                break;
            default:
                this.error(message, meta);
                break;
        }
    }

    private combineIntoString(message: string, meta?: any): string {
        if (meta) {
            return `${message} meta:${inspect(meta)}`;
        }

        return message;
    }

}

export function getConsoleLogger(): ILogger {
    return new ConsoleLogger();
}
