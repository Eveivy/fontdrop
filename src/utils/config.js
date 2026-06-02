import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

const CONFIG_FILE = ".fontdrop.json";

/**
 * Load saved preferences from .fontdrop.json in the project root
 * Returns null if config doesn't exist or saved paths are no longer valid
 */
export async function loadConfig() {
  try {
    const configPath = path.resolve(process.cwd(), CONFIG_FILE);
    if (!(await fs.pathExists(configPath))) return null;

    const config = await fs.readJson(configPath);

    // Validate that the saved output path still exists
    if (config.outputPath) {
      const resolvedOutput = path.resolve(process.cwd(), config.outputPath);
      if (!(await fs.pathExists(resolvedOutput))) {
        console.log(`  ${chalk.yellow("⚠  Saved output path \"" + config.outputPath + "\" no longer exists.")}`);
        console.log(`  ${chalk.gray("Saved preferences will be ignored. You will be prompted again.\n")}`);
        return null;
      }
    }

    // Validate existing CSS path if set
    if (config.existingCssPath) {
      const resolvedCss = path.resolve(process.cwd(), config.existingCssPath);
      if (!(await fs.pathExists(resolvedCss))) {
        console.log(`  ${chalk.yellow("⚠  Saved CSS file \"" + config.existingCssPath + "\" no longer exists.")}`);
        console.log(`  ${chalk.gray("Saved preferences will be ignored. You will be prompted again.\n")}`);
        return null;
      }
    }

    return config;
  } catch (_) {
    return null;
  }
}

/**
 * Delete .fontdrop.json from the project root
 */
export async function deleteConfig() {
  try {
    const configPath = path.resolve(process.cwd(), CONFIG_FILE);
    if (await fs.pathExists(configPath)) {
      await fs.remove(configPath);
    }
  } catch (_) {}
}
export async function saveConfig(config) {
  try {
    const configPath = path.resolve(process.cwd(), CONFIG_FILE);
    await fs.writeJson(configPath, config, { spaces: 2 });
  } catch (_) {}
}

/**
 * Print a summary of the loaded config
 */
export function printLoadedConfig(config) {
  console.log(`  ${chalk.green("✔")} Using saved preferences:`);
  console.log(`    Framework:  ${chalk.cyan(config.framework)}`);
  console.log(`    Output:     ${chalk.cyan(config.outputPath)}`);
  if (config.cssDestination === "existing" && config.existingCssPath) {
    console.log(`    Styles:     ${chalk.cyan(config.existingCssPath)}`);
  } else if (config.cssDestination === "new") {
    console.log(`    Styles:     ${chalk.cyan("New fonts.css")}`);
  } else {
    console.log(`    Styles:     ${chalk.cyan("Skipped")}`);
  }
  console.log(`\n  ${chalk.gray("Run with --reset to change preferences.")}\n`);
}