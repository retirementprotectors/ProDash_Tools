import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Select,
  useToast,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import config from '../config';

const API_URL = config.apiBaseUrl;
console.log('Monitoring component using API URL:', API_URL);

interface HealthMetrics {
  timestamp: number;
  memoryUsage: number;
  cpuUsage: number;
  contextCount: number;
  backupCount: number;
  lastBackupTime?: number;
}

export default function Monitoring() {
  const [metrics, setMetrics] = useState<HealthMetrics[]>([]);
  const [timeRange, setTimeRange] = useState('1h');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const end = Date.now();
      const start = end - getTimeRangeInMs(timeRange);
      console.log(`Fetching metrics from ${new Date(start).toISOString()} to ${new Date(end).toISOString()}`);
      
      const response = await axios.get<HealthMetrics[]>(
        `${API_URL}/api/monitoring/metrics?start=${start}&end=${end}`
      );
      
      console.log(`Received ${response.data.length} metrics`);
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: 'Error fetching metrics',
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

  const getTimeRangeInMs = (range: string): number => {
    switch (range) {
      case '1h': return 60 * 60 * 1000;
      case '6h': return 6 * 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  };

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">System Monitoring</Heading>
          <Select
            width="200px"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            isDisabled={isLoading}
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </Select>
        </Box>

        <Box height="400px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
              />
              <YAxis yAxisId="memory" label={{ value: 'Memory Usage', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="cpu" orientation="right" label={{ value: 'CPU Usage', angle: 90, position: 'insideRight' }} />
              <Tooltip
                labelFormatter={(timestamp) => new Date(Number(timestamp)).toLocaleString()}
                formatter={(value: number, name: string) => {
                  if (name === 'memoryUsage') return [formatBytes(value), 'Memory Usage'];
                  if (name === 'cpuUsage') return [value.toFixed(2), 'CPU Usage'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line
                yAxisId="memory"
                type="monotone"
                dataKey="memoryUsage"
                stroke="#8884d8"
                name="Memory Usage"
              />
              <Line
                yAxisId="cpu"
                type="monotone"
                dataKey="cpuUsage"
                stroke="#82ca9d"
                name="CPU Usage"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Current Stats</Heading>
          <HStack spacing={8}>
            <Box>
              <Text fontWeight="bold">Memory Usage</Text>
              <Text>{metrics.length > 0 ? formatBytes(metrics[metrics.length - 1].memoryUsage) : 'N/A'}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">CPU Usage</Text>
              <Text>{metrics.length > 0 ? `${(metrics[metrics.length - 1].cpuUsage / 1000).toFixed(2)}%` : 'N/A'}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">Context Count</Text>
              <Text>{metrics.length > 0 ? metrics[metrics.length - 1].contextCount : 'N/A'}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">Backup Count</Text>
              <Text>{metrics.length > 0 ? metrics[metrics.length - 1].backupCount : 'N/A'}</Text>
            </Box>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
} 