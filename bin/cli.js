#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { parseFonts } from '../lib/parseFonts.js';
import { handlers } from '../lib/frameworkHandlers.js';

const program = new Command();

program
    .name('fontdrop')
    .description('Drop fonts into your project with zero config')
    .argument('<fonts...>', 'Fonts to install, e.g. inter@400,700 poppins')
    .requiredOption('--framework <type>', 'Which CSS framework? (tailwind, css, etc)')
    .option('--css <file>', 'CSS file to inject @font-face (default: src/index.css)')
    .option('--out <folder>', 'Directory to save fonts (default: src/assets/fonts)')
    .action(async (fonts, options) => {
        const spinner = ora('Parsing fonts...').start();

        try {
            const parsed = parseFonts(fonts);
            const framework = options.framework.toLowerCase();
            const cssFile = options.css || 'src/index.css';
            const outDir = options.out || 'src/assets/fonts';

            spinner.succeed('Fonts parsed');

            console.log(chalk.cyan('🧠 Fonts:'), parsed);
            console.log(chalk.cyan(`🎨 Framework: ${framework}`));
            console.log(chalk.cyan(`📦 Output folder: ${outDir}`));
            console.log(chalk.cyan(`📄 CSS file: ${cssFile}`));

            const handler = handlers[framework];
            if (!handler) {
                console.error(chalk.red(`❌ Unsupported framework: ${framework}`));
                process.exit(1);
            }

            // Placeholder for actual download and handler call
            await handler({ fonts: parsed, outDir, cssFile });

        } catch (err) {
            spinner.fail('Error running fontdrop');
            console.error(chalk.red(err.message));
        }
    });

program.parse();
