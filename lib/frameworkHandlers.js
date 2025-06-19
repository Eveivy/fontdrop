import { handleTailwind } from './handlers/handleTailwind.js';
import { handleVanillaCSS } from './handlers/handleVanillaCSS.js';

export const handlers = {
  tailwind: handleTailwind,
  css: handleVanillaCSS,
};
