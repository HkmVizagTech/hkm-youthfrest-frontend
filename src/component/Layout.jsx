import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => (
  <Flex minH="100vh" bg="gray.50">
    <Sidebar />
    <Box flex="1" bg="gray.50" p={{ base: 3, md: 5 }} ml={{ base: 0, md: "220px" }} mt={{ base: "52px", md: 0 }}>
      {children}
    </Box>
  </Flex>
);

export default Layout;
