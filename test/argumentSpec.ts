import Argument = require("../lib/argument");

describe("Argument", ()=> {
    describe("constructor", ()=> {
        it("parse required argument", ()=> {
            var arg = new Argument("<foobar>");

            assert(arg.name === "foobar");
            assert(arg.required === true);
            assert(arg.variadic === false);
        });
        it("parse optional argument", ()=> {
            var arg = new Argument("[foobar]");

            assert(arg.name === "foobar");
            assert(arg.required === false);
            assert(arg.variadic === false);
        });
        it("parse required variadic argument", ()=> {
            var arg = new Argument("<foobar...>");

            assert(arg.name === "foobar");
            assert(arg.required === true);
            assert(arg.variadic === true);
        });
        it("parse optional variadic argument", ()=> {
            var arg = new Argument("[foobar...]");

            assert(arg.name === "foobar");
            assert(arg.required === false);
            assert(arg.variadic === true);
        });
    });
    describe("#parse", ()=> {
        it("parse required argument", ()=> {
            var arg = new Argument("<foobar>");

            var parsed:any = {};
            arg.parse(parsed, ["abc"]);

            assert(parsed.foobar === "abc");
        });
        it("raise error if can't get required argument", ()=> {
            var arg = new Argument("<foobar>");

            var parsed:any = {};
            var caught = false;
            try {
                arg.parse(parsed, []);
            } catch (e) {
                caught = true;
            }

            assert(caught);
            assert(parsed.foobar == null);
        });
        it("parse optional argument", ()=> {
            var arg = new Argument("[foobar]");

            var parsed:any = {};
            arg.parse(parsed, ["abc"]);

            assert(parsed.foobar === "abc");
        });
        it("not raise error when can't get optional argument", ()=> {
            var arg = new Argument("[foobar]");

            var parsed:any = {};
            arg.parse(parsed, []);

            assert(parsed.foobar == null);
        });
        it("parse variadic required argument", ()=> {
            var arg = new Argument("<foobar...>");

            var parsed:any = {};
            arg.parse(parsed, ["abc", "def"]);

            assert(parsed.foobar.length === 2);
            assert(parsed.foobar[0] === "abc");
            assert(parsed.foobar[1] === "def");
        });
        it("raise error if no argument passed to variadic required argument", ()=> {
            var arg = new Argument("<foobar...>");

            var parsed:any = {};
            var caught = false;
            try {
                arg.parse(parsed, []);
            } catch (e) {
                caught = true;
            }

            assert(caught);
            assert(parsed.foobar == null);
        });
        it("parse variadic optional argument", ()=> {
            var arg = new Argument("[foobar...]");

            var parsed:any = {};
            arg.parse(parsed, ["abc", "def"]);

            assert(parsed.foobar.length === 2);
            assert(parsed.foobar[0] === "abc");
            assert(parsed.foobar[1] === "def");
        });
        it("not raise error when can't get optional variadic argument", ()=> {
            var arg = new Argument("[foobar...]");

            var parsed:any = {};
            arg.parse(parsed, []);

            assert(parsed.foobar instanceof Array);
            assert(parsed.foobar.length === 0);
        });
    });
});
