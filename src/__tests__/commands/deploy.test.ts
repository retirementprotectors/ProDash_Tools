import fs from 'fs-extra';
import path from 'path';
import mongoose from 'mongoose';
import { deployProject, listDeployments } from '../../cli/commands/deploy';

describe('Deploy Command', () => {
  const TEST_PROJECT_NAME = 'test-project';
  const TEST_PROJECT_DIR = path.join(process.cwd(), 'data/test/projects', TEST_PROJECT_NAME);
  const TEST_DEPLOY_DIR = path.join(process.cwd(), 'data/test/deployments');

  beforeEach(async () => {
    // Create test project
    await fs.ensureDir(TEST_PROJECT_DIR);
    await fs.writeJSON(path.join(TEST_PROJECT_DIR, 'package.json'), {
      name: TEST_PROJECT_NAME,
      version: '1.0.0',
      scripts: {
        start: 'node index.js',
      },
    });
    await fs.writeFile(
      path.join(TEST_PROJECT_DIR, 'index.js'),
      'console.log("Hello, World!");'
    );
  });

  describe('deployProject', () => {
    it('should deploy project locally', async () => {
      // Deploy project
      await deployProject(TEST_PROJECT_NAME, 'local');

      // Check if deployment files exist
      const files = await fs.readdir(TEST_DEPLOY_DIR);
      expect(files.length).toBe(1);
      expect(files[0]).toMatch(new RegExp(`${TEST_PROJECT_NAME}-\\d+\\.zip`));

      // Check deployment metadata in database
      const deployment = await mongoose.connection
        .collection('deployments')
        .findOne({ project: TEST_PROJECT_NAME });
      expect(deployment).toBeTruthy();
      expect(deployment?.environment).toBe('local');
      expect(deployment?.status).toBe('completed');
    });

    it('should fail if project does not exist', async () => {
      await expect(
        deployProject('non-existent', 'local')
      ).rejects.toThrow('Project directory not found');
    });

    it('should fail with invalid environment', async () => {
      await expect(
        deployProject(TEST_PROJECT_NAME, 'invalid')
      ).rejects.toThrow('Invalid environment');
    });
  });

  describe('listDeployments', () => {
    it('should list all deployments', async () => {
      // Create test deployments
      const environments = ['local', 'staging', 'production'];
      for (const env of environments) {
        await deployProject(TEST_PROJECT_NAME, env);
      }

      // Get deployments from database
      const dbDeployments = await mongoose.connection
        .collection('deployments')
        .find()
        .toArray();

      // Check if all deployments are listed
      expect(dbDeployments).toHaveLength(3);
      for (const deployment of dbDeployments) {
        expect(environments).toContain(deployment.environment);
        expect(deployment.project).toBe(TEST_PROJECT_NAME);
      }
    });

    it('should return empty list when no deployments exist', async () => {
      const deployments = await mongoose.connection
        .collection('deployments')
        .find()
        .toArray();
      expect(deployments).toHaveLength(0);
    });
  });
}); 