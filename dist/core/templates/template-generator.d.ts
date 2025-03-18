import { TEMPLATES } from './template-config';
export declare class TemplateGenerator {
    private templateRoot;
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Generate a new project from a template
     * @param templateType - The type of template to use (basic, advanced, or api)
     * @param projectName - The name of the project
     */
    generateProject(templateType: keyof typeof TEMPLATES, projectName: string): Promise<void>;
    private copyTemplateFiles;
    private generatePackageJson;
    private setupFeatures;
    private initGit;
    private printNextSteps;
}
