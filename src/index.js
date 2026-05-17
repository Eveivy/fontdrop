#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import { addFont } from "./commands/add.js";

console.log(chalk.bold.hex("#6C63FF")("\n  font-drop 🎯\n"));

program
  .name("font-drop")
  .description("Drop fonts into your frontend project instantly.")
  .version("1.0.0");

program
  .argument("<font-name>", "Name of the font to install (e.g. 'Inter', 'Roboto')")
  .option("-w, --weights <weights>", "Comma-separated font weights (e.g. 400,700)", "400")
  .action(async (fontName, options) => {
    const weights = options.weights
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    await addFont(fontName, weights);
  });

program.parse();
