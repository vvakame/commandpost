import Option from "./option";
import Argument from "./argument";
import { CommandpostError, ErrorReason } from "./error";

import * as utils from "./utils";

// jsdoc, see constructor.
export default class Command<Opt, Arg> {
    /**
     * @private
     */
    _description?: string;
    /**
     * @private
     */
    _usage?: string;
    /**
     * @private
     */
    _help = new Option("-h, --help", "display help");
    /**
     * @private
     */
    _version?: Option;
    /**
     * @private
     */
    _versionStr?: string;
    /**
     * @private
     */
    _action: (opts: Opt, args: Arg, rest: string[]) => any;

    /**
     * e.g. -abc --foo bar
     * @private
     */
    _rawArgs?: string[];
    /**
     * e.g. -a -b -c --foo bar
     * @private
     */
    _args?: string[];
    /**
     * Command alias
     * @private
     */
    _alias?: string;

    /**
     * e.g. bar
     * @private
     */
    _rest: string[] = [];

    /**
     * @private
     */
    _allowUnknownOption?: boolean;

    /**
     * parent command.
     */
    parent?: Command<any, any>;
    /**
     * name of this command.
     */
    name: string;

    /**
     * e.g.
     * ```
     *   git -p clone git@github.com:vvakame/dtsm.git
     *       ↑ this!
     * ```
     * @type {Array}
     */
    options: Option[] = [];
    /**
     * e.g.
     * ```
     *   git -p clone git@github.com:vvakame/dtsm.git
     *          ↑ this!
     * ```
     * @type {Array}
     */
    subCommands: Command<any, any>[] = [];
    /**
     * e.g.
     * ```
     *   git -p clone git@github.com:vvakame/dtsm.git
     *                ↑ this!
     * ```
     * @type {Array}
     */
    args: Argument[];

    /**
     * parsed option values.
     * @type {any}
     */
    parsedOpts: Opt = <any>{};
    /**
     * parsed option arguments.
     * @type {any}
     */
    parsedArgs: Arg = <any>{};

    /**
     * unknown options.
     * @type {Array}
     */
    unknownOptions: string[] = [];

    /**
     * class of command.
     * ```
     * cmd -v sub --path foo/bar buzz.txt
     *        ↑ this one!
     * ```
     * @param name name and flags pass flags pass 'foo'(sub command) or 'foo <bar>'(sub command & required argument) or 'foo [bar]'(sub command & optional argument) or 'foo <bar...>'(sub command & required variadic argument) or 'foo [bar...]'(sub command & optional variadic argument).
     * @class
     */
    constructor(name: string) {
        let args = name.split(/\s+/);
        this.name = args.shift()!;

        let findOptional = false;
        let findVariadic = false;
        this.args = args.map(argStr => {
            if (findVariadic) {
                throw new CommandpostError({
                    parts: [argStr],
                    message: "parameter can not placed after variadic parameter",
                    reason: ErrorReason.ParameterCantPlacedAfterVariadic,
                });
            }
            let arg = new Argument(argStr);
            if (arg.required && findOptional) {
                throw new CommandpostError({
                    parts: [argStr],
                    message: "parameter can not placed after variadic parameter",
                    reason: ErrorReason.ParameterCannPlacedAfterOptional,
                });
            }
            if (!arg.required) {
                findOptional = true;
            }
            if (arg.variadic) {
                findVariadic = true;
            }
            return arg;
        });

        this._action = () => {
            process.stdout.write(this.helpText() + "\n");
        };
    }

    /**
     * set command alias.
     * @param alias
     * @returns {Command}
     * @method
     */
    alias(alias: string): Command<Opt, Arg> {
        this._alias = alias;
        return this;
    }

    /**
     * set description for this command.
     * @param desc
     * @returns {Command}
     * @method
     */
    description(desc: string): Command<Opt, Arg> {
        this._description = desc;
        return this;
    }

    /**
     * set usage for this command.
     * @param usage
     * @returns {Command}
     * @method
     */
    usage(usage: string): Command<Opt, Arg> {
        this._usage = usage;
        return this;
    }

    /**
     * add option for this command.
     * see {@link Option}.
     * @param flags
     * @param description
     * @param defaultValue
     * @returns {Command}
     */
    option(flags: string, description?: string, defaultValue?: any): Command<Opt, Arg> {
        let option = new Option(flags, description, defaultValue);
        this.options.push(option);
        return this;
    }

    /**
     * allow unknown option.
     * by default, An error occured if unknown option is included.
     * @param flag
     * @returns {Command}
     */
    allowUnknownOption(flag = true): Command<Opt, Arg> {
        this._allowUnknownOption = flag;
        return this;
    }

