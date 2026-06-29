import { Box, VStack, Text, Button, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, useDisclosure, Divider, HStack } from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";

const NAV = {
  admin: [
    { to: "/admin", label: "All Candidates", icon: "👥" },
    { to: "/admin/attendance", label: "Attendance", icon: "📋" },
    { to: "/admin/AdminAttendanceScannedList", label: "Scanned List", icon: "✅" },
    { to: "/admin/adminqrscanner", label: "QR Scanner", icon: "📷" },
    { to: "/admin/college", label: "Colleges", icon: "🏫" },
  ],
  user: [
    { to: "/admin/AdminAttendanceScannedList", label: "Scanned List", icon: "✅" },
    { to: "/admin/adminqrscanner", label: "QR Scanner", icon: "📷" },
  ],
};

const SidebarContent = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const links = NAV[role] || [];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/admin/login");
    onClose?.();
  };

  return (
    <VStack align="stretch" spacing={1} h="full">
      <Box px={4} py={5} borderBottom="1px solid" borderColor="whiteAlpha.100">
        <Text fontSize="xs" letterSpacing="0.22em" fontWeight={700} color="peacock.300" textTransform="uppercase">Krishna Pulse</Text>
        <Text fontSize="xs" color="whiteAlpha.400" mt={0.5}>Admin Panel</Text>
      </Box>

      <VStack align="stretch" spacing={1} px={3} py={4} flex={1}>
        {links.map(link => {
          const active = location.pathname === link.to;
          return (
            <Box key={link.to} as={Link} to={link.to} onClick={onClose}
              display="flex" alignItems="center" gap={3} px={3} py={2.5} borderRadius="lg" cursor="pointer"
              bg={active ? "whiteAlpha.150" : "transparent"}
              borderLeft={active ? "3px solid" : "3px solid transparent"}
              borderLeftColor={active ? "peacock.400" : "transparent"}
              _hover={{ bg: "whiteAlpha.100" }} transition="all 0.15s"
            >
              <Text fontSize="md" lineHeight={1}>{link.icon}</Text>
              <Text fontSize="sm" fontWeight={active ? 700 : 500} color={active ? "white" : "whiteAlpha.700"}>{link.label}</Text>
            </Box>
          );
        })}
      </VStack>

      <Box px={3} py={4} borderTop="1px solid" borderColor="whiteAlpha.100">
        <Button size="sm" w="full" bg="lotus.900" color="lotus.200" border="1px solid" borderColor="lotus.700"
          _hover={{ bg: "lotus.800" }} fontWeight={600} onClick={handleLogout}>
          Sign out
        </Button>
      </Box>
    </VStack>
  );
};

const Sidebar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const sidebarBg = "night.800";

  return (
    <>
      {/* mobile top bar */}
      <Box display={{ base: "flex", md: "none" }} position="fixed" top={0} left={0} zIndex={1400}
        w="100vw" h="52px" bg={sidebarBg} px={4} alignItems="center" justifyContent="space-between"
        borderBottom="1px solid" borderColor="whiteAlpha.100">
        <Text fontSize="sm" fontWeight={700} color="white" letterSpacing="0.04em">Krishna Pulse Admin</Text>
        <IconButton icon={<HamburgerIcon />} aria-label="Open menu" onClick={onOpen} size="md"
          bg="transparent" color="whiteAlpha.800" _hover={{ bg: "whiteAlpha.100" }} />
      </Box>

      {/* desktop sidebar */}
      <Box w="220px" bg={sidebarBg} color="white" minH="100vh" position="fixed" top={0} left={0}
        display={{ base: "none", md: "flex" }} flexDirection="column" zIndex={1300}
        borderRight="1px solid" borderColor="whiteAlpha.100">
        <SidebarContent />
      </Box>

      {/* mobile drawer */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen} size="xs">
        <DrawerOverlay />
        <DrawerContent bg={sidebarBg} color="white" maxW="220px">
          <DrawerCloseButton color="whiteAlpha.700" />
          <DrawerHeader p={0} />
          <DrawerBody p={0} display="flex" flexDirection="column">
            <SidebarContent onClose={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* mobile spacer */}
      <Box display={{ base: "block", md: "none" }} h="52px" w="100%" />
    </>
  );
};

export default Sidebar;
