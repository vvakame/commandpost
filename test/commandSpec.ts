import * as assert from "power-assert";

import Command from "../lib/command";

describe("Command", () => {
    describe("#subCommand", () => {
        it("create sub command", () => {
            let cmd = new Command("test");
            let remote = cmd.subCommand("remote");

            assert(cmd.name === "test");
            assert(cmd.parent == null);
            assert(cmd.subCommands.length === 1);
            assert(cmd.subCommands[0] === remote);

            assert(remote.name === "remote");
            assert(remote.parent === cmd);
            assert(remote.subCommands.length === 0);
        });
    });
    describe("#allowUnknownOption", () => {
        it("not allowed unknown option default", () => {
            let cmd = new Command("test");
            return cmd
                .parse(["--unknown"])
                .then(() => {
                    throw new Error("expected error is not raised");
                }, () => {
                    return true;
                });
        });
        it("allowed unknown option if allowUnknownOption() called", () => {
            let cmd = new Command("test");
            return cmd
                .allowUnknownOption()
                .action(() => {
                    false;
                })
                .parse(["--unknown"]);
        });
    });
    describe("#parse", () => {
        it("parse args with single value", () => {
            let cmd = new Command("test");
            cmd.option("-r, --replace");

            let remote = cmd.subCommand<{ config: string[]; }, {}>("remote");
            remote.option("-c, --config <file>");
            remote.action(opts => {
                assert(opts.config.length === 1);
                assert(opts.config[0] === "hoge.json");
            });

            return cmd.parse(["-r", "remote", "-c", "hoge.json", "piyo.txt"]);
        });
        it("parse args with multiple value", () => {
            let cmd = new Command("test");
            cmd.option("-r, --replace");

            let remote = cmd.subCommand<{ config: string[]; }, {}>("remote");
            remote.option("-c, --config <file>");
            remote.action(opts => {
                assert(opts.config.length === 3);
                assert(opts.config[0] === "hoge.json");
                assert(opts.config[1] === "fuga.json");
                assert(opts.config[2] === "piyo.json");
            });

            return cmd.parse(["-r", "remote", "-c", "hoge.json", "-c", "fuga.json", "--config=piyo.json", "foo.txt"]);
        });
    });
    describe("#_parseRawArgs", () => {
        it("parse args without sub command", () => {
            let cmd = new Command("test");
            cmd.option("-r, --replace");
            cmd.option("-c");

            let rest = cmd._parseRawArgs(["-r", "remote", "-c", "hoge.json", "piyo.txt"]);

            assert(cmd._args.length === 5);
            assert(cmd._args[0] === "-r");

            assert(rest.length === 0);
        });
        it("parse args with sub command", () => {
            let cmd = new Command("test");
            cmd.option("-r, --replace");

            let remote = cmd.subCommand("remote");
            remote.option("-c, --config <file>");

            let rest = cmd._parseRawArgs(["-r", "remote", "-c", "hoge.json", "piyo.txt"]);

            assert(cmd._args.length === 1);
            assert(cmd._args[0] === "-r");

            assert(rest.length === 4);
            assert(rest[0] === "remote");
        });
        it("parse args with normalized", () => {
            let cmd = new Command("test");
            cmd.option("-a");
            cmd.option("-b");
            cmd.option("-c");

            cmd._parseRawArgs(["-abc"]);

            assert(cmd._args.length === 3);
            assert(cmd._args[0] === "-a");
            assert(cmd._args[1] === "-b");
            assert(cmd._args[2] === "-c");
        });
        it("parse args with --", () => {
            let cmd = new Command("test");
            cmd.option("-r, --replace [file]");

            cmd._parseRawArgs(["-r", "hoge.json", "fuga.json", "-r", "--", "piyo.json"]);

            assert(cmd._args.length === 6);
            assert(cmd._args[0] === "-r");
            assert(cmd._args[1] === "hoge.json");
            assert(cmd._args[2] === "fuga.json");
            assert(cmd._args[3] === "-r");
            assert(cmd._args[4] === "--");
            assert(cmd._args[5] === "piyo.json");

            assert(cmd._rest.length === 2);
            assert(cmd._rest[0] === "fuga.json");
            assert(cmd._rest[1] === "piyo.json");
        });
    });
    describe("#_parseOptions", () => {
        it("parse opts", () => {
            let cmd = new Command("test");
            cmd.option("-a, --alpha-value", "", false);
            cmd.option("-b, --beta-value", "", false);

            let rest = cmd._parseOptions(["-a"]);

            assert((cmd.parsedOpts as any)["alphaValue"] === true);
            assert((cmd.parsedOpts as any)["betaValue"] === false);
            assert(rest.length === 0);
        });
    });
    describe("#helpText", () => {
        it("construct humanreadable text", () => {
            let cmd = new Command("test");
            cmd.description("this is command description");
            cmd.option("-r, --replace [file]");

            let text = cmd.helpText().trim();
            let expect = `
this is command description

  Usage: test [options] 

  Options:

    -r, --replace [file]
                            `.trim();
            assert(text === expect);
        });
    });
});
