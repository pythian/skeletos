import _ = require("lodash");
import Url = require("domurl");

/**
 * Utilities to modify URLs.
 */
export class UrlUtils {

    /**
     * Ensures there is only one trailing slash if this is a segment or a URL without a query or hash.
     *
     * With this method you can easily combine multiple segments together without having to worry about adding slashes.
     *
     * E.g.
     *
     * const url = host + UrlUtils.ensureTrailingSlash(segment1) + UrlUtils.ensureTrailingSlash(segment2)
     *
     * @param {string} urlString
     * @returns {string}
     */
    static ensureTrailingSlash(urlString: string): string {
        if (!urlString) {
            return urlString;
        }

        // tslint:disable-next-line
        if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
            const url: Url = new Url(urlString);
            // don't do anything if we have a query or hash.
            if ((url.query && url.query.length > 0) || (url.hash && url.hash.length > 0)) {
                return urlString;
            }
        }

        return _.trim(urlString, "/") + "/";
    }
}