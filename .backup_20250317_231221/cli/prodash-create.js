#!/usr/bin/env node

/**
 * ProDash Project Creator
 * 
 * This script creates a new project with ProDash Tools integration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find the project root
const findProjectRoot = () => {
  let currentDir = process.cwd();
  
  // Try to find package.json as indicator of project root
  while (currentDir !== '/') {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  // If we can't find it, use the current directory
  return process.cwd();
};

// Get command line arguments
const projectName = process.argv[2];

if (!projectName) {
  console.error('Error: Project name is required');
  console.log('Usage: prodash-create <project-name>');
  process.exit(1);
}

// Find the ProDash Tools root
const prodashRoot = findProjectRoot();
const templatesDir = path.join(prodashRoot, 'prodash-tools', 'templates');

// Create project directory
const projectDir = path.join(process.cwd(), projectName);

// Check if project directory already exists
if (fs.existsSync(projectDir)) {
  console.error(`Error: Directory '${projectName}' already exists`);
  process.exit(1);
}

try {
  console.log(`Creating new project: ${projectName}`);
  
  // Create project directory
  fs.mkdirSync(projectDir, { recursive: true });
  
  // Copy template files
  const basicTemplateDir = path.join(templatesDir, 'basic-project');
  
  // Read all files from template directory
  const copyTemplateFiles = (srcDir, destDir) => {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    
    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy each file/directory
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      
      if (entry.isDirectory()) {
        copyTemplateFiles(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  // Copy template files
  copyTemplateFiles(basicTemplateDir, projectDir);
  
  // Update package.json with project name
  const packageJsonPath = path.join(projectDir, 'package.json');
  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.name = projectName;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  // Create symbolic link to ProDash Tools core
  const coreSymlinkPath = path.join(projectDir, 'core');
  const coreTargetPath = path.join(prodashRoot, 'prodash-tools', 'core');
  
  // Remove existing link if present
  if (fs.existsSync(coreSymlinkPath)) {
    fs.unlinkSync(coreSymlinkPath);
  }
  
  // Create symlink to core
  fs.symlinkSync(coreTargetPath, coreSymlinkPath, 'dir');
  
  console.log(`\nProject '${projectName}' created successfully!`);
  console.log(`\nTo get started:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
  
} catch (error) {
  console.error('Error creating project:', error);
  process.exit(1);
} 