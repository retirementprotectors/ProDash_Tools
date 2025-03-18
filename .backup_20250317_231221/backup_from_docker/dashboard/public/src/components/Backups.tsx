import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Spinner,
  Center,
  Switch,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import axios from 'axios';
import config from '../config';

const API_URL = 'http://localhost:54420';
console.log('Backups component using API URL:', API_URL);

interface Backup {
  timestamp: number;
  contextCount: number;
  version: string;
  filename: string;
}

interface BackupConfig {
  autoBackupEnabled: boolean;
  backupFrequencyMs: number;
  retentionPeriodDays: number;
}

export default function Backups() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupConfig, setBackupConfig] = useState<BackupConfig>({
    autoBackupEnabled: true,
    backupFrequencyMs: 60 * 60 * 1000, // 1 hour
    retentionPeriodDays: 30
  });
  const toast = useToast();

  useEffect(() => {
    fetchBackups();
    fetchBackupConfig();
  }, []);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching backups from API');
      const response = await axios.get<Backup[]>(`${API_URL}/api/backups`);
      console.log('Backups response:', response.data);
      
      if (Array.isArray(response.data)) {
        setBackups(response.data);
      } else {
        console.error('Invalid data format received from API:', response.data);
        setError('Invalid data format received from API');
        setBackups([]);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      setError(axios.isAxiosError(error) 
        ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
        : error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Error fetching backups',
        description: axios.isAxiosError(error) 
          ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
          : error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackupConfig = async () => {
    try {
      setIsConfigLoading(true);
      console.log('Fetching backup configuration');
      const response = await axios.get<BackupConfig>(`${API_URL}/api/backups/config`);
      console.log('Backup config response:', response.data);
      setBackupConfig(response.data);
    } catch (error) {
      console.error('Error fetching backup configuration:', error);
      toast({
        title: 'Error fetching backup configuration',
        description: axios.isAxiosError(error) 
          ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
          : error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConfigLoading(false);
    }
  };

  const saveBackupConfig = async () => {
    try {
      setIsSavingConfig(true);
      console.log('Saving backup configuration', backupConfig);
      const response = await axios.post(`${API_URL}/api/backups/config`, backupConfig);
      console.log('Save config response:', response.data);
      
      setBackupConfig(response.data.config);
      
      toast({
        title: 'Backup configuration saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving backup configuration:', error);
      toast({
        title: 'Error saving backup configuration',
        description: axios.isAxiosError(error) 
          ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
          : error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const createBackup = async () => {
    try {
      setIsCreating(true);
      console.log('Creating new backup');
      
      // Use the trigger endpoint for manual backup
      const response = await axios.post(`${API_URL}/api/backups/trigger`);
      console.log('Create backup response:', response.data);
      
      toast({
        title: 'Backup created',
        description: `Backup file: ${response.data.backupFile}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Wait a moment before refreshing the list
      setTimeout(() => {
        fetchBackups();
      }, 1000);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: 'Error creating backup',
        description: axios.isAxiosError(error) 
          ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
          : error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const restoreBackup = async (filename: string) => {
    try {
      setIsRestoring(filename);
      console.log(`Restoring backup: ${filename}`);
      const response = await axios.post(`${API_URL}/api/backups/restore/${filename}`);
      console.log('Restore response:', response.data);
      
      toast({
        title: 'Backup restored',
        description: `Restored ${response.data.contextCount} contexts`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Wait a moment before refreshing the list
      setTimeout(() => {
        fetchBackups();
      }, 1000);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: 'Error restoring backup',
        description: axios.isAxiosError(error) 
          ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
          : error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRestoring(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (isNaN(bytes) || bytes === undefined) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  const handleFrequencyChange = (valueString: string) => {
    const value = parseInt(valueString, 10);
    if (!isNaN(value)) {
      setBackupConfig({
        ...backupConfig,
        backupFrequencyMs: value * 60 * 1000 // Convert minutes to milliseconds
      });
    }
  };

  const handleRetentionChange = (valueString: string) => {
    const value = parseInt(valueString, 10);
    if (!isNaN(value)) {
      setBackupConfig({
        ...backupConfig,
        retentionPeriodDays: value
      });
    }
  };

  // Debug output
  console.log('Rendering Backups component with backups:', backups);

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <HStack justifyContent="space-between">
          <Heading size="lg">Backups</Heading>
          <Button 
            colorScheme="blue" 
            onClick={createBackup}
            isLoading={isCreating}
            loadingText="Creating Backup"
            isDisabled={isRestoring !== null}
          >
            Create Backup
          </Button>
        </HStack>

        <Card variant="outline">
          <CardHeader>
            <Heading size="md">Backup Configuration</Heading>
          </CardHeader>
          <CardBody>
            {isConfigLoading ? (
              <Center p={4}>
                <Spinner size="sm" mr={2} />
                <Text>Loading configuration...</Text>
              </Center>
            ) : (
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="auto-backup" mb="0">
                    Automatic Backups
                  </FormLabel>
                  <Switch 
                    id="auto-backup" 
                    isChecked={backupConfig.autoBackupEnabled}
                    onChange={(e) => setBackupConfig({
                      ...backupConfig,
                      autoBackupEnabled: e.target.checked
                    })}
                    isDisabled={isSavingConfig}
                  />
                </FormControl>
                
                <HStack>
                  <FormControl>
                    <FormLabel>Backup Frequency (minutes)</FormLabel>
                    <NumberInput 
                      min={5} 
                      max={1440} 
                      value={backupConfig.backupFrequencyMs / (60 * 1000)}
                      onChange={handleFrequencyChange}
                      isDisabled={!backupConfig.autoBackupEnabled || isSavingConfig}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Retention Period (days)</FormLabel>
                    <NumberInput 
                      min={1} 
                      max={365} 
                      value={backupConfig.retentionPeriodDays}
                      onChange={handleRetentionChange}
                      isDisabled={isSavingConfig}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </HStack>
                
                <Button
                  colorScheme="green"
                  onClick={saveBackupConfig}
                  isLoading={isSavingConfig}
                  loadingText="Saving"
                  alignSelf="flex-end"
                >
                  Save Configuration
                </Button>
              </VStack>
            )}
          </CardBody>
        </Card>

        <Divider />
        
        <Heading size="md">Backup History</Heading>

        {error && (
          <Alert status="error" mt={2} mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Center p={8}>
            <Spinner size="xl" />
          </Center>
        ) : backups.length === 0 ? (
          <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
            No backups available
          </Box>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Filename</Th>
                <Th>Date</Th>
                <Th>Contexts</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {backups.map((backup) => (
                <Tr key={backup.filename}>
                  <Td>{backup.filename}</Td>
                  <Td>{new Date(backup.timestamp).toLocaleString()}</Td>
                  <Td>{backup.contextCount}</Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => restoreBackup(backup.filename)}
                      isLoading={isRestoring === backup.filename}
                      loadingText="Restoring"
                      isDisabled={isRestoring !== null || isCreating}
                    >
                      Restore
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </VStack>
    </Box>
  );
} 