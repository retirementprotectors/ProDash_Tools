import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { execSync } from 'child_process';

interface TemplateConfig {
  name: string;
  base: string;
  database: {
    type: 'mongodb' | 'none';
    config?: {
      collections: string[];
      indexes?: Record<string, unknown>[];
    };
  };
}

const BASE_TEMPLATES = ['basic', 'advanced', 'api'];

export async function generateTemplate(name: string, options: { base: string }): Promise<void> {
  const spinner = ora('Generating new template').start();

  try {
    // Validate base template
    if (!BASE_TEMPLATES.includes(options.base)) {
      spinner.fail(`Invalid base template: ${options.base}`);
      console.log(chalk.yellow('\nAvailable base templates:'));
      BASE_TEMPLATES.forEach(template => console.log(chalk.cyan(`- ${template}`)));
      process.exit(1);
    }

    const templateDir = path.join(process.cwd(), 'templates', name);
    const baseTemplateDir = path.join(process.cwd(), 'templates', `${options.base}-project`);

    // Create template directory
    spinner.text = 'Creating template directory...';
    await fs.ensureDir(templateDir);

    // Copy base template
    spinner.text = 'Copying base template...';
    await fs.copy(baseTemplateDir, templateDir);

    // Create template configuration
    const config: TemplateConfig = {
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
    await fs.writeJSON(path.join(templateDir, 'template.json'), config, { spaces: 2 });

    // Update package.json
    const packageJsonPath = path.join(templateDir, 'package.json');
    const packageJson = await fs.readJSON(packageJsonPath);
    packageJson.name = name;
    packageJson.version = '1.0.0';
    await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });

    // Initialize git repository
    spinner.text = 'Initializing git repository...';
    execSync('git init', { cwd: templateDir, stdio: 'ignore' });
    execSync('git add .', { cwd: templateDir, stdio: 'ignore' });
    execSync('git commit -m "Initial commit"', { cwd: templateDir, stdio: 'ignore' });

    spinner.succeed('Template generated successfully');

    console.log(chalk.green('\n✨ Template created successfully!\n'));
    console.log(chalk.cyan('Template location:'));
    console.log(chalk.yellow(`  ${templateDir}\n`));
    console.log(chalk.cyan('To use this template:'));
    console.log(chalk.yellow(`  prodash create my-project -t ${name}\n`));

  } catch (error) {
    spinner.fail('Template generation failed');
    console.error(chalk.red('\nError:'), error);
    process.exit(1);
  }
} 