/// <reference path="../typings/node/node.d.ts" />

// sample.
// tsc --module commonjs --target es5 --noImplicitAny usage.ts
// node usage.js -r -c a.json b.txt --config=c.json remote -v d add e.txt -- f.txt

import lib = require("../lib/index");

var root = lib
    .create<{replace: boolean; config: string[];}>()
    .description("foo bar")
    .option("-r, --replace", "replace files")
    .option("-c, --config <file>", "specified config file")
    .action((opts, rest) => {
        console.log("root action");
        console.log(opts);
        console.log(rest);
    });

var remote = root
    .subCommand<{verbose: boolean;}>("remote")
    .description("about remote repos")
    .option("-v, --verbose")
    .action((opts, rest)=> {
        console.log("remote action");
        console.log(opts);
        console.log(rest);
    });

remote
    .subCommand("add")
    .action((opts, rest)=> {
        return remote
            .exec()
            .then(()=> {
                console.log("remote add action");
                console.log(opts);
                console.log(rest);
                console.log("!root", root.parsedOpts, root._rest);
                console.log("!remote", remote.parsedOpts, remote._rest);
                console.log("!remote add", opts, rest);
            });
    });

lib.exec(root, process.argv);
