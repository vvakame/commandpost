import Option = require("./option");

class Command<T> {
    _description:string;
    _action:(opts:T, rest:string[])=>any;

    _rawArgs:string[];
    _args:string[];
    _rest:string[] = [];

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

    exec():Promise<{}> {
        return Promise.resolve(this._action(this.parsedOpts, this._rest));
    }

    parse(argv:string[]):Promise<{}> {
        var rest = this._processArgs(argv);
        if (rest[0]) {
            var subCommand = this.subCommands.filter(cmd => cmd.is(rest[0]))[0];
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

    is(arg:string) {
        return this.name === arg;
    }
}

export = Command;
