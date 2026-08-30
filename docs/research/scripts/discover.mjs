const res = await fetch('https://edmunhigh.framer.website/', {headers:{'user-agent':'Mozilla/5.0'}});
const html = await res.text();
const urls = [...new Set([...html.matchAll(/https:\/\/framerusercontent\.com\/(?:images|assets|modules)\/[A-Za-z0-9._-]+/g)].map(m=>m[0]))];
const imgs = urls.filter(u=>/\.(png|jpe?g|webp|svg|avif|gif)$/i.test(u));
const media = urls.filter(u=>/\.(mp4|webm|mov)$/i.test(u));
const fonts = [...new Set([...html.matchAll(/https:\/\/framerusercontent\.com\/assets\/[A-Za-z0-9._-]+\.(?:woff2?|ttf)/g)].map(m=>m[0]))];
console.log(JSON.stringify({total:urls.length, imgs, media, fonts}, null, 1));
