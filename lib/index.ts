/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

"use strict";

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

    return Promise
        .resolve(null)
        .then(()=> {
            argv = argv.slice(2);
            // cmd.parse throw an exception often.
            return cmd.parse(argv);
        });
}
