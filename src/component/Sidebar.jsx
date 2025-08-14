import {
  Box,
  VStack,
  Text,
  Button,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/admin/login");
  };


  const sidebarLinks = [];
  if (role === "admin") {
    sidebarLinks.push(
      { to: "/admin", label: "All Candidates" },
      { to: "/admin/attendance", label: "Attendance" },
      { to: "/admin/college", label: "College" }
    );
  }
  if (role === "admin" || role === "user") {
    sidebarLinks.push(
      { to: "/admin/AdminAttendanceScannedList", label: "AdminAttendanceScannedList" },
      { to: "/admin/adminqrscanner", label: "adminqrscanner" }
    );
  }

  const sidebarContent = (
    <VStack align="stretch" spacing="2" mt={0}>
      {sidebarLinks.map(link => (
        <Box
          key={link.to}
          as={Link}
          to={link.to}
          _hover={{ bg: "gray.700" }}
          p="2"
          borderRadius="md"
          cursor="pointer"
          bg={location.pathname === link.to ? "teal.600" : undefined}
          color={location.pathname === link.to ? "white" : undefined}
          fontWeight={location.pathname === link.to ? "bold" : undefined}
        >
          {link.label}
        </Box>
      ))}
      <Button colorScheme="red" mt={4} size="sm" onClick={handleLogout}>
        Logout
      </Button>
    </VStack>
  );

  return (
    <>
    
      <Box
        display={{ base: "block", md: "none" }}
        position="fixed"
        top={0}
        left={0}
        zIndex={1400}
        width="100vw"
        height="56px"
        bg="gray.800"
        px={4}
        py={2}
        boxShadow="md"
      >
        <IconButton
          icon={<HamburgerIcon />}
          aria-label="Open menu"
          onClick={onOpen}
          size="lg"
          bg="gray.800"
          color="white"
          _hover={{ bg: "gray.700" }}
        />
      </Box>
     
      <Box
        width="220px"
        bg="gray.800"
        color="white"
        p="3"
        minHeight="100vh"
        position="fixed" 
        top="0"
        left="0"
        display={{ base: "none", md: "block" }}
        zIndex={1300}
      >
        <Text fontSize="xl" fontWeight="bold" mb="4" textAlign="center">
          My Sidebar
        </Text>
        {sidebarContent}
      </Box>
     
      <Drawer
        placement="left"
        onClose={onClose}
        isOpen={isOpen}
        size="xs"
        trapFocus={false}
        blockScrollOnMount={false}
      >
        <DrawerOverlay />
        <DrawerContent bg="gray.800" color="white">
          <DrawerCloseButton />
          <DrawerHeader>My Sidebar</DrawerHeader>
          <DrawerBody>{sidebarContent}</DrawerBody>
        </DrawerContent>
      </Drawer>
      

      
      <Box
        as="span"
        display={{ base: "block", md: "none" }}
        height="56px"
        w="100%"
      />
    </>
  );
};

export default Sidebar;