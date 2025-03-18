import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { TEMPLATES, ProjectTemplate } from './template-config';

interface PackageJsonDependencies {
  [key: string]: string;
}

interface GeneratedPackageJson {
  name: string;
  version: string;
  description: string;
  dependencies: PackageJsonDependencies;
  devDependencies: PackageJsonDependencies;
  [key: string]: unknown;
}

export class TemplateGenerator {
  private templateRoot: string;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.templateRoot = path.join(__dirname, '../../../templates');
    this.projectRoot = projectRoot;
  }

  /**
   * Generate a new project from a template
   * @param templateType - The type of template to use (basic, advanced, or api)
   * @param projectName - The name of the project
   */
  async generateProject(templateType: keyof typeof TEMPLATES, projectName: string): Promise<void> {
    const template = TEMPLATES[templateType];
    if (!template) {
      throw new Error(`Unknown template type: ${templateType}`);
    }

    console.log(`Generating ${template.name} project: ${projectName}`);

    // Create project directory
    await fs.ensureDir(this.projectRoot);

    // Copy base template files
    await this.copyTemplateFiles(templateType);

    // Generate package.json
    await this.generatePackageJson(template, projectName);

    // Create feature directories and files
    await this.setupFeatures(template);

    // Initialize git repository
    this.initGit();

    console.log('Project generated successfully!');
    this.printNextSteps(projectName);
  }

  private async copyTemplateFiles(templateType: string): Promise<void> {
    const templateDir = path.join(this.templateRoot, `${templateType}-project`);
    await fs.copy(templateDir, this.projectRoot);
  }

  private async generatePackageJson(template: ProjectTemplate, projectName: string): Promise<void> {
    const packageJson: GeneratedPackageJson = {
      name: projectName,
      version: '1.0.0',
      description: `${template.name} created with ProDash Tools`,
      ...template.basePackageJson,
      dependencies: {},
      devDependencies: {}
    };

    // Add dependencies from features
    for (const feature of template.features) {
      feature.dependencies.forEach(dep => {
        packageJson.dependencies[dep] = '*';  // We'll let npm determine the version
      });
      feature.devDependencies.forEach(dep => {
        packageJson.devDependencies[dep] = '*';
      });
    }

    await fs.writeJson(path.join(this.projectRoot, 'package.json'), packageJson, { spaces: 2 });
  }

  private async setupFeatures(template: ProjectTemplate): Promise<void> {
    for (const feature of template.features) {
      // Create feature directories
      for (const dir of feature.files) {
        await fs.ensureDir(path.join(this.projectRoot, dir));
      }

      // Copy feature-specific files if they exist
      const featureTemplateDir = path.join(this.templateRoot, 'features', feature.name.toLowerCase().replace(/\s+/g, '-'));
      if (await fs.pathExists(featureTemplateDir)) {
        await fs.copy(featureTemplateDir, this.projectRoot);
      }
    }
  }

  private initGit(): void {
    try {
      execSync('git init', { cwd: this.projectRoot });
      execSync('git add .', { cwd: this.projectRoot });
      execSync('git commit -m "Initial commit from ProDash Tools"', { cwd: this.projectRoot });
    } catch (error) {
      console.warn('Warning: Could not initialize git repository');
    }
  }

  private printNextSteps(projectName: string): void {
    console.log('\nNext steps:');
    console.log(`1. cd ${projectName}`);
    console.log('2. npm install');
    console.log('3. npm run dev');
    console.log('\nAvailable commands:');
    console.log('- npm run dev      # Start development server');
    console.log('- npm run build    # Build for production');
    console.log('- npm test         # Run tests');
  }
} 