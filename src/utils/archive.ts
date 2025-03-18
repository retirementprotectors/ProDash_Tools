import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import extract from 'extract-zip';

/**
 * Creates a zip archive from a source directory
 * @param sourceDir Directory to archive
 * @param outputPath Output path without extension
 */
export async function createArchive(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(`${outputPath}.zip`);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    output.on('close', () => resolve());
    archive.on('error', err => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Extracts a zip archive to a target directory
 * @param sourcePath Path to the zip file
 * @param targetDir Directory to extract to
 */
export async function extractArchive(sourcePath: string, targetDir: string): Promise<void> {
  await extract(sourcePath, {
    dir: path.resolve(targetDir),
  });
} 