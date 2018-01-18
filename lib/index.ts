try {
    // optional
    require("source-map-support").install();
} catch (e) {
}
try {
    if (typeof Promise === "undefined") {
        require("es6-promise").polyfill();
    }
} catch (e) {
}

import Command from "./command";
import Option from "./option";
import Argument from "./argument";
export { CommandpostError, ErrorReason } from "./error";

export { Command, Option, Argument };

/**
 * Create new top level command.
 * @param cmdName
 * @returns {Command<Opt, Arg>}
 */
export function create<Opt, Arg>(cmdName: string): Command<Opt, Arg> {
    return new Command<Opt, Arg>(cmdName);
}

/**
 * exec parsing and call callback.
 * @param cmd it created by create function.
 * @param argv pass process.argv
 * @returns {Promise<{}>}
 */
export function exec(cmd: Command<any, any>, argv: string[]): Promise<{}> {
    return Promise
        .resolve(null)
        .then(() => {
            argv = argv.slice(2);
            // cmd.parse throw an exception often.
            return cmd.parse(argv);
        });
}
