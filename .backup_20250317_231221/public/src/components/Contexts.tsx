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
  Input,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
  Center
} from '@chakra-ui/react';
import axios from 'axios';
import config from '../config';

// Configure axios for API requests
const API_URL = 'http://localhost:54420';
console.log('Contexts component using API URL:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Log requests for debugging
apiClient.interceptors.request.use(request => {
  console.log('Starting API Request:', request.url);
  return request;
});

// Log responses for debugging
apiClient.interceptors.response.use(
  response => {
    console.log('API Response success:', response.status);
    return response;
  },
  error => {
    console.error('API Response error:', error.message);
    return Promise.reject(error);
  }
);

interface Context {
  id: string;
  content: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export default function Contexts() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchContexts();
  }, []);

  const fetchContexts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching contexts from /api/contexts');
      const response = await apiClient.get<any>('/api/contexts');
      console.log('Response:', response.data);
      
      // Handle nested array format: [[context1, context2, ...]]
      const contextData = Array.isArray(response.data) && response.data.length > 0 && Array.isArray(response.data[0])
        ? response.data[0]  // Extract the inner array
        : response.data;
      
      setContexts(contextData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contexts:', error);
      setLoading(false);
      
      // Extract error message
      let errorMessage = 'Failed to fetch contexts. Please try again.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: 'Error fetching contexts',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return fetchContexts();
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<Context[]>(`/api/contexts/search?query=${encodeURIComponent(searchQuery)}`);
      setContexts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error searching contexts:', error);
      setLoading(false);
      
      // Extract error message
      let errorMessage = 'Failed to search contexts. Please try again.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: 'Error searching contexts',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg">Contexts</Heading>
        
        <HStack>
          <Input
            placeholder="Search contexts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button colorScheme="blue" onClick={handleSearch}>
            Search
          </Button>
        </HStack>

        {loading ? (
          <Center p={8}>
            <Spinner size="xl" />
          </Center>
        ) : error ? (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        ) : contexts.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            No contexts found
          </Alert>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Content</Th>
                <Th>Timestamp</Th>
                <Th>Metadata</Th>
              </Tr>
            </Thead>
            <Tbody>
              {contexts.map((context) => (
                <Tr key={context.id}>
                  <Td>{context.id}</Td>
                  <Td>
                    <Text noOfLines={2}>{context.content}</Text>
                  </Td>
                  <Td>{new Date(context.timestamp).toLocaleString()}</Td>
                  <Td>
                    <Text noOfLines={1}>
                      {JSON.stringify(context.metadata)}
                    </Text>
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