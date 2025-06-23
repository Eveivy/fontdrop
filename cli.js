#!/usr/bin/env node
import { Command } from 'commander';
import { runInit } from './lib/init.js';
import { runFontdrop } from './lib/index.js';

const program = new Command();

program
  .name('fontdrop')
  .description('Install and configure fonts in your project')
  .version('1.0.0');

program
  .command('init')
  .description('Set up your project and install fonts')
  .action(runInit);

program
  .argument('<fonts...>')
  .option('--framework <framework>', 'CSS framework (tailwind, css, nativewind)')
  .option('--runtime <runtime>', 'Platform runtime (next, react, html, native)')
  .option('--out <folder>', 'Output folder', 'assets/fonts')
  .option('--css <file>', 'CSS file for @font-face (if HTML/CSS)')
  .action(runFontdrop);

program.parse();
