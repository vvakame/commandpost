import * as util from "util";

import Command from "./command";
import Argument from "./argument";
import Option from "./option";

export interface ErrorParameters {
    message?: string;
    reason: ErrorReason;
    parts: string[];
    params?:
    { origin: Argument; arg: string; } |
    { origin: Argument; opts: any; args: string[]; } |
    { origin: Command<any, any>; args: string[]; } |
    { option: Option; opts: any; args: string[]; };
}

export const enum ErrorReason {
    UnsupportedFormatArgument = "unsupported format",
    ArgumentsRequired = "1 or more arguments required",
    ArgumentRequired = "argument required",
    ParameterCantPlacedAfterVariadic = "parameter can not placed after variadic parameter",
    ParameterCannPlacedAfterOptional = "required parameter is not placed after optional parameter",
    UnknownOption = "unknown option",
    OptionNameMismatch = "short or long option name mismatch",
    OptionValueRequired = "option value required",
}

export class CommandpostError {
    stack?: string;

    constructor(public params: ErrorParameters) {
        Error.captureStackTrace(this, this.constructor);
    }

    get name() {
        return this.constructor.name;
    }

    get message() {
        return this.params.message;
    }
}

util.inherits(CommandpostError, Error);
