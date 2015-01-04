/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

try {
    // optional
    require("source-map-support").install();
} catch (e) {
}
require("es6-promise").polyfill();

import Command = require("./command");

export function create<T>():Command<T> {
    "use strict";

    return new Command<T>();
}

export function exec(cmd:Command<any>, argv:string[]):Promise<{}> {
    "use strict";

    argv = argv.slice(2);
    return cmd.parse(argv);
}
