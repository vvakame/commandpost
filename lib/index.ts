/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

try {
    // optional
    require("source-map-support").install();
} catch (e) {
}
require("es6-promise").polyfill();

import Command = require("./command");

export function create<Opt,Arg>(cmdName:string):Command<Opt,Arg> {
    "use strict";

    return new Command<Opt,Arg>(cmdName);
}

export function exec(cmd:Command<any,any>, argv:string[]):Promise<{}> {
    "use strict";

    argv = argv.slice(2);
    return cmd.parse(argv);
}
