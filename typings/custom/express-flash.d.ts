/// <reference types="express" />

/* tslint:disable */
declare module Express {
    export interface Request {
        flash(message: string): any;
        flash(event: string, message: string): any;
    }
}

declare module "express-flash" {
    import express = require("express");
    interface IExpressFlashOptions {
        unsafe?: boolean;
    }
    function e(options?: IExpressFlashOptions): express.RequestHandler;
    export = e;
}