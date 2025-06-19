#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
// import { parseFonts } from '../lib/parseFonts.js';
// import { detectFramework } from '../lib/detectFramework.js';

const program = new Command();

program
  .name('fontdrop')
  .description('Drop custom fonts into your React, Next.js or React Native project effortlessly.')
  .argument('<fonts...>', 'Fonts to install, e.g. inter@400,700 roboto')
  .option('--tailwind', 'Enable Tailwind CSS integration')
  .option('--global-css', 'Inject into global CSS file (e.g. index.css)')
  .option('--skip-config', 'Skip modifying config files')
  .action(async (fonts, options) => {
    const spinner = ora('Parsing fonts...').start();

    try {
    //   const parsed = parseFonts(fonts);
      spinner.succeed('Fonts parsed');
    //   console.log(chalk.greenBright(JSON.stringify(parsed, null, 2)));

    //   const framework = detectFramework();
    //   console.log(chalk.cyan(`Detected: ${framework}`));

      // In next steps:
      // - download fonts
      // - inject @font-face
      // - update tailwind.config.js

    } catch (err) {
      spinner.fail('Something went wrong');
      console.error(chalk.red(err.message));
    }
  });

program.parse();
