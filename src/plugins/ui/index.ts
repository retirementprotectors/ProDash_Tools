import { Plugin } from '@/types';

export interface UiConfig {
  theme: 'light' | 'dark';
  primaryColor: string;
  components: {
    buttons: {
      rounded: boolean;
      shadow: boolean;
    };
    inputs: {
      variant: 'outlined' | 'filled' | 'standard';
    };
  };
}

export class UiPlugin implements Plugin {
  name = 'ui';
  version = '1.0.0';
  private config?: UiConfig;

  configure(config: UiConfig): void {
    this.config = {
      theme: config.theme || 'light',
      primaryColor: config.primaryColor || '#4299e1',
      components: {
        buttons: {
          rounded: config.components?.buttons?.rounded ?? true,
          shadow: config.components?.buttons?.shadow ?? true,
        },
        inputs: {
          variant: config.components?.inputs?.variant || 'outlined',
        },
      },
    };
  }

  async install(): Promise<void> {
    if (!this.config) {
      throw new Error('UI configuration not set');
    }

    // Generate CSS variables
    const cssVariables = this.generateCssVariables();
    
    // Create theme file
    await this.createThemeFile(cssVariables);
    
    console.log('UI plugin installed successfully');
  }

  async uninstall(): Promise<void> {
    // Cleanup theme files
    console.log('UI plugin uninstalled');
  }

  private generateCssVariables(): string {
    const { theme, primaryColor, components } = this.config!;
    
    return `
:root {
  --primary-color: ${primaryColor};
  --background-color: ${theme === 'light' ? '#ffffff' : '#1a202c'};
  --text-color: ${theme === 'light' ? '#2d3748' : '#f7fafc'};
  --button-radius: ${components.buttons.rounded ? '9999px' : '4px'};
  --button-shadow: ${components.buttons.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
  --input-variant: ${components.inputs.variant};
}`;
  }

  private async createThemeFile(cssVariables: string): Promise<void> {
    // Implementation for creating theme file
    console.log('Theme file created with variables:', cssVariables);
  }
}

export const uiPlugin = new UiPlugin(); 