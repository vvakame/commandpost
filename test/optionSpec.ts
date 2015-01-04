import Option = require("../lib/option");

describe("Option", ()=> {
    describe("constructor", ()=> {
        it("parse flags, pattern A", ()=> {
            var opt = new Option("-C, --chdir <path>");

            assert(opt.short === "-C");
            assert(opt.long === "--chdir");
            assert(opt.required === true);
            assert(opt.optional === false);
            assert(opt.bool === true);
            assert(opt.name() === "chdir");
            assert(opt.is("-C") === true);
            assert(opt.is("--chdir") === true);
        });
        it("parse flags, pattern B", ()=> {
            var opt = new Option("-c, --cheese [type]");

            assert(opt.short === "-c");
            assert(opt.long === "--cheese");
            assert(opt.required === false);
            assert(opt.optional === true);
            assert(opt.bool === true);
            assert(opt.name() === "cheese");
            assert(opt.is("-c") === true);
            assert(opt.is("--cheese") === true);
        });
        it("parse flags, pattern C", ()=> {
            var opt = new Option("-T, --no-tests");

            assert(opt.short === "-T");
            assert(opt.long === "--no-tests");
            assert(opt.required === false);
            assert(opt.optional === false);
            assert(opt.bool === false);
            assert(opt.name() === "tests");
            assert(opt.is("-T") === true);
            assert(opt.is("--no-tests") === true);
        });
    });
    describe("#name", ()=> {
        it("return option name", ()=> {
            var opt = new Option("-C, --chdir <path>");

            assert(opt.name() === "chdir");
        });
        it("return option name without --long", ()=> {
            var opt = new Option("-C <path>");

            assert(opt.name() === "-C");
        });
    });
    describe("#is", ()=> {
        it("detect with --long syntax", ()=> {
            var opt = new Option("-C, --chdir <path>");

            assert(opt.is("--chdir"));
        });
        it("detect with -s syntax", ()=> {
            var opt = new Option("-C, --chdir <path>");

            assert(opt.is("-C"));
        });
    });
    describe("#parse", ()=> {
        it("parse in require", ()=> {
            var opt = new Option("-C, --chdir <path>");

            var opts:any = {};
            var rest = opt.parse(opts, ["-C", "value", "foo"]);
            assert(opts.chdir.length === 1);
            assert(opts.chdir[0] === "value");
            assert(rest.length === 1);
            assert(rest[0] === "foo");
        });
        it("parse in optional with value", ()=> {
            var opt = new Option("-C, --chdir [path]");

            var opts:any = {};
            var rest = opt.parse(opts, ["-C", "value", "foo"]);
            assert(opts.chdir.length === 1);
            assert(opts.chdir[0] === "value");
            assert(rest.length === 1);
            assert(rest[0] === "foo");
        });
        it("parse in optional without value", ()=> {
            var opt = new Option("-C, --chdir [path]");

            var opts:any = {};
            var rest = opt.parse(opts, ["-C"]);
            assert(opts.chdir.length === 1);
            assert(opts.chdir[0] === ""); // TODO is this right?
            assert(rest.length === 0);
        });
    });
});
