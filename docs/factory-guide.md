# Factory Guide

## Overview
The Factory module in ProDash Tools automates the creation of components and configurations using predefined patterns and templates. This guide explains how to use factories to streamline your development workflow.

## Core Concepts

### 1. Factory Pattern
Factories provide a standardized way to create objects:
- Abstract complex creation logic
- Ensure consistency across components
- Enable easy customization and extension

### 2. Available Factories

#### ComponentFactory
```typescript
const factory = new ComponentFactory();
const button = factory.create('button', {
  variant: 'primary',
  label: 'Click Me'
});
```

#### TemplateFactory
```typescript
const factory = new TemplateFactory();
const apiEndpoint = factory.create('api-endpoint', {
  method: 'GET',
  path: '/users'
});
```

#### StyleFactory
```typescript
const factory = new StyleFactory();
const styles = factory.create('container', {
  responsive: true,
  theme: 'dark'
});
```

## Factory Configuration

### 1. Basic Setup
```typescript
const factory = new ComponentFactory({
  namespace: 'app',
  defaultTheme: 'light',
  plugins: ['ui', 'api']
});
```

### 2. Custom Templates
```typescript
factory.registerTemplate('custom-button', {
  component: 'button',
  defaults: {
    variant: 'primary',
    rounded: true
  },
  validate: (config) => {
    if (!config.label) {
      throw new Error('Button label is required');
    }
  }
});
```

### 3. Factory Middleware
```typescript
factory.use(async (context, next) => {
  // Pre-processing
  console.log('Creating:', context.type);
  
  await next();
  
  // Post-processing
  console.log('Created:', context.result);
});
```

## Component Generation

### 1. Basic Components
```typescript
// Create a button
const button = factory.create('button', {
  label: 'Submit',
  variant: 'primary'
});

// Create a form
const form = factory.create('form', {
  fields: ['name', 'email'],
  submitButton: button
});
```

### 2. Composite Components
```typescript
const dashboard = factory.create('dashboard', {
  layout: 'grid',
  widgets: [
    factory.create('chart', { type: 'line' }),
    factory.create('table', { data: [] }),
    factory.create('stats', { metrics: ['users'] })
  ]
});
```

### 3. Dynamic Generation
```typescript
const components = data.map(item =>
  factory.create('card', {
    title: item.title,
    content: item.content
  })
);
```

## Template System

### 1. Define Templates
```typescript
factory.defineTemplate({
  name: 'data-grid',
  components: {
    container: {
      type: 'div',
      styles: { display: 'grid' }
    },
    header: {
      type: 'div',
      styles: { fontWeight: 'bold' }
    },
    cell: {
      type: 'div',
      styles: { padding: '8px' }
    }
  }
});
```

### 2. Use Templates
```typescript
const grid = factory.createFromTemplate('data-grid', {
  columns: ['Name', 'Age', 'Email'],
  data: users
});
```

### 3. Extend Templates
```typescript
factory.extendTemplate('data-grid', {
  name: 'sortable-grid',
  features: ['sorting', 'filtering'],
  styles: {
    header: {
      cursor: 'pointer'
    }
  }
});
```

## Plugin Integration

### 1. UI Plugin
```typescript
factory.use(uiPlugin);

const component = factory.create('button', {
  theme: 'dark',
  variant: 'primary'
});
```

### 2. API Plugin
```typescript
factory.use(apiPlugin);

const endpoint = factory.create('api-endpoint', {
  method: 'GET',
  path: '/users',
  auth: true
});
```

## Best Practices

### 1. Factory Organization
- Group related factories
- Use meaningful names
- Document factory configurations

### 2. Error Handling
```typescript
try {
  const component = factory.create('custom', config);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof TemplateError) {
    // Handle template errors
  }
}
```

### 3. Testing
```typescript
describe('ComponentFactory', () => {
  let factory: ComponentFactory;

  beforeEach(() => {
    factory = new ComponentFactory();
  });

  it('creates valid components', () => {
    const button = factory.create('button', {
      label: 'Test'
    });
    expect(button).toBeDefined();
    expect(button.label).toBe('Test');
  });
});
```

## Advanced Usage

### 1. Factory Composition
```typescript
class DashboardFactory {
  constructor(
    private componentFactory: ComponentFactory,
    private styleFactory: StyleFactory
  ) {}

  createDashboard(config: DashboardConfig) {
    const layout = this.componentFactory.create('grid');
    const styles = this.styleFactory.create('dashboard');
    // Compose dashboard
  }
}
```

### 2. Async Factories
```typescript
class AsyncComponentFactory {
  async create(type: string, config: any) {
    await this.loadDependencies(type);
    const component = await this.createComponent(type, config);
    await this.initialize(component);
    return component;
  }
}
```

### 3. Factory Registry
```typescript
class FactoryRegistry {
  private factories = new Map<string, Factory>();

  register(name: string, factory: Factory) {
    this.factories.set(name, factory);
  }

  get(name: string) {
    return this.factories.get(name);
  }
}
```

## Troubleshooting

### Common Issues

1. **Invalid Factory Configuration**
   - Check template definitions
   - Verify plugin compatibility
   - Review configuration schema

2. **Component Generation Failures**
   - Validate input parameters
   - Check template requirements
   - Review factory middleware

3. **Performance Issues**
   - Use factory pooling for frequent creation
   - Implement caching where appropriate
   - Profile factory operations

## Next Steps
- Review the [Builder Guide](./builder-guide.md) for component construction
- Explore [Plugin Development](./plugin-guide.md) for extending functionality
- Check out [Example Projects](./examples.md) for implementation patterns 