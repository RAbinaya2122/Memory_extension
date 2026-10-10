import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATEGORY_FILE = path.join(__dirname, '../data/categories.json');

const DEFAULT_CATEGORIES = [
  { id: 'cat_coding', name: 'Coding' },
  { id: 'cat_design', name: 'Design' },
  { id: 'cat_image', name: 'Image' },
  { id: 'cat_video', name: 'Video' },
  { id: 'cat_audio', name: 'Audio' },
  { id: 'cat_writing', name: 'Writing' },
  { id: 'cat_research', name: 'Research' },
  { id: 'cat_productivity', name: 'Productivity' },
  { id: 'cat_marketing', name: 'Marketing' },
  { id: 'cat_education', name: 'Education' },
  { id: 'cat_automation', name: 'Automation' },
  { id: 'cat_presentation', name: 'Presentation' },
  { id: 'cat_developer_tools', name: 'Developer Tools' },
  { id: 'cat_other', name: 'Other' },
  { id: 'cat_icon', name: 'Icon' },
  { id: 'cat_uncategorized', name: 'Uncategorized' }
];

async function ensureCategoryFile() {
  try {
    const dir = path.dirname(CATEGORY_FILE);
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(CATEGORY_FILE);
    } catch {
      await fs.writeFile(CATEGORY_FILE, JSON.stringify(DEFAULT_CATEGORIES, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[CategoryStorage] Error ensuring category file:', err);
  }
}

export async function readCategories() {
  await ensureCategoryFile();
  try {
    const data = await fs.readFile(CATEGORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[CategoryStorage] Error reading categories file, fallback to default array:', err.message);
    return [...DEFAULT_CATEGORIES];
  }
}

export async function writeCategories(categories) {
  await ensureCategoryFile();
  const tempFile = `${CATEGORY_FILE}.tmp_${Date.now()}`;
  try {
    await fs.writeFile(tempFile, JSON.stringify(categories, null, 2), 'utf-8');
    await fs.rename(tempFile, CATEGORY_FILE);
    return true;
  } catch (err) {
    console.error('[CategoryStorage] Error writing categories:', err);
    try {
      await fs.unlink(tempFile);
    } catch {}
    throw err;
  }
}

export async function addCategory(name) {
  const categories = await readCategories();
  const normalizedName = name.trim();
  
  if (!normalizedName) {
    throw new Error('Category name cannot be empty');
  }

  const exists = categories.find(c => c.name.toLowerCase() === normalizedName.toLowerCase());
  if (exists) {
    throw new Error('Category already exists');
  }

  const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newCategory = { id, name: normalizedName };
  
  categories.push(newCategory);
  await writeCategories(categories);
  return newCategory;
}

export async function updateCategory(id, newName) {
  const categories = await readCategories();
  const normalizedName = newName.trim();
  
  if (!normalizedName) {
    throw new Error('Category name cannot be empty');
  }

  const existingIndex = categories.findIndex(c => c.id === id);
  if (existingIndex === -1) {
    throw new Error('Category not found');
  }

  // Check for duplicate name
  const duplicate = categories.find(c => c.id !== id && c.name.toLowerCase() === normalizedName.toLowerCase());
  if (duplicate) {
    throw new Error('Category name already in use');
  }

  const oldName = categories[existingIndex].name;
  categories[existingIndex].name = normalizedName;
  await writeCategories(categories);
  
  return { updatedCategory: categories[existingIndex], oldName, newName: normalizedName };
}

export async function deleteCategory(id) {
  const categories = await readCategories();
  const existingIndex = categories.findIndex(c => c.id === id);
  
  if (existingIndex === -1) {
    throw new Error('Category not found');
  }
  
  if (id === 'cat_uncategorized') {
    throw new Error('Cannot delete Uncategorized fallback category');
  }

  const deletedCategory = categories[existingIndex];
  categories.splice(existingIndex, 1);
  
  // Ensure Uncategorized exists if missing
  if (!categories.find(c => c.id === 'cat_uncategorized')) {
    categories.push({ id: 'cat_uncategorized', name: 'Uncategorized' });
  }

  await writeCategories(categories);
  return deletedCategory;
}
