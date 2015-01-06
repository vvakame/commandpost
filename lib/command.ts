import Option = require("./option");

import utils = require("./utils");

class Command<Opt,Arg> {
    _description:string;
    _action:(opts:Opt, args:Arg, rest:string[])=>any;

    _rawArgs:string[];
    _args:string[];
    _rest:string[] = [];
    _usage:string;
    _help = new Option("-h, --help", "display help");

    name:string;
    parameters:{ name:string; required:boolean; variadic: boolean; }[];
    parent:Command<any,any>;
    subCommands:Command<any,any>[] = [];
    options:Option[] = [];
    parsedOpts:Opt = <any>{};
    parsedParams:Arg = <any>{};

    constructor(name = "") {
        var args = name.split(/\s+/);
        this.name = args.shift();
        var findOptional = false;
        var findVariadic = false;
        this.parameters = args.map(arg => {
            if (findVariadic) {
                throw new Error("parameter is not placed after variadic parameter");
            }
            var result:{ name:string; required:boolean; variadic: boolean; } = <any>{};
            switch (arg.charAt(0)) {
                case '<':
                    if (findOptional) {
                        throw new Error("required parameter is not placed after optional parameter");
                    }
                    result.required = true;
                    result.name = arg.slice(1, -1);
                    break;
                case '[':
                    result.name = arg.slice(1, -1);
                    findOptional = true;
                    break;
                default:
                    throw new Error("unsupported format: " + arg);
            }
            if (/\.\.\.$/.test(result.name)) {
                result.name = result.name.slice(0, -3);
                result.variadic = true;
                findVariadic = true;
            }
            return result;
        });
    }

    description(desc:string):Command<Opt,Arg> {
        this._description = desc;
        return this;
    }

    usage(usage:string):Command<Opt,Arg> {
        this._usage = usage;
        return this;
    }

    // TODO defaultValue
    option(flags:string, description?:string, defaultValue?:any):Command<Opt,Arg> {
        var option = new Option(flags, description);
        this.options.push(option);
        return this;
    }

    action(fn:(opts:Opt, args:Arg, rest:string[])=>any):Command<Opt,Arg> {
        this._action = fn;
        return this;
    }

    subCommand<Opt2,Arg2>(name:string):Command<Opt2, Arg2> {
        var command = new Command<Opt2,Arg2>(name);
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
        result += "  Usage: ";
        if (this._usage != null) {
            result += this._usage;
        } else {
            result += this._getAncestorsWithMe().map(cmd => cmd.name).join(" ") + " ";
            if (this.options.length !== 0) {
                result += "[options] ";
            }
            if (this.subCommands.length !== 0) {
                result += "[command] ";
            }
            if (this.parameters.length !== 0) {
                result += this.parameters.map(param => {
                    if (param.required) {
                        return "<" + param.name + (param.variadic ? "..." : "") + ">";
                    } else {
                        return "[" + param.name + (param.variadic ? "..." : "") + "]";
                    }
                }).join(" ");
            }
        }
        // TODO humanReadableArgName
        result += "\n\n";

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
        return Promise.resolve(this._action(this.parsedOpts, this.parsedParams, this._rest));
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
        var subCommand:Command<any,any>;
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

    _getAncestorsWithMe():Command<any,any>[] {
        if (!this.parent) {
            return [this];
        } else {
            return this.parent._getAncestorsWithMe().concat([this]);
        }
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
        this._rest = this._parseArgs(this._args);
        this._rest = this._parseParameters(this._rest);

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
        return rest;
    }

    _parseParameters(rest:string[]) {
        rest = rest.slice(0);
        this.parameters.forEach(param => {
            if (param.variadic) {
                (<any>this.parsedParams)[param.name] = rest;
                rest = [];
            }
            var arg = rest.shift();
            if (param.required && !arg) {
                // TODO
                throw new Error(param.name + " is required");
            }
            (<any>this.parsedParams)[param.name] = arg;
        });
        return rest;
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
