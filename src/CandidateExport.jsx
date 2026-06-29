import React, { useEffect, useState } from "react";
import { Box, Heading, Select, Table, Thead, Tbody, Tr, Th, Td, Button, Spinner, Input, Flex, FormControl, FormLabel, Tag, Tooltip, Text, HStack, Badge, chakra } from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon, DownloadIcon, PhoneIcon, TimeIcon } from "@chakra-ui/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import Layout from "./component/Layout";

const statusColor = { Paid: "green", Pending: "yellow", Failed: "red" };

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
      .then(r => r.json()).then(d => { setData(d.candidates || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filterByDate = c => {
    if (!startDate && !endDate) return true;
    const cd = new Date(c.registrationDate);
    if (startDate && cd < new Date(startDate)) return false;
    if (endDate && cd > new Date(new Date(endDate).setHours(23,59,59,999))) return false;
    return true;
  };

  const filteredData = data.filter(c => {
    const collegeMatch = filteredCollege ? c.college === filteredCollege : true;
    const paymentMatch = filteredPaymentStatus ? c.paymentStatus === filteredPaymentStatus : true;
    const searchMatch = search.length < 2 || [c.name, c.email, c.whatsappNumber, c.college, c.companyName].join(" ").toLowerCase().includes(search.toLowerCase());
    return collegeMatch && filterByDate(c) && paymentMatch && searchMatch;
  });

  const uniqueColleges = [...new Set(data.map(c => c.college).filter(Boolean))];

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(r => ({
      "S.No": r.serialNo, Name: r.name, Gender: r.gender, Email: r.email,
      College: r.college, "Company Name": r.companyName, Course: r.course,
      "College/Working": r.collegeOrWorking, Year: r.year, Phone: r.whatsappNumber,
      Slot: r.slot, "Order ID": r.orderId, "Payment Amount": r.paymentAmount,
      "Payment Date": r.paymentDate ? new Date(r.paymentDate).toLocaleString() : "",
      "Payment Status": r.paymentStatus, "Payment Method": r.paymentMethod,
      "Registration Date": r.registrationDate ? new Date(r.registrationDate).toLocaleString() : "",
      Attendance: r.attendance ? "Yes" : "No", "Receipt No": r.receipt,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), "candidates.xlsx");
  };

  if (loading) return <Layout><Flex justify="center" align="center" minH="70vh"><Spinner size="xl" color="peacock.500" /></Flex></Layout>;

  return (
    <Layout>
      <Box py={4} maxW="100%">
        {/* header */}
        <Flex justify="space-between" align="center" mb={5} wrap="wrap" gap={3}>
          <Box>
            <Text fontSize="xs" fontWeight={700} color="night.400" textTransform="uppercase" letterSpacing="0.12em">Admin</Text>
            <Heading size="lg" color="night.800" fontWeight={800}>Candidates</Heading>
          </Box>
          <Button size="sm" variant="outline" colorScheme="teal" leftIcon={<TimeIcon />} onClick={() => navigate("/admin/attendance")}>
            Attendance
          </Button>
        </Flex>

        {/* stat pills */}
        <HStack mb={4} spacing={2} flexWrap="wrap">
          <Badge px={3} py={1} borderRadius="full" colorScheme="purple" fontSize="sm">Total: {filteredData.length}</Badge>
          <Badge px={3} py={1} borderRadius="full" colorScheme="green" fontSize="sm">Paid: {filteredData.filter(c => c.paymentStatus === "Paid").length}</Badge>
          <Badge px={3} py={1} borderRadius="full" colorScheme="yellow" fontSize="sm">Pending: {filteredData.filter(c => c.paymentStatus === "Pending").length}</Badge>
          <Badge px={3} py={1} borderRadius="full" colorScheme="red" fontSize="sm">Failed: {filteredData.filter(c => c.paymentStatus === "Failed").length}</Badge>
        </HStack>

        {/* filters */}
        <Box mb={4} p={4} bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)" overflowX="auto">
          <Flex gap={3} align="flex-end" wrap="nowrap" minW="640px">
            <FormControl w="170px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">College</FormLabel>
              <Select placeholder="All colleges" size="sm" value={filteredCollege} onChange={e => setFilteredCollege(e.target.value)}>
                {uniqueColleges.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </Select>
            </FormControl>
            <FormControl w="140px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">Payment</FormLabel>
              <Select placeholder="All" size="sm" value={filteredPaymentStatus} onChange={e => setFilteredPaymentStatus(e.target.value)}>
                <option value="Paid">Paid</option><option value="Pending">Pending</option><option value="Failed">Failed</option>
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
            <Button colorScheme="teal" leftIcon={<DownloadIcon />} onClick={exportToExcel} size="sm" minW="130px" flexShrink={0}>
              Export Excel
            </Button>
          </Flex>
        </Box>

        {/* table */}
        <Box overflowX="auto" bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)">
          <Table variant="simple" size="sm">
            <Thead><Tr bg="night.50">
              {["#","Name","Gender","Phone","College / Company","Course","Year","Reg Date","Slot","Payment","Method","Present"].map(h => (
                <Th key={h} fontSize="xs" color="night.500" fontWeight={700} whiteSpace="nowrap">{h}</Th>
              ))}
            </Tr></Thead>
            <Tbody>
              {filteredData.map((c, i) => (
                <Tr key={c._id} _hover={{ bg: "peacock.50" }} transition="background 0.1s">
                  <Td color="night.400" fontSize="xs">{i + 1}</Td>
                  <Td><Text fontWeight={600} fontSize="sm" color="night.800">{c.name}</Text><Text fontSize="xs" color="night.400">{c.serialNo || "—"}</Text></Td>
                  <Td fontSize="sm" color="night.600">{c.gender}</Td>
                  <Td><HStack spacing={1}><PhoneIcon boxSize={3} color="peacock.500" /><Text fontSize="sm">{c.whatsappNumber}</Text></HStack></Td>
                  <Td fontSize="sm" color="night.700">{c.college || <chakra.span color="saffron.600">{c.companyName || "—"}</chakra.span>}</Td>
                  <Td fontSize="sm">{c.course || "—"}</Td>
                  <Td fontSize="sm">{c.year || "—"}</Td>
                  <Td fontSize="xs" color="night.400" whiteSpace="nowrap">{c.registrationDate ? new Date(c.registrationDate).toLocaleDateString() : "—"}</Td>
                  <Td><Tag size="sm" colorScheme="purple">{c.slot}</Tag></Td>
                  <Td><Tag size="sm" colorScheme={statusColor[c.paymentStatus] || "gray"}>{c.paymentStatus}</Tag></Td>
                  <Td><Tag size="sm" colorScheme="orange">{c.paymentMethod || "—"}</Tag></Td>
                  <Td>{c.attendance ? <CheckCircleIcon color="green.400" /> : <WarningIcon color="gray.300" />}</Td>
                </Tr>
              ))}
              {filteredData.length === 0 && <Tr><Td colSpan={12}><Text color="night.300" textAlign="center" py={10} fontSize="sm">No candidates found.</Text></Td></Tr>}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Layout>
  );
};

export default CandidateExport;
