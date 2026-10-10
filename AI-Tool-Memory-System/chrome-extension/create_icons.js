import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base64 transparent 1x1 purple PNG
const BASE64_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function createIcons() {
  const iconDir = path.join(__dirname, 'public/icons');
  await fs.mkdir(iconDir, { recursive: true });

  const buffer = Buffer.from(BASE64_PNG, 'base64');
  
  await fs.writeFile(path.join(iconDir, 'icon16.png'), buffer);
  await fs.writeFile(path.join(iconDir, 'icon48.png'), buffer);
  await fs.writeFile(path.join(iconDir, 'icon128.png'), buffer);

  console.log('✅ Created extension icons in public/icons/');
}

createIcons().catch(console.error);
