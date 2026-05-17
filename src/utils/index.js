/**
 * Shared utility functions for font-drop
 */

/**
 * Convert a font family name to a slug
 * e.g. "Open Sans" → "open-sans"
 */
export function toSlug(str) {
  return str.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Convert a font family name to camelCase
 * e.g. "Open Sans" → "openSans"
 */
export function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, "");
}

/**
 * Convert a font family name to TitleCase
 * e.g. "open sans" → "Open Sans"
 */
export function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Get a human-readable label for a font weight number
 */
export function weightLabel(weight) {
  const labels = {
    100: "Thin",
    200: "ExtraLight",
    300: "Light",
    400: "Regular",
    500: "Medium",
    600: "SemiBold",
    700: "Bold",
    800: "ExtraBold",
    900: "Black",
  };
  return labels[parseInt(weight)] || `W${weight}`;
}
