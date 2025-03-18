import { execSync } from 'child_process';
import { mkdirSync, copyFileSync, readdirSync, statSync, renameSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

class ProjectReorganizer {
  private basePath: string;
  private timestamp: string;

  constructor() {
    this.basePath = process.cwd();
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async reorganize() {
    try {
      // Create new directory structure
      this.createDirectoryStructure();
      
      // Move files to new structure
      this.moveFiles();
      
      // Clean up old directories
      this.cleanup();
      
      // Create git commit
      this.commitChanges();
      
      console.log('✅ Reorganization completed successfully!');
    } catch (error) {
      console.error('❌ Error during reorganization:', error);
      this.rollback();
    }
  }

  private createDirectoryStructure() {
    const directories = [
      'core/api',
      'core/auth',
      'core/cache',
      'core/database',
      'core/email',
      'plugins/crm',
      'plugins/pdf',
      'plugins/search',
      'plugins/media',
      'services/monitoring',
      'services/notification',
      'services/google-workspace',
      'context-keeper/dashboard',
      'context-keeper/backup',
      'context-keeper/monitoring',
      'context-keeper/api',
      'templates/basic',
      'templates/advanced',
      'templates/project_template'
    ];

    directories.forEach(dir => {
      const fullPath = join(this.basePath, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  private moveFiles() {
    // Move src contents to new structure
    const srcPath = join(this.basePath, 'src');
    if (!existsSync(srcPath)) {
      console.warn('Source directory does not exist, skipping file moves');
      return;
    }

    const moveMap = {
      'plugins/api': 'core/api',
      'plugins/auth': 'core/auth',
      'plugins/cache': 'core/cache',
      'plugins/database': 'core/database',
      'plugins/email': 'core/email',
      'plugins/crm': 'plugins/crm',
      'plugins/pdf': 'plugins/pdf',
      'plugins/search': 'plugins/search',
      'plugins/media': 'plugins/media',
      'plugins/monitoring': 'services/monitoring',
      'plugins/notification': 'services/notification',
      'plugins/google-workspace': 'services/google-workspace',
      'templates': 'templates'
    };

    Object.entries(moveMap).forEach(([src, dest]) => {
      const sourcePath = join(srcPath, src);
      const destPath = join(this.basePath, dest);
      
      try {
        if (existsSync(sourcePath) && statSync(sourcePath).isDirectory()) {
          // Move all contents
          const files = readdirSync(sourcePath);
          files.forEach(file => {
            const sourceFile = join(sourcePath, file);
            const destFile = join(destPath, file);
            if (!existsSync(destFile)) {
              renameSync(sourceFile, destFile);
            }
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not move ${src} to ${dest}:`, error);
      }
    });
  }

  private cleanup() {
    console.log('🧹 Cleaning up old directories...');

    const directoriesToClean = [
      'src',
      '.DS_Store',
      'node_modules/.package-lock.json',
      'node_modules/.bin',
      '__pycache__'
    ];

    directoriesToClean.forEach(dir => {
      const fullPath = join(this.basePath, dir);
      if (existsSync(fullPath)) {
        try {
          rmSync(fullPath, { recursive: true, force: true });
          console.log(`✅ Removed ${dir}`);
        } catch (error) {
          console.warn(`⚠️ Could not remove ${dir}:`, error);
        }
      }
    });

    // Clean up empty directories
    ['core', 'plugins', 'services', 'templates', 'context-keeper'].forEach(dir => {
      const dirPath = join(this.basePath, dir);
      if (existsSync(dirPath)) {
        readdirSync(dirPath).forEach(subdir => {
          const subdirPath = join(dirPath, subdir);
          if (statSync(subdirPath).isDirectory() && readdirSync(subdirPath).length === 0) {
            rmSync(subdirPath, { recursive: true, force: true });
            console.log(`✅ Removed empty directory ${dir}/${subdir}`);
          }
        });
      }
    });
  }

  private commitChanges() {
    try {
      // Configure git user if not already configured
      try {
        execSync('git config user.name');
      } catch {
        execSync('git config user.name "ProDash Tools"');
        execSync('git config user.email "prodash@tools.local"');
      }

      // Add all changes
      execSync('git add .');
      
      // Check if there are changes to commit
      const status = execSync('git status --porcelain').toString();
      if (status) {
        execSync(`git commit -m "refactor: reorganize project structure

- Reorganized directory structure
- Created core, plugins, services directories
- Integrated context-keeper system"`);
        console.log('✅ Changes committed to git');
      } else {
        console.log('No changes to commit');
      }
    } catch (error) {
      console.error('❌ Failed to commit changes:', error);
    }
  }

  private rollback() {
    console.log('🔄 Rolling back changes...');
    execSync('git reset --hard HEAD');
    console.log('✅ Rollback completed');
  }
}

// Run the reorganization
const reorganizer = new ProjectReorganizer();
reorganizer.reorganize(); 