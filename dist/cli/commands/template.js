"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTemplate = generateTemplate;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const BASE_TEMPLATES = ['basic', 'advanced', 'api'];
async function generateTemplate(name, options) {
    const spinner = (0, ora_1.default)('Generating new template').start();
    try {
        // Validate base template
        if (!BASE_TEMPLATES.includes(options.base)) {
            spinner.fail(`Invalid base template: ${options.base}`);
            console.log(chalk_1.default.yellow('\nAvailable base templates:'));
            BASE_TEMPLATES.forEach(template => console.log(chalk_1.default.cyan(`- ${template}`)));
            process.exit(1);
        }
        const templateDir = path_1.default.join(process.cwd(), 'templates', name);
        const baseTemplateDir = path_1.default.join(process.cwd(), 'templates', `${options.base}-project`);
        // Create template directory
        spinner.text = 'Creating template directory...';
        await fs_extra_1.default.ensureDir(templateDir);
        // Copy base template
        spinner.text = 'Copying base template...';
        await fs_extra_1.default.copy(baseTemplateDir, templateDir);
        // Create template configuration
        const config = {
            name,
            base: options.base,
            database: {
                type: options.base === 'basic' ? 'none' : 'mongodb',
                config: options.base !== 'basic' ? {
                    collections: ['users', 'settings', 'data'],
                    indexes: [
                        { collection: 'users', field: 'email', unique: true },
                        { collection: 'data', field: 'createdAt', unique: false },
                    ],
                } : undefined,
            },
        };
        // Save template configuration
        await fs_extra_1.default.writeJSON(path_1.default.join(templateDir, 'template.json'), config, { spaces: 2 });
        // Update package.json
        const packageJsonPath = path_1.default.join(templateDir, 'package.json');
        const packageJson = await fs_extra_1.default.readJSON(packageJsonPath);
        packageJson.name = name;
        packageJson.version = '1.0.0';
        await fs_extra_1.default.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
        // Initialize git repository
        spinner.text = 'Initializing git repository...';
        (0, child_process_1.execSync)('git init', { cwd: templateDir, stdio: 'ignore' });
        (0, child_process_1.execSync)('git add .', { cwd: templateDir, stdio: 'ignore' });
        (0, child_process_1.execSync)('git commit -m "Initial commit"', { cwd: templateDir, stdio: 'ignore' });
        spinner.succeed('Template generated successfully');
        console.log(chalk_1.default.green('\n✨ Template created successfully!\n'));
        console.log(chalk_1.default.cyan('Template location:'));
        console.log(chalk_1.default.yellow(`  ${templateDir}\n`));
        console.log(chalk_1.default.cyan('To use this template:'));
        console.log(chalk_1.default.yellow(`  prodash create my-project -t ${name}\n`));
    }
    catch (error) {
        spinner.fail('Template generation failed');
        console.error(chalk_1.default.red('\nError:'), error);
        process.exit(1);
    }
}
