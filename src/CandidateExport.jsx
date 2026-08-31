import { API_HOST } from "./config";
import React, { useEffect, useState } from "react";
import {
  Box, Heading, Select, Table, Thead, Tbody, Tr, Th, Td, Button, Spinner, Input, Flex,
  FormControl, FormLabel, Tag, Tooltip, Text, HStack, Badge, chakra, IconButton,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  useDisclosure, useToast, FormErrorMessage,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon, DownloadIcon, PhoneIcon, TimeIcon, EditIcon } from "@chakra-ui/icons";
import axios from "axios";
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
  const [filteredGender, setFilteredGender] = useState("");
  const [filteredSlot, setFilteredSlot] = useState("");
  const [filteredType, setFilteredType] = useState(""); // College / Working
  const [filteredAttendance, setFilteredAttendance] = useState("");
  const [filteredYear, setFilteredYear] = useState("");
  const [filteredPaymentMethod, setFilteredPaymentMethod] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editTarget, setEditTarget] = useState(null); // candidate being edited
  const [editForm, setEditForm] = useState({ name: "", whatsappNumber: "", email: "" });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const openEdit = (candidate) => {
    setEditTarget(candidate);
    setEditForm({
      name: candidate.name || "",
      // Show without the country code for editing; re-added on save.
      whatsappNumber: (candidate.whatsappNumber || "").replace(/^91/, ""),
      email: candidate.email || "",
    });
    setEditError("");
    onOpen();
  };

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const saveEdit = async () => {
    const digitsOnly = editForm.whatsappNumber.replace(/\D/g, "");
    if (!editForm.name.trim()) { setEditError("Name is required"); return; }
    if (!/^\d{10}$/.test(digitsOnly)) { setEditError("Enter a valid 10-digit WhatsApp number"); return; }
    setSaving(true);
    setEditError("");
    try {
      const res = await axios.put(
        `${API_HOST}/users/${editTarget._id}`,
        { name: editForm.name.trim(), whatsappNumber: digitsOnly, email: editForm.email.trim() },
        { headers: authHeader(), timeout: 10000 }
      );
      setData((prev) => prev.map((c) => (c._id === editTarget._id ? res.data.candidate : c)));
      toast({ title: "Candidate updated", status: "success" });
      onClose();
    } catch (err) {
      setEditError(err.response?.data?.message || err.message);
    }
    setSaving(false);
  };

  useEffect(() => {
    fetch(`${API_HOST}/users?limit=all`)
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
    const genderMatch = filteredGender ? c.gender === filteredGender : true;
    const slotMatch = filteredSlot ? c.slot === filteredSlot : true;
    const typeMatch = filteredType ? c.collegeOrWorking === filteredType : true;
    const attendanceMatch = filteredAttendance
      ? (filteredAttendance === "Present" ? !!c.attendance : !c.attendance)
      : true;
    const yearMatch = filteredYear ? String(c.year) === filteredYear : true;
    const paymentMethodMatch = filteredPaymentMethod ? c.paymentMethod === filteredPaymentMethod : true;
    const searchMatch = search.length < 2 || [c.name, c.email, c.whatsappNumber, c.college, c.companyName, c.rrn].join(" ").toLowerCase().includes(search.toLowerCase());
    return collegeMatch && filterByDate(c) && paymentMatch && genderMatch && slotMatch
      && typeMatch && attendanceMatch && yearMatch && paymentMethodMatch && searchMatch;
  });

  const uniqueColleges = [...new Set(data.map(c => c.college).filter(Boolean))];
  const uniqueSlots = [...new Set(data.map(c => c.slot).filter(Boolean))];
  const uniqueYears = [...new Set(data.map(c => c.year).filter(Boolean))].sort();
  const uniquePaymentMethods = [...new Set(data.map(c => c.paymentMethod).filter(Boolean))];

  const hasActiveFilters = filteredCollege || startDate || endDate || filteredPaymentStatus
    || filteredGender || filteredSlot || filteredType || filteredAttendance || filteredYear
    || filteredPaymentMethod || search;

  const clearFilters = () => {
    setFilteredCollege(""); setStartDate(""); setEndDate(""); setFilteredPaymentStatus("");
    setFilteredGender(""); setFilteredSlot(""); setFilteredType(""); setFilteredAttendance("");
    setFilteredYear(""); setFilteredPaymentMethod(""); setSearch("");
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(r => ({
      "S.No": r.serialNo, Name: r.name, Gender: r.gender, Email: r.email,
      College: r.college, "Company Name": r.companyName, Course: r.course,
      "College/Working": r.collegeOrWorking, Year: r.year, Phone: r.whatsappNumber,
      Slot: r.slot, "Order ID": r.orderId, "Payment Amount": r.paymentAmount,
      "Payment Date": r.paymentDate ? new Date(r.paymentDate).toLocaleString() : "",
      "Payment Status": r.paymentStatus, "Payment Method": r.paymentMethod, "RRN": r.rrn || "",
      "Registration Date": r.registrationDate ? new Date(r.registrationDate).toLocaleString() : "",
      Attendance: r.attendance ? "Yes" : "No", "Receipt No": r.receipt,
      "UTM Source": r.utmSource || "", "UTM Medium": r.utmMedium || "", "UTM Campaign": r.utmCampaign || "",
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
        <Box mb={4} p={4} bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)">
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="xs" fontWeight={700} color="night.500" textTransform="uppercase" letterSpacing="0.08em">Filters</Text>
            {hasActiveFilters && (
              <Button size="xs" variant="ghost" colorScheme="red" onClick={clearFilters}>Clear all</Button>
            )}
          </Flex>
          <Flex gap={3} wrap="wrap" align="flex-end">
            <FormControl w="160px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">College</FormLabel>
              <Select placeholder="All colleges" size="sm" value={filteredCollege} onChange={e => setFilteredCollege(e.target.value)}>
                {uniqueColleges.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </Select>
            </FormControl>
            <FormControl w="130px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">Payment</FormLabel>
              <Select placeholder="All" size="sm" value={filteredPaymentStatus} onChange={e => setFilteredPaymentStatus(e.target.value)}>
                <option value="Paid">Paid</option><option value="Pending">Pending</option><option value="Failed">Failed</option>
              </Select>
            </FormControl>
            <FormControl w="130px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">Payment method</FormLabel>
              <Select placeholder="All" size="sm" value={filteredPaymentMethod} onChange={e => setFilteredPaymentMethod(e.target.value)}>
                {uniquePaymentMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </Select>
            </FormControl>
            <FormControl w="120px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">Gender</FormLabel>
              <Select placeholder="All" size="sm" value={filteredGender} onChange={e => setFilteredGender(e.target.value)}>
                <option value="Male">Male</option><option value="Female">Female</option>
              </Select>
            </FormControl>
            <FormControl w="120px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">Slot</FormLabel>
              <Select placeholder="All" size="sm" value={filteredSlot} onChange={e => setFilteredSlot(e.target.value)}>
                {uniqueSlots.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </Select>
            </FormControl>
            <FormControl w="130px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">College / Working</FormLabel>
              <Select placeholder="All" size="sm" value={filteredType} onChange={e => setFilteredType(e.target.value)}>
                <option value="College">College</option><option value="Working">Working</option>
              </Select>
            </FormControl>
            <FormControl w="110px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">Year</FormLabel>
              <Select placeholder="All" size="sm" value={filteredYear} onChange={e => setFilteredYear(e.target.value)}>
                {uniqueYears.map((y, i) => <option key={i} value={y}>{y}</option>)}
              </Select>
            </FormControl>
            <FormControl w="130px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">Attendance</FormLabel>
              <Select placeholder="All" size="sm" value={filteredAttendance} onChange={e => setFilteredAttendance(e.target.value)}>
                <option value="Present">Present</option><option value="Absent">Not present</option>
              </Select>
            </FormControl>
            <FormControl w="140px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">From</FormLabel>
              <Input type="date" size="sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </FormControl>
            <FormControl w="140px"><FormLabel fontSize="xs" fontWeight={700} color="night.600">To</FormLabel>
              <Input type="date" size="sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </FormControl>
            <FormControl minW="200px" flex={1}><FormLabel fontSize="xs" fontWeight={700} color="night.600">Search</FormLabel>
              <Input placeholder="Name, phone, RRN, college…" size="sm" value={search} onChange={e => setSearch(e.target.value)} />
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
              {["#","Name","Gender","Phone","College / Company","Course","Year","Reg Date","Slot","Payment","Method","RRN","Present",""].map(h => (
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
                  <Td fontSize="xs" whiteSpace="nowrap">{c.rrn || "—"}</Td>
                  <Td>{c.attendance ? <CheckCircleIcon color="green.400" /> : <WarningIcon color="gray.300" />}</Td>
                  <Td><IconButton aria-label="Edit candidate" icon={<EditIcon />} size="xs" variant="ghost" colorScheme="gray" onClick={() => openEdit(c)} /></Td>
                </Tr>
              ))}
              {filteredData.length === 0 && <Tr><Td colSpan={14}><Text color="night.300" textAlign="center" py={10} fontSize="sm">No candidates found.</Text></Td></Tr>}
            </Tbody>
          </Table>
        </Box>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader>Edit candidate</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel fontSize="xs" fontWeight={700} color="night.600">Name</FormLabel>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </FormControl>
            <FormControl mb={3} isInvalid={!!editError}>
              <FormLabel fontSize="xs" fontWeight={700} color="night.600">WhatsApp Number</FormLabel>
              <HStack>
                <Text fontSize="sm" color="night.500" fontWeight={700}>+91</Text>
                <Input
                  value={editForm.whatsappNumber}
                  onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="10-digit number"
                />
              </HStack>
              <FormErrorMessage>{editError}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight={700} color="night.600">Email</FormLabel>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="teal" onClick={saveEdit} isLoading={saving}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default CandidateExport;
