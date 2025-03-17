import { Template } from '@/types';

export interface BasicTemplateConfig {
  name: string;
  description: string;
  version: string;
  dependencies: Record<string, string>;
}

export const basicTemplate: Template<BasicTemplateConfig> = {
  name: 'basic',
  description: 'Basic ProDash Tools project template',
  files: [
    {
      path: 'package.json',
      template: `{
  "name": "{{name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "dependencies": {{dependencies}},
  "scripts": {
    "start": "ts-node src/index.ts",
    "build": "tsc",
    "test": "jest"
  }
}`
    },
    {
      path: 'tsconfig.json',
      template: `{
  "extends": "./node_modules/@prodash/tsconfig/base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`
    },
    {
      path: 'src/index.ts',
      template: `console.log('ProDash Tools project initialized!');\n`
    }
  ]
}; 