import { Command } from 'commander';
export declare function deployProject(project: string, environment?: string): Promise<void>;
export declare function listDeployments(): Promise<void>;
export declare function setupDeployCommand(program: Command): void;
