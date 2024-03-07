import { Subprocess } from 'bun';
import { isNil } from 'lodash';
import { Arguments } from 'yargs';

import { CLIConfig, StartCommandArguments } from '../types';

export const start = async (args: Arguments<StartCommandArguments>, config: CLIConfig) => {
    const script = args.typescript ? config.paths.ts : config.paths.js;
    const params = [config.paths.bun, 'run'];
    if (args.watch) params.push('--watch');
    if (args.debug) {
        const inspectFlag =
            typeof args.debug === 'string' ? `--inspect=${args.debug}` : '--inspect';
        params.push(inspectFlag);
    }
    params.push(script);
    let child: Subprocess;
    if (args.watch) {
        const restart = () => {
            if (!isNil(child)) child.kill();
            child = Bun.spawn(params, config.subprocess.bun);
        };
        restart();
    } else {
        Bun.spawn(params, {
            ...config.subprocess.bun,
            onExit(proc) {
                proc.kill();
                process.exit(0);
            },
        });
    }
};
