import { Arguments } from 'yargs';

import { CommandItem } from '../types';

import { getCLIConfig } from './helpers/config';
import { start, startPM2 } from './helpers/start';
import { StartCommandArguments } from './types';

export const createStartCommand: CommandItem<any, StartCommandArguments> = async (app) => ({
    command: ['start', 's'],
    describe: 'Start app',
    builder: {
        nestConfig: {
            type: 'string',
            alias: 'n',
            describe: 'nest cli config file path.', // nest-cli.json 的文件路径(相当于当前运行目录)
            default: 'nest-cli.json',
        },
        tsConfig: {
            type: 'string',
            alias: 't',
            describe: 'typescript config file path', // 用于编译和运行的tsconfig.build.json的文件路径(相当于当前运行目录)
            default: 'tsconfig.build.json',
        },
        entry: {
            type: 'string',
            alias: 'e',
            describe:
                'specify entry file for ts runner, you can specify js entry file in nest-cli.json by entryFile',
            // 使用直接运行TS文件的入口文件,默认为main.ts
            // 如果是运行js文件,则通过nest-cli.json的entryFile指定
            default: 'main.ts',
        },
        prod: {
            type: 'boolean',
            alias: 'p',
            describe: 'start app in production by pm2.', // 是否使用PM2后台静默启动 - 在生产环境
            default: false,
        },
        restart: {
            type: 'boolean',
            alias: 'r',
            describe: 'restart app(by pm2). pm2 will auto run start if process not exists.', // 是否重启应用(PM2进程)
            default: false,
        },
        typescript: {
            type: 'boolean',
            alias: 'ts',
            describe: 'Run the .ts file directly.', // 直接运行TS文件, 只针对生产环境下
            default: false,
        },
        debug: {
            type: 'boolean',
            alias: 'd',
            describe: 'whether to enable debug mode, on valid in production environment.', // 是否开启debug模式,只对非生产环境有效
            default: false,
        },
        watch: {
            type: 'boolean',
            alias: 'w',
            describe: ' Run in watch mode (live-reload).',
            default: false,
        },
    },
    handler: async (args: Arguments<StartCommandArguments>) => {
        console.log('进入yargs - 命令 :>> ', args);
        const { configure } = app;
        const config = getCLIConfig(args.tsConfig, args.nestConfig, args.entry);
        if (args.prod || args.restart) {
            await startPM2(configure, args, config);
        } else {
            await start(args, config);
        }
    },
});
