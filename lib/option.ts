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
        var next = args[1];
        if (this.required) {
            if (next == null) {
                throw new Error(args[0] + " is required parameter value");
            }
            opts[this.name()] = opts[this.name()] || [];
            opts[this.name()].push(next);
            return args.slice(2);
        } else if (this.optional) {
            if (next != null && !/^-/.test(next)) {
                opts[this.name()] = opts[this.name()] || [];
                opts[this.name()].push(next);
                return args.slice(2);
            } else {
                opts[this.name()] = opts[this.name()] || [];
                opts[this.name()].push(this.defaultValue);
                return args.slice(1);
            }
        } else {
            opts[this.name()] = this.no ? true : false;
            return args.slice(1);
        }
    }
}

export = Option;
