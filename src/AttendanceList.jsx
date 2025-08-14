import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  Input,
  Flex,
  FormControl,
  FormLabel,
  Tag,
  Tooltip,
  Text,
  HStack,
  Badge,
  Select,
  chakra,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon, DownloadIcon, PhoneIcon } from "@chakra-ui/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Layout from "./component/Layout";

const AttendanceList = () => {
  const [data, setData] = useState([]);
  const [filteredCollege, setFilteredCollege] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("https://hkm-youtfrest-backend-razorpay-882278565284.asia-south1.run.app/users/attendance-list")
      .then((res) => res.json())
      .then((records) => {
        setData(records);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch attendance list", err);
        setLoading(false);
      });
  }, []);

  const filterByDate = (candidate) => {
    if (!startDate && !endDate) return true;
    const candidateDate = candidate.attendanceDate
      ? new Date(candidate.attendanceDate)
      : candidate.registrationDate
      ? new Date(candidate.registrationDate)
      : null;
    if (!candidateDate) return false;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;
    if (start && candidateDate < start) return false;
    if (end && candidateDate > end) return false;
    return true;
  };

  const filteredData = data.filter((c) => {
    const collegeMatch = filteredCollege ? c.college === filteredCollege : true;
    const dateMatch = filterByDate(c);
    const searchMatch =
      search.length < 2 ||
      [c.name, c.email, c.whatsappNumber, c.college, c.branch]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
    return collegeMatch && dateMatch && searchMatch;
  });

  const uniqueColleges = [...new Set(data.map((c) => c.college).filter(Boolean))];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map((row, idx) => ({
        "S.No": idx + 1,
        Name: row.name,
        Gender: row.gender,
        Email: row.email,
        College: row.college,
        Branch: row.branch,
        Phone: row.whatsappNumber,
        Slot: row.slot,
        Attendance: row.attendance ? "Yes" : "No",
        "Attendance Date": row.attendanceDate
          ? new Date(row.attendanceDate).toLocaleString()
          : "",
        "Registration Date": row.registrationDate
          ? new Date(row.registrationDate).toLocaleString()
          : "",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(file, "attendance.xlsx");
  };

  if (loading)
    return (
      <Layout>
        <Flex justify="center" align="center" minH="70vh">
          <Spinner size="xl" />
        </Flex>
      </Layout>
    );

  return (
    <Layout>
      <Box px={{ base: 2, md: 8 }} py={6} maxW="100vw" minH="100vh" bg="gray.50">
        <Flex justify="space-between" align="center" mb={6} wrap="wrap">
          <Heading size="lg" color="teal.700">
            Attendance List
          </Heading>
          <Button
            colorScheme="teal"
            variant="solid"
            leftIcon={<DownloadIcon />}
            onClick={exportToExcel}
            minW="140px"
            size="sm"
          >
            Export to Excel
          </Button>
        </Flex>

        <Box
          mb={4}
          overflowX="auto"
          py={2}
          px={2}
          bg="white"
          borderRadius="md"
          boxShadow="sm"
        >
          <Flex gap={4} align="flex-end" wrap="nowrap" minW="600px">
            <FormControl w="180px">
              <FormLabel fontSize="sm">College</FormLabel>
              <Select
                placeholder="Select College"
                onChange={(e) => setFilteredCollege(e.target.value)}
                value={filteredCollege}
                bg="gray.50"
                size="sm"
              >
                {uniqueColleges.map((college, i) => (
                  <option key={i} value={college}>
                    {college}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl w="150px">
              <FormLabel fontSize="sm">From</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                bg="gray.50"
                size="sm"
              />
            </FormControl>
            <FormControl w="150px">
              <FormLabel fontSize="sm">To</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                bg="gray.50"
                size="sm"
              />
            </FormControl>
            <FormControl w="220px">
              <FormLabel fontSize="sm">Search</FormLabel>
              <Input
                placeholder="Name, email, phone, college..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                bg="gray.50"
                size="sm"
              />
            </FormControl>
          </Flex>
        </Box>

        <HStack mb={4}>
          <Badge colorScheme="purple" fontSize="lg">
            Total Marked: {filteredData.length}
          </Badge>
        </HStack>

        <Box overflowX="auto" rounded="md" boxShadow="md" bg="white" p={2}>
          <Table variant="simple" size="sm">
            <Thead bg="gray.100">
              <Tr>
                <Th>#</Th>
                <Th>Name</Th>
                <Th>Gender</Th>
                <Th>Phone</Th>
                <Th>College</Th>
                <Th>Branch</Th>
                <Th>Email</Th>
                <Th>Attendance</Th>
                <Th>Slot</Th>
                <Th>Attendance Date</Th>
                <Th>Registration Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredData.map((candidate, idx) => (
                <Tr key={candidate._id} _hover={{ bg: "gray.50" }}>
                  <Td>{idx + 1}</Td>
                  <Td>
                    <Text fontWeight="semibold">{candidate.name}</Text>
                  </Td>
                  <Td>{candidate.gender}</Td>
                  <Td>
                    <Tooltip label={candidate.whatsappNumber} fontSize="xs">
                      <HStack spacing={1}>
                        <PhoneIcon boxSize={3} color="green.500" />
                        <Text fontSize="sm" noOfLines={1} maxW="110px">
                          {candidate.whatsappNumber}
                        </Text>
                      </HStack>
                    </Tooltip>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{candidate.college}</Text>
                  </Td>
                  <Td>{candidate.branch}</Td>
                  <Td>
                    <Tooltip label={candidate.email} fontSize="xs">
                      <Text fontSize="sm" noOfLines={1} maxW="140px">
                        {candidate.email}
                      </Text>
                    </Tooltip>
                  </Td>
                  <Td>
                    {candidate.attendance ? (
                      <CheckCircleIcon color="green.400" />
                    ) : (
                      <WarningIcon color="gray.400" />
                    )}
                  </Td>
                  <Td>
                    {candidate.slot ? (
                      <Tag colorScheme="teal" fontWeight="bold" fontSize="sm" px={2}>
                        {candidate.slot}
                      </Tag>
                    ) : (
                      <Tag colorScheme="gray" fontSize="sm" px={2}>
                        N/A
                      </Tag>
                    )}
                  </Td>
                  <Td>
                    {candidate.attendanceDate
                      ? new Date(candidate.attendanceDate).toLocaleString()
                      : "-"}
                  </Td>
                  <Td>
                    {candidate.registrationDate
                      ? new Date(candidate.registrationDate).toLocaleDateString()
                      : "-"}
                  </Td>
                </Tr>
              ))}
              {filteredData.length === 0 && (
                <Tr>
                  <Td colSpan={11}>
                    <Text color="gray.400" textAlign="center" py={10}>
                      No attendance records found.
                    </Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Layout>
  );
};

export default AttendanceList;