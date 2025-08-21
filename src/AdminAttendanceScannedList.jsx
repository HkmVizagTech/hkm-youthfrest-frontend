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
} from "@chakra-ui/react";
import { CheckCircleIcon, PhoneIcon } from "@chakra-ui/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import Layout from "./component/Layout";

const AdminAttendanceScannedList = () => {
  const [data, setData] = useState([]);
  const [filteredCollege, setFilteredCollege] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(
      "https://hkm-youtfrest-backend-razorpay-882278565284.asia-south1.run.app/users/admin/scanned-list"
    )
      .then((res) => res.json())
      .then((records) => {
        setData(records);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch scanned attendance", err);
        setLoading(false);
      });
  }, []);

  const filterByDate = (candidate) => {
    if (!startDate && !endDate) return true;
    if (!candidate.adminAttendanceDate) return false;
    const candidateDate = new Date(candidate.adminAttendanceDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : null;
    if (start && candidateDate < start) return false;
    if (end && candidateDate > end) return false;
    return true;
  };

  const filteredData = data.filter((c) => {
    const collegeMatch = filteredCollege ? c.college === filteredCollege : true;
    const dateMatch = filterByDate(c);

    const searchMatch =
      search.length < 2 ||
      [c.name, c.email, c.phone, c.college, c.branch]
        .map((v) => (v && v !== "-" ? v : ""))
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    const timeMatch = (() => {
      if (!timeFilter || !c.adminAttendanceDate) return true;

      const dateObj = new Date(c.adminAttendanceDate);
      const recordDateStr = dateObj.toISOString().split("T")[0];
      const targetDateStr = startDate || "";

      if (targetDateStr && recordDateStr !== targetDateStr) return true;

      const hours = dateObj.getHours();
      if (timeFilter === "morning") return hours >= 8 && hours < 16;
      if (timeFilter === "evening") return hours >= 16;
      return true;
    })();

    return collegeMatch && dateMatch && searchMatch && timeMatch;
  });

  const uniqueColleges = [
    ...new Set(data.map((c) => c.college).filter(Boolean)),
  ];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map((row, idx) => ({
        "S.No": idx + 1,
        Name: row.name,
        Email: row.email,
        Phone: row.phone,
        Gender: row.gender,
        College: row.college,
        Branch: row.branch,
        "Scanned At": row.adminAttendanceDate
          ? new Date(row.adminAttendanceDate).toLocaleString()
          : "",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AdminScannedAttendance");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(file, "admin_scanned_attendance.xlsx");
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
            Admin Scanned Attendance List
          </Heading>
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
          <Flex gap={4} align="flex-end" wrap="nowrap" minW="850px">
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

            <FormControl w="150px">
              <FormLabel fontSize="sm">Time of Day</FormLabel>
              <Select
                placeholder="All"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                bg="gray.50"
                size="sm"
              >
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </Select>
            </FormControl>
          </Flex>
        </Box>

        <HStack mb={4}>
          <Badge colorScheme="purple" fontSize="lg">
            Total Scanned: {filteredData.length}
          </Badge>
        </HStack>

        <Box overflowX="auto" rounded="md" boxShadow="md" bg="white" p={2}>
          <Table variant="simple" size="sm">
            <Thead bg="gray.100">
              <Tr>
                <Th>#</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Gender</Th>
                <Th>Phone</Th>
                <Th>College</Th>
                <Th>Branch</Th>
                <Th>Scanned At</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredData.map((candidate, idx) => (
                <Tr key={candidate._id} _hover={{ bg: "gray.50" }}>
                  <Td>{idx + 1}</Td>
                  <Td>
                    <Text fontWeight="semibold">{candidate.name}</Text>
                  </Td>
                  <Td>
                    <Tooltip label={candidate.email} fontSize="xs">
                      <Text fontSize="sm" noOfLines={1} maxW="140px">
                        {candidate.email}
                      </Text>
                    </Tooltip>
                  </Td>
                  <Td>{candidate.gender || ""}</Td>
                  <Td>
                    <Tooltip label={candidate.phone} fontSize="xs">
                      <HStack spacing={1}>
                        <PhoneIcon boxSize={3} color="green.500" />
                        <Text fontSize="sm" noOfLines={1} maxW="110px">
                          {candidate.phone}
                        </Text>
                      </HStack>
                    </Tooltip>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{candidate.college || ""}</Text>
                  </Td>
                  <Td>{candidate.branch || ""}</Td>
                  <Td>
                    {candidate.adminAttendanceDate
                      ? new Date(
                          candidate.adminAttendanceDate
                        ).toLocaleDateString()
                      : ""}
                  </Td>
                  <Td>
                    <Tag colorScheme="green" size="sm">
                      <CheckCircleIcon mr={1} color="green.500" /> Scanned
                    </Tag>
                  </Td>
                </Tr>
              ))}
              {filteredData.length === 0 && (
                <Tr>
                  <Td colSpan={9}>
                    <Text color="gray.400" textAlign="center" py={10}>
                      No scanned attendance records found.
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

export default AdminAttendanceScannedList;
