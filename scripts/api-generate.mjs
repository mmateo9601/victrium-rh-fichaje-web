import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const templatePath = resolve(root, 'src/lib/api/generated.template.ts');
const outputPath = resolve(root, 'src/lib/api/generated.ts');

mkdirSync(dirname(outputPath), { recursive: true });
copyFileSync(templatePath, outputPath);
console.log(`Generated API client at ${outputPath}`);
