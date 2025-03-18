import fs from 'fs-extra';
import path from 'path';
import mongoose from 'mongoose';
import { createProject, listProjects } from '../../cli/commands/project';

describe('Project Command', () => {
  const TEST_PROJECT_NAME = 'test-project';
  const TEST_PROJECT_DIR = path.join(process.cwd(), 'data/test/projects', TEST_PROJECT_NAME);
  const TEST_TEMPLATE_DIR = path.join(process.cwd(), 'data/test/templates', 'basic');

  beforeEach(async () => {
    // Create test template
    await fs.ensureDir(TEST_TEMPLATE_DIR);
    await fs.writeJSON(path.join(TEST_TEMPLATE_DIR, 'template.json'), {
      name: 'basic',
      description: 'Basic template for testing',
      version: '1.0.0',
      type: 'basic',
      features: ['test'],
      dependencies: {
        express: '^4.18.2',
      },
      devDependencies: {
        typescript: '^5.3.3',
      },
      scripts: {
        start: 'node dist/index.js',
      },
    });
  });

  describe('createProject', () => {
    it('should create a new project from template', async () => {
      // Create project
      await createProject(TEST_PROJECT_NAME, {
        template: 'basic',
        database: 'local',
        description: 'Test project',
      });

      // Check if project directory exists
      expect(await fs.pathExists(TEST_PROJECT_DIR)).toBe(true);

      // Check if project config exists
      const configPath = path.join(TEST_PROJECT_DIR, 'prodash.json');
      expect(await fs.pathExists(configPath)).toBe(true);

      // Check config content
      const config = await fs.readJSON(configPath);
      expect(config).toMatchObject({
        name: TEST_PROJECT_NAME,
        description: 'Test project',
        template: 'basic',
        database: {
          type: 'local',
          uri: `mongodb://localhost:27017/prodash_${TEST_PROJECT_NAME}`,
        },
      });

      // Check if project is in database
      const project = await mongoose.connection
        .collection('projects')
        .findOne({ name: TEST_PROJECT_NAME });
      expect(project).toBeTruthy();
      expect(project?.template).toBe('basic');
    });

    it('should fail if project already exists', async () => {
      // Create project first time
      await createProject(TEST_PROJECT_NAME, {
        template: 'basic',
        database: 'local',
      });

      // Try to create project with same name
      await expect(
        createProject(TEST_PROJECT_NAME, {
          template: 'basic',
          database: 'local',
        })
      ).rejects.toThrow('Project already exists');
    });

    it('should fail if template does not exist', async () => {
      await expect(
        createProject(TEST_PROJECT_NAME, {
          template: 'non-existent',
          database: 'local',
        })
      ).rejects.toThrow('Template not found');
    });
  });

  describe('listProjects', () => {
    it('should list all projects', async () => {
      // Create test projects
      const projects = ['test-1', 'test-2', 'test-3'];
      for (const name of projects) {
        await createProject(name, {
          template: 'basic',
          database: 'local',
          description: `Test project ${name}`,
        });
      }

      // Get projects from database
      const dbProjects = await mongoose.connection
        .collection('projects')
        .find()
        .toArray();

      // Check if all projects are listed
      expect(dbProjects).toHaveLength(3);
      for (const project of dbProjects) {
        expect(projects).toContain(project.name);
      }
    });

    it('should return empty list when no projects exist', async () => {
      const projects = await mongoose.connection
        .collection('projects')
        .find()
        .toArray();
      expect(projects).toHaveLength(0);
    });
  });
}); 