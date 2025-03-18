"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBackupName = validateBackupName;
exports.validateDatabaseName = validateDatabaseName;
exports.validateCollectionName = validateCollectionName;
exports.validateProjectName = validateProjectName;
exports.validateTemplateName = validateTemplateName;
/**
 * Validates and sanitizes a backup name
 * @param name The backup name to validate
 * @returns Sanitized backup name
 * @throws Error if name is invalid
 */
function validateBackupName(name) {
    // Remove any path traversal attempts
    const sanitized = name.replace(/[/\\]/g, '-');
    // Remove any non-alphanumeric characters except dash and underscore
    const cleaned = sanitized.replace(/[^a-zA-Z0-9\-_]/g, '');
    // Ensure the name is not empty and not too long
    if (!cleaned || cleaned.length < 1) {
        throw new Error('Backup name must not be empty');
    }
    if (cleaned.length > 100) {
        throw new Error('Backup name must not exceed 100 characters');
    }
    return cleaned;
}
/**
 * Validates a MongoDB database name
 * @param name The database name to validate
 * @returns true if valid, false otherwise
 */
function validateDatabaseName(name) {
    // MongoDB database naming rules
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9_]*$/;
    return regex.test(name) && name.length <= 64;
}
/**
 * Validates a MongoDB collection name
 * @param name The collection name to validate
 * @returns true if valid, false otherwise
 */
function validateCollectionName(name) {
    // MongoDB collection naming rules
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9_]*$/;
    return regex.test(name) && name.length <= 128;
}
/**
 * Validates a project name
 * @param name The project name to validate
 * @returns Sanitized project name
 * @throws Error if name is invalid
 */
function validateProjectName(name) {
    // Remove any path traversal attempts
    const sanitized = name.replace(/[/\\]/g, '-');
    // Remove any non-alphanumeric characters except dash
    const cleaned = sanitized.replace(/[^a-zA-Z0-9\-]/g, '');
    // Ensure the name is not empty and not too long
    if (!cleaned || cleaned.length < 1) {
        throw new Error('Project name must not be empty');
    }
    if (cleaned.length > 100) {
        throw new Error('Project name must not exceed 100 characters');
    }
    return cleaned;
}
/**
 * Validates a template name
 * @param name The template name to validate
 * @returns Sanitized template name
 * @throws Error if name is invalid
 */
function validateTemplateName(name) {
    // Remove any path traversal attempts
    const sanitized = name.replace(/[/\\]/g, '-');
    // Remove any non-alphanumeric characters except dash
    const cleaned = sanitized.replace(/[^a-zA-Z0-9\-]/g, '');
    // Ensure the name is not empty and not too long
    if (!cleaned || cleaned.length < 1) {
        throw new Error('Template name must not be empty');
    }
    if (cleaned.length > 100) {
        throw new Error('Template name must not exceed 100 characters');
    }
    return cleaned;
}