    /**
     * add action at this command selected.
     * @param fn
     * @returns {Command}
     */
    action(fn: (opts: Opt, args: Arg, rest: string[]) => any): Command<Opt, Arg> {
        this._action = fn;
        return this;
    }

    /**
     * create sub command.
     * @param name
     * @returns {Command<Opt2, Arg2>} new command instance
     */
    subCommand<Opt2, Arg2>(name: string): Command<Opt2, Arg2> {
        let command = new Command<Opt2, Arg2>(name);
        command.parent = this;
        this.subCommands.push(command);
        return command;
    }

    /**
     * check arg is matches this command.
     * @param arg
     * @returns {boolean}
     */
    is(arg: string) {
        return this.name === arg || this._alias === arg;
    }

    /**
     * add help this option.
     * in general case, use default help option.
     * @param flags
     * @param description
     * @returns {Command}
     */
    help(flags: string, description: string) {
        this._help = new Option(flags, description);
        return this;
    }

    /**
     * add show version option to this command.
     * @param version
     * @param flags
     * @param description
     * @returns {Command}
     */
    version(version: string, flags: string, description: string = "output the version number"): Command<Opt, Arg> {
        this._version = new Option(flags, description);
        this._versionStr = version;
        return this;
    }

    /**
     * exec action of command.
     * this method MUST call after parse process.
     * @returns {Promise<{}>}
     */
    exec(): Promise<{}> {
        return Promise.resolve(this._action(this.parsedOpts, this.parsedArgs, this._rest));
    }

    /**
     * parse argv.
     * @param argv
     * @returns {Promise<{}>}
     */
    parse(argv: string[]): Promise<{}> {
        return Promise
            .resolve(null)
            .then(() => {
                let rest = this._parseRawArgs(argv);
                // resolve help action
                if (this._args!.some(arg => this._help.is(arg))) {
                    // include help option. (help for this command
                    process.stdout.write(this.helpText() + "\n");
                    process.exit(0);

                    return Promise.resolve({});
                }
                let subCommand: Command<any, any>;
                if (this.parent == null) {
                    // only for top level (why? because I can't decide which is natural syntax between `foo help bar buzz` and `foo bar help buzz`.
                    if (this._rest.some(arg => this._help.name() === arg)) {
                        // include help sub command. (help for deeper level sub command
                        if (rest[0]) {
                            subCommand = this.subCommands.filter(cmd => cmd.is(rest[0]))[0];
                            if (subCommand) {
                                process.stdout.write(subCommand.helpText() + "\n");
                                process.exit(0);

                                return Promise.resolve({});
                            }
                        }
                        // TODO raise error? pass through?
                    }
                }
                // resolve version option
                if (this._version && this._args!.some(arg => this._version!.is(arg))) {
                    process.stdout.write((this._versionStr || "unknown") + "\n");
                    process.exit(0);

                    return Promise.resolve({});
                }

                if (rest[0]) {
                    subCommand = this.subCommands.filter(cmd => cmd.is(rest[0]))[0];
                    if (subCommand) {
                        return subCommand.parse(rest.slice(1));
                    }
                }
                return this.exec();
            });
    }

    /**
     * @returns {*}
     * @private
     */
    _getAncestorsAndMe(): Command<any, any>[] {
        if (!this.parent) {
            return [this];
        } else {
            return this.parent._getAncestorsAndMe().concat([this]);
        }
    }

    /**
     * @param args
     * @returns {string[]}
     * @private
     */
    _parseRawArgs(args: string[]) {
        args = args.slice(0);
        let target: string[] = [];
        let rest: string[] = [];

        for (let i = 0; i < args.length; i++) {
            let arg = args[i];
            if (arg === "--") {
                // Honor option terminator
                target = target.concat(args.slice(i));
                break;
            }
            let cmd = this.subCommands.filter(cmd => cmd.is(arg))[0];
            if (cmd) {
                rest = args.slice(i);
                break;
            }
            target.push(arg);
        }

        this._rawArgs = target.slice(0);
        this._args = this._normalize(target);
        this._rest = this._parseOptions(this._args);
        let cmds = this._getAncestorsAndMe();
        let allowUnknownOption = cmds.reverse().map(cmd => cmd._allowUnknownOption).filter(allowUnknownOption => typeof allowUnknownOption !== "undefined")[0];
        if (this.unknownOptions.length !== 0 && !allowUnknownOption) {
            let errMsg = "unknown option";
            errMsg += this.unknownOptions.length === 1 ? " " : "s ";
            errMsg += this.unknownOptions.join(", ") + "\n";
            errMsg += this.helpText();
            throw new CommandpostError({
                message: errMsg,
                reason: ErrorReason.UnknownOption,
                parts: this.unknownOptions,
                params: {
                    origin: this,
                    args,
                },
            });
        }
        if (this._matchSubCommand(rest)) {
            return rest;
        }
        this._rest = this._parseArgs(this._rest);

        return rest;
    }

