import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import BackupIcon from '@mui/icons-material/Backup';

const Navbar = (): JSX.Element => {
  return (
    <AppBar position="static" color="default">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          ProDash
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={RouterLink}
            to="/"
            startIcon={<DashboardIcon />}
            color="inherit"
          >
            Dashboard
          </Button>
          <Button
            component={RouterLink}
            to="/contexts"
            startIcon={<StorageIcon />}
            color="inherit"
          >
            Contexts
          </Button>
          <Button
            component={RouterLink}
            to="/backups"
            startIcon={<BackupIcon />}
            color="inherit"
          >
            Backups
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 