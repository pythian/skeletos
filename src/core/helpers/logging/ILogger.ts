import {ELogLevel} from "./ELogLevel";

export interface ILogger {
    error(message: string, meta?: any, req?: any): void;
    warn(message: string, meta?: any, req?: any): void;
    info(message: string, meta?: any, req?: any): void;
    debug(message: string, meta?: any, req?: any): void;
    log(level: ELogLevel, message: string, meta?: any, req?: any): void;
}