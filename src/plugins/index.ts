import { Plugin } from '../types';

export const plugins: Record<string, Plugin> = {};

export function registerPlugin(plugin: Plugin): void {
  plugins[plugin.name] = plugin;
}

export function getPlugin(name: string): Plugin | undefined {
  return plugins[name];
}

export * from './database';
export * from './api';
export * from './ui'; 