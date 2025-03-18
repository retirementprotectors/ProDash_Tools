import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Contexts from './pages/Contexts';
import Backups from './pages/Backups';

const App = (): JSX.Element => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contexts" element={<Contexts />} />
          <Route path="/backups" element={<Backups />} />
        </Routes>
      </Container>
    </Box>
  );
};

export default App; 