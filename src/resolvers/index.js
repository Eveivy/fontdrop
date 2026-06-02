import axios from "axios";

const GOOGLE_FONTS_API = "https://fonts.googleapis.com/css2";
const BUNNY_FONTS_API = "https://fonts.bunny.net/css";
const FONTSHARE_API = "https://api.fontshare.com/v2/css";
const FONTSOURCE_API = "https://api.fontsource.org/v1/fonts";
const FONTSQUIRREL_API = "https://www.fontsquirrel.com/api";

const GOOGLE_FONTS_LIST_API = "https://fonts.google.com/metadata/fonts";
const BUNNY_FONTS_LIST_API = "https://fonts.bunny.net/list";
const FONTSHARE_LIST_API = "https://api.fontshare.com/v2/fonts?page=1&limit=200";
const FONTSOURCE_LIST_API = "https://api.fontsource.org/v1/fonts?limit=200";

// Well-known premium font sources for helpful messaging
const PREMIUM_SOURCES = [
  { name: "Pangram Pangram Foundry", url: "https://pangrampangram.com", keywords: ["neue machina", "neue montreal", "neue haas", "editorial", "author"] },
  { name: "Klim Type Foundry", url: "https://klim.co.nz", keywords: ["tiempos", "financier", "national", "calibre"] },
  { name: "Grilli Type", url: "https://www.grillitype.com", keywords: ["gt walsheim", "gt flexa", "gt america", "gt alpina"] },
  { name: "Fontspring", url: "https://fontspring.com", keywords: [] },
  { name: "MyFonts", url: "https://myfonts.com", keywords: [] },
];

/**
 * Resolves a font from available sources.
 * Chain: Google Fonts → Bunny Fonts → Fontshare → Fontsource → Font Squirrel
 */
export async function resolveFont(fontName, weights) {
  const sources = [
    () => resolveFromGoogle(fontName, weights),
    () => resolveFromBunny(fontName, weights),
    () => resolveFromFontshare(fontName, weights),
    () => resolveFromFontsource(fontName, weights),
    () => resolveFromFontSquirrel(fontName, weights),
  ];

  for (const trySource of sources) {
    try {
      const result = await trySource();
      if (result) return result;
    } catch (_) {
      continue;
    }
  }

  // Font not found — fetch suggestions and check if it's premium
  const suggestions = await getFontSuggestions(fontName);
  const premiumHint = getPremiumHint(fontName);

  const error = new Error(`Font "${fontName}" could not be found.`);
  error.suggestions = suggestions;
  error.premiumHint = premiumHint;
  throw error;
}

/**
 * Check if the font name matches known premium foundries
 */
function getPremiumHint(fontName) {
  const lower = fontName.toLowerCase();
  for (const source of PREMIUM_SOURCES) {
    if (source.keywords.some((k) => lower.includes(k))) {
      return source;
    }
  }
  return { name: null, url: null, generic: true };
}

/**
 * Fetch font list from all sources and return fuzzy matches
 */
export async function getFontSuggestions(fontName) {
  const allFonts = await fetchAllFontNames();
  if (!allFonts.length) return [];
  return fuzzyMatch(fontName, allFonts, 4);
}

/**
 * Fetch font names from all sources
 */
