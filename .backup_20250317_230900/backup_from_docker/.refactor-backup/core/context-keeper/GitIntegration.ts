import { exec } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GitConfig {
  enabled: boolean;
  autoCommit: boolean;
  autoCommitIntervalMs: number; // Default: 1 hour
  remoteUrl?: string;
  branch: string;
  commitMessage: string;
}

export class GitIntegration {
  private config: GitConfig;
  private initialized: boolean = false;
  private commitInterval: NodeJS.Timeout | null = null;
  private projectPath: string;
  private contextPath: string;
  
  constructor() {
    this.projectPath = process.cwd();
    this.contextPath = join(this.projectPath, '.context-keeper');
    
    // Default configuration
    this.config = {
      enabled: false,
      autoCommit: false,
      autoCommitIntervalMs: 60 * 60 * 1000, // 1 hour
      branch: 'main',
      commitMessage: 'Update context [automated commit]'
    };
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Check if git is installed
      await this.runGitCommand('--version');
      
      // Check if the context path exists
      if (!existsSync(this.contextPath)) {
        mkdirSync(this.contextPath, { recursive: true });
      }
      
      // Check if this is a git repository
      if (!await this.isGitRepository()) {
        console.log('Not a git repository. Git integration features will be limited.');
      } else {
        console.log('Git repository detected.');
        
        // Start auto-commit if enabled
        if (this.config.enabled && this.config.autoCommit) {
          this.startAutoCommit();
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Git integration:', error);
      console.log('Git integration will be disabled.');
      this.config.enabled = false;
      this.initialized = true;
    }
  }
  
  async shutdown(): Promise<void> {
    if (this.commitInterval) {
      clearInterval(this.commitInterval);
      this.commitInterval = null;
    }
  }
  
  setConfig(config: Partial<GitConfig>): void {
    this.config = { ...this.config, ...config };
    
    // If integration is already initialized, update the auto-commit settings
    if (this.initialized && this.config.enabled) {
      // Stop existing auto-commit interval if running
      if (this.commitInterval) {
        clearInterval(this.commitInterval);
        this.commitInterval = null;
      }
      
      // Restart auto-commit if enabled
      if (this.config.autoCommit) {
        this.startAutoCommit();
      }
    }
  }
  
  getConfig(): GitConfig {
    return { ...this.config };
  }
  
  private startAutoCommit(): void {
    if (this.commitInterval) {
      console.log('Auto-commit already running. Skipping initialization.');
      return;
    }
    
    console.log(`Starting automatic Git commits every ${this.config.autoCommitIntervalMs / (60 * 1000)} minutes`);
    
    // Schedule the first commit to happen soon
    const initialCommitTimeout = setTimeout(() => {
      this.commitContextChanges();
      clearTimeout(initialCommitTimeout);
    }, 10000);
    
    // Set up regular interval for future commits
    this.commitInterval = setInterval(
      () => this.commitContextChanges(),
      this.config.autoCommitIntervalMs
    );
  }
  
  async commitContextChanges(): Promise<boolean> {
    if (!this.config.enabled) return false;
    
    try {
      console.log('Committing context changes to Git repository...');
      
      // Stage changes in the context-keeper directory
      await this.runGitCommand('add', ['.context-keeper']);
      
      // Check if there are changes to commit
      const statusOutput = await this.runGitCommand('status', ['--porcelain', '.context-keeper']);
      
      if (!statusOutput.trim()) {
        console.log('No changes to commit.');
        return false;
      }
      
      // Commit the changes
      await this.runGitCommand('commit', ['-m', this.config.commitMessage]);
      console.log('Changes committed successfully.');
      
      // Push to remote if configured
      if (this.config.remoteUrl) {
        await this.pushChanges();
      }
      
      return true;
    } catch (error) {
      console.error('Error committing context changes:', error);
      return false;
    }
  }
  
  async pushChanges(): Promise<boolean> {
    if (!this.config.enabled || !this.config.remoteUrl) return false;
    
    try {
      console.log('Pushing changes to remote repository...');
      
      // Check if the remote exists
      const remoteOutput = await this.runGitCommand('remote');
      
      if (!remoteOutput.includes('origin')) {
        // Add the remote if it doesn't exist
        await this.runGitCommand('remote', ['add', 'origin', this.config.remoteUrl]);
      } else {
        // Update the URL if the remote exists
        await this.runGitCommand('remote', ['set-url', 'origin', this.config.remoteUrl]);
      }
      
      // Push the changes
      await this.runGitCommand('push', ['--set-upstream', 'origin', this.config.branch]);
      
      console.log('Changes pushed to remote repository.');
      return true;
    } catch (error) {
      console.error('Error pushing changes to remote repository:', error);
      return false;
    }
  }
  
  async initializeRepository(): Promise<boolean> {
    try {
      if (await this.isGitRepository()) {
        console.log('Git repository already initialized.');
        return true;
      }
      
      console.log('Initializing Git repository...');
      
      // Initialize the repository
      await this.runGitCommand('init');
      
      // Create an initial commit if there are no commits yet
      const hasCommits = await this.hasCommits();
      
      if (!hasCommits) {
        // Stage all files
        await this.runGitCommand('add', ['.']);
        
        // Create the initial commit
        await this.runGitCommand('commit', ['-m', 'Initial commit']);
        
        console.log('Created initial commit.');
      }
      
      // Configure the branch name if needed
      const currentBranch = await this.getCurrentBranch();
      
      if (currentBranch !== this.config.branch) {
        await this.runGitCommand('branch', ['-M', this.config.branch]);
        console.log(`Renamed branch to ${this.config.branch}.`);
      }
      
      console.log('Git repository initialized successfully.');
      return true;
    } catch (error) {
      console.error('Error initializing Git repository:', error);
      return false;
    }
  }
  
  private async isGitRepository(): Promise<boolean> {
    try {
      await this.runGitCommand('rev-parse', ['--is-inside-work-tree']);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  private async hasCommits(): Promise<boolean> {
    try {
      await this.runGitCommand('rev-parse', ['--verify', 'HEAD']);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  private async getCurrentBranch(): Promise<string> {
    try {
      const output = await this.runGitCommand('rev-parse', ['--abbrev-ref', 'HEAD']);
      return output.trim();
    } catch (error) {
      return '';
    }
  }
  
  private async runGitCommand(command: string, args: string[] = []): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`git ${command} ${args.join(' ')}`, {
        cwd: this.projectPath
      });
      
      if (stderr && !stdout) {
        throw new Error(stderr);
      }
      
      return stdout;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Git command failed: ${error.message}`);
      }
      throw error;
    }
  }
} 