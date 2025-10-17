import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Select,
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
  Stack,
  Badge,
  chakra,
  HStack,
  VStack,
  Divider,
  Avatar,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon, TimeIcon, EmailIcon, PhoneIcon, DownloadIcon } from "@chakra-ui/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import Layout from "./component/Layout";

const statusColors = {
  Paid: "green",
  Pending: "yellow",
  Failed: "red",
};

const CandidateExport = () => {
  const [data, setData] = useState([]);
  const [filteredCollege, setFilteredCollege] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [filteredPaymentStatus, setFilteredPaymentStatus] = useState("");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

useEffect(() => {
  fetch("https://hkm-youtfrest-backend-razorpay-882278565284.asia-south1.run.app/users")
    .then((res) => res.json())
    .then((resData) => {
      // ✅ Extract the candidates array
      setData(resData.candidates || []);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Failed to fetch data", err);
      setLoading(false);
    });
}, []);

  const filterByDate = (candidate) => {
    if (!startDate && !endDate) return true;
    const candidateDate = new Date(candidate.registrationDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;
    if (start && candidateDate < start) return false;
    if (end && candidateDate > end) return false;
    return true;
  };

  const filteredData = data.filter((c) => {
    const collegeMatch = filteredCollege ? c.college === filteredCollege : true;
    const dateMatch = filterByDate(c);
    const paymentMatch = filteredPaymentStatus ? c.paymentStatus === filteredPaymentStatus : true;
    const searchMatch =
      search.length < 2 ||
      [c.name, c.email, c.whatsappNumber, c.college, c.companyName]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
    return collegeMatch && dateMatch && paymentMatch && searchMatch;
  });

  const uniqueColleges = [...new Set(data.map((c) => c.college).filter(Boolean))];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map((row) => ({
        "S.No": row.serialNo,
        Name: row.name,
        Gender: row.gender,
        Email: row.email,
        College: row.college,
        "Company Name": row.companyName,
        Course: row.course,
        "College/Working": row.collegeOrWorking,
        Year: row.year,
        Phone: row.whatsappNumber,
        Slot: row.slot,
        "Order ID": row.orderId,
        "Payment Amount": row.paymentAmount,
        "Payment Date": row.paymentDate
          ? new Date(row.paymentDate).toLocaleString()
          : "",
        "Payment Status": row.paymentStatus,
        "Payment Method": row.paymentMethod,
        "Registration Date": row.registrationDate
          ? new Date(row.registrationDate).toLocaleString()
          : "",
        Attendance: row.attendance ? "Yes" : "No",
        "Receipt No": row.receipt,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(file, "candidates.xlsx");
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
            Candidate List
          </Heading>
          <Button
            colorScheme="teal"
            variant="outline"
            leftIcon={<TimeIcon />}
            onClick={() => navigate("/admin/attendance")}
          >
            Go to Attendance
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
              <FormLabel fontSize="sm">Payment</FormLabel>
              <Select
                placeholder="Status"
                value={filteredPaymentStatus}
                onChange={(e) => setFilteredPaymentStatus(e.target.value)}
                bg="gray.50"
                size="sm"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
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
            <Button
              colorScheme="teal"
              leftIcon={<DownloadIcon />}
              onClick={exportToExcel}
              variant="solid"
              size="sm"
              minW="140px"
            >
              Export to Excel
            </Button>
          </Flex>
        </Box>

        <HStack mb={4}>
          <Badge colorScheme="purple" fontSize="lg">
            Total Records: {filteredData.length}
          </Badge>
          <Badge colorScheme="green" fontSize="md">
            Paid: {filteredData.filter((c) => c.paymentStatus === "Paid").length}
          </Badge>
          <Badge colorScheme="yellow" fontSize="md">
            Pending: {filteredData.filter((c) => c.paymentStatus === "Pending").length}
          </Badge>
          <Badge colorScheme="red" fontSize="md">
            Failed: {filteredData.filter((c) => c.paymentStatus === "Failed").length}
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
                <Th>College/Company</Th>
                <Th>Course</Th>
                <Th>Year</Th>
                <Th>Reg Date</Th>
                <Th>Slot</Th>
                <Th>Payment</Th>
                <Th>Payment Method</Th>
                <Th>Attendance</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredData.map((candidate, idx) => (
                <Tr key={candidate._id} _hover={{ bg: "gray.50" }}>
                  <Td>{idx + 1}</Td>
                  <Td>
                    <HStack>
                     
                      <Box>
                        <Text fontWeight="semibold">{candidate.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {candidate.serialNo || "-"}
                        </Text>
                      </Box>
                    </HStack>
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
                    <Text fontSize="sm">
                      {candidate.college || (
                        <chakra.span color="blue.600">{candidate.companyName || "-"}</chakra.span>
                      )}
                    </Text>
                  </Td>
                  <Td>{candidate.course || "-"}</Td>
                  <Td>{candidate.year || "-"}</Td>
                  <Td>
                    {candidate.registrationDate
                      ? new Date(candidate.registrationDate).toLocaleDateString()
                      : "N/A"}
                  </Td>
                  <Td>
                    <Tag colorScheme="purple" size="sm">
                      {candidate.slot}
                    </Tag>
                  </Td>
                  <Td>
                    <Tag
                      size="sm"
                      colorScheme={statusColors[candidate.paymentStatus] || "gray"}
                      ml={1}
                    >
                      {candidate.paymentStatus}
                    </Tag>
                  </Td>
                  <Td>
                    {candidate.paymentMethod ? (
                      <Tag colorScheme="orange" size="sm">
                        {candidate.paymentMethod}
                      </Tag>
                    ) : (
                      <Tag colorScheme="gray" size="sm">
                        -
                      </Tag>
                    )}
                  </Td>
               
                  <Td>
                    {candidate.attendance ? (
                      <CheckCircleIcon color="green.400" />
                    ) : (
                      <WarningIcon color="gray.400" />
                    )}
                  </Td>
                 
                </Tr>
              ))}
              {filteredData.length === 0 && (
                <Tr>
                  <Td colSpan={16}>
                    <Text color="gray.400" textAlign="center" py={10}>
                      No candidates found.
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

export default CandidateExport;
