// // lib/index.js
// import fs from 'fs';
// import path from 'path';
// import { handleTailwind } from './handlers/handleTailwind.js';
// import { handleVanillaCSS } from './handlers/handleVanillaCSS.js';
// import { handleNativeWind } from './handlers/handleNativeWind.js';
// import chalk from 'chalk';

// export async function runFontdrop(fontArgs, options) {
//     // 1. Load project config if exists
//     const configPath = path.join(process.cwd(), '.fontdroprc.json');
//     let savedConfig = {};

//     if (fs.existsSync(configPath)) {
//         savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
//     }

//     // 2. Combine CLI options + saved config
//     const framework = options.framework || savedConfig.framework || 'css';
//     const runtime = options.runtime || savedConfig.runtime || 'html';
//     const outDir = options.out || savedConfig.out || 'assets/fonts';
//     const cssFile = options.css || savedConfig.css || 'styles.css';

//     if (!fontArgs?.length) {
//         console.log(chalk.red('❌ No fonts provided. Please specify at least one.'));
//         return;
//     }

//     // 3. Parse fonts like inter@400,700 → { name: 'inter', weights: ['400', '700'] }
//     const parsedFonts = fontArgs.map((entry) => {
//         const [name, weightStr = '400'] = entry.split('@');
//         return {
//             name: name.trim(),
//             weights: weightStr.split(',').map((w) => w.trim()),
//         };
//     });

//     console.log(chalk.blue(`\n🔍 Installing fonts: ${parsedFonts.map(f => f.name).join(', ')}`));
//     console.log(chalk.gray(`Framework: ${framework}, Runtime: ${runtime}\n`));

//     // 4. Route to correct handler
//     switch (framework) {
//         case 'tailwind':
//             await handleTailwind({ fonts: parsedFonts, outDir, runtime });
//             break;

//         case 'css':
//             await handleVanillaCSS({ fonts: parsedFonts, outDir, cssFile });
//             break;

//         case 'nativewind':
//             await handleNativeWind({ fonts: parsedFonts, outDir });
//             break;

//         default:
//             console.log(chalk.red(`❌ Unsupported framework: ${framework}`));
//     }
// }


import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { handleTailwind } from './handlers/handleTailwind.js';
import { handleVanillaCSS } from './handlers/handleVanillaCSS.js';
import { handleNativeWind } from './handlers/handleNativeWind.js';

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
