"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateGenerator = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const template_config_1 = require("./template-config");
class TemplateGenerator {
    constructor(projectRoot) {
        this.templateRoot = path_1.default.join(__dirname, '../../../templates');
        this.projectRoot = projectRoot;
    }
    /**
     * Generate a new project from a template
     * @param templateType - The type of template to use (basic, advanced, or api)
     * @param projectName - The name of the project
     */
    async generateProject(templateType, projectName) {
        const template = template_config_1.TEMPLATES[templateType];
        if (!template) {
            throw new Error(`Unknown template type: ${templateType}`);
        }
        console.log(`Generating ${template.name} project: ${projectName}`);
        // Create project directory
        await fs_extra_1.default.ensureDir(this.projectRoot);
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
    async copyTemplateFiles(templateType) {
        const templateDir = path_1.default.join(this.templateRoot, `${templateType}-project`);
        await fs_extra_1.default.copy(templateDir, this.projectRoot);
    }
    async generatePackageJson(template, projectName) {
        const packageJson = {
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
                packageJson.dependencies[dep] = '*'; // We'll let npm determine the version
            });
            feature.devDependencies.forEach(dep => {
                packageJson.devDependencies[dep] = '*';
            });
        }
        await fs_extra_1.default.writeJson(path_1.default.join(this.projectRoot, 'package.json'), packageJson, { spaces: 2 });
    }
    async setupFeatures(template) {
        for (const feature of template.features) {
            // Create feature directories
            for (const dir of feature.files) {
                await fs_extra_1.default.ensureDir(path_1.default.join(this.projectRoot, dir));
            }
            // Copy feature-specific files if they exist
            const featureTemplateDir = path_1.default.join(this.templateRoot, 'features', feature.name.toLowerCase().replace(/\s+/g, '-'));
            if (await fs_extra_1.default.pathExists(featureTemplateDir)) {
                await fs_extra_1.default.copy(featureTemplateDir, this.projectRoot);
            }
        }
    }
    initGit() {
        try {
            (0, child_process_1.execSync)('git init', { cwd: this.projectRoot });
            (0, child_process_1.execSync)('git add .', { cwd: this.projectRoot });
            (0, child_process_1.execSync)('git commit -m "Initial commit from ProDash Tools"', { cwd: this.projectRoot });
        }
        catch (error) {
            console.warn('Warning: Could not initialize git repository');
        }
    }
    printNextSteps(projectName) {
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
exports.TemplateGenerator = TemplateGenerator;
