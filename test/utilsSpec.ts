import * as assert from "power-assert";

import utils = require("../lib/utils");

describe("utils", () => {
    describe("pad", () => {
        it("not padding if satisfied", () => {
            assert(utils.pad("foobar", 5) === "foobar");
        });
        it("padding shortage char", () => {
            assert(utils.pad("foobar", 10) === "foobar    ");
        });
        it("padding shortage char with specific har", () => {
            assert(utils.pad("foobar", 10, "+") === "foobar++++");
        });
    });
    describe("chainToLowerCamelCase", () => {
        it("convert chain case to lower camel case", () => {
            assert(utils.chainToLowerCamelCase("foo-bar") === "fooBar");
        });
    });
});
