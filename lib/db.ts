import fs from 'fs/promises';
import path from 'path';
import { IngestedDataset } from './types';

const DB_DIR = path.join(process.cwd(), '.aether-db');

async function ensureDbDir() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create DB dir', err);
  }
}

export async function saveDataset(dataset: IngestedDataset): Promise<void> {
  await ensureDbDir();
  const filePath = path.join(DB_DIR, `${dataset.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(dataset, null, 2), 'utf-8');
}

export async function getDataset(id: string): Promise<IngestedDataset | null> {
  try {
    const filePath = path.join(DB_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as IngestedDataset;
  } catch (err) {
    return null;
  }
}

export async function listDatasets(): Promise<IngestedDataset[]> {
  await ensureDbDir();
  try {
    const files = await fs.readdir(DB_DIR);
    const datasets: IngestedDataset[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(DB_DIR, file), 'utf-8');
        datasets.push(JSON.parse(data));
      }
    }
    return datasets;
  } catch (err) {
    return [];
  }
}
