# ProDash Tools Refactoring Plan

## Current Issues

1. **Port Configuration Issues**
   - Frontend and backend port mismatch causing connectivity problems
   - Fixed by hardcoding the port in frontend components to match the actual backend port (54420)

2. **Directory Structure Redundancy**
   - Duplicate directories and overlapping functionality between different parts of the codebase
   - Current structure is confusing with similar functionality spread across different locations

## Directory Structure Analysis

### Current Structure
- `/core/` - Core utilities for broader ProDash Tools
  - Re-exports context-keeper components
  - Contains singleton accessors for services
  - Has directories for API, auth, cache, database, email

- `/context-keeper/` - Context Keeper functionality
  - `/core/` - Core services (ContextManager, BackupManager, etc.)
  - `/api/` - API routes for the context keeper
  - `/dashboard/` - Frontend dashboard

- `/services/` - Additional services
  - google-workspace, monitoring, notification

- `/scripts/` - CLI tools and utilities

- Multiple README and documentation files

## Proposed Refactoring

### 1. Reorganize Directory Structure

```
/prodash-tools/
├── core/
│   ├── context-keeper/
│   │   ├── ContextManager.ts
│   │   ├── BackupManager.ts
│   │   ├── MonitoringService.ts
│   │   ├── GitIntegration.ts
│   │   └── ContextCaptureService.ts
│   ├── utils/
│   │   └── PortConfig.ts
│   ├── services/
│   │   ├── google-workspace/
│   │   ├── notification/
│   │   └── monitoring/
│   └── index.ts
├── api/
│   ├── routes/
│   │   ├── contextRoutes.ts
│   │   ├── backupRoutes.ts
│   │   ├── healthRoutes.ts
│   │   └── ...
│   └── server.ts
├── dashboard/
│   └── public/
│       ├── src/
│       └── ...
├── cli/
│   ├── context-tools.js
│   └── command_wrapper.sh
├── plugins/
├── templates/
├── docs/
└── tests/
```

### 2. Improve Port Management

- Implement a central port management system that ensures consistent port usage
- Store active ports in a configuration file accessible to both frontend and backend
- Create an environment variable system for development ports

### 3. Consolidate Documentation

- Create a single comprehensive documentation structure
- Merge redundant README files
- Organize documentation into clear sections (installation, usage, API, etc.)

### 4. Implementation Plan

#### Phase 1: Fix Immediate Issues
- [x] Fix frontend-backend port mismatch (completed)

#### Phase 2: Restructure Core Components
- [ ] Create the new directory structure
- [ ] Move files to their new locations
- [ ] Update import paths in all files
- [ ] Test all components after migration

#### Phase 3: Consolidate Documentation
- [ ] Merge README files
- [ ] Update installation and usage guides
- [ ] Create comprehensive API documentation

#### Phase 4: Improve Configuration System
- [ ] Implement centralized configuration management
- [ ] Create environment-based configuration
- [ ] Add proper error handling for configuration issues

## Next Steps

1. Gather team feedback on the proposed structure
2. Create a detailed migration plan with assigned tasks
3. Set up a staging environment for testing the refactored codebase
4. Schedule code reviews during the refactoring process 