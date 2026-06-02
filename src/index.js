#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import { addFonts } from "./commands/add.js";

console.log(chalk.bold.hex("#6C63FF")("\n  font-drop 🎯\n"));

program
  .name("font-drop")
  .description("Drop fonts into your frontend project instantly.")
  .version("1.0.0");

program
  .argument("<font-names...>", "One or more font names to install (e.g. Inter Roboto Lato)")
  .option("-w, --weights <weights>", "Comma-separated font weights (e.g. 400,700)", "400")
  .option("--reset", "Ignore saved preferences and prompt again")
  .action(async (fontNames, options) => {
    const weights = options.weights
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    await addFonts(fontNames, weights, { reset: options.reset });
  });

program.parse();




