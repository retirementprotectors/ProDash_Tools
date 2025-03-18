#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const template_generator_1 = require("../core/templates/template-generator");
const template_config_1 = require("../core/templates/template-config");
commander_1.program
    .name('prodash-create')
    .description('Create a new project with ProDash Tools')
    .argument('<project-name>', 'Name of the project to create')
    .option('-t, --template <type>', 'Template type (basic, advanced, or api)', 'basic')
    .option('-d, --directory <path>', 'Target directory', process.cwd())
    .action(async (projectName, options) => {
    try {
        const templateType = options.template;
        if (!template_config_1.TEMPLATES[templateType]) {
            console.error(`Error: Unknown template type '${templateType}'`);
            console.log('Available templates:');
            Object.entries(template_config_1.TEMPLATES).forEach(([key, template]) => {
                console.log(`  ${key} - ${template.description}`);
            });
            process.exit(1);
        }
        const projectPath = path_1.default.join(options.directory, projectName);
        const generator = new template_generator_1.TemplateGenerator(projectPath);
        console.log(`Creating new ${template_config_1.TEMPLATES[templateType].name}...`);
        console.log(`Location: ${projectPath}`);
        await generator.generateProject(templateType, projectName);
    }
    catch (error) {
        console.error('Error creating project:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
commander_1.program.parse();
