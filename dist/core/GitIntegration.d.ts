interface GitConfig {
    enabled: boolean;
    autoCommit: boolean;
    autoCommitIntervalMs: number;
    remoteUrl?: string;
    branch: string;
    commitMessage: string;
}
export declare class GitIntegration {
    private config;
    private initialized;
    private commitInterval;
    private projectPath;
    private contextPath;
    constructor();
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    setConfig(config: Partial<GitConfig>): void;
    getConfig(): GitConfig;
    private startAutoCommit;
    commitContextChanges(): Promise<boolean>;
    pushChanges(): Promise<boolean>;
    initializeRepository(): Promise<boolean>;
    private isGitRepository;
    private hasCommits;
    private getCurrentBranch;
    private runGitCommand;
}
export {};
