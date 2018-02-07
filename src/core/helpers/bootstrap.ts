/// <reference types="node" />

declare const window: any;

/**
 * ensure that process.env.NODE_ENV is defined somewhere...
 */
export function defineProcessEnv(): void {
    // we only care about non-node.js environments because node.js already has process.env defined.
    if (typeof window !== "undefined") {
        if (typeof process === "undefined") {
            process = {
                env: {
                    NODE_ENV: "development",
                    RENDER_ENV: "client"
                }
            } as any;
        } else if (!process.env) {
            process.env = {
                NODE_ENV: "development",
                RENDER_ENV: "client"
            };
        }
    }
}