"use strict";

export function maxLength(strs:string[]):number {
    "use strict";

    return strs.map(str => str.length).reduce((p, c) => Math.max(p, c), 0);
}

export function pad(str:string, length:number, pad = " "):string {
    "use strict";

    if (length <= str.length) {
        return str;
    }
    if (pad === "") {
        throw new Error("pad can't to be empty string");
    }
    while (str.length < length) {
        str += pad;
    }
    return str;
}
