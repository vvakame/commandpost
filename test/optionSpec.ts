import assert = require("assert");

import Option from "../src/option";

describe("Option", () => {
    describe("constructor", () => {
        it("parse flags, pattern A", () => {
            let opt = new Option("-C, --chdir <path>");

            assert(opt.short === "-C");
            assert(opt.long === "--chdir");
            assert(opt.required === true);
            assert(opt.optional === false);
            assert(opt.no === true);
            assert(opt.name() === "chdir");
            assert(opt.is("-C") === true);
            assert(opt.is("--chdir") === true);
        });
        it("parse flags, pattern B", () => {
            let opt = new Option("-c, --cheese [type]");

            assert(opt.short === "-c");
            assert(opt.long === "--cheese");
            assert(opt.required === false);
            assert(opt.optional === true);
            assert(opt.no === true);
            assert(opt.name() === "cheese");
            assert(opt.is("-c") === true);
            assert(opt.is("--cheese") === true);
        });
        it("parse flags, pattern C", () => {
            let opt = new Option("-T, --no-tests");

            assert(opt.short === "-T");
            assert(opt.long === "--no-tests");
            assert(opt.required === false);
            assert(opt.optional === false);
            assert(opt.no === false);
            assert(opt.name() === "tests");
            assert(opt.is("-T") === true);
            assert(opt.is("--no-tests") === true);
        });
    });
    describe("#name", () => {
        it("return option name", () => {
            let opt = new Option("-C, --chdir <path>");

            assert(opt.name() === "chdir");
        });
        it("return option name without --long", () => {
            let opt = new Option("-C <path>");

            assert(opt.name() === "-C");
        });
    });
    describe("#is", () => {
        it("detect with --long syntax", () => {
            let opt = new Option("-C, --chdir <path>");

            assert(opt.is("--chdir"));
        });
        it("detect with -s syntax", () => {
            let opt = new Option("-C, --chdir <path>");

            assert(opt.is("-C"));
        });
    });
    describe("#parse", () => {
        it("parse in require", () => {
            let opt = new Option("-C, --chdir <path>");

            let opts: any = {};
            let rest = opt.parse(opts, ["-C", "value", "foo"]);
            assert(opts.chdir.length === 1);
            assert(opts.chdir[0] === "value");
            assert(rest.length === 1);
            assert(rest[0] === "foo");
        });
        it("parse in optional with value", () => {
            let opt = new Option("-C, --chdir [path]");

            let opts: any = {};
            let rest = opt.parse(opts, ["-C", "value", "foo"]);
            assert(opts.chdir.length === 1);
            assert(opts.chdir[0] === "value");
            assert(rest.length === 1);
            assert(rest[0] === "foo");
        });
        it("parse in optional without value", () => {
            let opt = new Option("-C, --chdir [path]");

            let opts: any = {};
            let rest = opt.parse(opts, ["-C"]);
            assert(opts.chdir.length === 1);
            assert(opts.chdir[0] === ""); // TODO is this right?
            assert(rest.length === 0);
        });
        it("property name convert chain case to lower camel case", () => {
            let opt = new Option("--dry-run");

            let opts: any = {};
            opt.parse(opts, ["--dry-run"]);
            assert(opts.dryRun);
        });
        it("property name convert chain case to lower camel case", () => {
            let opt = new Option("--no-exec");

            let opts: any = {};
            opt.parse(opts, ["--no-exec"]);
            assert(opts.exec === false);
        });
    });
});
