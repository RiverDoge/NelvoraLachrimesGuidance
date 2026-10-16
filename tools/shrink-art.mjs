import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SITE = process.argv[2] || '_site';
const DATA = path.join(SITE, 'data', 'xeryos.json');
const PLACEHOLDER = 'assets/champion_art/Placeholder_12.png';
const SIZE = 400;

const made = new Map();

function thumbUrl(url) {
    return url.replace(/\.[^./]+$/, '.thumb.webp');
}

async function makeThumb(url) {
    if (!url) return '';
    if (made.has(url)) return made.get(url);
    const source = path.join(SITE, decodeURIComponent(url));
    const target = path.join(SITE, decodeURIComponent(thumbUrl(url)));
    await sharp(source)
        .resize({ width: SIZE, height: SIZE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(target);
    made.set(url, thumbUrl(url));
    return thumbUrl(url);
}

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
for (const champion of data.champions) {
    champion.emblemThumb = await makeThumb(champion.emblem);
    champion.leaderThumb = await makeThumb(champion.leaderArt);
}
data.placeholderThumb = await makeThumb(PLACEHOLDER);
fs.writeFileSync(DATA, JSON.stringify(data, null, 2));

const sizeOf = url => fs.statSync(path.join(SITE, decodeURIComponent(url))).size;
const before = [...made.keys()].reduce((total, url) => total + sizeOf(url), 0);
const after = [...made.values()].reduce((total, url) => total + sizeOf(url), 0);
console.log(`Made ${made.size} display copies: ${(before / 1048576).toFixed(1)} MB of art shown as ${(after / 1048576).toFixed(2)} MB`);
