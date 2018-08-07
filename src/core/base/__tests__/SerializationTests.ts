// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************


// tslint:disable

import {SkeletosDb} from "../SkeletosDb";
import {ConsoleLogger} from "../../helpers/logging/ConsoleLogger";
import {setDefaultLogger} from "../../helpers/logging/DefaultLogger";
import _ = require("lodash");

setDefaultLogger(new ConsoleLogger());

let stringsToTest: string[] = [
    "\\t\"DoubleQuotedName\"",
    "\\\t\n\b\f\r\t\u2028\u2029\"",
    "<Bracket Name>",
    "<script>alert(\"Break This\");</script>",
    "Bob",
    "///String///"
];

describe("SerializationTests", () => {

    it("serialization escaping works correctly", () => {
        const db = new SkeletosDb();

        for (let i = 0; i < stringsToTest.length; i++) {
            db.set([i + ""], stringsToTest[i]);
        }

        const serializedForm = db.serialize();

        // try escape and unescape first
        const escapedForm = _.escape(serializedForm);
        expect(_.unescape(escapedForm)).toBe(serializedForm);

        // now deserialize and check item
        const db2Test = new SkeletosDb();
        db2Test.deserialize(serializedForm);

        for (let i = 0; i < stringsToTest.length; i++) {
            expect(db.get([i + ""])).toBe(stringsToTest[i]);
        }
    });
});