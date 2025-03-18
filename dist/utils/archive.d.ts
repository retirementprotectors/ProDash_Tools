/**
 * Creates a zip archive from a source directory
 * @param sourceDir Directory to archive
 * @param outputPath Output path without extension
 */
export declare function createArchive(sourceDir: string, outputPath: string): Promise<void>;
/**
 * Extracts a zip archive to a target directory
 * @param sourcePath Path to the zip file
 * @param targetDir Directory to extract to
 */
export declare function extractArchive(sourcePath: string, targetDir: string): Promise<void>;
