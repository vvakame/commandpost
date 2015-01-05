import Option = require("./option");

import utils = require("./utils");

class Command<T> {
    _description:string;
    _action:(opts:T, rest:string[])=>any;

    _rawArgs:string[];
    _args:string[];
    _rest:string[] = [];
    _help = new Option("-h, --help", "display help");

    parent:Command<any>;
    subCommands:Command<any>[] = [];
    options:Option[] = [];
    parsedOpts:T = <any>{};

    constructor(public name?:string) {
    }

    description(desc:string):Command<T> {
        this._description = desc;
        return this;
    }

    // TODO defaultValue
    option(flags:string, description?:string, defaultValue?:any):Command<T> {
        var option = new Option(flags, description);
        this.options.push(option);
        return this;
    }

    action(fn:(opts:T, rest:string[])=>any):Command<T> {
        this._action = fn;
        return this;
    }

    subCommand<T2>(name:string):Command<T2> {
        var command = new Command<T2>(name);
        command.parent = this;
        this.subCommands.push(command);
        return command;
    }

    is(arg:string) {
        return this.name === arg;
    }

    help(flags:string, description:string) {
        this._help = new Option(flags, description);
        return this;
    }

    helpText():string {
        var result = "";
        // usage part
        result += "  Usage: " + this._description + "\n\n";

        // options part
        if (this.options.length !== 0) {
            result += "  Options:\n\n";
            var optionsMaxLength = utils.maxLength(this.options.map(opt => opt.flags));
            result += this.options.map(opt => {
                var result = "    ";
                result += utils.pad(opt.flags, optionsMaxLength);
                result += "  ";
                result += opt.description || "";
                result += "\n";
                return result;
            }).join("");
            result += "\n\n";
        }

        // sub commands part
        if (this.subCommands.length !== 0) {
            result += "  Commands:\n\n";
            var subCommandsMaxLength = utils.maxLength(this.subCommands.map(cmd => cmd.name));
            result += this.subCommands.map(cmd => {
                var result = "    ";
                result += utils.pad(cmd.name, subCommandsMaxLength);
                result += "  ";
                result += cmd._description || "";
                result += "\n";
                return result;
            }).join("");
            result += "\n\n";
        }

        return result;
    }

    exec():Promise<{}> {
        return Promise.resolve(this._action(this.parsedOpts, this._rest));
    }

    parse(argv:string[]):Promise<{}> {
        var rest = this._processArgs(argv);
        // resolve help action
        if (this._args.some(arg => this._help.is(arg))) {
            // include help option. (help for this command
            process.stdout.write(this.helpText() + '\n');
            process.exit(0);

            return Promise.resolve({});
        }
        var subCommand:Command<any>;
        if (this.parent == null) {
            // only for top level (why? because I can't decide which is natural syntax between `foo help bar buzz` and `foo bar help buzz`.
            if (this._rest.some(arg => this._help.name() === arg)) {
                // include help sub command. (help for deeper level sub command
                if (rest[0]) {
                    subCommand = this.subCommands.filter(cmd => cmd.is(rest[0]))[0];
                    if (subCommand) {
                        process.stdout.write(subCommand.helpText() + '\n');
                        process.exit(0);

                        return Promise.resolve({});
                    }
                }
                // TODO raise error? pass through?
            }
        }

        if (rest[0]) {
            subCommand = this.subCommands.filter(cmd => cmd.is(rest[0]))[0];
            if (subCommand) {
                return subCommand.parse(rest.slice(1));
            }
        }
        return this.exec();
    }

    _processArgs(args:string[]) {
        args = args.slice(0);
        var target:string[] = [];
        var rest:string[] = [];

        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            if (arg === "--") {
                // Honor option terminator
                target = target.concat(args.slice(i));
                break;
            }
            var cmd = this.subCommands.filter(cmd => cmd.is(arg))[0];
            if (cmd) {
                rest = args.slice(i);
                break;
            }
            target.push(arg);
        }

        this._rawArgs = target.slice(0);
        this._args = this._normalize(target);
        this._parseArgs(this._args);

        return rest;
    }

    _parseArgs(args:string[]) {
        args = args.slice(0);
        var rest:string[] = [];
        while (args.length !== 0) {
            var arg = args.shift();
            if (arg === "--") {
                rest = rest.concat(args);
                break;
            }
            var opt = this.options.filter(opt => opt.is(arg))[0];
            if (!opt) {
                rest.push(arg);
                continue;
            }
            args = opt.parse(this.parsedOpts, [arg].concat(args));
        }
        this._rest = rest;
    }

    _normalize(args:string[]):string[] {
        var result:string[] = [];
        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            var lastOpt:Option;
            if (0 < i) {
                lastOpt = this.options.filter(opt => opt.is(args[i - 1]))[0];
            }
            if (arg === "--") {
                // Honor option terminator
                result = result.concat(args.slice(i));
                break;
            } else if (lastOpt && lastOpt.required) {
                result.push(arg);
            } else if (/^-[^-]/.test(arg)) {
                // expand combined short hand option. "-abc" to "-a -b -c"
                arg.slice(1).split("").forEach(c => result.push("-" + c));
            } else if (/^--/.test(arg) && arg.indexOf("=") !== -1) {
                result.push(arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1));
            } else {
                result.push(arg);
            }
        }
        return result;
    }
}

export = Command;