async function fetchAllFontNames() {
  const fonts = new Set();

  // Google Fonts
  try {
    const response = await axios.get(GOOGLE_FONTS_LIST_API, {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0 Chrome/120.0.0.0" },
    });
    const raw = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
    const cleaned = raw.replace(/^\s*\)\]\}'\s*/, "").trim();
    const json = JSON.parse(cleaned);
    if (json.familyMetadataList) json.familyMetadataList.forEach((f) => fonts.add(f.family));
  } catch (_) { }

  // Bunny Fonts
  try {
    const response = await axios.get(BUNNY_FONTS_LIST_API, { timeout: 8000 });
    Object.values(response.data).forEach((f) => { if (f.family || f.name) fonts.add(f.family || f.name); });
  } catch (_) { }

  // Fontshare
  try {
    const response = await axios.get(FONTSHARE_LIST_API, { timeout: 8000 });
    if (response.data?.fonts) {
      response.data.fonts.forEach((f) => { if (f.family?.name || f.name) fonts.add(f.family?.name || f.name); });
    }
  } catch (_) { }

  // Fontsource
  try {
    const response = await axios.get(FONTSOURCE_LIST_API, { timeout: 8000 });
    if (Array.isArray(response.data)) {
      response.data.forEach((f) => { if (f.family) fonts.add(f.family); });
    }
  } catch (_) { }

  // Font Squirrel
  try {
    const response = await axios.get(`${FONTSQUIRREL_API}/fontlist/all`, { timeout: 8000 });
    if (Array.isArray(response.data)) {
      response.data.forEach((f) => { if (f.family_name) fonts.add(f.family_name); });
    }
  } catch (_) { }

  return [...fonts].filter(Boolean);
}

/**
 * Resolve from Google Fonts API v2
 */
async function resolveFromGoogle(fontName, weights) {
  const family = `${fontName.replace(/ /g, "+")}:wght@${weights.join(";")}`;
  const url = `${GOOGLE_FONTS_API}?family=${family}&display=swap`;
  const response = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
    timeout: 8000,
  });
  if (response.status !== 200) throw new Error("Not found on Google Fonts");
  const fontFiles = parseFontFaceCSS(response.data, weights);
  if (!fontFiles.length) throw new Error("No font files parsed from Google Fonts");
  return { family: toTitleCase(fontName), source: "Google Fonts", weights, files: fontFiles };
}

/**
 * Resolve from Bunny Fonts
 */
async function resolveFromBunny(fontName, weights) {
  const family = `${fontName.toLowerCase().replace(/ /g, "-")}:${weights.join(",")}`;
  const url = `${BUNNY_FONTS_API}?family=${family}&display=swap`;
  const response = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
    timeout: 8000,
  });
  if (response.status !== 200) throw new Error("Not found on Bunny Fonts");
  const fontFiles = parseFontFaceCSS(response.data, weights);
  if (!fontFiles.length) throw new Error("No font files parsed from Bunny Fonts");
  return { family: toTitleCase(fontName), source: "Bunny Fonts", weights, files: fontFiles };
}

/**
 * Resolve from Fontshare
 */
async function resolveFromFontshare(fontName, weights) {
  const slug = fontName.toLowerCase().replace(/ /g, "-");
  const url = `${FONTSHARE_API}?f[]=${slug}@${weights.join(",")}&display=swap`;
  const response = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
    timeout: 8000,
  });
  if (response.status !== 200) throw new Error("Not found on Fontshare");
  const fontFiles = parseFontFaceCSS(response.data, weights);
  if (!fontFiles.length) throw new Error("No font files parsed from Fontshare");
  return { family: toTitleCase(fontName), source: "Fontshare", weights, files: fontFiles };
}

/**
 * Resolve from Fontsource REST API
 */
async function resolveFromFontsource(fontName, weights) {
  // Search for the font
  const searchUrl = `${FONTSOURCE_API}?family=${encodeURIComponent(fontName)}`;
  const searchResponse = await axios.get(searchUrl, { timeout: 8000 });

  if (!Array.isArray(searchResponse.data) || searchResponse.data.length === 0) {
    throw new Error("Not found on Fontsource");
  }

  // Find exact or closest match
  const match = searchResponse.data.find(
    (f) => f.family.toLowerCase() === fontName.toLowerCase()
  ) || searchResponse.data[0];

  // Get full font details
  const detailUrl = `${FONTSOURCE_API}/${match.id}`;
  const detailResponse = await axios.get(detailUrl, { timeout: 8000 });
  const fontDetail = detailResponse.data;

  if (!fontDetail?.variants) throw new Error("No variants found on Fontsource");

  const fontFiles = [];
  for (const weight of weights) {
    const weightStr = String(weight);
    const variant = fontDetail.variants?.[weightStr]?.normal?.latin;
    if (variant?.url?.woff2) {
      fontFiles.push({ weight: weightStr, format: "woff2", url: variant.url.woff2 });
    }
  }

  if (!fontFiles.length) throw new Error("No matching weights found on Fontsource");
  return { family: fontDetail.family, source: "Fontsource", weights, files: fontFiles };
}

