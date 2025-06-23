// // lib/init.js
// import fs from 'fs';
// import path from 'path';
// import inquirer from 'inquirer';
// import chalk from 'chalk';
// import { runFontdrop } from './index.js';

// export async function runInit() {
//   console.log(chalk.cyanBright('\n🌟 Welcome to Fontdrop Setup!\n'));

//   // 1. Ask user for setup
//   const answers = await inquirer.prompt([
//     {
//       name: 'framework',
//       type: 'list',
//       message: 'What CSS framework are you using?',
//       choices: ['tailwind', 'css', 'nativewind'],
//     },
//     {
//       name: 'runtime',
//       type: 'list',
//       message: 'What platform are you building for?',
//       choices: ['next', 'react', 'html', 'native'],
//     },
//     {
//       name: 'out',
//       type: 'input',
//       message: 'Where should we save downloaded fonts?',
//       default: 'assets/fonts',
//     },
//     {
//       name: 'css',
//       type: 'input',
//       message: 'Where is your global CSS file? (for @font-face)',
//       default: 'styles.css',
//       when: (answers) => answers.framework === 'css',
//     },
//     {
//       name: 'fonts',
//       type: 'input',
//       message: 'What fonts do you want to install now? (e.g. inter@400, roboto@500)',
//     },
//   ]);

//   // 2. Save the config
//   const config = {
//     framework: answers.framework,
//     runtime: answers.runtime,
//     out: answers.out,
//     css: answers.css,
//   };

//   const configPath = path.join(process.cwd(), '.fontdroprc.json');
//   fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

//   console.log(chalk.green(`\n✅ Saved config to .fontdroprc.json\n`));

//   // 3. Parse font input like "inter@400, roboto@500"
//   const fontArgs = answers.fonts
//     .split(',')
//     .map((f) => f.trim())
//     .filter(Boolean);

//   // 4. Pass everything into runFontdrop
//   await runFontdrop(fontArgs, config);
// }


import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { runFontdrop } from './index.js';

export async function runInit() {
  console.log(chalk.cyanBright('\n🌟 Welcome to Fontdrop Setup!\n'));

  const answers = await inquirer.prompt([
    {
      name: 'framework',
      type: 'list',
      message: 'What CSS framework are you using?',
      choices: ['tailwind', 'css', 'nativewind'],
    },
    {
      name: 'runtime',
      type: 'list',
      message: 'What platform are you building for?',
      choices: ['next', 'react', 'html', 'react-native'],
    },
    {
      name: 'out',
      type: 'input',
      message: 'Where should we save downloaded fonts?',
      default: 'assets/fonts',
    },
    {
      name: 'css',
      type: 'input',
      message: 'Where is your global CSS file? (for @font-face)',
      default: 'styles.css',
      when: (answers) => answers.framework === 'css',
    },
    {
      name: 'fonts',
      type: 'input',
      message: 'What fonts do you want to install now? (e.g. inter@400, roboto@500)',
    },
  ]);

  const config = {
    framework: answers.framework,
    runtime: answers.runtime,
    out: answers.out,
    css: answers.css,
  };

  const configPath = path.join(process.cwd(), '.fontdroprc.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(chalk.green(`\n✅ Saved config to .fontdroprc.json\n`));

  const fontArgs = answers.fonts
    .split(',')
    .map(f => f.trim())
    .filter(Boolean);

  await runFontdrop(fontArgs, config);
}
