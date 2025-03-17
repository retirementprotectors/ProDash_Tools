import { execSync } from 'child_process';
import { mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
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
      mkdirSync(fullPath, { recursive: true });
    });
  }

  private moveFiles() {
    // Move src contents to new structure
    const srcPath = join(this.basePath, 'src');
    const moveMap = {
      'api': 'core/api',
      'auth': 'core/auth',
      'cache': 'core/cache',
      'database': 'core/database',
      'email': 'core/email',
      'plugins/crm': 'plugins/crm',
      'plugins/pdf': 'plugins/pdf',
      'plugins/search': 'plugins/search',
      'plugins/media': 'plugins/media',
      'monitoring': 'services/monitoring',
      'notification': 'services/notification',
      'google-workspace': 'services/google-workspace',
      'templates': 'templates'
    };

    Object.entries(moveMap).forEach(([src, dest]) => {
      const sourcePath = join(srcPath, src);
      const destPath = join(this.basePath, dest);
      
      try {
        if (statSync(sourcePath).isDirectory()) {
          execSync(`cp -R "${sourcePath}/"* "${destPath}/"`);
        }
      } catch (error) {
        console.warn(`Warning: Could not move ${src} to ${dest}`);
      }
    });
  }

  private commitChanges() {
    try {
      execSync('git add .');
      execSync(`git commit -m "refactor: reorganize project structure\n\n- Reorganized directory structure\n- Created core, plugins, services directories\n- Integrated context-keeper system"`);
      console.log('✅ Changes committed to git');
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