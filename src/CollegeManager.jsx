import React, { useEffect, useState } from 'react';
import { Box, Input, Button, Stack, HStack, Text, useToast, IconButton, Flex, Heading, Divider } from '@chakra-ui/react';
import { EditIcon, DeleteIcon, CheckIcon, AddIcon } from '@chakra-ui/icons';
import axios from 'axios';
import Layout from './component/Layout';

const API_URL = 'https://vrc-server-110406681774.asia-south1.run.app/college';

const CollegeManager = () => {
  const [colleges, setColleges] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchColleges = async () => {
    setLoading(true);
    try { const r = await axios.get(API_URL); setColleges(Array.isArray(r.data) ? r.data : []); }
    catch { toast({ title: 'Failed to fetch colleges.', status: 'error' }); }
    setLoading(false);
  };

  const handleCreateOrUpdate = async () => {
    if (!name.trim()) { toast({ title: 'College name required.', status: 'warning' }); return; }
    setLoading(true);
    try {
      if (editingId) { await axios.put(`${API_URL}/${editingId}`, { name }); toast({ title: 'College updated.', status: 'success' }); }
      else { await axios.post(API_URL, { name }); toast({ title: 'College added.', status: 'success' }); }
      setName(''); setEditingId(null); fetchColleges();
    } catch (err) { toast({ title: 'Error.', description: err.response?.data?.error || 'Failed', status: 'error' }); }
    setLoading(false);
  };

  const handleDelete = async id => {
    setLoading(true);
    try { await axios.delete(`${API_URL}/${id}`); toast({ title: 'College deleted.', status: 'info' }); fetchColleges(); }
    catch { toast({ title: 'Delete failed.', status: 'error' }); }
    setLoading(false);
  };

  useEffect(() => { fetchColleges(); }, []);

  return (
    <Layout>
      <Box py={4} maxW="640px">
        <Box mb={6}>
          <Text fontSize="xs" fontWeight={700} color="night.400" textTransform="uppercase" letterSpacing="0.12em">Admin</Text>
          <Heading size="lg" color="night.800" fontWeight={800}>Colleges</Heading>
          <Text fontSize="sm" color="night.500" mt={1}>Add, edit, or remove colleges from the registration list.</Text>
        </Box>

        {/* add / edit form */}
        <Box bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)" p={5} mb={6}>
          <Text fontSize="sm" fontWeight={700} color="night.700" mb={3}>{editingId ? "Edit college" : "Add college"}</Text>
          <Stack spacing={3}>
            <Input placeholder="College name" value={name} onChange={e => setName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleCreateOrUpdate()} />
            <HStack>
              <Button variant="pulse" leftIcon={editingId ? <CheckIcon /> : <AddIcon />} onClick={handleCreateOrUpdate} isLoading={loading} isDisabled={!name.trim()} flex={1}>
                {editingId ? "Update" : "Add college"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={() => { setEditingId(null); setName(""); }} size="md">Cancel</Button>
              )}
            </HStack>
          </Stack>
        </Box>

        {/* list */}
        <Box bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)" overflow="hidden">
          <Box px={5} py={4} borderBottom="1px solid" borderColor="blackAlpha.100">
            <Text fontSize="sm" fontWeight={700} color="night.700">{colleges.length} college{colleges.length !== 1 ? "s" : ""}</Text>
          </Box>
          {colleges.length === 0 ? (
            <Text fontSize="sm" color="night.300" textAlign="center" py={10}>No colleges yet. Add one above.</Text>
          ) : colleges.map((c, i) => (
            <Flex key={c._id} align="center" justify="space-between" px={5} py={3}
              borderBottom={i < colleges.length - 1 ? "1px solid" : "none"} borderColor="blackAlpha.60"
              _hover={{ bg: "peacock.50" }} transition="background 0.1s">
              <Text fontSize="sm" fontWeight={500} color="night.800" flex={1} wordBreak="break-word">{c.name}</Text>
              <HStack spacing={1} flexShrink={0}>
                <IconButton aria-label="Edit" icon={<EditIcon />} size="sm" variant="ghost" colorScheme="gray" isRound onClick={() => { setEditingId(c._id); setName(c.name); }} />
                <IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" isRound onClick={() => handleDelete(c._id)} />
              </HStack>
            </Flex>
          ))}
        </Box>
      </Box>
    </Layout>
  );
};

export default CollegeManager;
