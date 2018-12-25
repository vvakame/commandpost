import { CommandpostError, ErrorReason } from "./error";

// jsdoc, see constructor.
export default class Argument {
    /** argument name */
    name: string;
    /** this argument is required */
    required: boolean;
    /** this argument is variadic */
    variadic: boolean;

    /**
     * class of argument.
     * ```
     * cmd --path foo/bar buzz.txt
     *                     ↑ this one!
     * ```
     * @param arg pass '<foo>'(required) or '[foo]'(optional) or '<foo...>'(required & variadic) or '[foo...]'(optional & variadic)
     * @class
     */
    constructor(arg: string) {
        switch (arg.charAt(0)) {
            case "<":
                this.required = true;
                this.name = arg.slice(1, -1);
                break;
            case "[":
                this.required = false;
                this.name = arg.slice(1, -1);
                break;
            default:
                throw new CommandpostError({
                    message: `unsupported format: ${arg}`,
                    parts: [arg],
                    reason: ErrorReason.UnsupportedFormatArgument,
                    params: {
                        origin: this,
                        arg,
                    },
                });
        }
        if (/\.\.\.$/.test(this.name)) {
            this.name = this.name.slice(0, -3);
            this.variadic = true;
        } else {
            this.variadic = false;
        }
    }

    /**
     * parse args.
     * build to opts.
     *
     * e.g. #1
     *   instance member:  name=foo, required=true, variadic=false
     *   method arguments: opts={}, args=["foo!", "bar!"].
     *   opts are modified to { foo: "foo!" } and return ["bar!"].
     *
     * e.g. #2
     *   instance member:  name=foo, required=false, variadic=true
     *   method arguments: opts={}, args=["foo!", "bar!"].
     *   opts are modified to { foo: ["foo!", "bar!"] } and return [].
     *
     * @param opts build target object
     * @param args
     * @returns {string[]} rest args
     */
    parse(opts: any, args: string[]): string[] {
        if (this.required && this.variadic && args.length === 0) {
            throw new CommandpostError({
                message: `${this.name} requires more than one argument`,
                parts: [this.name],
                reason: ErrorReason.ArgumentsRequired,
                params: {
                    origin: this,
                    opts,
                    args,
                },
            });
        }
        if (this.variadic) {
            opts[this.name] = args;
            args = [];
            return args;
        }
        let arg = args.shift();
        if (this.required && !arg) {
            throw new CommandpostError({
                message: `${this.name} is required`,
                reason: ErrorReason.ArgumentRequired,
                parts: [this.name],
                params: {
                    origin: this,
                    opts,
                    args,
                },
            });
        }
        opts[this.name] = arg;
        return args;
    }
}
