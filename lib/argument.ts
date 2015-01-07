"use strict";

class Argument {
    name:string;
    required:boolean;
    variadic:boolean;

    constructor(arg:string) {
        switch (arg.charAt(0)) {
            case '<':
                this.required = true;
                this.name = arg.slice(1, -1);
                break;
            case '[':
                this.required = false;
                this.name = arg.slice(1, -1);
                break;
            default:
                throw new Error("unsupported format: " + arg);
        }
        if (/\.\.\.$/.test(this.name)) {
            this.name = this.name.slice(0, -3);
            this.variadic = true;
        } else {
            this.variadic = false;
        }
    }

    parse(opts:any, args:string[]):string[] {
        if (this.required && this.variadic && args.length === 0) {
            throw new Error(this.name + " is required more than 1 argument");
        }
        if (this.variadic) {
            opts[this.name] = args;
            args = [];
            return args;
        }
        var arg = args.shift();
        if (this.required && !arg) {
            throw new Error(this.name + " is required");
        }
        opts[this.name] = arg;
        return args;
    }
}

export = Argument;
