import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import Sidebar from './Sidebar';

// Use Google's Material Design background color (light: #F5F5F5, dark: #121212)
const Layout = ({ children }) => {
  // Uses the appropriate background depending on the color mode
  const bg = useColorModeValue("#F5F5F5", "#121212"); // Google Material light/dark background

  return (
    <Flex minHeight="100vh" bg={bg}>
      <Sidebar />
  <Box flex="1" bg={bg} p={{ base: 1, md: 3 }} ml={{ base: 0, md: "220px" }} mt={{ base: "56px", md: 0 }}>
        {children}
      </Box>
    </Flex>
  );
};

export default Layout;