# font-drop 🎯

> Drop fonts into your frontend project instantly — search, download, and wire up in seconds.

## Install

```bash
npm install -g font-drop
```

## Usage

```bash
font-drop <font-name(s)> [options]
```

### Examples

```bash
# Install a single font with default weight (400)
font-drop Inter

# Install with specific weights
font-drop Roboto --weights 300,400,700

# Install multiple fonts at once
font-drop Inter Roboto Lato --weights 400,700

# Install a multi-word font
font-drop "Open Sans" --weights 400,600,800

# Reset saved preferences and prompt again
font-drop Inter --reset
```

---

## What it does

1. **Searches** for the font across multiple free sources
2. **Prompts** you to pick a framework (CSS / React / Next.js)
3. **Detects** your existing project structure — assets folder, CSS files
4. **Downloads** font files in WOFF2 format
5. **Generates** `@font-face` declarations, CSS variables, and utility classes
6. **Wires up** framework-specific config automatically
7. **Saves** your preferences for future runs (optional)

---

## Font Sources

font-drop searches sources in this order, falling back to the next if not found:

| Source | Library Size |
|--------|-------------|
| Google Fonts | 1,500+ fonts |
| Bunny Fonts | Privacy-friendly Google Fonts mirror |
| Fontshare | High-quality free fonts from ITF |
| Fontsource | 1,500+ fonts via npm/REST API |
| Font Squirrel | 8,000+ commercial-free fonts |

If a font still isn't found, font-drop will:
- Suggest similarly named fonts (fuzzy matching)
- Tell you if it's likely a premium font and where to get it

---

## Framework Outputs

### CSS
- `fonts.css` — `@font-face` declarations + utility classes

```css
@font-face {
  font-family: 'Inter';
  src: url('./Inter-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

.font-inter { font-family: 'Inter', sans-serif; }
.font-inter-400 { font-family: 'Inter', sans-serif; font-weight: 400; }
.font-inter-700 { font-family: 'Inter', sans-serif; font-weight: 700; }
```

### React
- `fonts.css` — global stylesheet with `@font-face` + utility classes
- `fontHelper.js` — exported `fontFamily`, `fontWeights`, `fontClasses`

```jsx
// In main.jsx / index.jsx
import 'src/assets/fonts/fonts.css';

// Usage
<p className="font-inter">Hello World</p>
<p className="font-inter-700">Bold text</p>
```

### Next.js
- `fontConfig.js` — `next/font/local` config (App Router)
- `fonts.css` — fallback stylesheet (Pages Router)

```jsx
// app/layout.js
import { inter } from 'public/fonts/fontConfig.js';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Smart Features

### Framework Detection
font-drop checks your `package.json` to see if your chosen framework is installed. If not, it shows setup instructions and asks if you want to continue anyway.

### CSS File Detection
When adding styles to an existing file, font-drop automatically scans your project for CSS files — no need to type paths manually.

### Duplicate Detection
font-drop checks which font weights are already installed before downloading:
- **New weights** → installs automatically
- **Mix of new and existing** → shows what's new, asks about overwriting existing
- **All already installed** → asks if you want to overwrite

### Saved Preferences
After your first run, font-drop asks if you'd like to save your preferences (framework, output path, CSS destination) to `.fontdrop.json`. Future runs skip the prompts entirely.

```bash
# Reset saved preferences
font-drop Inter --reset
```

---

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--weights` | Comma-separated font weights | `400` |
| `--reset` | Ignore saved preferences and prompt again | — |
| `--version` | Show version | — |
| `--help` | Show help | — |

---

## Output Structure

```
your-project/
├── assets/fonts/          # CSS projects
│   ├── Inter-400.woff2
│   ├── Inter-700.woff2
│   └── fonts.css
├── src/assets/fonts/      # React projects
│   ├── Inter-400.woff2
│   ├── Inter-700.woff2
│   ├── fonts.css
│   └── fontHelper.js
└── public/fonts/          # Next.js projects
    ├── Inter-400.woff2
    ├── Inter-700.woff2
    ├── fontConfig.js
    └── fonts.css
```

---

## License

MIT











<!-- # font-drop 🎯

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

MIT -->
