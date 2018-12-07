import assert = require("assert");

import Argument from "../src/argument";
import { CommandpostError } from "../src/error";

describe("Argument", () => {
    describe("constructor", () => {
        it("parse required argument", () => {
            let arg = new Argument("<foobar>");

            assert(arg.name === "foobar");
            assert(arg.required === true);
            assert(arg.variadic === false);
        });
        it("parse optional argument", () => {
            let arg = new Argument("[foobar]");

            assert(arg.name === "foobar");
            assert(arg.required === false);
            assert(arg.variadic === false);
        });
        it("parse required variadic argument", () => {
            let arg = new Argument("<foobar...>");

            assert(arg.name === "foobar");
            assert(arg.required === true);
            assert(arg.variadic === true);
        });
        it("parse optional variadic argument", () => {
            let arg = new Argument("[foobar...]");

            assert(arg.name === "foobar");
            assert(arg.required === false);
            assert(arg.variadic === true);
        });
    });
    describe("#parse", () => {
        it("parse required argument", () => {
            let arg = new Argument("<foobar>");

            let parsed: any = {};
            arg.parse(parsed, ["abc"]);

            assert(parsed.foobar === "abc");
        });
        it("raise error if can't get required argument", () => {
            let arg = new Argument("<foobar>");

            let parsed: any = {};
            let caught = false;
            try {
                arg.parse(parsed, []);
            } catch (e) {
                caught = true;
                assert(e instanceof Error);
                assert(e instanceof CommandpostError);
                let err = e as CommandpostError;
                assert(err.params.message === "foobar is required");
            }

            assert(caught);
            assert(parsed.foobar == null);
        });
        it("parse optional argument", () => {
            let arg = new Argument("[foobar]");

            let parsed: any = {};
            arg.parse(parsed, ["abc"]);

            assert(parsed.foobar === "abc");
        });
        it("not raise error when can't get optional argument", () => {
            let arg = new Argument("[foobar]");

            let parsed: any = {};
            arg.parse(parsed, []);

            assert(parsed.foobar == null);
        });
        it("parse variadic required argument", () => {
            let arg = new Argument("<foobar...>");

            let parsed: any = {};
            arg.parse(parsed, ["abc", "def"]);

            assert(parsed.foobar.length === 2);
            assert(parsed.foobar[0] === "abc");
            assert(parsed.foobar[1] === "def");
        });
        it("raise error if no argument passed to variadic required argument", () => {
            let arg = new Argument("<foobar...>");

            let parsed: any = {};
            let caught = false;
            try {
                arg.parse(parsed, []);
            } catch (e) {
                caught = true;
            }

            assert(caught);
            assert(parsed.foobar == null);
        });
        it("parse variadic optional argument", () => {
            let arg = new Argument("[foobar...]");

            let parsed: any = {};
            arg.parse(parsed, ["abc", "def"]);

            assert(parsed.foobar.length === 2);
            assert(parsed.foobar[0] === "abc");
            assert(parsed.foobar[1] === "def");
        });
        it("not raise error when can't get optional variadic argument", () => {
            let arg = new Argument("[foobar...]");

            let parsed: any = {};
            arg.parse(parsed, []);

            assert(parsed.foobar instanceof Array);
            assert(parsed.foobar.length === 0);
        });
    });
});
