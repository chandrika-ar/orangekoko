import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

async function imageFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return imageFiles(file);
    return /\.(png|jpe?g|webp|avif|gif)$/i.test(entry.name) ? [file] : [];
  }));
  return nested.flat();
}

test('public images contain nonempty, decodable image data', async () => {
  const failures = [];
  for (const file of await imageFiles('public')) {
    try {
      const bytes = await readFile(file);
      assert.ok(bytes.length > 0, 'empty image file');
      await sharp(bytes, { failOn: 'error' }).stats();
    } catch (error) {
      failures.push(`${file}: ${error.message}`);
    }
  }
  assert.deepEqual(failures, []);
});
