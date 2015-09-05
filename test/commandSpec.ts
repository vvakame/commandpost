import Command from "../lib/command";

describe("Command", () => {
    describe("#subCommand", () => {
        it("create sub command", () => {
            var cmd = new Command("test");
            var remote = cmd.subCommand("remote");

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
            var cmd = new Command("test");
            return cmd
                .parse(["--unknown"])
                .then(() => {
                    throw new Error("expected error is not raised");
                }, () => {
                    return true;
                });
        });
        it("allowed unknown option if allowUnknownOption() called", () => {
            var cmd = new Command("test");
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
            var cmd = new Command("test");
            cmd.option("-r, --replace");

            var remote = cmd.subCommand<{ config: string[]; }, {}>("remote");
            remote.option("-c, --config <file>");
            remote.action((opts, rest) => {
                assert(opts.config.length === 1);
                assert(opts.config[0] === "hoge.json");
            });

            return cmd.parse(["-r", "remote", "-c", "hoge.json", "piyo.txt"]);
        });
        it("parse args with multiple value", () => {
            var cmd = new Command("test");
            cmd.option("-r, --replace");

            var remote = cmd.subCommand<{ config: string[]; }, {}>("remote");
            remote.option("-c, --config <file>");
            remote.action((opts, rest) => {
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
            var cmd = new Command("test");
            cmd.option("-r, --replace");
            cmd.option("-c");

            var rest = cmd._parseRawArgs(["-r", "remote", "-c", "hoge.json", "piyo.txt"]);

            assert(cmd._args.length === 5);
            assert(cmd._args[0] === "-r");

            assert(rest.length === 0);
        });
        it("parse args with sub command", () => {
            var cmd = new Command("test");
            cmd.option("-r, --replace");

            var remote = cmd.subCommand("remote");
            remote.option("-c, --config <file>");

            var rest = cmd._parseRawArgs(["-r", "remote", "-c", "hoge.json", "piyo.txt"]);

            assert(cmd._args.length === 1);
            assert(cmd._args[0] === "-r");

            assert(rest.length === 4);
            assert(rest[0] === "remote");
        });
        it("parse args with normalized", () => {
            var cmd = new Command("test");
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
            var cmd = new Command("test");
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
});
