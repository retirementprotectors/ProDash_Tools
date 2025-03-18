#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import { TemplateGenerator } from '../core/templates/template-generator';
import { TEMPLATES } from '../core/templates/template-config';

interface ProgramOptions {
  template: string;
  directory: string;
}

program
  .name('prodash-create')
  .description('Create a new project with ProDash Tools')
  .argument('<project-name>', 'Name of the project to create')
  .option('-t, --template <type>', 'Template type (basic, advanced, or api)', 'basic')
  .option('-d, --directory <path>', 'Target directory', process.cwd())
  .action(async (projectName: string, options: ProgramOptions) => {
    try {
      const templateType = options.template as keyof typeof TEMPLATES;
      if (!TEMPLATES[templateType]) {
        console.error(`Error: Unknown template type '${templateType}'`);
        console.log('Available templates:');
        Object.entries(TEMPLATES).forEach(([key, template]) => {
          console.log(`  ${key} - ${template.description}`);
        });
        process.exit(1);
      }

      const projectPath = path.join(options.directory, projectName);
      const generator = new TemplateGenerator(projectPath);

      console.log(`Creating new ${TEMPLATES[templateType].name}...`);
      console.log(`Location: ${projectPath}`);

      await generator.generateProject(templateType, projectName);
    } catch (error) {
      console.error('Error creating project:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse(); 