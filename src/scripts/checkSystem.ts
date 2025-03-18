import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

async function checkMongoDB() {
  try {
    const { stdout } = await execAsync("mongo prodash_master --eval 'db.contexts.countDocuments()' | cat");
    console.log('MongoDB Context Count:', stdout.trim());
  } catch (error) {
    console.error('Failed to check MongoDB:', error);
  }
}

async function checkBackups() {
  try {
    const backupDir = join(process.cwd(), '.context-keeper', 'backups');
    const files = await readdir(backupDir);
    console.log('Backup Files:', files);
  } catch (error) {
    console.error('Failed to check backups:', error);
  }
}

async function checkConsoleOutput() {
  // This would typically involve checking logs or console output
  console.log('Check console output manually for HistoricalLoader messages.');
}

async function main() {
  await checkMongoDB();
  await checkBackups();
  checkConsoleOutput();
}

main().catch(console.error); 