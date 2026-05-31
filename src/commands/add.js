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

// Common CSS entry files to auto-detect, in priority order
const CSS_CANDIDATES = [
  "src/index.css",
  "src/App.css",
  "src/styles/global.css",
  "src/styles/globals.css",
  "styles/global.css",
  "styles/globals.css",
  "app/globals.css",
  "pages/_app.css",
  "css/main.css",
  "assets/css/main.css",
];

/**
 * Auto-detect existing CSS files in the project
 * Checks known candidates + root directory + one level deep in common folders
 */
async function detectCSSFiles() {
  const found = new Set();

  // Check known candidates first
  for (const candidate of CSS_CANDIDATES) {
    const resolved = path.resolve(process.cwd(), candidate);
    if (await fs.pathExists(resolved)) {
      found.add(candidate);
    }
  }

  // Scan root directory for any .css files
  try {
    const rootFiles = await fs.readdir(process.cwd());
    for (const file of rootFiles) {
      if (file.endsWith(".css")) {
        found.add(file);
      }
    }
  } catch (_) {}

  // Scan one level deep in common folders
  const scanDirs = ["src", "styles", "css", "app"];
  for (const dir of scanDirs) {
    const dirPath = path.resolve(process.cwd(), dir);
    try {
      const dirExists = await fs.pathExists(dirPath);
      if (!dirExists) continue;
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (file.endsWith(".css")) {
          found.add(path.join(dir, file).replace(/\\/g, "/"));
        }
      }
    } catch (_) {}
  }

  return [...found];
}

/**
 * Detect if a framework is installed by checking package.json
 */
