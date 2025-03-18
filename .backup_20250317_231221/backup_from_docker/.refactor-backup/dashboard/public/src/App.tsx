import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ChakraProvider, Box, Flex, VStack, Heading, Text } from '@chakra-ui/react';
import Contexts from './components/Contexts';
import Backups from './components/Backups';

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Box minH="100vh" bg="gray.50">
          <Flex>
            {/* Sidebar */}
            <VStack
              w="250px"
              h="100vh"
              p={5}
              bg="white"
              borderRight="1px"
              borderColor="gray.200"
              spacing={4}
            >
              <Heading size="md" mb={4}>Context Keeper</Heading>
              <Link to="/">
                <Text fontSize="lg">Contexts</Text>
              </Link>
              <Link to="/backups">
                <Text fontSize="lg">Backups</Text>
              </Link>
            </VStack>

            {/* Main Content */}
            <Box flex={1} p={8}>
              <Routes>
                <Route path="/" element={<Contexts />} />
                <Route path="/backups" element={<Backups />} />
              </Routes>
            </Box>
          </Flex>
        </Box>
      </Router>
    </ChakraProvider>
  );
}

export default App; 