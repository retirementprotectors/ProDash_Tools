import fs from 'fs-extra';
import path from 'path';
import mongoose from 'mongoose';
import { generateTemplate, listTemplates } from '../../cli/commands/template';

describe('Template Command', () => {
  const TEST_TEMPLATE_NAME = 'test-template';
  const TEST_TEMPLATE_DIR = path.join(process.cwd(), 'data/test/templates', TEST_TEMPLATE_NAME);
  const BASE_TEMPLATE_DIR = path.join(process.cwd(), 'templates/basic');

  beforeEach(async () => {
    // Create base template directory
    await fs.ensureDir(BASE_TEMPLATE_DIR);
    await fs.writeFile(
      path.join(BASE_TEMPLATE_DIR, 'index.ts'),
      'console.log("Hello, World!");'
    );
  });

  describe('generateTemplate', () => {
    it('should generate a new template', async () => {
      // Generate template
      await generateTemplate(TEST_TEMPLATE_NAME, {
        base: 'basic',
        description: 'Test template',
      });

      // Check if template directory exists
      expect(await fs.pathExists(TEST_TEMPLATE_DIR)).toBe(true);

      // Check if template config exists
      const configPath = path.join(TEST_TEMPLATE_DIR, 'template.json');
      expect(await fs.pathExists(configPath)).toBe(true);

      // Check config content
      const config = await fs.readJSON(configPath);
      expect(config).toMatchObject({
        name: TEST_TEMPLATE_NAME,
        description: 'Test template',
        version: '1.0.0',
        type: 'basic',
      });

      // Check if template is in database
      const template = await mongoose.connection
        .collection('templates')
        .findOne({ name: TEST_TEMPLATE_NAME });
      expect(template).toBeTruthy();
      expect(template?.type).toBe('basic');
    });

    it('should fail if template already exists', async () => {
      // Generate template first time
      await generateTemplate(TEST_TEMPLATE_NAME, {
        base: 'basic',
      });

      // Try to generate template with same name
      await expect(
        generateTemplate(TEST_TEMPLATE_NAME, {
          base: 'basic',
        })
      ).rejects.toThrow('Template already exists');
    });

    it('should fail if base template does not exist', async () => {
      await expect(
        generateTemplate(TEST_TEMPLATE_NAME, {
          base: 'non-existent',
        })
      ).rejects.toThrow('Base template not found');
    });
  });

  describe('listTemplates', () => {
    it('should list all templates', async () => {
      // Generate test templates
      const templates = ['test-1', 'test-2', 'test-3'];
      for (const name of templates) {
        await generateTemplate(name, {
          base: 'basic',
          description: `Test template ${name}`,
        });
      }

      // Get templates from database
      const dbTemplates = await mongoose.connection
        .collection('templates')
        .find()
        .toArray();

      // Check if all templates are listed
      expect(dbTemplates).toHaveLength(3);
      for (const template of dbTemplates) {
        expect(templates).toContain(template.name);
      }
    });

    it('should return empty list when no templates exist', async () => {
      const templates = await mongoose.connection
        .collection('templates')
        .find()
        .toArray();
      expect(templates).toHaveLength(0);
    });
  });
}); 