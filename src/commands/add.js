import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs-extra";
import { resolveFont } from "../resolvers/index.js";
import { downloadFonts } from "../downloaders/index.js";
import { writeCSS, printCSSUsage } from "../writers/css.js";
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
 * Detect an existing assets folder in the project
 */
async function detectAssetsFolder(framework) {
  const candidates = ["src/assets", "assets", "public/assets", "src/public"];

  if (framework === "nextjs") return "public/fonts";

  for (const candidate of candidates) {
    const resolved = path.resolve(process.cwd(), candidate);
    if (await fs.pathExists(resolved)) {
      return `${candidate}/fonts`.replace(/\\/g, "/");
    }
  }

  const defaults = { css: "assets/fonts", react: "src/assets/fonts", nextjs: "public/fonts" };
  return defaults[framework];
}

/**
 * Auto-detect existing CSS files in the project
 */
async function detectCSSFiles(outputPath) {
  const found = new Set();

  // Also check the fonts output folder itself for an existing fonts.css
  if (outputPath) {
    const existingFontsCSS = path.join(outputPath, "fonts.css");
    if (await fs.pathExists(existingFontsCSS)) {
      found.add(path.relative(process.cwd(), existingFontsCSS).replace(/\\/g, "/"));
    }
  }

  for (const candidate of CSS_CANDIDATES) {
    const resolved = path.resolve(process.cwd(), candidate);
    if (await fs.pathExists(resolved)) found.add(candidate);
  }

  try {
    const rootFiles = await fs.readdir(process.cwd());
    for (const file of rootFiles) {
      if (file.endsWith(".css")) found.add(file);
    }
  } catch (_) {}

  const scanDirs = ["src", "styles", "css", "app"];
  for (const dir of scanDirs) {
    const dirPath = path.resolve(process.cwd(), dir);
    try {
      if (!(await fs.pathExists(dirPath))) continue;
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (file.endsWith(".css")) found.add(path.join(dir, file).replace(/\\/g, "/"));
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
    if (!(await fs.pathExists(pkgPath))) return false;
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

/**
 * Resolve and download a single font, return downloadedFiles or null on failure
 */
async function isFontInstalled(fontName, resolvedOutput) {
  try {
    if (!(await fs.pathExists(resolvedOutput))) return [];
    const files = await fs.readdir(resolvedOutput);
    const slug = fontName.replace(/\s+/g, "-").toLowerCase();
    const pattern = new RegExp(`^${slug}-\\d+\\.`, "i");
    return files.filter((f) => pattern.test(f));
  } catch (_) {
    return [];
  }
}

async function processSingleFont(fontName, weights, resolvedOutput) {
  // Check if font is already installed
  const installedFiles = await isFontInstalled(fontName, resolvedOutput);
  if (installedFiles.length > 0) {
    console.log(`\n  ${chalk.yellow(`⚠  "${fontName}" is already installed in this project.`)}`);
    console.log(`  ${chalk.gray("Found: " + installedFiles.join(", "))}`);
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: "Overwrite?",
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log(`  ${chalk.gray(`Skipped "${fontName}".\n`)}`);
      return null;
    }
    console.log();
  }

  const spinner = ora(`Looking up ${chalk.bold(fontName)}...`).start();

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

    if (err.premiumHint) {
      if (err.premiumHint.name) {
        console.log(`  ${chalk.yellow("This may be a premium font from")} ${chalk.bold(err.premiumHint.name)}`);
        console.log(`  ${chalk.gray("Get it at:")} ${chalk.cyan(err.premiumHint.url)}\n`);
      } else {
        console.log(`  ${chalk.yellow("This may be a premium or paid font not available in free sources.")}`);
        console.log(`  ${chalk.gray("Try searching at:")} ${chalk.cyan("https://fontspring.com")} ${chalk.gray("or")} ${chalk.cyan("https://myfonts.com")}\n`);
      }
    }

    return null;
  }

  const dlSpinner = ora(`Downloading ${chalk.bold(fontData.family)} files...`).start();
  try {
    const downloadedFiles = await downloadFonts(fontData, resolvedOutput);
    dlSpinner.succeed(chalk.green(`Downloaded ${downloadedFiles.length} file(s) for ${chalk.bold(fontData.family)}`));
    return { fontData, downloadedFiles };
  } catch (err) {
    dlSpinner.fail(chalk.red(`Failed to download ${fontName}: ${err.message}`));
    return null;
  }
}

/**
 * Main entry — handles one or more font names
 */
export async function addFonts(fontNames, weights) {
  const isMultiple = fontNames.length > 1;

  if (isMultiple) {
    console.log(chalk.gray(`  Installing ${fontNames.length} fonts: ${fontNames.join(", ")}\n`));
  } else {
    console.log(chalk.gray(`  Looking up "${fontNames[0]}" with weights: ${weights.join(", ")}\n`));
  }

  // Step 1 — Pick framework (once)
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

  // Step 2 — Framework detection check
  if (framework !== "css") {
    const installed = await detectFramework(framework);
    if (!installed) {
      printInstallGuide(framework);
      const { continueAnyway } = await inquirer.prompt([
        { type: "confirm", name: "continueAnyway", message: "Continue anyway?", default: false },
      ]);
      if (!continueAnyway) {
        console.log(`\n  ${chalk.gray("Aborted. Set up your project and run font-drop again.")}\n`);
        process.exit(0);
      }
    }
  }

  // Step 3 — Where to add font styles (once)
  const outputPath = await detectAssetsFolder(framework);
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

  // Step 4 — Auto-detect existing CSS file if needed (once)
  let existingCssPath = null;
  if (cssDestination === "existing") {
    const detectedFiles = await detectCSSFiles(resolvedOutput);
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

  // Step 5 — Process each font
  if (isMultiple) console.log();
  
  const results = [];
  for (const fontName of fontNames) {
    if (isMultiple) console.log(chalk.bold.gray(`  ── ${fontName} ──`));
    const result = await processSingleFont(fontName, weights, resolvedOutput);
    if (result) results.push(result);
    if (isMultiple) console.log();
  }

  if (results.length === 0) {
    console.log(chalk.red("  No fonts were installed.\n"));
    process.exit(1);
  }

  // Step 6 — Write framework config for all fonts at once
  const setupSpinner = ora("Wiring everything up...").start();
  try {
    for (let i = 0; i < results.length; i++) {
      const { fontData, downloadedFiles } = results[i];
      const context = {
        fontData,
        outputPath,
        resolvedOutput,
        weights,
        downloadedFiles,
        cssDestination,
        existingCssPath,
        generateHelper: true,
        isMultiple,
        isFirst: i === 0,
      };

      if (framework === "css") await writeCSS(context);
      else if (framework === "react") await writeReact(context);
      else if (framework === "nextjs") await writeNextjs(context);
    }

    setupSpinner.succeed(chalk.green("All done!"));

    // Print usage once for all fonts
    if (framework === "css") {
      printCSSUsage({ results, outputPath, cssDestination, existingCssPath });
    }

    const installedNames = results.map((r) => r.fontData.family).join(", ");
    console.log(`
${chalk.bold.hex("#6C63FF")("  font-drop complete ✨")}

  Font${results.length > 1 ? "s" : ""}:      ${chalk.bold(installedNames)}
  Weights:   ${weights.join(", ")}
  Framework: ${framework}
  Output:    ${chalk.cyan(outputPath)}

  ${chalk.gray("Your font classes are ready to use. Check the generated stylesheet for class names.")}
`);
  } catch (err) {
    setupSpinner.fail(chalk.red("Something went wrong during setup."));
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

// // Common CSS entry files to auto-detect, in priority order
// const CSS_CANDIDATES = [
//   "src/index.css",
//   "src/App.css",
//   "src/styles/global.css",
//   "src/styles/globals.css",
//   "styles/global.css",
//   "styles/globals.css",
//   "app/globals.css",
//   "pages/_app.css",
//   "css/main.css",
//   "assets/css/main.css",
// ];

// /**
//  * Auto-detect existing CSS files in the project
//  * Checks known candidates + root directory + one level deep in common folders
//  */
// async function detectCSSFiles() {
//   const found = new Set();

//   // Check known candidates first
//   for (const candidate of CSS_CANDIDATES) {
//     const resolved = path.resolve(process.cwd(), candidate);
//     if (await fs.pathExists(resolved)) {
//       found.add(candidate);
//     }
//   }

//   // Scan root directory for any .css files
//   try {
//     const rootFiles = await fs.readdir(process.cwd());
//     for (const file of rootFiles) {
//       if (file.endsWith(".css")) {
//         found.add(file);
//       }
//     }
//   } catch (_) {}

//   // Scan one level deep in common folders
//   const scanDirs = ["src", "styles", "css", "app"];
//   for (const dir of scanDirs) {
//     const dirPath = path.resolve(process.cwd(), dir);
//     try {
//       const dirExists = await fs.pathExists(dirPath);
//       if (!dirExists) continue;
//       const files = await fs.readdir(dirPath);
//       for (const file of files) {
//         if (file.endsWith(".css")) {
//           found.add(path.join(dir, file).replace(/\\/g, "/"));
//         }
//       }
//     } catch (_) {}
//   }

//   return [...found];
// }

// /**
//  * Detect if a framework is installed by checking package.json
//  */
// async function detectFramework(framework) {
//   try {
//     const pkgPath = path.resolve(process.cwd(), "package.json");
//     const exists = await fs.pathExists(pkgPath);
//     if (!exists) return false;

//     const pkg = await fs.readJson(pkgPath);
//     const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

//     if (framework === "react") return "react" in allDeps;
//     if (framework === "nextjs") return "next" in allDeps;
//     return true;
//   } catch (_) {
//     return false;
//   }
// }

// /**
//  * Print installation guide for a framework
//  */
// function printInstallGuide(framework) {
//   if (framework === "react") {
//     console.log(`
//   ${chalk.yellow("⚠  React doesn't appear to be installed in this project.")}

//   ${chalk.bold("To set up a React project, run one of the following:")}

//   ${chalk.cyan("Vite")} ${chalk.gray("(recommended)")}
//     npm create vite@latest my-app -- --template react

//   ${chalk.cyan("Create React App")}
//     npx create-react-app my-app
// `);
//   } else if (framework === "nextjs") {
//     console.log(`
//   ${chalk.yellow("⚠  Next.js doesn't appear to be installed in this project.")}

//   ${chalk.bold("To set up a Next.js project, run:")}

//   ${chalk.cyan("Create Next App")} ${chalk.gray("(recommended)")}
//     npx create-next-app@latest my-app
// `);
//   }
// }

// export async function addFont(fontName, weights) {
//   console.log(chalk.gray(`  Looking up "${fontName}" with weights: ${weights.join(", ")}\n`));

//   // Step 1 — Resolve font
//   const spinner = ora(`Searching for ${chalk.bold(fontName)}...`).start();
//   let fontData;

//   try {
//     fontData = await resolveFont(fontName, weights);
//     spinner.succeed(chalk.green(`Found "${fontData.family}" via ${fontData.source}`));
//   } catch (err) {
//     spinner.fail(chalk.red(`Could not find font "${fontName}".`));

//     if (err.suggestions && err.suggestions.length > 0) {
//       console.log(`\n  ${chalk.yellow("Did you mean?")}`);
//       err.suggestions.forEach((s) => console.log(`    ${chalk.cyan("→")} ${s}`));
//       console.log();
//     }

//     process.exit(1);
//   }

//   // Step 2 — Pick framework
//   const { framework } = await inquirer.prompt([
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
//   ]);

//   // Step 3 — Framework detection check
//   if (framework !== "css") {
//     const installed = await detectFramework(framework);

//     if (!installed) {
//       printInstallGuide(framework);

//       const { continueAnyway } = await inquirer.prompt([
//         {
//           type: "confirm",
//           name: "continueAnyway",
//           message: "Continue anyway?",
//           default: false,
//         },
//       ]);

//       if (!continueAnyway) {
//         console.log(`\n  ${chalk.gray("Aborted. Set up your project and run font-drop again.")}\n`);
//         process.exit(0);
//       }
//     }
//   }

//   // Step 4 — Where to add font styles
//   const outputPath = { css: "assets/fonts", react: "src/assets/fonts", nextjs: "public/fonts" }[framework];
//   const resolvedOutput = path.resolve(process.cwd(), outputPath);

//   let { cssDestination } = await inquirer.prompt([
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
//   ]);

//   // Step 5 — Auto-detect existing CSS file if needed
//   let existingCssPath = null;

//   if (cssDestination === "existing") {
//     const detectedFiles = await detectCSSFiles();

//     if (detectedFiles.length === 0) {
//       console.log(`\n  ${chalk.yellow("No CSS files found. A new fonts.css will be created instead.")}\n`);
//       cssDestination = "new";
//     } else if (detectedFiles.length === 1) {
//       existingCssPath = path.resolve(process.cwd(), detectedFiles[0]);
//       console.log(`\n  ${chalk.green("✔")} Found ${chalk.cyan(detectedFiles[0])} — font styles will be added there.\n`);
//     } else {
//       const { chosenFile } = await inquirer.prompt([
//         {
//           type: "list",
//           name: "chosenFile",
//           message: "Multiple CSS files found. Which one should font styles be added to?",
//           choices: detectedFiles,
//         },
//       ]);
//       existingCssPath = path.resolve(process.cwd(), chosenFile);
//     }
//   }

//   // Step 6 — Download fonts
//   const dlSpinner = ora("Downloading font files...").start();
//   try {
//     const downloadedFiles = await downloadFonts(fontData, resolvedOutput);
//     dlSpinner.succeed(chalk.green(`Downloaded ${downloadedFiles.length} font file(s) to ${chalk.bold(outputPath)}`));

//     // Step 7 — Framework-specific setup
//     const setupSpinner = ora("Wiring everything up...").start();
//     const context = {
//       fontData,
//       outputPath,
//       resolvedOutput,
//       weights,
//       downloadedFiles,
//       cssDestination,
//       existingCssPath,
//       generateHelper: true,
//     };

//     if (framework === "css") await writeCSS(context);
//     else if (framework === "react") await writeReact(context);
//     else if (framework === "nextjs") await writeNextjs(context);

//     setupSpinner.succeed(chalk.green("All done!"));

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














// // import inquirer from "inquirer";
// // import chalk from "chalk";
// // import ora from "ora";
// // import path from "path";
// // import fs from "fs-extra";
// // import { resolveFont } from "../resolvers/index.js";
// // import { downloadFonts } from "../downloaders/index.js";
// // import { writeCSS } from "../writers/css.js";
// // import { writeReact } from "../writers/react.js";
// // import { writeNextjs } from "../writers/nextjs.js";

// // export async function addFont(fontName, weights) {
// //   console.log(chalk.gray(`  Looking up "${fontName}" with weights: ${weights.join(", ")}\n`));

// //   // Step 1 — Resolve the font from available sources
// //   const spinner = ora(`Searching for ${chalk.bold(fontName)}...`).start();
// //   let fontData;

// //   try {
// //     fontData = await resolveFont(fontName, weights);
// //     spinner.succeed(chalk.green(`Found "${fontData.family}" via ${fontData.source}`));
// //   } catch (err) {
// //     spinner.fail(chalk.red(`Could not find font "${fontName}".`));

// //     // Show fuzzy suggestions if available
// //     if (err.suggestions && err.suggestions.length > 0) {
// //       console.log(`\n  ${chalk.yellow("Did you mean?")}`);
// //       err.suggestions.forEach((s) => console.log(`    ${chalk.cyan("→")} ${s}`));
// //       console.log();
// //     }

// //     process.exit(1);
// //   }

// //   // Step 2 — Prompts: framework, output path, CSS destination, helper option
// //   const answers = await inquirer.prompt([
// //     {
// //       type: "list",
// //       name: "framework",
// //       message: "Which framework are you using?",
// //       choices: [
// //         { name: "CSS (plain stylesheet)", value: "css" },
// //         { name: "React", value: "react" },
// //         { name: "Next.js", value: "nextjs" },
// //       ],
// //     },
// //     {
// //       type: "input",
// //       name: "outputPath",
// //       message: "Where should the font files be saved?",
// //       default: (ans) => {
// //         const defaults = {
// //           css: "assets/fonts",
// //           react: "src/assets/fonts",
// //           nextjs: "public/fonts",
// //         };
// //         return defaults[ans.framework];
// //       },
// //     },
// //     {
// //       type: "list",
// //       name: "cssDestination",
// //       message: "Where should the font styles be added?",
// //       choices: [
// //         { name: "Create a new fonts.css file (default)", value: "new" },
// //         { name: "Add to an existing CSS file", value: "existing" },
// //         { name: "Skip — I'll handle it myself", value: "skip" },
// //       ],
// //     },
// //     {
// //       type: "input",
// //       name: "existingCssPath",
// //       message: "Path to your existing CSS file:",
// //       when: (ans) => ans.cssDestination === "existing",
// //       validate: async (input) => {
// //         const resolved = path.resolve(process.cwd(), input);
// //         const exists = await fs.pathExists(resolved);
// //         return exists ? true : `File not found: ${input}`;
// //       },
// //     },
// //     {
// //       type: "confirm",
// //       name: "generateHelper",
// //       message: "Generate a fontHelper.js file?",
// //       default: true,
// //       when: (ans) => ans.framework === "react",
// //     },
// //   ]);

// //   const { framework, outputPath, cssDestination, existingCssPath, generateHelper } = answers;
// //   const resolvedOutput = path.resolve(process.cwd(), outputPath);

// //   // Step 3 — Download fonts
// //   const dlSpinner = ora("Downloading font files...").start();
// //   try {
// //     const downloadedFiles = await downloadFonts(fontData, resolvedOutput);
// //     dlSpinner.succeed(chalk.green(`Downloaded ${downloadedFiles.length} font file(s) to ${chalk.bold(outputPath)}`));

// //     // Step 4 — Framework-specific setup
// //     const setupSpinner = ora("Wiring everything up...").start();
// //     const context = {
// //       fontData,
// //       outputPath,
// //       resolvedOutput,
// //       weights,
// //       downloadedFiles,
// //       cssDestination,
// //       existingCssPath: existingCssPath ? path.resolve(process.cwd(), existingCssPath) : null,
// //       generateHelper: generateHelper !== false,
// //     };

// //     if (framework === "css") await writeCSS(context);
// //     else if (framework === "react") await writeReact(context);
// //     else if (framework === "nextjs") await writeNextjs(context);

// //     setupSpinner.succeed(chalk.green("All done!"));

// //     // Summary
// //     console.log(`
// // ${chalk.bold.hex("#6C63FF")("  font-drop complete ✨")}
  
// //   Font:       ${chalk.bold(fontData.family)}
// //   Weights:    ${weights.join(", ")}
// //   Framework:  ${framework}
// //   Output:     ${chalk.cyan(outputPath)}

// //   ${chalk.gray("Your font classes are ready to use. Check the generated stylesheet for class names.")}
// // `);
// //   } catch (err) {
// //     dlSpinner.fail(chalk.red("Something went wrong."));
// //     console.error(chalk.red(err.message));
// //     process.exit(1);
// //   }
// // }