/**
 * Resolve from Font Squirrel API
 * Downloads the webfont kit zip and extracts WOFF2 URLs
 */
async function resolveFromFontSquirrel(fontName, weights) {
  const slug = fontName.toLowerCase().replace(/ /g, "-");

  // Check if font exists
  const familyUrl = `${FONTSQUIRREL_API}/familyinfo/${slug}`;
  const familyResponse = await axios.get(familyUrl, { timeout: 8000 });

  if (!familyResponse.data || familyResponse.data.error) throw new Error("Not found on Font Squirrel");

  const familyData = Array.isArray(familyResponse.data) ? familyResponse.data : [familyResponse.data];
  if (!familyData.length) throw new Error("Not found on Font Squirrel");

  // Get webfont kit CSS
  const cssUrl = `https://www.fontsquirrel.com/fonts/${slug}`;
  const cssResponse = await axios.get(`${FONTSQUIRREL_API}/fonts/${slug}`, { timeout: 8000 });

  if (!cssResponse.data) throw new Error("No fonts from Font Squirrel");

  const fonts = Array.isArray(cssResponse.data) ? cssResponse.data : [];
  const fontFiles = [];

  for (const font of fonts) {
    if (!font.urls) continue;
    const woff2Url = font.urls.find((u) => u.endsWith(".woff2"));
    if (woff2Url) {
      // Try to match weight from font name
      const weightMatch = font.font_style?.match(/\d{3}/) || ["400"];
      fontFiles.push({
        weight: weightMatch[0],
        format: "woff2",
        url: `https://www.fontsquirrel.com${woff2Url}`,
      });
    }
  }

  if (!fontFiles.length) throw new Error("No WOFF2 files from Font Squirrel");
  return { family: toTitleCase(fontName), source: "Font Squirrel", weights, files: fontFiles };
}

/**
 * Parse @font-face blocks from CSS response
 */
function parseFontFaceCSS(cssText, weights) {
  const fontFiles = [];
  const fontFaceRegex = /@font-face\s*\{([^}]+)\}/g;
  let match;

  while ((match = fontFaceRegex.exec(cssText)) !== null) {
    const block = match[1];
    const urlMatch = block.match(/src:\s*url\(([^)]+)\)/);
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const formatMatch = block.match(/format\(['"]?([^'")\s]+)['"]?\)/);

    if (urlMatch && weightMatch) {
      const weight = weightMatch[1];
      if (weights.includes(weight) || weights.includes(String(parseInt(weight)))) {
        fontFiles.push({
          weight,
          format: formatMatch ? formatMatch[1] : "woff2",
          url: urlMatch[1].replace(/['"]/g, ""),
        });
      }
    }
  }

  return fontFiles;
}

/**
 * Simple fuzzy matcher — Dice coefficient
 */
function fuzzyMatch(input, list, limit = 4) {
  const inputLower = input.toLowerCase();
  const scored = list
    .map((name) => ({ name, score: similarity(inputLower, name.toLowerCase()) }))
    .filter((f) => f.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((f) => f.name);
}

function similarity(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const getBigrams = (str) => {
    const bigrams = new Map();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.slice(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    return bigrams;
  };
  const aBigrams = getBigrams(a);
  const bBigrams = getBigrams(b);
  let intersectionSize = 0;
  for (const [bigram, count] of aBigrams) {
    intersectionSize += Math.min(count, bBigrams.get(bigram) || 0);
  }
  return (2.0 * intersectionSize) / (a.length + b.length - 2);
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
} 