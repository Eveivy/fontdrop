export function parseFonts(fontArgs) {
  return fontArgs.map((fontStr) => {
    const [name, weightsRaw] = fontStr.split('@');
    const weights = weightsRaw ? weightsRaw.split(',') : 'all';
    return { name: name.trim().toLowerCase(), weights };
  });
}
