"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArchive = createArchive;
exports.extractArchive = extractArchive;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const extract_zip_1 = __importDefault(require("extract-zip"));
/**
 * Creates a zip archive from a source directory
 * @param sourceDir Directory to archive
 * @param outputPath Output path without extension
 */
async function createArchive(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
        const output = fs_extra_1.default.createWriteStream(`${outputPath}.zip`);
        const archive = (0, archiver_1.default)('zip', {
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
async function extractArchive(sourcePath, targetDir) {
    await (0, extract_zip_1.default)(sourcePath, {
        dir: path_1.default.resolve(targetDir),
    });
}
