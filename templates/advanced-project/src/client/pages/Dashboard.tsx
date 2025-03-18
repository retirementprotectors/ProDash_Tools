import { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';

interface SystemStatus {
  contexts: number;
  backups: number;
  health: {
    server: boolean;
    database: boolean;
  };
}

const Dashboard = (): JSX.Element => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async (): Promise<void> => {
      try {
        const [healthRes, contextsRes, backupsRes] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/contexts'),
          fetch('/api/backups'),
        ]);

        const health = await healthRes.json();
        const contexts = await contextsRes.json();
        const backups = await backupsRes.json();

        setStatus({
          contexts: contexts.length,
          backups: backups.length,
          health: {
            server: health.status === 'ok',
            database: health.database === 'connected',
          },
        });
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" sx={{ height: '50vh' }}>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Contexts
              </Typography>
              <Typography variant="h5">
                {status?.contexts ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Backups
              </Typography>
              <Typography variant="h5">
                {status?.backups ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Typography>
              Server: {status?.health.server ? '🟢 Online' : '🔴 Offline'}
            </Typography>
            <Typography>
              Database: {status?.health.database ? '🟢 Connected' : '🔴 Disconnected'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard; 