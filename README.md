# font-drop 🎯

> Drop fonts into your frontend project instantly — download, configure, and wire up in seconds.

## Install

```bash
npm install -g font-drop
```

## Usage

```bash
font-drop <font-name> [options]
```

### Examples

```bash
# Install Inter with default weight (400)
font-drop Inter

# Install Roboto with multiple weights
font-drop Roboto --weights 300,400,700

# Install a multi-word font
font-drop "Open Sans" --weights 400,600,800
```

## What it does

1. **Searches** for the font across Google Fonts, Bunny Fonts, and more
2. **Prompts** you to pick a framework (CSS / React / Next.js)
3. **Downloads** font files in WOFF2 format with fallbacks
4. **Generates** `@font-face` declarations, CSS variables, and utility classes
5. **Wires up** framework-specific config (e.g. `next/font/local` for Next.js)

## Framework outputs

### CSS
- `fonts.css` — `@font-face` + utility classes (`.font-inter`, `.font-inter-700`)

### React
- `fonts.css` — global stylesheet with CSS variables
- `fontHelper.js` — exported `fontFamily`, `fontWeights`, `fontClasses`

### Next.js
- `fontConfig.js` — `next/font/local` config (App Router)
- `fonts.css` — fallback stylesheet (Pages Router)

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--weights` | Comma-separated font weights | `400` |
| `--version` | Show version | |
| `--help` | Show help | |

## Font Sources

font-drop tries sources in this order:
1. **Google Fonts** — largest library
2. **Bunny Fonts** — privacy-friendly alternative

## License

MIT
