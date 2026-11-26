/** Wraps SVG markup in an <svg> element; give width and height for tiles that repeat. */
export const svg = (viewBox: string, body: string, w?: number, h?: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${w ? ` width="${w}" height="${h}"` : ''}>${body}</svg>`;

/** An SVG string as an image URI. */
export const svgUri = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
