import React, { useEffect, useState } from "react";
import {
  Box, Heading, Text, Input, Select, Button, Stack, HStack, VStack,
  useToast, IconButton, Flex, Tag, Divider, FormControl, FormLabel, Spinner,
} from "@chakra-ui/react";
import { DeleteIcon, AddIcon } from "@chakra-ui/icons";
import axios from "axios";
import Layout from "./component/Layout";
import { API_HOST } from "./config";

const API_URL = `${API_HOST}/admin/users`;

const roleLabel = { admin: "Admin", volunteer: "Volunteer", user: "Volunteer", collegeadmin: "College Admin" };
const roleColor = { admin: "purple", volunteer: "teal", user: "teal", collegeadmin: "orange" };

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "volunteer" });
  const toast = useToast();

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const fetchUsers = async () => {
    setLoading(true);
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await axios.get(`${API_URL}/`, { headers: authHeader(), timeout: 10000 });
        setUsers(res.data.users || []);
        setLoading(false);
        return;
      } catch (err) {
        const status = err.response?.status;
        // Auth/permission failures won't fix themselves on retry — surface
        // them right away instead of making the admin wait through retries.
        const isAuthFailure = status === 401 || status === 403;
        if (isAuthFailure || attempt === maxAttempts) {
          toast({ title: "Failed to load team", description: err.response?.data?.message || err.message, status: "error" });
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast({ title: "Fill in all fields", status: "warning" });
      return;
    }
    setCreating(true);
    try {
      await axios.post(`${API_URL}/register`, form, { headers: authHeader() });
      toast({ title: `${roleLabel[form.role]} account created`, status: "success" });
      setForm({ name: "", email: "", password: "", role: "volunteer" });
      fetchUsers();
    } catch (err) {
      toast({ title: "Could not create account", description: err.response?.data?.message || err.message, status: "error" });
    }
    setCreating(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}'s account? They will lose access immediately.`)) return;
    try {
      await axios.delete(`${API_URL}/${id}`, { headers: authHeader() });
      toast({ title: "Account removed", status: "info" });
      fetchUsers();
    } catch (err) {
      toast({ title: "Could not remove account", description: err.response?.data?.message || err.message, status: "error" });
    }
  };

  return (
    <Layout>
      <Box py={4} maxW="720px">
        <Box mb={6}>
          <Text fontSize="xs" fontWeight={700} color="night.400" textTransform="uppercase" letterSpacing="0.12em">Admin</Text>
          <Heading size="lg" color="night.800" fontWeight={800}>Team</Heading>
          <Text fontSize="sm" color="night.500" mt={1}>
            Create admin or scanner-staff accounts and manage who has access.
          </Text>
        </Box>

        {/* add user form */}
        <Box bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)" p={5} mb={6}>
          <Text fontSize="sm" fontWeight={700} color="night.700" mb={3}>Add a teammate</Text>
          <form onSubmit={handleCreate}>
            <Stack spacing={3}>
              <HStack spacing={3} align="flex-start">
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight={700} color="night.600">Name</FormLabel>
                  <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight={700} color="night.600">Role</FormLabel>
                  <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="volunteer">Volunteer</option>
                    <option value="collegeadmin">College Admin</option>
                    <option value="admin">Admin</option>
                  </Select>
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel fontSize="xs" fontWeight={700} color="night.600">Email</FormLabel>
                <Input type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs" fontWeight={700} color="night.600">Password</FormLabel>
                <Input type="password" placeholder="Set a password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </FormControl>
              <Button variant="pulse" type="submit" leftIcon={<AddIcon />} isLoading={creating} alignSelf="flex-start">
                Create account
              </Button>
            </Stack>
          </form>
          <Text fontSize="xs" color="night.400" mt={3}>
            <Tag size="sm" colorScheme="purple" mr={1}>Admin</Tag> full access, including Team and Colleges.{" "}
            <Tag size="sm" colorScheme="orange" mr={1}>College Admin</Tag> registrations + colleges only.{" "}
            <Tag size="sm" colorScheme="teal" mr={1}>Volunteer</Tag> QR scanner + scanned list only.
          </Text>
        </Box>

        {/* user list */}
        <Box bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)" overflow="hidden">
          <Box px={5} py={4} borderBottom="1px solid" borderColor="blackAlpha.100">
            <Text fontSize="sm" fontWeight={700} color="night.700">{users.length} account{users.length !== 1 ? "s" : ""}</Text>
          </Box>
          {loading ? (
            <Flex justify="center" py={10}><Spinner color="peacock.500" /></Flex>
          ) : users.length === 0 ? (
            <Text fontSize="sm" color="night.300" textAlign="center" py={10}>No accounts yet.</Text>
          ) : (
            users.map((u, i) => (
              <Flex key={u._id} align="center" justify="space-between" px={5} py={3}
                borderBottom={i < users.length - 1 ? "1px solid" : "none"} borderColor="blackAlpha.60"
                _hover={{ bg: "peacock.50" }} transition="background 0.1s">
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight={600} color="night.800">{u.name}</Text>
                  <Text fontSize="xs" color="night.400">{u.email}</Text>
                </Box>
                <Tag size="sm" colorScheme={roleColor[u.role] || "gray"} mr={3}>{roleLabel[u.role] || u.role}</Tag>
                <IconButton aria-label="Remove" icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" isRound onClick={() => handleDelete(u._id, u.name)} />
              </Flex>
            ))
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default Team;
