import path = require("path");
import fs = require("fs");

export class FilePathUtils {

    /**
     * Searches for the given relative path starting from the fromDir and walking upwards
     * until the root has been reached.
     *
     * @param {string} fromDir
     * @param {string} path
     * @returns {string}
     */
    static searchForPath(fromDir: string, searchForRelativePath: string): string {
        let absolutePath: string = path.resolve(fromDir);
        const rootPath: string = path.parse(absolutePath).root;
        let lastPath: string = null;
        let retVal: string;
        let found: boolean = false;

        while (absolutePath !== rootPath) {
            retVal = path.resolve(absolutePath, searchForRelativePath);
            if (fs.existsSync(retVal)) {
                found = true;
                break;
            } else {
                lastPath = absolutePath;
                absolutePath = path.resolve(absolutePath, "../");
            }
        }

        if (found) {
            return retVal;
        } else {
            // we did not actually check the root path. Check that before we throw in the towel.
            retVal = path.resolve(rootPath, searchForRelativePath);
            if (fs.existsSync(retVal)) {
                return retVal;
            } else {
                return null;
            }
        }
    }

    /**
     * Given an environment variable that is a path, returns this environment
     * variable as an absolute path. For example, if the environment variable is a:
     *
     * - Absolute path, then returns the environment variable as is
     * - Relative path, then returns the environment variable as the absolute path relative to the given directory.
     *
     * @param {string} envVarKey
     * @returns {string}
     */
    static getAsAbsolutePath(inputPath: string, relativeDir: string): string {
        if (!inputPath) {
            return null;
        } else if (path.isAbsolute(inputPath)) {
            return inputPath;
        } else {
            return path.resolve(relativeDir, inputPath);
        }
    }
}
