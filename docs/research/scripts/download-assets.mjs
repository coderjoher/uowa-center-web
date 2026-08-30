import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const IMAGES = [
  ['ga1tVIaOMlqf4s8pJpGItUowI.svg', 'seo/favicon.svg'],
  ['zEcy5wk2Jhd5WvSEKk86U3YqljY.jpg', 'seo/og-image.jpg'],
  ['YDI397kSm5g22CE120eDurT9Gjc.png', 'images/hero-collage.png'],
  ['ZHe7I9aCpgqQUIrbZpJ07aYfm4Y.png', 'images/about-main.png'],
  ['rAFb1CKBsfYLU42D0iroAHnBgbw.png', 'images/about-deco.png'],
  ['9PsB7AjNmOh59ZtGiJrijsBtEA.svg', 'images/icon-academic.svg'],
  ['m2KHLeLGv2jAG8qvPItQN43Qpj8.svg', 'images/icon-faculty.svg'],
  ['Ocd7cLs5y7HWmTZlHDqbipQk7k.svg', 'images/icon-community.svg'],
  ['i1hP4L2pxQKtDQKGeC5hdDnHAQ.png', 'images/events-deco.png'],
  ['W8sFOcejXMgX09fOPQ0QC4nVPU.png', 'images/program-1.png'],
  ['UbpHFBDcvyz4GhIXfZRV4ZpeCkQ.png', 'images/program-2.png'],
  ['4nsGWvlrV6P5WHiz4r82WV83Ao.png', 'images/program-3.png'],
  ['iezqUHAULOUv9rNYTpasrGigcz4.png', 'images/program-4.png'],
  ['o9i6MReibe9SMwetzQR1Cphuwk.png', 'images/program-5.png'],
  ['UDBRJG58Io5w5UL7DshQFF9PlA.png', 'images/alumni-1.png'],
  ['239VEF4AsTFvNez1VaCWx7EVkw.png', 'images/alumni-2.png'],
  ['vVkK9Ql0wh842cBhQWFRClRjo.png', 'images/alumni-3.png'],
  ['ahI2eZHcL5fyoPSmVAuj54U9vyc.png', 'images/alumni-4.png'],
  ['6tTbkXggWgQCAJ4DO2QEdXXmgM.svg', 'images/icon-arrow-1.svg'],
  ['11KSGbIZoRSg4pjdnUoif6MKHI.svg', 'images/icon-arrow-2.svg'],
  ['1exlIVVYxQUOHn4B05CqFVZnz6o.png', 'images/gallery-1.png'],
  ['btfyww1tPQ7b1hYT1W9i0cKC5I.png', 'images/gallery-2.png'],
  ['ZSUWwO2T6k7eTx5zaVvx12K4ts.png', 'images/blog-1.png'],
  ['O4pqStZVnyEkx9TfKeRuFlwhaY.png', 'images/blog-2.png'],
];
const MEDIA = [['1NUM0vHEXjfGdZjgyvBYeip9A.mp4', 'videos/campus.mp4']];

async function get(url, dest) {
  const out = 'public/' + dest;
  if (existsSync(out)) return `skip ${dest}`;
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!r.ok) return `FAIL ${dest} ${r.status}`;
  const buf = Buffer.from(await r.arrayBuffer());
  await mkdir(out.split('/').slice(0, -1).join('/'), { recursive: true });
  await writeFile(out, buf);
  return `ok ${dest} ${(buf.length / 1024).toFixed(0)}KB`;
}

const jobs = [
  ...IMAGES.map(([f, d]) => () => get(`https://framerusercontent.com/images/${f}`, d)),
  ...MEDIA.map(([f, d]) => () => get(`https://framerusercontent.com/assets/${f}`, d)),
];
for (let i = 0; i < jobs.length; i += 4) {
  const res = await Promise.all(jobs.slice(i, i + 4).map((j) => j()));
  res.forEach((r) => console.log(r));
}
