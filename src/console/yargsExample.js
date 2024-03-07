#!/usr/bin/env node

require('yargs')
    .scriptName('pirate-parser')
    .usage('$0 <cmd> [args]')
    .command(
        'hello [name]',
        'welcome ter yargs!',
        (yargs) => {
            yargs.positional('name', {
                type: 'string',
                default: 'Cambi',
                describe: 'the name to say hello to',
            });
        },
        function (argv) {
            console.log('hello', argv.name, 'welcome to yargs!');
        },
    )
    .help().argv;

// node src/console/yargsExample.js --help
// node src/console/yargsExample.js hello --name 拜登习近平普京
