"use strict";

import utils = require("./utils");

// jsdoc, see constructor.
class Option {
    /** this option need parameter value. it is required. */
    required:boolean;
    /** this option need parameter value. it is optional. */
    optional:boolean;
    /** this option is default true. if specified this option, value is become false. */
    no:boolean;
    /** short style. e.g. -o */
    short:string;
    /** long style. e.g. --option */
    long:string;
    /** description of this option */
    description:string;

    /**
     * class of option.
     * ```
     * cmd --path foo/bar buzz.txt
     *       ↑ this one!
     * ```
     * @param flags pass '-f, --foo'(boolean) or '--foo'(boolean) or '--foo <bar>'(string[]) or '--foo [bar]'(string[]).
     * @param description
     * @param defaultValue
     * @class
     */
    constructor(public flags:string, description?:string, public defaultValue?:any) {
        this.required = flags.indexOf("<") !== -1;
        this.optional = flags.indexOf("[") !== -1;
        this.no = flags.indexOf("-no-") === -1;
        var splittedFlags = flags.split(/[ ,|]+/);
        if (splittedFlags.length > 1 && !/^[[<]/.test(splittedFlags[1])) {
            this.short = splittedFlags.shift();
        }
        this.long = splittedFlags.shift();
        this.description = description || '';
        if (typeof this.defaultValue === "undefined") {
            if (this.required || this.optional) {
                this.defaultValue = "";
            } else {
                this.defaultValue = !this.no;
            }
        }
    }

    /**
     * name of this option.
     * @returns {any}
     */
    name() {
        return this.long.replace("--", "").replace("no-", "");
    }

    /**
     * check arg is matches this option.
     * @param arg
     * @returns {boolean}
     */
    is(arg:string) {
        return arg === this.short || arg === this.long;
    }

    /**
     * parse args.
     * build to opts.
     *
     * e.g. #1
     *   instance member:  required=true, optional=false, short=-f, long=--foo
     *   method arguments: opts={}, args=["--foo", "foo!", "bar!"].
     *   opts are modified to { foo: ["foo!"] } and return ["bar!"].
     *
     * e.g. #2
     *   instance member:  required=true, optional=false, short=-f, long=--foo
     *   method arguments: opts={ foo: ["foo?"] }, args=["--foo", "foo!", "bar!"].
     *   opts are modified to { foo: ["foo?", "foo!"] } and return ["bar!"].
     *
     * e.g. #3
     *   instance member:  required=false, optional=false, short=-f, long=--foo
     *   method arguments: opts={}, args=["-f", "foo!", "bar!"].
     *   opts are modified to { foo: true } and return ["foo!", "bar!"].
     *
     * @param opts
     * @param args
     * @returns {string[]}
     */
    parse(opts:any, args:string[]):string[] {
        if (!this.is(args[0])) {
            throw new Error(args[0] + " is not match " + this.short + " or " + this.long);
        }
        var next = args[1];
        var propertyName = utils.chainToLowerCamelCase(this.name());
        if (this.required) {
            if (next == null) {
                throw new Error(args[0] + " is required parameter value");
            }
            opts[propertyName] = opts[propertyName] || [];
            opts[propertyName].push(next);
            return args.slice(2);
        } else if (this.optional) {
            if (next != null && !/^-/.test(next)) {
                opts[propertyName] = opts[propertyName] || [];
                opts[propertyName].push(next);
                return args.slice(2);
            } else {
                opts[propertyName] = opts[propertyName] || [];
                opts[propertyName].push(this.defaultValue);
                return args.slice(1);
            }
        } else {
            opts[propertyName] = this.no ? true : false;
            return args.slice(1);
        }
    }
}

export = Option;
