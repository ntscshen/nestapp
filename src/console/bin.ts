#!/usr/bin/env node

import { createData } from '@/constants';

import { createApp } from '@/modules/core/app';
import { buildCli } from '@/modules/core/helpers/command';

console.log('进入当前环境 :>> ');

// 核心目的是创建一个命令行界面（CLI）应用。
// 这里通过 buildCli 函数实现，而 createApp(createOptions)
// 负责根据提供的选项生成应用实例，这个实例包含了应用的命令配置（commands 属性）。
buildCli(createApp(createData));