async function detectFramework(framework) {
  try {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const exists = await fs.pathExists(pkgPath);
    if (!exists) return false;

    const pkg = await fs.readJson(pkgPath);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (framework === "react") return "react" in allDeps;
    if (framework === "nextjs") return "next" in allDeps;
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Print installation guide for a framework
 */
function printInstallGuide(framework) {
  if (framework === "react") {
    console.log(`
  ${chalk.yellow("⚠  React doesn't appear to be installed in this project.")}

  ${chalk.bold("To set up a React project, run one of the following:")}

  ${chalk.cyan("Vite")} ${chalk.gray("(recommended)")}
    npm create vite@latest my-app -- --template react

  ${chalk.cyan("Create React App")}
    npx create-react-app my-app
`);
  } else if (framework === "nextjs") {
    console.log(`
  ${chalk.yellow("⚠  Next.js doesn't appear to be installed in this project.")}

  ${chalk.bold("To set up a Next.js project, run:")}

  ${chalk.cyan("Create Next App")} ${chalk.gray("(recommended)")}
    npx create-next-app@latest my-app
`);
  }
}

export async function addFont(fontName, weights) {
  console.log(chalk.gray(`  Looking up "${fontName}" with weights: ${weights.join(", ")}\n`));

  // Step 1 — Resolve font
  const spinner = ora(`Searching for ${chalk.bold(fontName)}...`).start();
  let fontData;

  try {
    fontData = await resolveFont(fontName, weights);
    spinner.succeed(chalk.green(`Found "${fontData.family}" via ${fontData.source}`));
  } catch (err) {
    spinner.fail(chalk.red(`Could not find font "${fontName}".`));

    if (err.suggestions && err.suggestions.length > 0) {
      console.log(`\n  ${chalk.yellow("Did you mean?")}`);
      err.suggestions.forEach((s) => console.log(`    ${chalk.cyan("→")} ${s}`));
      console.log();
    }

    process.exit(1);
  }

  // Step 2 — Pick framework
  const { framework } = await inquirer.prompt([
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
  ]);

  // Step 3 — Framework detection check
  if (framework !== "css") {
    const installed = await detectFramework(framework);

    if (!installed) {
      printInstallGuide(framework);

      const { continueAnyway } = await inquirer.prompt([
        {
          type: "confirm",
          name: "continueAnyway",
          message: "Continue anyway?",
          default: false,
        },
      ]);

      if (!continueAnyway) {
        console.log(`\n  ${chalk.gray("Aborted. Set up your project and run font-drop again.")}\n`);
        process.exit(0);
      }
    }
  }

  // Step 4 — Where to add font styles
  const outputPath = { css: "assets/fonts", react: "src/assets/fonts", nextjs: "public/fonts" }[framework];
  const resolvedOutput = path.resolve(process.cwd(), outputPath);

  let { cssDestination } = await inquirer.prompt([
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
  ]);

  // Step 5 — Auto-detect existing CSS file if needed
  let existingCssPath = null;

  if (cssDestination === "existing") {
    const detectedFiles = await detectCSSFiles();

    if (detectedFiles.length === 0) {
      console.log(`\n  ${chalk.yellow("No CSS files found. A new fonts.css will be created instead.")}\n`);
      cssDestination = "new";
    } else if (detectedFiles.length === 1) {
      existingCssPath = path.resolve(process.cwd(), detectedFiles[0]);
      console.log(`\n  ${chalk.green("✔")} Found ${chalk.cyan(detectedFiles[0])} — font styles will be added there.\n`);
    } else {
      const { chosenFile } = await inquirer.prompt([
        {
          type: "list",
          name: "chosenFile",
          message: "Multiple CSS files found. Which one should font styles be added to?",
          choices: detectedFiles,
        },
      ]);
      existingCssPath = path.resolve(process.cwd(), chosenFile);
    }
  }

  // Step 6 — Download fonts
  const dlSpinner = ora("Downloading font files...").start();
  try {
    const downloadedFiles = await downloadFonts(fontData, resolvedOutput);
    dlSpinner.succeed(chalk.green(`Downloaded ${downloadedFiles.length} font file(s) to ${chalk.bold(outputPath)}`));

    // Step 7 — Framework-specific setup
    const setupSpinner = ora("Wiring everything up...").start();
    const context = {
      fontData,
      outputPath,
      resolvedOutput,
      weights,
      downloadedFiles,
      cssDestination,
      existingCssPath,
      generateHelper: true,
    };

    if (framework === "css") await writeCSS(context);
    else if (framework === "react") await writeReact(context);
    else if (framework === "nextjs") await writeNextjs(context);

    setupSpinner.succeed(chalk.green("All done!"));

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
// import fs from "fs-extra";
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
//     spinner.fail(chalk.red(`Could not find font "${fontName}".`));

//     // Show fuzzy suggestions if available
//     if (err.suggestions && err.suggestions.length > 0) {
//       console.log(`\n  ${chalk.yellow("Did you mean?")}`);
//       err.suggestions.forEach((s) => console.log(`    ${chalk.cyan("→")} ${s}`));
//       console.log();
//     }

//     process.exit(1);
//   }

//   // Step 2 — Prompts: framework, output path, CSS destination, helper option
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
//       message: "Where should the font files be saved?",
//       default: (ans) => {
//         const defaults = {
//           css: "assets/fonts",
//           react: "src/assets/fonts",
//           nextjs: "public/fonts",
//         };
//         return defaults[ans.framework];
//       },
//     },
//     {
//       type: "list",
//       name: "cssDestination",
//       message: "Where should the font styles be added?",
//       choices: [
//         { name: "Create a new fonts.css file (default)", value: "new" },
//         { name: "Add to an existing CSS file", value: "existing" },
//         { name: "Skip — I'll handle it myself", value: "skip" },
//       ],
//     },
//     {
//       type: "input",
//       name: "existingCssPath",
//       message: "Path to your existing CSS file:",
//       when: (ans) => ans.cssDestination === "existing",
//       validate: async (input) => {
//         const resolved = path.resolve(process.cwd(), input);
//         const exists = await fs.pathExists(resolved);
//         return exists ? true : `File not found: ${input}`;
//       },
//     },
//     {
//       type: "confirm",
//       name: "generateHelper",
//       message: "Generate a fontHelper.js file?",
//       default: true,
//       when: (ans) => ans.framework === "react",
//     },
//   ]);

//   const { framework, outputPath, cssDestination, existingCssPath, generateHelper } = answers;
//   const resolvedOutput = path.resolve(process.cwd(), outputPath);

//   // Step 3 — Download fonts
//   const dlSpinner = ora("Downloading font files...").start();
//   try {
//     const downloadedFiles = await downloadFonts(fontData, resolvedOutput);
//     dlSpinner.succeed(chalk.green(`Downloaded ${downloadedFiles.length} font file(s) to ${chalk.bold(outputPath)}`));

//     // Step 4 — Framework-specific setup
//     const setupSpinner = ora("Wiring everything up...").start();
//     const context = {
//       fontData,
//       outputPath,
//       resolvedOutput,
//       weights,
//       downloadedFiles,
//       cssDestination,
//       existingCssPath: existingCssPath ? path.resolve(process.cwd(), existingCssPath) : null,
//       generateHelper: generateHelper !== false,
//     };

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







