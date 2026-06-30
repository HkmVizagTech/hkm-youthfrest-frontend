import { API_HOST } from "./config";
import React, { useEffect, useState } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Button, Spinner, Input, Flex, FormControl, FormLabel, Tag, Tooltip, Text, HStack, Badge, Select } from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, DownloadIcon, PhoneIcon } from '@chakra-ui/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Layout from './component/Layout';

const AttendanceList = () => {
  const [data, setData] = useState([]);
  const [filteredCollege, setFilteredCollege] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API_HOST}/users/attendance-list`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filterByDate = c => {
    if (!startDate && !endDate) return true;
    const cd = c.attendanceDate ? new Date(c.attendanceDate) : c.registrationDate ? new Date(c.registrationDate) : null;
    if (!cd) return false;
    if (startDate && cd < new Date(startDate)) return false;
    if (endDate && cd > new Date(new Date(endDate).setHours(23,59,59,999))) return false;
    return true;
  };

  const filteredData = data.filter(c => {
    const collegeMatch = filteredCollege ? c.college === filteredCollege : true;
    const searchMatch = search.length < 2 || [c.name, c.email, c.whatsappNumber, c.college, c.branch].join(' ').toLowerCase().includes(search.toLowerCase());
    return collegeMatch && filterByDate(c) && searchMatch;
  });

  const uniqueColleges = [...new Set(data.map(c => c.college).filter(Boolean))];

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map((r, i) => ({
      'S.No': i + 1, Name: r.name, Gender: r.gender, Email: r.email, College: r.college,
      Branch: r.branch, Phone: r.whatsappNumber, Slot: r.slot,
      Attendance: r.attendance ? 'Yes' : 'No',
      'Attendance Date': r.attendanceDate ? new Date(r.attendanceDate).toLocaleString() : '',
      'Registration Date': r.registrationDate ? new Date(r.registrationDate).toLocaleString() : '',
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), 'attendance.xlsx');
  };

  if (loading) return <Layout><Flex justify="center" align="center" minH="70vh"><Spinner size="xl" color="peacock.500" /></Flex></Layout>;

  return (
    <Layout>
      <Box py={4}>
        <Flex justify="space-between" align="center" mb={5} wrap="wrap" gap={3}>
          <Box>
            <Text fontSize="xs" fontWeight={700} color="night.400" textTransform="uppercase" letterSpacing="0.12em">Admin</Text>
            <Heading size="lg" color="night.800" fontWeight={800}>Attendance</Heading>
          </Box>
          <HStack>
            <Badge px={3} py={1} borderRadius="full" colorScheme="purple" fontSize="sm">Total: {filteredData.length}</Badge>
            <Button size="sm" colorScheme="teal" leftIcon={<DownloadIcon />} onClick={exportToExcel}>Export Excel</Button>
          </HStack>
        </Flex>

        <Box mb={4} p={4} bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)" overflowX="auto">
          <Flex gap={3} align="flex-end" wrap="nowrap" minW="580px">
            <FormControl w="170px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">College</FormLabel>
              <Select placeholder="All colleges" size="sm" value={filteredCollege} onChange={e => setFilteredCollege(e.target.value)}>
                {uniqueColleges.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </Select>
            </FormControl>
            <FormControl w="140px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">From</FormLabel>
              <Input type="date" size="sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </FormControl>
            <FormControl w="140px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">To</FormLabel>
              <Input type="date" size="sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </FormControl>
            <FormControl flex={1}><FormLabel fontSize="xs" fontWeight={700} color="night.600">Search</FormLabel>
              <Input placeholder="Name, phone, college…" size="sm" value={search} onChange={e => setSearch(e.target.value)} />
            </FormControl>
          </Flex>
        </Box>

        <Box overflowX="auto" bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)">
          <Table variant="simple" size="sm">
            <Thead><Tr bg="night.50">
              {["#","Name","Gender","Phone","College","Branch","Email","Present","Slot","Attended","Registered"].map(h => (
                <Th key={h} fontSize="xs" color="night.500" fontWeight={700} whiteSpace="nowrap">{h}</Th>
              ))}
            </Tr></Thead>
            <Tbody>
              {filteredData.map((c, i) => (
                <Tr key={c._id} _hover={{ bg: "peacock.50" }} transition="background 0.1s">
                  <Td fontSize="xs" color="night.400">{i + 1}</Td>
                  <Td><Text fontWeight={600} fontSize="sm" color="night.800">{c.name}</Text></Td>
                  <Td fontSize="sm">{c.gender}</Td>
                  <Td><HStack spacing={1}><PhoneIcon boxSize={3} color="peacock.500" /><Text fontSize="sm">{c.whatsappNumber}</Text></HStack></Td>
                  <Td fontSize="sm">{c.college}</Td>
                  <Td fontSize="sm">{c.branch || "—"}</Td>
                  <Td><Tooltip label={c.email}><Text fontSize="xs" noOfLines={1} maxW="140px" color="night.500">{c.email}</Text></Tooltip></Td>
                  <Td>{c.attendance ? <CheckCircleIcon color="green.400" /> : <WarningIcon color="gray.300" />}</Td>
                  <Td><Tag size="sm" colorScheme={c.slot?.toLowerCase().includes('morning') ? 'teal' : c.slot?.toLowerCase().includes('evening') ? 'orange' : 'gray'}>{c.slot || "—"}</Tag></Td>
                  <Td fontSize="xs" color="night.400" whiteSpace="nowrap">{c.attendanceDate ? new Date(c.attendanceDate).toLocaleString() : "—"}</Td>
                  <Td fontSize="xs" color="night.400" whiteSpace="nowrap">{c.registrationDate ? new Date(c.registrationDate).toLocaleDateString() : "—"}</Td>
                </Tr>
              ))}
              {filteredData.length === 0 && <Tr><Td colSpan={11}><Text color="night.300" textAlign="center" py={10} fontSize="sm">No attendance records found.</Text></Td></Tr>}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Layout>
  );
};

export default AttendanceList;
