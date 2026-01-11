import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function listFilesRecursive(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true })
  const files: string[] = []
  for (const e of entries) {
    const res = path.join(root, e.name)
    if (e.isDirectory()) {
      files.push(...(await listFilesRecursive(res)))
    } else {
      files.push(res)
    }
  }
  return files
}

export async function hashFile(filePath: string, algo = 'sha256') {
  const data = await fs.readFile(filePath)
  return crypto.createHash(algo).update(data).digest('hex')
}

export async function moveFileSafe(src: string, dest: string) {
  await ensureDir(path.dirname(dest))
  await fs.rename(src, dest)
}

export async function copyFileSafe(src: string, dest: string) {
  await ensureDir(path.dirname(dest))
  await fs.copyFile(src, dest)
}

export function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9.\-_]/gi, '_')
}
