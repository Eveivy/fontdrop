import fs from "fs-extra";
import path from "path";

/**
 * CSS framework setup:
 * - First font creates fonts.css, subsequent fonts append to it
 * - Or appends to an existing CSS file
 * - Silent when part of a multi-font install (verbose handled by add.js)
 */
export async function writeCSS({ fontData, outputPath, resolvedOutput, downloadedFiles, cssDestination, existingCssPath, isMultiple, isFirst }) {
  const familySlug = fontData.family.replace(/\s+/g, "-").toLowerCase();
  const cssFilePath = path.join(resolvedOutput, "fonts.css");

  if (cssDestination === "new") {
    const cssContent = generateFontCSS({ fontData, downloadedFiles, familySlug, urlPrefix: "./" });

    // First font creates the file, subsequent fonts append
    if (isFirst) {
      await fs.writeFile(cssFilePath, cssContent, "utf8");
    } else {
      const separator = `\n/* ── font-drop: ${fontData.family} ── */\n`;
      await fs.appendFile(cssFilePath, separator + cssContent, "utf8");
    }

  } else if (cssDestination === "existing" && existingCssPath) {
    const cssDir = path.dirname(existingCssPath);
    const relativePrefix = path.relative(cssDir, resolvedOutput).replace(/\\/g, "/") + "/";
    const cssContent = generateFontCSS({ fontData, downloadedFiles, familySlug, urlPrefix: relativePrefix });
    const separator = `\n\n/* ── font-drop: ${fontData.family} ── */\n`;
    await fs.appendFile(existingCssPath, separator + cssContent, "utf8");
  }
  // skip = do nothing
}

/**
 * Print usage instructions once after all fonts are installed
 */
export function printCSSUsage({ results, outputPath, cssDestination, existingCssPath }) {
  const cssFilePath = cssDestination === "existing" && existingCssPath
    ? existingCssPath
    : path.join(outputPath, "fonts.css");

  if (cssDestination !== "skip") {
    console.log(`\n  ${cssDestination === "existing" ? "Font styles appended to:" : "Created:"} ${cssFilePath}`);
    console.log(`\n  Import in your HTML:`);
    console.log(`\n    <link rel="stylesheet" href="${cssFilePath.replace(/\\/g, "/")}">`);
  }

  console.log(`\n  Use the classes in your HTML:\n`);
  for (const { fontData, downloadedFiles } of results) {
    const familySlug = fontData.family.replace(/\s+/g, "-").toLowerCase();
    console.log(`    ${chalk_comment(`/* ${fontData.family} */`)}`);
    console.log(`    <p class="font-${familySlug}">Hello World</p>`);
    for (const file of downloadedFiles) {
      console.log(`    <p class="font-${familySlug}-${file.weight}">Weight ${file.weight}</p>`);
    }
    console.log();
  }
}

function chalk_comment(str) { return str; }

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





// import fs from "fs-extra";
// import path from "path";

// /**
//  * CSS framework setup:
//  * - Generates @font-face declarations + utility classes
//  * - Writes to new fonts.css, appends to existing, or skips
//  */
// export async function writeCSS({ fontData, outputPath, resolvedOutput, downloadedFiles, cssDestination, existingCssPath }) {
//   const familySlug = fontData.family.replace(/\s+/g, "-").toLowerCase();

//   if (cssDestination === "new") {
//     const cssContent = generateFontCSS({ fontData, downloadedFiles, familySlug, urlPrefix: "./" });
//     const cssFilePath = path.join(resolvedOutput, "fonts.css");
//     await fs.writeFile(cssFilePath, cssContent, "utf8");
//     console.log(`\n  Created: ${path.join(outputPath, "fonts.css")}`);
//     console.log(`\n  Import in your HTML:`);
//     console.log(`\n    <link rel="stylesheet" href="${path.join(outputPath, "fonts.css")}">`);
//   } else if (cssDestination === "existing" && existingCssPath) {
//     const cssDir = path.dirname(existingCssPath);
//     const relativePrefix = path.relative(cssDir, resolvedOutput).replace(/\\/g, "/") + "/";
//     const cssContent = generateFontCSS({ fontData, downloadedFiles, familySlug, urlPrefix: relativePrefix });
//     const separator = `\n\n/* ── font-drop: ${fontData.family} ── */\n`;
//     await fs.appendFile(existingCssPath, separator + cssContent, "utf8");
//     console.log(`\n  Font styles appended to: ${existingCssPath}`);
//   } else {
//     console.log(`\n  Skipped CSS setup — add your @font-face declarations manually.`);
//   }

//   console.log(`\n  Use the classes in your HTML:`);
//   console.log(`\n    <p class="font-${familySlug}">Hello World</p>`);
//   for (const file of downloadedFiles) {
//     console.log(`    <p class="font-${familySlug}-${file.weight}">Weight ${file.weight}</p>`);
//   }
//   console.log();
// }

// function generateFontCSS({ fontData, downloadedFiles, familySlug, urlPrefix }) {
//   const lines = [];

//   for (const file of downloadedFiles) {
//     lines.push(`@font-face {`);
//     lines.push(`  font-family: '${fontData.family}';`);
//     lines.push(`  src: url('${urlPrefix}${file.fileName}') format('${file.format}');`);
//     lines.push(`  font-weight: ${file.weight};`);
//     lines.push(`  font-style: normal;`);
//     lines.push(`  font-display: swap;`);
//     lines.push(`}`);
//     lines.push(``);
//   }

//   lines.push(`/* Utility classes */`);
//   lines.push(``);
//   lines.push(`.font-${familySlug} {`);
//   lines.push(`  font-family: '${fontData.family}', sans-serif;`);
//   lines.push(`}`);
//   lines.push(``);

//   for (const file of downloadedFiles) {
//     lines.push(`.font-${familySlug}-${file.weight} {`);
//     lines.push(`  font-family: '${fontData.family}', sans-serif;`);
//     lines.push(`  font-weight: ${file.weight};`);
//     lines.push(`}`);
//     lines.push(``);
//   }

//   return lines.join("\n");
// }