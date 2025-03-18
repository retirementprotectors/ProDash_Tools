import { Vector } from './Vector';
export type Role = 'user' | 'assistant' | 'system' | 'tool';
export type Priority = 'low' | 'medium' | 'high';
export type Status = 'active' | 'archived' | 'deleted';
export type EntityType = 'function' | 'class' | 'variable' | 'concept' | 'problem' | 'solution' | 'pattern' | 'tool' | 'workflow';
export type RelationType = 'related' | 'depends_on' | 'blocked_by' | 'similar_to';
export type LearningType = 'pattern' | 'solution' | 'pitfall' | 'best_practice' | 'optimization' | 'architecture' | 'bug_pattern';
export type ActionType = 'tool_call' | 'code_edit' | 'command_execution' | 'system_change' | 'knowledge_update' | 'context_link';
export interface CodeReference {
    file: string;
    lines: [number, number];
    content: string;
    hash?: string;
    changeType?: 'added' | 'modified' | 'deleted';
}
export interface ProjectState {
    files: string[];
    gitHash: string;
    environment: Record<string, string>;
    dependencies: Record<string, string>;
    configState: Record<string, any>;
    systemMetrics: {
        memory: number;
        cpu: number;
        timestamp: number;
    };
}
export interface Action {
    id: string;
    type: ActionType;
    tool?: string;
    input: any;
    output: any;
    status: Status;
    startTime: number;
    endTime: number;
    impact: {
        filesChanged: string[];
        systemStateChanges: Record<string, any>;
        resourceUsage: {
            memory: number;
            cpu: number;
            duration: number;
        };
    };
    metadata: {
        retryCount?: number;
        errorDetails?: string;
        warnings?: string[];
        dependencies?: string[];
    };
}
export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}
export interface Entity {
    name: string;
    type: string;
    confidence: number;
    metadata?: Record<string, unknown>;
}
export interface Learning {
    content: string;
    source: string;
    timestamp: number;
    confidence?: number;
    metadata?: Record<string, unknown>;
}
export interface Outcome {
    content: string;
    status: Status;
    timestamp: number;
    metadata?: Record<string, unknown>;
}
export interface Relationship {
    type: RelationType;
    targetId: string;
    metadata?: Record<string, unknown>;
}
export interface ContextMetadata {
    title: string;
    description: string;
    project: string;
    tags: string[];
    priority: Priority;
    status: Status;
    created: number;
    updated: number;
    linkedContexts?: string[];
    metadata?: Record<string, unknown>;
}
export interface ContextKnowledge {
    entities: Entity[];
    learnings: Learning[];
    outcomes: Outcome[];
    relationships: Relationship[];
}
export interface ContextConversation {
    messages: ConversationMessage[];
    summary: string;
}
export interface VectorIndices {
    semantic: Vector;
    conceptual: Vector;
    temporal: Vector;
    categorical: Vector;
    custom?: Record<string, Vector>;
}
export interface EnhancedContext {
    id: string;
    session: {
        id: string;
        startTime: number;
        endTime: number;
        projectState: ProjectState;
        parentSession?: string;
        childSessions?: string[];
    };
    conversation: ContextConversation;
    knowledge: ContextKnowledge;
    metadata: ContextMetadata;
    vectorIndices: VectorIndices;
    schema: {
        version: string;
        compatibility: string[];
        migrations?: string[];
    };
    content: string;
    embedding: number[];
    messages?: ConversationMessage[];
    entities?: Entity[];
    learnings?: Learning[];
    outcomes?: Outcome[];
    relationships?: Relationship[];
    timestamp: number;
}
export interface ContextUpdate {
    content?: string;
    metadata?: Partial<ContextMetadata>;
    knowledge?: Partial<ContextKnowledge>;
    conversation?: Partial<ContextConversation>;
}
export type ContextMigration = (context: any) => Promise<EnhancedContext>;
export interface ContextKnowledge {
    entities: Entity[];
    learnings: Learning[];
    outcomes: Outcome[];
    relationships: Relationship[];
}
export interface ContextConversation {
    messages: ConversationMessage[];
    summary: string;
}
