import fs from "fs-extra";
import path from "path";

/**
 * CSS framework setup:
 * - Generates @font-face declarations + utility classes
 * - Writes to new fonts.css, appends to existing, or skips
 */
export async function writeCSS({ fontData, outputPath, resolvedOutput, downloadedFiles, cssDestination, existingCssPath }) {
  const familySlug = fontData.family.replace(/\s+/g, "-").toLowerCase();

  if (cssDestination === "new") {
    const cssContent = generateFontCSS({ fontData, downloadedFiles, familySlug, urlPrefix: "./" });
    const cssFilePath = path.join(resolvedOutput, "fonts.css");
    await fs.writeFile(cssFilePath, cssContent, "utf8");
    console.log(`\n  Created: ${path.join(outputPath, "fonts.css")}`);
    console.log(`\n  Import in your HTML:`);
    console.log(`\n    <link rel="stylesheet" href="${path.join(outputPath, "fonts.css")}">`);
  } else if (cssDestination === "existing" && existingCssPath) {
    const cssDir = path.dirname(existingCssPath);
    const relativePrefix = path.relative(cssDir, resolvedOutput).replace(/\\/g, "/") + "/";
    const cssContent = generateFontCSS({ fontData, downloadedFiles, familySlug, urlPrefix: relativePrefix });
    const separator = `\n\n/* ── font-drop: ${fontData.family} ── */\n`;
    await fs.appendFile(existingCssPath, separator + cssContent, "utf8");
    console.log(`\n  Font styles appended to: ${existingCssPath}`);
  } else {
    console.log(`\n  Skipped CSS setup — add your @font-face declarations manually.`);
  }

  console.log(`\n  Use the classes in your HTML:`);
  console.log(`\n    <p class="font-${familySlug}">Hello World</p>`);
  for (const file of downloadedFiles) {
    console.log(`    <p class="font-${familySlug}-${file.weight}">Weight ${file.weight}</p>`);
  }
  console.log();
}

function generateFontCSS({ fontData, downloadedFiles, familySlug, urlPrefix }) {
  const lines = [];

  for (const file of downloadedFiles) {
    lines.push(`@font-face {`);
    lines.push(`  font-family: '${fontData.family}';`);
    lines.push(`  src: url('${urlPrefix}${file.fileName}') format('${file.format}');`);
    lines.push(`  font-weight: ${file.weight};`);
    lines.push(`  font-style: normal;`);
    lines.push(`  font-display: swap;`);
    lines.push(`}`);
    lines.push(``);
  }

  lines.push(`/* Utility classes */`);
  lines.push(``);
  lines.push(`.font-${familySlug} {`);
  lines.push(`  font-family: '${fontData.family}', sans-serif;`);
  lines.push(`}`);
  lines.push(``);

  for (const file of downloadedFiles) {
    lines.push(`.font-${familySlug}-${file.weight} {`);
    lines.push(`  font-family: '${fontData.family}', sans-serif;`);
    lines.push(`  font-weight: ${file.weight};`);
    lines.push(`}`);
    lines.push(``);
  }

  return lines.join("\n");
}