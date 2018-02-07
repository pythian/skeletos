/**
 * Represents a 404.
 */
export class NotFoundError extends Error {

    constructor(message?: string) {
        super(message);
    }
}