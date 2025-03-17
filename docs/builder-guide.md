# Builder Guide

## Overview
The Builder module in ProDash Tools provides a fluent API for constructing complex components and configurations. This guide explains how to use builders effectively in your projects.

## Core Concepts

### 1. Builder Pattern
Builders help you construct complex objects step by step. They're especially useful when:
- An object needs many optional parameters
- Construction requires multiple steps
- You want to enforce specific construction rules

### 2. Available Builders

#### ComponentBuilder
```typescript
const component = new ComponentBuilder()
  .setName('MyComponent')
  .setType('container')
  .addChild(childComponent)
  .build();
```

#### ConfigBuilder
```typescript
const config = new ConfigBuilder()
  .setEnvironment('development')
  .addPlugin('ui')
  .addDatabase({
    type: 'postgresql',
    host: 'localhost'
  })
  .build();
```

#### ThemeBuilder
```typescript
const theme = new ThemeBuilder()
  .setPrimaryColor('#4299e1')
  .setFontFamily('Inter')
  .setSpacing({ base: 4 })
  .build();
```

## Best Practices

### 1. Chain Methods
Take advantage of method chaining for cleaner code:
```typescript
const button = new ButtonBuilder()
  .setVariant('primary')
  .setSize('large')
  .setRounded(true)
  .addIcon('arrow-right')
  .build();
```

### 2. Use Type Safety
Builders are fully typed for better IDE support and compile-time checks:
```typescript
interface ButtonConfig {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'small' | 'medium' | 'large';
  rounded?: boolean;
  icon?: string;
}
```

### 3. Validate Early
Add validation in builder methods:
```typescript
setSize(size: Size): this {
  if (!VALID_SIZES.includes(size)) {
    throw new Error(`Invalid size: ${size}`);
  }
  this.size = size;
  return this;
}
```

## Common Patterns

### 1. Default Configuration
```typescript
const defaultConfig = new ConfigBuilder()
  .setDefaults()  // Applies sensible defaults
  .build();
```

### 2. Extending Configurations
```typescript
const baseConfig = new ConfigBuilder()
  .setDefaults()
  .build();

const extendedConfig = new ConfigBuilder()
  .extend(baseConfig)  // Inherit from base
  .setEnvironment('production')
  .build();
```

### 3. Template Builders
```typescript
const template = new TemplateBuilder()
  .setName('api-endpoint')
  .setMethod('GET')
  .addParameter('id', 'string')
  .setResponse(200, { type: 'object' })
  .build();
```

## Integration with Plugins

### 1. UI Plugin Integration
```typescript
const uiConfig = new UiConfigBuilder()
  .setTheme('dark')
  .setComponents({
    buttons: { rounded: true },
    inputs: { variant: 'outlined' }
  })
  .build();

await plugins.ui.configure(uiConfig);
```

### 2. API Plugin Integration
```typescript
const apiConfig = new ApiConfigBuilder()
  .setBasePath('/api/v1')
  .addEndpoint({
    path: '/users',
    method: 'GET'
  })
  .build();

await plugins.api.configure(apiConfig);
```

## Troubleshooting

### Common Issues

1. **Builder Methods Not Chaining**
   - Ensure each method returns `this`
   - Check for proper method implementation

2. **Type Errors**
   - Verify interface compliance
   - Check generic type parameters

3. **Build Validation Failures**
   - Review required properties
   - Check value constraints

## Advanced Usage

### 1. Custom Builders
Create specialized builders for your components:
```typescript
class DashboardBuilder extends ComponentBuilder {
  addWidget(widget: Widget): this {
    this.widgets.push(widget);
    return this;
  }

  setLayout(layout: Layout): this {
    this.layout = layout;
    return this;
  }
}
```

### 2. Builder Factories
Create builders through a factory for consistent configuration:
```typescript
class BuilderFactory {
  createComponentBuilder(): ComponentBuilder {
    return new ComponentBuilder()
      .setDefaults()
      .setTheme(this.globalTheme);
  }
}
```

## Next Steps
- Explore the [Factory Guide](./factory-guide.md) for automated component generation
- Review the [API Documentation](./api-docs.md) for detailed method references
- Check out [Example Projects](./examples.md) for real-world usage 