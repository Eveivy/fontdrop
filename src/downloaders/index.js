import axios from "axios";
import fs from "fs-extra";
import path from "path";

/**
 * Downloads font files to the output directory.
 * Saves WOFF2 (primary). Filenames follow: FontName-{weight}.woff2
 * Returns list of saved file metadata.
 */
export async function downloadFonts(fontData, outputDir) {
  await fs.ensureDir(outputDir);

  const savedFiles = [];
  const familySlug = fontData.family.replace(/\s+/g, "-");

  // Deduplicate by weight — Google Fonts returns multiple blocks per weight (unicode subsets)
  const seen = new Set();
  const uniqueFiles = fontData.files.filter((file) => {
    if (seen.has(file.weight)) return false;
    seen.add(file.weight);
    return true;
  });

  for (const file of uniqueFiles) {
    const ext = getExtension(file.format, file.url);
    const fileName = `${familySlug}-${file.weight}.${ext}`;
    const destPath = path.join(outputDir, fileName);

    const response = await axios.get(file.url, {
      responseType: "arraybuffer",
      timeout: 15000,
    });

    await fs.writeFile(destPath, response.data);

    savedFiles.push({
      fileName,
      weight: file.weight,
      format: ext,
      path: destPath,
    });
  }

  return savedFiles;
}

/**
 * Determine file extension from format string or URL
 */
function getExtension(format, url) {
  if (format) {
    if (format.includes("woff2")) return "woff2";
    if (format.includes("woff")) return "woff";
    if (format.includes("truetype") || format.includes("ttf")) return "ttf";
    if (format.includes("opentype") || format.includes("otf")) return "otf";
  }

  // Fallback: infer from URL
  const ext = url.split(".").pop().split("?")[0].toLowerCase();
  if (["woff2", "woff", "ttf", "otf"].includes(ext)) return ext;

  return "woff2"; // Safe default
}









// import axios from "axios";
// import fs from "fs-extra";
// import path from "path";

// /**
//  * Downloads font files to the output directory.
//  * Saves WOFF2 (primary). Filenames follow: FontName-{weight}.woff2
//  * Returns list of saved file metadata.
//  */
// export async function downloadFonts(fontData, outputDir) {
//   await fs.ensureDir(outputDir);

//   const savedFiles = [];
//   const familySlug = fontData.family.replace(/\s+/g, "-");

//   for (const file of fontData.files) {
//     const ext = getExtension(file.format, file.url);
//     const fileName = `${familySlug}-${file.weight}.${ext}`;
//     const destPath = path.join(outputDir, fileName);

//     const response = await axios.get(file.url, {
//       responseType: "arraybuffer",
//       timeout: 15000,
//     });

//     await fs.writeFile(destPath, response.data);

//     savedFiles.push({
//       fileName,
//       weight: file.weight,
//       format: ext,
//       path: destPath,
//     });
//   }

//   return savedFiles;
// }

// /**
//  * Determine file extension from format string or URL
//  */
// function getExtension(format, url) {
//   if (format) {
//     if (format.includes("woff2")) return "woff2";
//     if (format.includes("woff")) return "woff";
//     if (format.includes("truetype") || format.includes("ttf")) return "ttf";
//     if (format.includes("opentype") || format.includes("otf")) return "otf";
//   }

//   // Fallback: infer from URL
//   const ext = url.split(".").pop().split("?")[0].toLowerCase();
//   if (["woff2", "woff", "ttf", "otf"].includes(ext)) return ext;

//   return "woff2"; // Safe default
// }
