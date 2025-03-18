import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  Alert as ChakraAlert,
  Button,
  Switch,
  Text,
  useToast,
} from '@chakra-ui/react';
import {
  AlertIcon,
  AlertTitle,
  AlertDescription,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import axios from 'axios';
import config from '../config';

const API_URL = config.apiBaseUrl;
console.log('Alerts component using API URL:', API_URL);

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
  resolved: boolean;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [isResolving, setIsResolving] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [showResolved]);

  const fetchAlerts = async () => {
    try {
      console.log('Fetching alerts from API');
      const response = await axios.get<Alert[]>(`${API_URL}/api/monitoring/alerts?includeResolved=${showResolved}`);
      console.log('Alerts response:', response.data);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Error fetching alerts',
        description: axios.isAxiosError(error) 
          ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
          : error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      setIsResolving(id); // Set the ID of the alert being resolved
      console.log(`Resolving alert with ID: ${id}`);
      
      const response = await axios.post(`${API_URL}/api/monitoring/alerts/${id}/resolve`);
      console.log('Resolve response:', response.data);
      
      toast({
        title: 'Alert resolved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Update the local state without making another API call
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === id ? { ...alert, resolved: true } : alert
        )
      );
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: 'Error resolving alert',
        description: axios.isAxiosError(error) 
          ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
          : error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsResolving(null); // Clear the resolving state
    }
  };

  const getAlertStatus = (type: Alert['type']) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">System Alerts</Heading>
          <FormControl display="flex" alignItems="center" width="auto">
            <FormLabel htmlFor="show-resolved" mb="0">
              Show Resolved
            </FormLabel>
            <Switch
              id="show-resolved"
              isChecked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
            />
          </FormControl>
        </Box>

        {alerts.length === 0 ? (
          <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
            No alerts to display
          </Box>
        ) : (
          alerts.map((alert) => (
            <ChakraAlert
              key={alert.id}
              status={getAlertStatus(alert.type)}
              variant="left-accent"
              borderRadius="md"
            >
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>{alert.type.toUpperCase()}</AlertTitle>
                <AlertDescription display="block">
                  {alert.message}
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </Text>
                </AlertDescription>
              </Box>
              {!alert.resolved && (
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={() => resolveAlert(alert.id)}
                  isLoading={isResolving === alert.id}
                  loadingText="Resolving"
                  isDisabled={isResolving !== null}
                >
                  Resolve
                </Button>
              )}
            </ChakraAlert>
          ))
        )}
      </VStack>
    </Box>
  );
} 