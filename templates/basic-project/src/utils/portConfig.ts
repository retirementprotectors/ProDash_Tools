import net from 'net';

/**
 * Find an available port starting from the suggested port
 * @param startPort - The port to start checking from
 * @returns A promise that resolves to an available port
 */
export async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try the next one
        server.close(() => {
          findAvailablePort(startPort + 1)
            .then(resolve)
            .catch(reject);
        });
      } else {
        reject(err);
      }
    });

    server.listen(startPort, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => {
        resolve(port);
      });
    });
  });
} 