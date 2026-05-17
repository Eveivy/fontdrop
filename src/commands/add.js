import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs-extra";
import { resolveFont } from "../resolvers/index.js";
import { downloadFonts } from "../downloaders/index.js";
import { writeCSS } from "../writers/css.js";
import { writeReact } from "../writers/react.js";
import { writeNextjs } from "../writers/nextjs.js";

export async function addFont(fontName, weights) {
  console.log(chalk.gray(`  Looking up "${fontName}" with weights: ${weights.join(", ")}\n`));

  // Step 1 — Resolve the font from available sources
  const spinner = ora(`Searching for ${chalk.bold(fontName)}...`).start();
  let fontData;

  try {
    fontData = await resolveFont(fontName, weights);
    spinner.succeed(chalk.green(`Found "${fontData.family}" via ${fontData.source}`));
  } catch (err) {
    spinner.fail(chalk.red(`Could not find font "${fontName}".`));

    // Show fuzzy suggestions if available
    if (err.suggestions && err.suggestions.length > 0) {
      console.log(`\n  ${chalk.yellow("Did you mean?")}`);
      err.suggestions.forEach((s) => console.log(`    ${chalk.cyan("→")} ${s}`));
      console.log();
    }

    process.exit(1);
  }

  // Step 2 — Prompts: framework, output path, CSS destination, helper option
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "framework",
      message: "Which framework are you using?",
      choices: [
        { name: "CSS (plain stylesheet)", value: "css" },
        { name: "React", value: "react" },
        { name: "Next.js", value: "nextjs" },
      ],
    },
    {
      type: "input",
      name: "outputPath",
      message: "Where should the font files be saved?",
      default: (ans) => {
        const defaults = {
          css: "assets/fonts",
          react: "src/assets/fonts",
          nextjs: "public/fonts",
        };
        return defaults[ans.framework];
      },
    },
    {
      type: "list",
      name: "cssDestination",
      message: "Where should the font styles be added?",
      choices: [
        { name: "Create a new fonts.css file (default)", value: "new" },
        { name: "Add to an existing CSS file", value: "existing" },
        { name: "Skip — I'll handle it myself", value: "skip" },
      ],
    },
    {
      type: "input",
      name: "existingCssPath",
      message: "Path to your existing CSS file:",
      when: (ans) => ans.cssDestination === "existing",
      validate: async (input) => {
        const resolved = path.resolve(process.cwd(), input);
        const exists = await fs.pathExists(resolved);
        return exists ? true : `File not found: ${input}`;
      },
    },
    {
      type: "confirm",
      name: "generateHelper",
      message: "Generate a fontHelper.js file?",
      default: true,
      when: (ans) => ans.framework === "react",
    },
  ]);

  const { framework, outputPath, cssDestination, existingCssPath, generateHelper } = answers;
  const resolvedOutput = path.resolve(process.cwd(), outputPath);

  // Step 3 — Download fonts
  const dlSpinner = ora("Downloading font files...").start();
  try {
    const downloadedFiles = await downloadFonts(fontData, resolvedOutput);
    dlSpinner.succeed(chalk.green(`Downloaded ${downloadedFiles.length} font file(s) to ${chalk.bold(outputPath)}`));

    // Step 4 — Framework-specific setup
    const setupSpinner = ora("Wiring everything up...").start();
    const context = {
      fontData,
      outputPath,
      resolvedOutput,
      weights,
      downloadedFiles,
      cssDestination,
      existingCssPath: existingCssPath ? path.resolve(process.cwd(), existingCssPath) : null,
      generateHelper: generateHelper !== false,
    };

    if (framework === "css") await writeCSS(context);
    else if (framework === "react") await writeReact(context);
    else if (framework === "nextjs") await writeNextjs(context);

    setupSpinner.succeed(chalk.green("All done!"));

    // Summary
    console.log(`
${chalk.bold.hex("#6C63FF")("  font-drop complete ✨")}
  
  Font:       ${chalk.bold(fontData.family)}
  Weights:    ${weights.join(", ")}
  Framework:  ${framework}
  Output:     ${chalk.cyan(outputPath)}

  ${chalk.gray("Your font classes are ready to use. Check the generated stylesheet for class names.")}
`);
  } catch (err) {
    dlSpinner.fail(chalk.red("Something went wrong."));
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}







// import inquirer from "inquirer";
// import chalk from "chalk";
// import ora from "ora";
// import path from "path";
// import { resolveFont } from "../resolvers/index.js";
// import { downloadFonts } from "../downloaders/index.js";
// import { writeCSS } from "../writers/css.js";
// import { writeReact } from "../writers/react.js";
// import { writeNextjs } from "../writers/nextjs.js";

// export async function addFont(fontName, weights) {
//   console.log(chalk.gray(`  Looking up "${fontName}" with weights: ${weights.join(", ")}\n`));

//   // Step 1 — Resolve the font from available sources
//   const spinner = ora(`Searching for ${chalk.bold(fontName)}...`).start();
//   let fontData;

//   try {
//     fontData = await resolveFont(fontName, weights);
//     spinner.succeed(chalk.green(`Found "${fontData.family}" via ${fontData.source}`));
//   } catch (err) {
//     spinner.fail(chalk.red(`Could not find font "${fontName}". Please check the name and try again.`));
//     process.exit(1);
//   }

//   // Step 2 — Prompt: framework + output path
//   const answers = await inquirer.prompt([
//     {
//       type: "list",
//       name: "framework",
//       message: "Which framework are you using?",
//       choices: [
//         { name: "CSS (plain stylesheet)", value: "css" },
//         { name: "React", value: "react" },
//         { name: "Next.js", value: "nextjs" },
//       ],
//     },
//     {
//       type: "input",
//       name: "outputPath",
//       message: "Where should the fonts be saved?",
//       default: (ans) => {
//         const defaults = {
//           css: "assets/fonts",
//           react: "src/assets/fonts",
//           nextjs: "public/fonts",
//         };
//         return defaults[ans.framework];
//       },
//     },
//   ]);

//   const { framework, outputPath } = answers;
//   const resolvedOutput = path.resolve(process.cwd(), outputPath);

//   // Step 3 — Download fonts
//   const dlSpinner = ora("Downloading font files...").start();
//   try {
//     const downloadedFiles = await downloadFonts(fontData, resolvedOutput);
//     dlSpinner.succeed(chalk.green(`Downloaded ${downloadedFiles.length} font file(s) to ${chalk.bold(outputPath)}`));

//     // Step 4 — Framework-specific setup
//     const setupSpinner = ora("Wiring everything up...").start();
//     const context = { fontData, outputPath, resolvedOutput, weights, downloadedFiles };

//     if (framework === "css") await writeCSS(context);
//     else if (framework === "react") await writeReact(context);
//     else if (framework === "nextjs") await writeNextjs(context);

//     setupSpinner.succeed(chalk.green("All done!"));

//     // Summary
//     console.log(`
// ${chalk.bold.hex("#6C63FF")("  font-drop complete ✨")}
  
//   Font:       ${chalk.bold(fontData.family)}
//   Weights:    ${weights.join(", ")}
//   Framework:  ${framework}
//   Output:     ${chalk.cyan(outputPath)}

//   ${chalk.gray("Your font classes are ready to use. Check the generated stylesheet for class names.")}
// `);
//   } catch (err) {
//     dlSpinner.fail(chalk.red("Something went wrong."));
//     console.error(chalk.red(err.message));
//     process.exit(1);
//   }
// }
