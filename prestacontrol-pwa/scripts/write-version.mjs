import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('public', { recursive: true });
await writeFile('public/version.json', JSON.stringify({ version: Date.now().toString() }) + '\n');
