import { API_HOST } from "./config";
import React, { useState, useRef, useEffect } from "react";
import {
  Box, Heading, Button, Spinner, Input, Flex, Text, HStack, VStack, Badge, Tag,
  FormControl, FormLabel, Divider, useToast, InputGroup, InputRightElement, IconButton,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Select, useDisclosure,
} from "@chakra-ui/react";
import { SearchIcon, EditIcon, CheckCircleIcon, WarningIcon, RepeatIcon } from "@chakra-ui/icons";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import Layout from "./component/Layout";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const HelpDesk = () => {
  const [queryInput, setQueryInput] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [busy, setBusy] = useState(null);
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: onSpotOpen, onOpen: onSpotOnOpen, onClose: onSpotOnClose } = useDisclosure();
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", whatsappNumber: "", email: "" });
  const [editError, setEditError] = useState("");
  const [onSpotForm, setOnSpotForm] = useState({ name: "", whatsappNumber: "", gender: "Male", college: "", course: "", year: "", email: "", slot: "Morning", paymentAmount: 49, paymentMethod: "Cash", utr: "" });
  const [onSpotLoading, setOnSpotLoading] = useState(false);
  const [onSpotError, setOnSpotError] = useState("");
  const [onSpotResult, setOnSpotResult] = useState(null);

  const debounceTimer = useRef(null);
  const latestQuery = useRef("");

  const search = async (q) => {
    const query = (q ?? queryInput).trim();
    if (!query) {
      setResults([]);
      setSearchError("");
      return;
    }
    latestQuery.current = query;
    setLoading(true);
    setSearchError("");
    try {
      const res = await axios.get(`${API_HOST}/users/help-desk/search`, {
        params: { q: query },
        headers: authHeader(),
        timeout: 15000,
      });
      if (latestQuery.current !== query) return;
      setResults(res.data.candidates || []);
      if (!res.data.candidates?.length) setSearchError("No candidate found for this search.");
    } catch (err) {
      if (latestQuery.current !== query) return;
      setResults([]);
      setSearchError(err.response?.data?.message || err.message || "Search failed");
      if (err.response?.status === 401 || err.response?.status === 403) {
        setSearchError("You do not have permission to access Help Desk.");
      }
    }
    setLoading(false);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setQueryInput(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => search(value), 400);
  };

  useEffect(() => () => {
    clearTimeout(debounceTimer.current);
  }, []);

  const openEdit = (c) => {
    setEditTarget(c);
    setEditForm({
      name: c.name || "",
      whatsappNumber: (c.whatsappNumber || "").replace(/^91/, ""),
      email: c.email || "",
    });
    setEditError("");
    onOpen();
  };

  const runAction = async (c, action, body = {}) => {
    setBusy(`${c._id}-${action}`);
    try {
      const res = await axios.post(
        `${API_HOST}/users/help-desk/fix`,
        { id: c._id, action, ...body },
        { headers: authHeader(), timeout: 15000 }
      );
      toast({ title: res.data.message || "Done", status: "success" });
      // refresh the matched record in the results list
      setResults((prev) => prev.map((r) => (r._id === c._id ? res.data.candidate : r)));
      if (action === "updateDetails") onClose();
    } catch (err) {
      toast({ title: err.response?.data?.message || err.message || "Action failed", status: "error" });
    }
    setBusy(null);
  };

  const saveEdit = async () => {
    const digitsOnly = editForm.whatsappNumber.replace(/\D/g, "");
    if (!editForm.name.trim()) { setEditError("Name is required"); return; }
    if (!/^\d{10}$/.test(digitsOnly)) { setEditError("Enter a valid 10-digit WhatsApp number"); return; }
    setEditError("");
    await runAction(editTarget, "updateDetails", {
      name: editForm.name.trim(),
      whatsappNumber: digitsOnly,
      email: editForm.email.trim(),
    });
  };

  const getPresent = (c) => !!c.attendance || !!c.adminAttendance;

  const handleOnSpotRegister = async () => {
    setOnSpotError("");
    if (!onSpotForm.name.trim()) { setOnSpotError("Name is required"); return; }
    if (!/^\d{10}$/.test(onSpotForm.whatsappNumber.replace(/\D/g, ""))) { setOnSpotError("Enter a valid 10-digit WhatsApp number"); return; }
    setOnSpotLoading(true);
    try {
      const res = await axios.post(
        `${API_HOST}/users/on-spot-register`,
        {
          name: onSpotForm.name.trim(),
          whatsappNumber: onSpotForm.whatsappNumber.replace(/\D/g, ""),
          gender: onSpotForm.gender,
          college: onSpotForm.college.trim(),
          course: onSpotForm.course.trim(),
          year: onSpotForm.year.trim(),
          email: onSpotForm.email.trim(),
          slot: onSpotForm.slot,
          paymentAmount: onSpotForm.paymentAmount,
          paymentMethod: onSpotForm.paymentMethod,
          utr: onSpotForm.paymentMethod === "UPI" ? onSpotForm.utr.trim() : "",
        },
        { headers: authHeader(), timeout: 15000 }
      );
      setOnSpotResult(res.data.candidate);
      toast({ title: "On-spot registration successful!", status: "success" });
    } catch (err) {
      setOnSpotError(err.response?.data?.message || err.message || "Registration failed");
    }
    setOnSpotLoading(false);
  };

  const resetOnSpotForm = () => {
    setOnSpotForm({ name: "", whatsappNumber: "", gender: "Male", college: "", course: "", year: "", email: "", slot: "Morning", paymentAmount: 49, paymentMethod: "Cash", utr: "" });
    setOnSpotError("");
    setOnSpotResult(null);
    onSpotOnClose();
  };

  return (
    <Layout>
      <Box py={4} maxW="100%">
        <Box mb={5}>
          <Text fontSize="xs" fontWeight={700} color="night.400" textTransform="uppercase" letterSpacing="0.12em">Admin</Text>
          <Heading size="lg" color="night.800" fontWeight={800}>Help Desk</Heading>
          <Text fontSize="sm" color="night.500" mt={1}>Search by UTR or phone to find and fix registrations (wrong numbers, QR, attendance).</Text>
          <Button mt={3} size="sm" colorScheme="orange" leftIcon={<CheckCircleIcon />} onClick={onSpotOnOpen}>On-Spot Register</Button>
        </Box>

        {/* search */}
        <Box mb={4} p={4} bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)">
          <form onSubmit={(e) => { e.preventDefault(); search(); }}>
            <HStack spacing={3} align="flex-end" wrap="wrap">
              <FormControl flex={1} minW="240px">
                <FormLabel fontSize="xs" fontWeight={700} color="night.600">Search (UTR, phone or name)</FormLabel>
                <InputGroup>
                  <Input
                    placeholder="Enter UTR, phone or name"
                    size="md"
                    value={queryInput}
                    onChange={handleSearchInputChange}
                  />
                  <InputRightElement>
                    <IconButton aria-label="Search" icon={<SearchIcon />} size="sm" colorScheme="teal" onClick={search} />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </HStack>
          </form>
          {searchError && <Text mt={2} fontSize="sm" color="red.500">{searchError}</Text>}
        </Box>

        {loading ? (
          <Flex justify="center" align="center" py={16}><Spinner size="xl" color="peacock.500" /></Flex>
        ) : (
          results.map((c) => (
            <Box key={c._id} mb={4} p={4} bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)">
              <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
                <VStack align="stretch" spacing={1}>
                  <HStack spacing={2}>
                    <Text fontWeight={800} fontSize="lg" color="night.800">{c.name || "—"}</Text>
                    {getPresent(c) && <Tag size="sm" colorScheme="green">Present</Tag>}
                  </HStack>
                  <HStack spacing={2} flexWrap="wrap">
                    <Badge px={2} py={0.5} borderRadius="full" colorScheme="purple" fontSize="xs">UTR: {c.utr || c.rrn || "—"}</Badge>
                    <Badge px={2} py={0.5} borderRadius="full" colorScheme="orange" fontSize="xs">Phone: {c.whatsappNumber || "—"}</Badge>
                    <Tag size="sm" colorScheme={c.paymentStatus === "Paid" ? "green" : c.paymentStatus === "Pending" ? "yellow" : "red"}>{c.paymentStatus}</Tag>
                    {c.paymentMethod && <Tag size="sm" colorScheme={c.paymentMethod === "UPI" ? "blue" : "gray"}>{c.paymentMethod}</Tag>}
                  </HStack>
                  <Text fontSize="sm" color="night.500">Email: {c.email || "—"}</Text>
                  <Text fontSize="sm" color="night.500">College: {c.college || "—"} · Slot: {c.slot || "—"} · Reg: {c.registrationDate ? new Date(c.registrationDate).toLocaleDateString() : "—"}</Text>
                </VStack>

                <HStack spacing={2} wrap="wrap">
                  <Button size="sm" leftIcon={<EditIcon />} variant="outline" colorScheme="teal" onClick={() => openEdit(c)}>
                    Edit
                  </Button>
                  <Button
                    size="sm" leftIcon={<RepeatIcon />} colorScheme="purple"
                    isLoading={busy === `${c._id}-regenerateQr`}
                    onClick={() => runAction(c, "regenerateQr")}
                  >
                    Fix / new QR
                  </Button>
                  {!getPresent(c) ? (
                    <Button
                      size="sm" leftIcon={<CheckCircleIcon />} colorScheme="green"
                      isLoading={busy === `${c._id}-markPresent`}
                      onClick={() => runAction(c, "markPresent")}
                    >
                      Mark present
                    </Button>
                  ) : (
                    <Button
                      size="sm" leftIcon={<WarningIcon />} variant="outline" colorScheme="red"
                      isLoading={busy === `${c._id}-resetAttendance`}
                      onClick={() => runAction(c, "resetAttendance")}
                    >
                      Reset attendance
                    </Button>
                  )}
                </HStack>
              </Flex>

              <Divider my={3} />

              <Accordion allowToggle>
                <AccordionItem border="none">
                  <AccordionButton px={0} _hover={{ bg: "transparent" }}>
                    <Text fontSize="sm" fontWeight={700} color="peacock.600">QR Code</Text>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel px={0}>
                    {c.attendanceToken ? (
                      <Flex align="center" gap={4} wrap="wrap">
                        <Box p={3} bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" display="inline-block">
                          <QRCodeSVG value={c.attendanceToken} size={160} />
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="night.400" fontWeight={700} textTransform="uppercase" letterSpacing="0.08em">Attendance token</Text>
                          <Text fontSize="sm" color="night.700" wordBreak="break-all">{c.attendanceToken}</Text>
                          <Text fontSize="xs" color="night.400" mt={1}>
                            {c.attendance
                              ? "Attendance enabled — this QR can be scanned."
                              : "Attendance not enabled yet — use “Fix / new QR” to enable scanning."}
                          </Text>
                        </Box>
                      </Flex>
                    ) : (
                      <Text fontSize="sm" color="night.400">No QR generated yet. Use “Fix / new QR” to create one.</Text>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          ))
        )}

        {!loading && !results.length && !searchError && (
          <Box p={8} textAlign="center">
            <Text color="night.300" fontSize="sm">Search for a candidate to get started.</Text>
          </Box>
        )}
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
              <Text fontSize="xs" color="night.400" mt={1}>Must be a valid 10-digit number.</Text>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight={700} color="night.600">Email</FormLabel>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="teal" onClick={saveEdit} isLoading={busy === `${editTarget?._id}-updateDetails`}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* On-Spot Registration Modal */}
      <Modal isOpen={onSpotOpen} onClose={resetOnSpotForm} isCentered size="lg">
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader>On-Spot Registration</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!onSpotResult ? (
              <>
                {onSpotError && <Text fontSize="sm" color="red.500" mb={3}>{onSpotError}</Text>}
                <FormControl mb={3} isRequired>
                  <FormLabel fontSize="xs" fontWeight={700} color="night.600">Name</FormLabel>
                  <Input value={onSpotForm.name} onChange={(e) => setOnSpotForm({ ...onSpotForm, name: e.target.value })} placeholder="Full name" />
                </FormControl>
                <FormControl mb={3} isRequired>
                  <FormLabel fontSize="xs" fontWeight={700} color="night.600">WhatsApp Number</FormLabel>
                  <HStack>
                    <Text fontSize="sm" color="night.500" fontWeight={700}>+91</Text>
                    <Input value={onSpotForm.whatsappNumber} onChange={(e) => setOnSpotForm({ ...onSpotForm, whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="10-digit number" />
                  </HStack>
                </FormControl>
                <HStack mb={3} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight={700} color="night.600">Gender</FormLabel>
                    <Select value={onSpotForm.gender} onChange={(e) => setOnSpotForm({ ...onSpotForm, gender: e.target.value })}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight={700} color="night.600">Slot</FormLabel>
                    {/* Evening merged into Morning on 4 Sep 2026 — walk-ins are
                        Morning only. Kept as a Select so reinstating a second
                        slot is a one-line change. */}
                    <Select value={onSpotForm.slot} onChange={(e) => setOnSpotForm({ ...onSpotForm, slot: e.target.value })}>
                      <option value="Morning">Morning</option>
                    </Select>
                  </FormControl>
                </HStack>
                <FormControl mb={3}>
                  <FormLabel fontSize="xs" fontWeight={700} color="night.600">College</FormLabel>
                  <Input value={onSpotForm.college} onChange={(e) => setOnSpotForm({ ...onSpotForm, college: e.target.value })} placeholder="College name" />
                </FormControl>
                <HStack mb={3} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight={700} color="night.600">Course</FormLabel>
                    <Input value={onSpotForm.course} onChange={(e) => setOnSpotForm({ ...onSpotForm, course: e.target.value })} placeholder="e.g. B.Tech" />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight={700} color="night.600">Year</FormLabel>
                    <Input value={onSpotForm.year} onChange={(e) => setOnSpotForm({ ...onSpotForm, year: e.target.value })} placeholder="e.g. 3rd" />
                  </FormControl>
                </HStack>
                <FormControl mb={3}>
                  <FormLabel fontSize="xs" fontWeight={700} color="night.600">Email</FormLabel>
                  <Input value={onSpotForm.email} onChange={(e) => setOnSpotForm({ ...onSpotForm, email: e.target.value })} placeholder="Optional" />
                </FormControl>
                <HStack mb={3} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight={700} color="night.600">Payment Method</FormLabel>
                    <Select value={onSpotForm.paymentMethod} onChange={(e) => setOnSpotForm({ ...onSpotForm, paymentMethod: e.target.value, utr: "" })}>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight={700} color="night.600">Payment Amount (₹)</FormLabel>
                    <Input type="number" value={onSpotForm.paymentAmount} onChange={(e) => setOnSpotForm({ ...onSpotForm, paymentAmount: Number(e.target.value) })} />
                  </FormControl>
                </HStack>
                {onSpotForm.paymentMethod === "UPI" && (
                  <FormControl mb={3} isRequired>
                    <FormLabel fontSize="xs" fontWeight={700} color="night.600">UTR / Transaction Reference</FormLabel>
                    <Input value={onSpotForm.utr} onChange={(e) => setOnSpotForm({ ...onSpotForm, utr: e.target.value })} placeholder="Enter UTR number from UPI app" />
                    <Text fontSize="xs" color="night.400" mt={1}>Check the UPI app for the 12-digit UTR/Reference number.</Text>
                  </FormControl>
                )}
              </>
            ) : (
              <Box textAlign="center" py={4}>
                <Flex justify="center" mb={3}><CheckCircleIcon boxSize={12} color="green.500" /></Flex>
                <Text fontSize="lg" fontWeight={800} color="night.800">{onSpotResult.name}</Text>
                <Text fontSize="sm" color="night.500">{onSpotResult.whatsappNumber} · {onSpotResult.college || "—"}</Text>
                <Text fontSize="sm" color="peacock.700" fontWeight={600} mt={4} mb={4}>Show this QR at the scanner to check in:</Text>
                <Flex justify="center">
                  <Box p={3} bg="white" borderRadius="xl" border="2px solid" borderColor="peacock.300" display="inline-block">
                    <QRCodeSVG value={onSpotResult.attendanceToken} size={180} />
                  </Box>
                </Flex>
                <Text fontSize="xs" color="night.400" mt={3}>Token: {onSpotResult.attendanceToken}</Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={resetOnSpotForm}>{onSpotResult ? "Close" : "Cancel"}</Button>
            {!onSpotResult && (
              <Button colorScheme="orange" onClick={handleOnSpotRegister} isLoading={onSpotLoading}>Register & Generate QR</Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default HelpDesk;
