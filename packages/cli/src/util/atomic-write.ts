import { chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function applySecureMode(filePath: string) {
  if (process.platform !== 'win32') {
    await chmod(filePath, 0o600);
  }
}

async function replaceFile(tempPath: string, destinationPath: string) {
  try {
    await rename(tempPath, destinationPath);
    await applySecureMode(destinationPath);
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

export async function writeTextAtomic(filePath: string, content: string) {
  await mkdir(path.dirname(filePath), { recursive: true });

  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempPath, content, 'utf8');
  await replaceFile(tempPath, filePath);
}

export async function writeJsonAtomic(filePath: string, value: unknown) {
  await writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function copyFileAtomic(sourcePath: string, destinationPath: string) {
  const content = await readFile(sourcePath, 'utf8');
  await writeTextAtomic(destinationPath, content);
}
