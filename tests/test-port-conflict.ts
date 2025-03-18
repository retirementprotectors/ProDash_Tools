import { DashboardServer } from '../context-keeper/dashboard/DashboardServer';
import * as net from 'net';

/**
 * This script tests the port conflict resolution feature by:
 * 1. Creating a dummy server on the default port
 * 2. Starting the DashboardServer which should detect the conflict and use another port
 */
async function testPortConflict() {
  console.log('Testing port conflict resolution...');
  
  // Define the port we'll use for testing
  const testPort = 6000;
  
  // Create a dummy server to occupy the port
  const dummyServer = net.createServer();
  
  try {
    // Start the dummy server on the test port
    await new Promise<void>((resolve, reject) => {
      dummyServer.once('error', (err) => {
        console.error(`Could not start dummy server: ${err.message}`);
        reject(err);
      });
      
      dummyServer.once('listening', () => {
        console.log(`Dummy server listening on port ${testPort}`);
        resolve();
      });
      
      dummyServer.listen(testPort);
    });
    
    // Now try to start the dashboard server on the same port
    console.log(`Starting DashboardServer on port ${testPort} (should find alternative)`);
    const dashboardServer = new DashboardServer(testPort, 5);
    await dashboardServer.start();
    
    // Check if a different port was used
    const actualPort = dashboardServer.getPort();
    console.log(`DashboardServer actual port: ${actualPort}`);
    
    if (actualPort !== testPort) {
      console.log('✅ Port conflict resolution worked! Alternative port was used.');
    } else {
      console.log('❌ Something went wrong - server started on the occupied port.');
    }
    
    // Clean up
    await dashboardServer.stop();
    console.log('Test complete, stopping servers...');
  } catch (error) {
    console.error('Test failed:', error instanceof Error ? error.message : error);
  } finally {
    // Ensure the dummy server is closed
    dummyServer.close();
  }
}

// Run the test
testPortConflict(); 