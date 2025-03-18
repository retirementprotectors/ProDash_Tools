import { ContextManager } from '../context-keeper/core/ContextManager';

async function addDemoData() {
  try {
    console.log('Initializing Context Manager...');
    const contextManager = new ContextManager();
    await contextManager.initialize();

    console.log('Adding current conversation as sample data...');
    
    // Add our demo conversation
    await contextManager.addContext(
      "This conversation is about building a 'Context Keeper' system for maintaining chat context. We created core components like ContextManager, BackupManager, and MonitoringService, along with a dashboard frontend. We discussed challenges with Docker setup and resolved API connectivity issues between the frontend and backend services, eventually creating a working system with proper error handling.",
      {
        topic: "Context Keeper Development",
        participants: ["User", "Assistant"],
        tags: ["context-management", "dashboard", "typescript", "docker"]
      }
    );

    // Add our conversation history as a second context
    await contextManager.addContext(
      "The user expressed frustration with existing chat systems losing context, so we designed and implemented a Context Keeper system. We built backend services for context storage, backup management, and system health monitoring, along with a web dashboard that shows contexts, backups, alerts, and metrics. We encountered and fixed issues with Docker configuration, port conflicts, and API connectivity, successfully getting the system running.",
      {
        topic: "Project Implementation",
        participants: ["User", "Assistant"],
        tags: ["troubleshooting", "api", "development"]
      }
    );

    console.log('Demo data added successfully!');
  } catch (error) {
    console.error('Error adding demo data:', error);
  }
}

// Run the function
addDemoData(); 