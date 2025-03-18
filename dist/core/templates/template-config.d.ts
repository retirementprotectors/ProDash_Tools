import { PackageJson } from 'type-fest';
export interface TemplateFeature {
    name: string;
    description: string;
    dependencies: string[];
    devDependencies: string[];
    files: string[];
}
export interface ProjectTemplate {
    name: string;
    description: string;
    features: TemplateFeature[];
    basePackageJson: Partial<PackageJson>;
}
export declare const TEMPLATES: Record<string, ProjectTemplate>;
