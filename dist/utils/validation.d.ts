/**
 * Validates and sanitizes a backup name
 * @param name The backup name to validate
 * @returns Sanitized backup name
 * @throws Error if name is invalid
 */
export declare function validateBackupName(name: string): string;
/**
 * Validates a MongoDB database name
 * @param name The database name to validate
 * @returns true if valid, false otherwise
 */
export declare function validateDatabaseName(name: string): boolean;
/**
 * Validates a MongoDB collection name
 * @param name The collection name to validate
 * @returns true if valid, false otherwise
 */
export declare function validateCollectionName(name: string): boolean;
/**
 * Validates a project name
 * @param name The project name to validate
 * @returns Sanitized project name
 * @throws Error if name is invalid
 */
export declare function validateProjectName(name: string): string;
/**
 * Validates a template name
 * @param name The template name to validate
 * @returns Sanitized template name
 * @throws Error if name is invalid
 */
export declare function validateTemplateName(name: string): string;
