// // lib/handlers/handleTailwind.js
// import {
//   fetchFontCSS,
//   extractFontFiles,
//   downloadFontFiles,
// } from '../utils.js';
// import { updateTailwindConfig } from '../tailwindHelpers.js';
// import chalk from 'chalk';

// export async function handleTailwind({ fonts, outDir }) {
//   console.log(chalk.greenBright('🎯 Setting up fonts for Tailwind...'));

//   for (const font of fonts) {
//     const css = await fetchFontCSS(font.name, font.weights);
//     if (!css) continue;

//     const urls = extractFontFiles(css);
//     const files = await downloadFontFiles(urls, outDir);

//     console.log(`✅ ${font.name}: ${files.length} font files downloaded.`);
//   }

//   updateTailwindConfig(fonts);

//   console.log(chalk.cyan(`
// 🚀 Fontdrop (Tailwind) complete!

// 📁 Fonts saved to: ${outDir}
// 🌀 Update your global CSS with @font-face if needed
// 🎨 Use font classes like: font-inter, font-roboto
//   `));
// }


import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { ensureTailwindConfigExists } from '../tailwindHelpers.js';

// export async function handleTailwind({ fonts, outDir, runtime }) {
//   console.log(chalk.magenta('🎯 Setting up fonts for Tailwind...'));

//   ensureTailwindConfigExists();

//   // Simulate installation (replace this with real downloading later)
//   for (const font of fonts) {
//     const cssURL = `https://fonts.googleapis.com/css2?family=${font.name}:wght@${font.weights.join(';')}&display=swap`;
//     try {
//       console.log(`📥 Would fetch: ${cssURL}`);
//       // Simulate font download & config updates
//     } catch (err) {
//       console.log(chalk.red(`❌ Error fetching CSS for ${font.name}: ${err.message}`));
//     }
//   }

//   console.log(chalk.green(`🚀 Fontdrop (Tailwind) complete!`));
//   console.log(`📁 Fonts saved to: ${outDir}`);
// }

export async function handleTailwind({ fonts, outDir, runtime }) {
  console.log(chalk.magenta('🎯 Setting up fonts for Tailwind...'));

  const canProceed = ensureTailwindConfigExists();
  if (!canProceed) {
    console.log(chalk.red('⛔ Halting setup due to missing Tailwind config.'));
    return;
  }

  for (const font of fonts) {
    const cssURL = `https://fonts.googleapis.com/css2?family=${font.name}:wght@${font.weights.join(';')}&display=swap`;
    try {
      console.log(`📥 Would fetch: ${cssURL}`);
    } catch (err) {
      console.log(chalk.red(`❌ Error fetching CSS for ${font.name}: ${err.message}`));
    }
  }

  console.log(chalk.green(`🚀 Fontdrop (Tailwind) complete!`));
  console.log(`📁 Fonts saved to: ${outDir}`);
}
