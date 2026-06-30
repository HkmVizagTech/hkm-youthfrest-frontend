import { API_HOST } from "./config";
import React, { useState } from "react";
import { Box, Button, FormControl, FormLabel, Input, VStack, Text, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const API = `${API_HOST}/admin/users/login`;

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Logged in.", status: "success", duration: 2000, isClosable: true });
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        if (data.role === "admin") navigate("/admin");
        else if (data.role === "user") navigate("/admin/AdminAttendanceScannedList");
        else navigate("/");
      } else {
        toast({ title: "Login failed.", description: data.message || "Check your credentials.", status: "error", duration: 3000, isClosable: true });
      }
    } catch {
      toast({ title: "Network error.", description: "Please try again.", status: "error", duration: 3000, isClosable: true });
    } finally { setIsLoading(false); }
  };

  return (
    <Box bg="night.900" minH="100vh" display="flex" alignItems="center" justifyContent="center" px={4} position="relative" overflow="hidden">
      <Box className="kp-blob" position="absolute" top="-60px" left="-40px" w="280px" h="280px" bgGradient="radial(peacock.400, transparent 70%)" filter="blur(20px)" opacity={0.35} pointerEvents="none" />
      <Box className="kp-blob" position="absolute" bottom="-40px" right="-40px" w="260px" h="260px" bgGradient="radial(lotus.400, transparent 70%)" filter="blur(20px)" opacity={0.3} pointerEvents="none" />

      <Box w="full" maxW="400px" position="relative">
        <Text fontSize="xs" letterSpacing="0.32em" fontWeight={700} color="peacock.300" textTransform="uppercase" textAlign="center" mb={6}>
          Krishna Pulse · Admin
        </Text>

        <Box bg="cream" borderRadius="2xl" overflow="hidden" boxShadow="0 30px 60px -20px rgba(12,9,33,0.8)">
          <Box h="5px" bgGradient="linear(to-r, peacock.500, marigold.400, lotus.400)" />
          <Box px={8} py={8}>
            <Text fontSize="xl" fontWeight={800} color="night.800" mb={6} textAlign="center">Sign in</Text>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input name="email" type="email" placeholder="admin@hkmvizag.org" value={formData.email} onChange={handleChange} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} />
                </FormControl>
                <Button variant="pulse" type="submit" isLoading={isLoading} loadingText="Signing in" w="full" mt={2} py={6}>
                  Sign in
                </Button>
              </VStack>
            </form>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
