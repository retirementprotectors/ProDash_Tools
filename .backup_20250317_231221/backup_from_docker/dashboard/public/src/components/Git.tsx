import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Spinner,
  Center,
  Divider,
  Card,
  CardHeader,
  CardBody,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
} from '@chakra-ui/react';
import axios from 'axios';
import config from '../config';

const API_URL = config.apiBaseUrl;

interface GitConfig {
  enabled: boolean;
  autoCommit: boolean;
  autoCommitIntervalMs: number;
  remoteUrl?: string;
  branch: string;
  commitMessage: string;
}

export default function Git() {
  const [config, setConfig] = useState<GitConfig>({
    enabled: false,
    autoCommit: false,
    autoCommitIntervalMs: 60 * 60 * 1000, // 1 hour
    branch: 'main',
    commitMessage: 'Update context [automated commit]'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  
  const toast = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching Git configuration');
      const response = await axios.get<GitConfig>(`${API_URL}/api/git/config`);
      console.log('Git config response:', response.data);
      setConfig(response.data);
    } catch (error) {
      console.error('Error fetching Git configuration:', error);
      setError(axios.isAxiosError(error)
        ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
        : error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Error fetching Git configuration',
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

  const saveConfig = async () => {
    try {
      setIsSaving(true);
      setError(null);
      console.log('Saving Git configuration', config);
      const response = await axios.post(`${API_URL}/api/git/config`, config);
      console.log('Save config response:', response.data);
      
      setConfig(response.data.config);
      setLastAction('Configuration saved successfully');
      
      toast({
        title: 'Git configuration saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving Git configuration:', error);
      setError(axios.isAxiosError(error)
        ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
        : error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Error saving Git configuration',
        description: axios.isAxiosError(error)
          ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
          : error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const commitChanges = async () => {
    try {
      setIsCommitting(true);
      setError(null);
      console.log('Committing Git changes');
      const response = await axios.post(`${API_URL}/api/git/commit`);
      console.log('Commit response:', response.data);
      
      setLastAction('Changes committed successfully');
      
      toast({
        title: 'Changes committed',
        description: response.data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error committing changes:', error);
      setError(axios.isAxiosError(error)
        ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
        : error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Error committing changes',
        description: axios.isAxiosError(error)
          ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
          : error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCommitting(false);
    }
  };

  const pushChanges = async () => {
    try {
      setIsPushing(true);
      setError(null);
      console.log('Pushing Git changes');
      const response = await axios.post(`${API_URL}/api/git/push`);
      console.log('Push response:', response.data);
      
      setLastAction('Changes pushed to remote repository');
      
      toast({
        title: 'Changes pushed',
        description: response.data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error pushing changes:', error);
      setError(axios.isAxiosError(error)
        ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
        : error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Error pushing changes',
        description: axios.isAxiosError(error)
          ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
          : error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPushing(false);
    }
  };

  const initializeRepository = async () => {
    try {
      setIsSaving(true);
      setError(null);
      console.log('Initializing Git repository');
      const response = await axios.post(`${API_URL}/api/git/init`);
      console.log('Init response:', response.data);
      
      setLastAction('Git repository initialized successfully');
      
      toast({
        title: 'Repository initialized',
        description: response.data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh the configuration
      await fetchConfig();
    } catch (error) {
      console.error('Error initializing repository:', error);
      setError(axios.isAxiosError(error)
        ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
        : error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Error initializing repository',
        description: axios.isAxiosError(error)
          ? `${error.message}: ${error.response?.data?.error || 'Unknown error'}`
          : error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleIntervalChange = (valueString: string) => {
    const value = parseInt(valueString, 10);
    if (!isNaN(value)) {
      setConfig({
        ...config,
        autoCommitIntervalMs: value * 60 * 1000 // Convert minutes to milliseconds
      });
    }
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <HStack justifyContent="space-between">
          <Heading size="lg">GitHub Integration</Heading>
          <HStack>
            <Button
              colorScheme="blue"
              onClick={commitChanges}
              isLoading={isCommitting}
              loadingText="Committing"
              isDisabled={!config.enabled || isSaving || isPushing}
            >
              Commit Changes
            </Button>
            <Button
              colorScheme="green"
              onClick={pushChanges}
              isLoading={isPushing}
              loadingText="Pushing"
              isDisabled={!config.enabled || !config.remoteUrl || isSaving || isCommitting}
            >
              Push to GitHub
            </Button>
          </HStack>
        </HStack>

        {lastAction && (
          <Alert status="success" variant="subtle">
            <AlertIcon />
            <AlertDescription>{lastAction}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card variant="outline">
          <CardHeader>
            <Heading size="md">GitHub Configuration</Heading>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <Center p={4}>
                <Spinner size="sm" mr={2} />
                <Text>Loading configuration...</Text>
              </Center>
            ) : (
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="git-enabled" mb="0">
                    Enable GitHub Integration
                  </FormLabel>
                  <Switch
                    id="git-enabled"
                    isChecked={config.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      enabled: e.target.checked
                    })}
                    isDisabled={isSaving}
                  />
                </FormControl>

                <FormControl isDisabled={!config.enabled || isSaving}>
                  <FormLabel>Repository Branch</FormLabel>
                  <Input
                    value={config.branch}
                    onChange={(e) => setConfig({
                      ...config,
                      branch: e.target.value
                    })}
                    placeholder="main"
                  />
                </FormControl>

                <FormControl isDisabled={!config.enabled || isSaving}>
                  <FormLabel>GitHub Repository URL (Optional)</FormLabel>
                  <Input
                    value={config.remoteUrl || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      remoteUrl: e.target.value || undefined
                    })}
                    placeholder="https://github.com/username/repo.git"
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Leave empty for local Git only
                  </Text>
                </FormControl>

                <FormControl isDisabled={!config.enabled || isSaving}>
                  <FormLabel>Commit Message Template</FormLabel>
                  <Input
                    value={config.commitMessage}
                    onChange={(e) => setConfig({
                      ...config,
                      commitMessage: e.target.value
                    })}
                    placeholder="Update context [automated commit]"
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center" isDisabled={!config.enabled || isSaving}>
                  <FormLabel htmlFor="auto-commit" mb="0">
                    Automatic Commits
                  </FormLabel>
                  <Switch
                    id="auto-commit"
                    isChecked={config.autoCommit}
                    onChange={(e) => setConfig({
                      ...config,
                      autoCommit: e.target.checked
                    })}
                  />
                </FormControl>

                <FormControl isDisabled={!config.enabled || !config.autoCommit || isSaving}>
                  <FormLabel>Commit Frequency (minutes)</FormLabel>
                  <NumberInput
                    min={5}
                    max={1440}
                    value={config.autoCommitIntervalMs / (60 * 1000)}
                    onChange={handleIntervalChange}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <HStack justifyContent="space-between" pt={4}>
                  <Button
                    colorScheme="teal"
                    onClick={initializeRepository}
                    isLoading={isSaving}
                    loadingText="Initializing"
                    isDisabled={isCommitting || isPushing}
                  >
                    Initialize Repository
                  </Button>
                  
                  <Button
                    colorScheme="blue"
                    onClick={saveConfig}
                    isLoading={isSaving}
                    loadingText="Saving"
                    isDisabled={isCommitting || isPushing}
                  >
                    Save Configuration
                  </Button>
                </HStack>
              </VStack>
            )}
          </CardBody>
        </Card>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>GitHub Integration Guide</Heading>
          <VStack align="stretch" spacing={4}>
            <Text>
              The GitHub integration allows you to automatically back up your context data to a Git repository,
              either locally or remotely on GitHub.
            </Text>
            
            <Alert status="info" variant="left-accent">
              <AlertIcon />
              <VStack align="stretch" spacing={2} width="100%">
                <AlertTitle>Setting Up GitHub Integration</AlertTitle>
                <AlertDescription>
                  <OrderedList spacing={2}>
                    <ListItem>Enable GitHub integration using the switch above</ListItem>
                    <ListItem>Set your preferred branch name (default: main)</ListItem>
                    <ListItem>Optionally, add a GitHub repository URL to enable remote syncing</ListItem>
                    <ListItem>Choose whether to enable automatic commits and set the frequency</ListItem>
                    <ListItem>Click "Save Configuration" to apply your settings</ListItem>
                  </OrderedList>
                </AlertDescription>
              </VStack>
            </Alert>
            
            <Text>
              <strong>GitHub Repository URL Format:</strong>
            </Text>
            <Code p={2} borderRadius="md">
              https://github.com/username/repository.git
            </Code>
            <Text fontSize="sm">
              Make sure your GitHub credentials are properly configured on your system if using HTTPS URLs.
              For SSH URLs, ensure your SSH keys are set up correctly.
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}

// Helper component for better organization
const OrderedList = ({ children, spacing = 0 }) => (
  <Box as="ol" listStylePosition="inside" ml="4" spacing={spacing}>
    {children}
  </Box>
);

const ListItem = ({ children }) => (
  <Box as="li" pb={1}>
    {children}
  </Box>
); 