    /**
     * @param rest
     * @returns {boolean}
     * @private
     */
    _matchSubCommand(rest: string[]): boolean {
        if (rest == null || !rest[0]) {
            return false;
        }
        let subCommand = this.subCommands.filter(cmd => cmd.is(rest[0]))[0];
        return !!subCommand;
    }

    /**
     * @param args
     * @returns {string[]}
     * @private
     */
    _parseOptions(args: string[]) {
        args = args.slice(0);
        let rest: string[] = [];
        let processedOptions: Option[] = [];
        while (args.length !== 0) {
            let arg = args.shift()!;
            if (arg === "--") {
                rest = rest.concat(args);
                break;
            }
            let opt = this.options.filter(opt => opt.is(arg))[0];
            if (!opt) {
                rest.push(arg);
                if (arg.indexOf("-") === 0 && !this._help.is(arg) && (!this._version || !this._version.is(arg))) {
                    this.unknownOptions.push(arg);
                }
                continue;
            }
            args = opt.parse(this.parsedOpts, [arg].concat(args));
            processedOptions.push(opt);
        }
        this.options
            .filter(opt => processedOptions.indexOf(opt) === -1)
            .forEach(opt => {
                let optName = utils.kebabToLowerCamelCase(opt.name());
                if (opt.required || opt.optional) {
                    // string[]
                    (<any>this.parsedOpts)[optName] = (<any>this.parsedOpts)[optName] || [];
                    if (opt.defaultValue) {
                        (<any>this.parsedOpts)[optName].push(opt.defaultValue);
                    }
                } else {
                    (<any>this.parsedOpts)[optName] = opt.defaultValue;
                }
            });
        return rest;
    }

    /**
     * @param rest
     * @returns {string[]}
     * @private
     */
    _parseArgs(rest: string[]) {
        rest = rest.slice(0);
        this.args.forEach(argInfo => {
            rest = argInfo.parse(this.parsedArgs, rest);
        });
        return rest;
    }

    /**
     * @param args
     * @returns {string[]}
     * @private
     */
    _normalize(args: string[]): string[] {
        let result: string[] = [];
        for (let i = 0; i < args.length; i++) {
            let arg = args[i];
            let lastOpt: Option | undefined;
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

    /**
     * generate help text.
     * @returns {string}
     */
    helpText(): string {
        let result = "";
        if (this._description) {
            result += this._description + "\n\n";
        }
        // usage part
        result += "  Usage: ";
        if (this._usage != null) {
            result += this._usage;
        } else {
            result += this._getAncestorsAndMe().map(cmd => cmd.name).join(" ") + " ";
            if (this.options.length !== 0) {
                result += "[options] ";
            }
            if (this.subCommands.length !== 0) {
                result += "[command] ";
            }
            if (this.args.length !== 0) {
                result += "[--] ";
                result += this.args.map(arg => {
                    if (arg.required) {
                        return "<" + arg.name + (arg.variadic ? "..." : "") + ">";
                    } else {
                        return "[" + arg.name + (arg.variadic ? "..." : "") + "]";
                    }
                }).join(" ");
            }
        }

        result = result.trimRight();
        result += "\n\n";

        // options part
        if (this.options.length !== 0) {
            result += "  Options:\n\n";
            let optionsMaxLength = utils.maxLength(this.options.map(opt => opt.flags));
            result += this.options.map(opt => {
                let result = "    ";
                result += utils.pad(opt.flags, optionsMaxLength);
                result += "  ";
                result += opt.description || "";
                result += "\n";
                result = result.trimRight();
                return result;
            }).join("");
            result += "\n\n";
        }

        // sub commands part
        if (this.subCommands.length !== 0) {
            result += "  Commands:\n\n";
            let subCommandsMaxLength = utils.maxLength(this.subCommands.map(cmd => cmd.name + " (aka '" + cmd._alias + "')"));
            result += this.subCommands.map(cmd => {
                let result = "    ";
                let display = cmd.name;
                if (cmd._alias) {
                    display += " (aka '" + cmd._alias + "')";
                }

                result += utils.pad(display, subCommandsMaxLength);
                result += "  ";
                result += cmd._description || "";
                result += "\n";
                return result;
            }).join("");
            result += "\n\n";
        }

        return result;
    }
}
