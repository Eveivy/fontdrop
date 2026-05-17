import axios from "axios";

const GOOGLE_FONTS_API = "https://fonts.googleapis.com/css2";
const BUNNY_FONTS_API = "https://fonts.bunny.net/css";
const GOOGLE_FONTS_LIST_API = "https://fonts.google.com/metadata/fonts";
const BUNNY_FONTS_LIST_API = "https://fonts.bunny.net/list";

/**
 * Resolves a font from available sources.
 * Chain: Google Fonts → Bunny Fonts
 */
export async function resolveFont(fontName, weights) {
  const sources = [
    () => resolveFromGoogle(fontName, weights),
    () => resolveFromBunny(fontName, weights),
  ];

  for (const trySource of sources) {
    try {
      const result = await trySource();
      if (result) return result;
    } catch (_) {
      continue;
    }
  }

  // Font not found — fetch suggestions
  const suggestions = await getFontSuggestions(fontName);
  const error = new Error(`Font "${fontName}" could not be found.`);
  error.suggestions = suggestions;
  throw error;
}

/**
 * Fetch font list and return fuzzy matches for a given name
 */
export async function getFontSuggestions(fontName) {
  const allFonts = await fetchAllFontNames();
  if (!allFonts.length) return [];
  return fuzzyMatch(fontName, allFonts, 4);
}

/**
 * Fetch font names from Google Fonts metadata, fallback to Bunny Fonts
 */
async function fetchAllFontNames() {
  // Try Google Fonts metadata
  try {
    const response = await axios.get(GOOGLE_FONTS_LIST_API, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const raw = typeof response.data === "string" ? response.data : JSON.stringify(response.data);

    // Google wraps response with )]}' prefix — strip it
    const cleaned = raw.replace(/^\s*\)\]\}'\s*/, "").trim();
    const json = JSON.parse(cleaned);

    if (json.familyMetadataList && json.familyMetadataList.length) {
      return json.familyMetadataList.map((f) => f.family);
    }
  } catch (_) {
    // fall through to Bunny
  }

  // Try Bunny Fonts list as fallback
  try {
    const response = await axios.get(BUNNY_FONTS_LIST_API, { timeout: 8000 });
    const data = response.data;
    // Bunny returns an object of { "font-slug": { ... } }
    return Object.values(data).map((f) => f.family || f.name).filter(Boolean);
  } catch (_) {
    return [];
  }
}

/**
 * Simple fuzzy matcher — finds closest font names by Dice coefficient
 */
function fuzzyMatch(input, list, limit = 4) {
  const inputLower = input.toLowerCase();

  const scored = list
    .map((name) => ({
      name,
      score: similarity(inputLower, name.toLowerCase()),
    }))
    .filter((f) => f.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((f) => f.name);
}

/**
 * Dice coefficient similarity between two strings (0–1)
 */
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
    const bCount = bBigrams.get(bigram) || 0;
    intersectionSize += Math.min(count, bCount);
  }

  return (2.0 * intersectionSize) / (a.length + b.length - 2);
}

/**
 * Resolve from Google Fonts API v2
 */
async function resolveFromGoogle(fontName, weights) {
  const family = `${fontName.replace(/ /g, "+")}:wght@${weights.join(";")}`;
  const url = `${GOOGLE_FONTS_API}?family=${family}&display=swap`;

  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    timeout: 8000,
  });

  if (response.status !== 200) throw new Error("Not found on Google Fonts");

  const cssText = response.data;
  const fontFiles = parseGoogleFontsCss(cssText, fontName, weights);

  if (!fontFiles.length) throw new Error("No font files parsed from Google Fonts");

  return {
    family: toTitleCase(fontName),
    source: "Google Fonts",
    weights,
    files: fontFiles,
    cssText,
  };
}

/**
 * Resolve from Bunny Fonts
 */
async function resolveFromBunny(fontName, weights) {
  const family = `${fontName.toLowerCase().replace(/ /g, "-")}:${weights.join(",")}`;
  const url = `${BUNNY_FONTS_API}?family=${family}&display=swap`;

  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    timeout: 8000,
  });

  if (response.status !== 200) throw new Error("Not found on Bunny Fonts");

  const cssText = response.data;
  const fontFiles = parseBunnyFontsCss(cssText, fontName, weights);

  if (!fontFiles.length) throw new Error("No font files parsed from Bunny Fonts");

  return {
    family: toTitleCase(fontName),
    source: "Bunny Fonts",
    weights,
    files: fontFiles,
    cssText,
  };
}

function parseGoogleFontsCss(cssText, fontName, weights) {
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

function parseBunnyFontsCss(cssText, fontName, weights) {
  return parseGoogleFontsCss(cssText, fontName, weights);
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}