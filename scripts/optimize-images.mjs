import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';

const INPUT_DIR = 'public/images';
const CLOCKS_DIR = 'public/clocks';
const ASSETS_DIR = 'public/assets';
const MAX_WIDTH = 600;
const QUALITY = 80;

async function optimizeDir(dir) {
    try {
        await stat(dir);
    } catch {
        return;
    }

    const files = await readdir(dir);
    let optimized = 0;
    let skipped = 0;

    for (const file of files) {
        const ext = extname(file).toLowerCase();
        if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
            skipped++;
            continue;
        }

        const filepath = join(dir, file);
        const fileStat = await stat(filepath);

        // Skip small files (already optimized)
        if (fileStat.size < 50000) {
            skipped++;
            continue;
        }

        try {
            const image = sharp(filepath);
            const metadata = await image.metadata();

            // Only resize if wider than MAX_WIDTH
            const pipeline = metadata.width > MAX_WIDTH
                ? image.resize(MAX_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
                : image;

            if (ext === '.png') {
                await pipeline.png({ quality: QUALITY, compressionLevel: 9 }).toBuffer()
                    .then(buf => sharp(buf).toFile(filepath));
            } else {
                await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer()
                    .then(buf => sharp(buf).toFile(filepath));
            }

            const newStat = await stat(filepath);
            const saved = ((fileStat.size - newStat.size) / fileStat.size * 100).toFixed(1);
            console.log(`✓ ${file}: ${(fileStat.size / 1024).toFixed(0)}KB → ${(newStat.size / 1024).toFixed(0)}KB (-${saved}%)`);
            optimized++;
        } catch (err) {
            console.log(`✗ ${file}: ${err.message}`);
        }
    }

    console.log(`\n${dir}: ${optimized} optimized, ${skipped} skipped\n`);
}

console.log('Optimizing images...\n');
await optimizeDir(INPUT_DIR);
await optimizeDir(CLOCKS_DIR);
await optimizeDir(ASSETS_DIR);
console.log('Done!');
