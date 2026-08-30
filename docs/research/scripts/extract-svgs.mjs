import { writeFile, mkdir } from 'node:fs/promises';
const html = await (await fetch('https://edmunhigh.framer.website/', {headers:{'user-agent':'Mozilla/5.0'}})).text();
const MAP = {
  svg9374711143: 'ornament-alumni',
  svg11324640047: 'ornament-cta',
  svg105813475_7897: 'logo-wordmark',
  svg8768843566: 'ornament-footer',
};
await mkdir('public/svg', { recursive: true });
for (const [id, name] of Object.entries(MAP)) {
  const i = html.indexOf(`id="${id}"`);
  if (i < 0) { console.log('MISS', id); continue; }
  const start = html.lastIndexOf('<svg', i);
  const end = html.indexOf('</svg>', i) + 6;
  let svg = html.slice(start, end);
  // strip framer token comments, keep the fallback rgb() value
  svg = svg.replace(/var\(--token-[a-f0-9-]+,\s*(rgb\([^)]*\))\)\s*\/\*[\s\S]*?\*\//g, '$1');
  svg = svg.replace(/\s*\/\*[\s\S]*?\*\//g, '');
  svg = svg.replace(new RegExp(`\s*id="${id}"`), '');
  if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  await writeFile(`public/svg/${name}.svg`, svg);
  console.log('ok', name, svg.length, 'bytes');
}
