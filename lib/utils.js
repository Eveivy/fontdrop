// lib/utils.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export async function fetchFontCSS(fontName, weights = ['400']) {
  const family = fontName.replace(/\s+/g, '+');
  const weightParam = weights.join(';');
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weightParam}&display=swap`;

  try {
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error(`❌ Error fetching CSS for ${fontName}:`, err.message);
    return null;
  }
}

export function extractFontFiles(cssText) {
  const fontRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\) format\('woff2'\);/g;
  const urls = [];
  let match;
  while ((match = fontRegex.exec(cssText)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

export async function downloadFontFiles(urls, outDir) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const results = [];
  for (const url of urls) {
    const fileName = path.basename(url);
    const filePath = path.join(outDir, fileName);

    try {
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      fs.writeFileSync(filePath, res.data);
      results.push(filePath);
    } catch (err) {
      console.error(`❌ Failed to download ${fileName}:`, err.message);
    }
  }

  return results;
}
