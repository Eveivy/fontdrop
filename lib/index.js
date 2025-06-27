import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { handleTailwind } from './handlers/handleTailwind.js';
import { handleVanillaCSS } from './handlers/handleVanillaCSS.js';
import { handleNativeWind } from './handlers/handleNativeWind.js';
import { ensureFolderExists, ensureCSSFile } from './utils.js';


export async function runFontdrop(fontArgs, options) {
    const configPath = path.join(process.cwd(), '.fontdroprc.json');
    let savedConfig = {};

    if (fs.existsSync(configPath)) {
        savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    const framework = options.framework || savedConfig.framework || 'css';
    const runtime = options.runtime || savedConfig.runtime || 'html';
    const outDir = options.out || savedConfig.out || 'assets/fonts';
    const cssFile = options.css || savedConfig.css || 'styles.css';
   

    if (!fontArgs?.length) {
        console.log(chalk.red('❌ No fonts provided. Please specify at least one.'));
        return;
    }

    const parsedFonts = fontArgs.map((entry) => {
        const [name, weights] = entry.split('@');
        return {
            name: name.trim(),
            weights: weights?.split(',').map(w => w.trim()) ?? ['400'],
        };
    });

    console.log(chalk.blue(`\n🔍 Installing fonts: ${parsedFonts.map(f => f.name).join(', ')}`));
    console.log(chalk.gray(`Framework: ${framework}, Runtime: ${runtime}\n`));


    // if (framework === 'tailwind' && !tailwindConfigExists) {
    //     // console.warn(chalk.yellow('⚠️ No tailwind.config.js found. Please ensure Tailwind is installed and configured.'));
    //     return;
    // } else {
        ensureFolderExists(outDir, framework);
    // };

    if (framework === 'css') {
        ensureCSSFile(cssFile);
    }

    switch (framework) {
        case 'tailwind':
            await handleTailwind({ fonts: parsedFonts, outDir, runtime });
            break;
        case 'css':
            await handleVanillaCSS({ fonts: parsedFonts, outDir, cssFile });
            break;
        case 'nativewind':
            await handleNativeWind({ fonts: parsedFonts, outDir });
            break;
        default:
            console.log(chalk.red(`❌ Unsupported framework: ${framework}`));
    }
}
