import { EnhancedContext, ContextMigration } from '../types/Context';
/**
 * Migrates a legacy context to the enhanced format
 */
export declare const migrateLegacyContext: ContextMigration;
/**
 * Validates an enhanced context against the current schema
 */
export declare const validateContext: (context: EnhancedContext) => boolean;
/**
 * Updates an existing context to the latest schema version if needed
 */
export declare const ensureLatestSchema: (context: any) => Promise<EnhancedContext>;
