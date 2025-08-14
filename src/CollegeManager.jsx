import React, { useEffect, useState } from 'react';
import {
  Box,
  Input,
  Button,
  Stack,
  HStack,
  Text,
  useToast,
  IconButton,
  Flex,
  Heading,
  Avatar,
  Divider,
  useColorModeValue,
  Center,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, CheckCircleIcon, PlusSquareIcon } from '@chakra-ui/icons';
import { FaUniversity } from 'react-icons/fa';
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
    try {
      const res = await axios.get(API_URL);
      setColleges(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast({ title: 'Failed to fetch colleges.', status: 'error' });
    }
    setLoading(false);
  };

  const handleCreateOrUpdate = async () => {
    if (!name.trim()) {
      toast({ title: 'College name required!', status: 'warning' });
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, { name });
        toast({ title: 'College updated.', status: 'success' });
      } else {
        await axios.post(API_URL, { name });
        toast({ title: 'College added.', status: 'success' });
      }
      setName('');
      setEditingId(null);
      fetchColleges();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed', status: 'error' });
    }
    setLoading(false);
  };

  const handleEdit = (college) => {
    setName(college.name);
    setEditingId(college._id);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast({ title: 'College deleted.', status: 'info' });
      fetchColleges();
    } catch (err) {
      toast({ title: 'Delete failed.', status: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.600");
  const sectionBg = useColorModeValue("gray.50", "gray.700");

  return (
    <Layout>
      <Center minH="100vh" px={0}>
        <Box
          w={{ base: "90vw", md: "90%", lg: "740px" }}
          maxW="100vw"
          mx="auto"
          mt={{ base: 2, md: 10 }}
          p={{ base: 2, md: 8 }}
          bg={cardBg}
          borderWidth={1}
          borderColor={cardBorder}
          borderRadius={{ base: "none", md: "2xl" }}
          boxShadow="lg"
        >
          <Flex align="center" justify="center" direction="column" mb={6}>
            <Avatar icon={<FaUniversity fontSize="2.5rem" />} size="xl" mb={2} />
            <Heading size="lg" fontWeight="bold" mb={1}>
              College Manager
            </Heading>
            <Text fontSize="md" textAlign="center" px={2} mb={0}>
              Add, edit, or remove colleges for your system.
            </Text>
          </Flex>
          <Stack
            spacing={4}
            rounded="lg"
            p={4}
            bg={sectionBg}
            mb={6}
            border="1px"
            borderColor={cardBorder}
            w="100%"
          >
            <Input
              placeholder="Enter College Name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              fontWeight="medium"
              bg="white"
              _dark={{ bg: "gray.900" }}
              letterSpacing="wide"
              borderRadius="md"
              border="1px solid"
              borderColor={cardBorder}
              w="100%"
            />
            <Button
              colorScheme={editingId ? "gray" : "teal"}
              leftIcon={editingId ? <CheckCircleIcon /> : <PlusSquareIcon />}
              onClick={handleCreateOrUpdate}
              isLoading={loading}
              fontWeight="bold"
              fontSize="md"
              disabled={loading || !name.trim()}
              shadow="sm"
              borderRadius="md"
              w="100%"
            >
              {editingId ? 'Update College' : 'Add College'}
            </Button>
            {editingId && (
              <Button
                onClick={() => { setEditingId(null); setName(""); }}
                variant="ghost"
                colorScheme="gray"
                size="sm"
                borderRadius="md"
                shadow="none"
                w="100%"
              >
                Cancel Edit
              </Button>
            )}
          </Stack>
          <Divider mb={6} />
          <Box>
            <Text fontSize="md" fontWeight="bold" mb={3}>
              {colleges.length === 0 ? "No colleges yet." : "All Colleges"}
            </Text>
            <Stack spacing={3}>
              {colleges.map((college) => (
                <Flex
                  key={college._id}
                  align="center"
                  justify="space-between"
                  bg={sectionBg}
                  px={4}
                  py={2}
                  rounded="md"
                  border="1px"
                  borderColor={cardBorder}
                  shadow="sm"
                  transition="all 0.2s"
                  _hover={{ shadow: "md", borderColor: "teal.300" }}
                  minWidth={0}
                  w="100%"
                  flexWrap="wrap"
                >
                  <HStack minWidth={0} flex="1">
                    <Text
                      fontWeight="medium"
                      fontSize="md"
                      whiteSpace="normal"
                      wordBreak="break-word"
                      flex="1"
                    >
                      {college.name}
                    </Text>
                  </HStack>
                  <HStack spacing={1} flexShrink={0} pl={2}>
                    <IconButton
                      aria-label="Edit"
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="gray"
                      variant="ghost"
                      onClick={() => handleEdit(college)}
                      isRound
                    />
                    <IconButton
                      aria-label="Delete"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDelete(college._id)}
                      isRound
                    />
                  </HStack>
                </Flex>
              ))}
            </Stack>
          </Box>
        </Box>
      </Center>
    </Layout>
  );
};

export default CollegeManager;