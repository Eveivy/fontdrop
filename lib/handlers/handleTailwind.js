

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { ensureTailwindConfigExists } from '../tailwindHelpers.js';
import { ensureFolderExists } from '../utils.js';


// export async function handleTailwind({ fonts, outDir, runtime }) {
//   console.log(chalk.magenta('🎯 Setting up fonts for Tailwind...'));

//   const canProceed = ensureTailwindConfigExists();
//   if (!canProceed) {
//     console.log(chalk.red('⛔ Halting setup due to missing Tailwind config.'));
//     return;
//   }

//   ensureFolderExists(outDir);

//   for (const font of fonts) {
//     const cssURL = `https://fonts.googleapis.com/css2?family=${font.name}:wght@${font.weights.join(';')}&display=swap`;
//     try {
//       console.log(`📥 Would fetch: ${cssURL}`);
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
  // else{
  //   // ensureFolderExists(outDir);
  // }


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

