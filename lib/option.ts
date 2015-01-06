"use strict";

class Option {
    required:boolean;
    optional:boolean;
    no:boolean;
    short:string;
    long:string;
    description:string;

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

    name() {
        return this.long.replace("--", "").replace("no-", "");
    }

    is(arg:string) {
        return arg === this.short || arg === this.long;
    }

    parse(opts:any, args:string[]):string[] {
        if (!this.is(args[0])) {
            throw new Error(args[0] + " is not match " + this.short + " or " + this.long);
        }
        var arg:string;
        if (this.required) {
            arg = args[1];
            if (arg == null) {
                throw new Error(args[0] + " is required parameter value");
            }
            opts[this.name()] = opts[this.name()] || [];
            opts[this.name()].push(arg);
            return args.slice(2);
        }
        if (this.optional) {
            arg = args[1];
            if (arg == null || (arg.charAt(0) === "-" && arg.length !== 0)) {
                opts[this.name()] = opts[this.name()] || [];
                opts[this.name()].push(arg || "");
                return args.slice(1);
            } else {
                opts[this.name()] = opts[this.name()] || [];
                opts[this.name()].push(arg);
                return args.slice(2);
            }
        }

        opts[this.name()] = this.no ? true : false;
        return args.slice(1);
    }
}

export = Option;
