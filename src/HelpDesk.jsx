import { API_HOST } from "./config";
import React, { useState } from "react";
import {
  Box, Heading, Button, Spinner, Input, Flex, Text, HStack, VStack, Badge, Tag,
  FormControl, FormLabel, Divider, useToast, InputGroup, InputRightElement, IconButton,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  useDisclosure,
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
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", whatsappNumber: "", email: "" });
  const [editError, setEditError] = useState("");

  const search = async (e) => {
    e?.preventDefault();
    const q = queryInput.trim();
    if (!q) return;
    setLoading(true);
    setSearchError("");
    try {
      const res = await axios.get(`${API_HOST}/users/help-desk/search`, {
        params: { q },
        headers: authHeader(),
        timeout: 15000,
      });
      setResults(res.data.candidates || []);
      if (!res.data.candidates?.length) setSearchError("No candidate found for this search.");
    } catch (err) {
      setResults([]);
      setSearchError(err.response?.data?.message || err.message || "Search failed");
      if (err.response?.status === 401 || err.response?.status === 403) {
        setSearchError("You do not have permission to access Help Desk.");
      }
    }
    setLoading(false);
  };

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

  return (
    <Layout>
      <Box py={4} maxW="100%">
        <Box mb={5}>
          <Text fontSize="xs" fontWeight={700} color="night.400" textTransform="uppercase" letterSpacing="0.12em">Admin</Text>
          <Heading size="lg" color="night.800" fontWeight={800}>Help Desk</Heading>
          <Text fontSize="sm" color="night.500" mt={1}>Search by RRN or phone to find and fix registrations (wrong numbers, QR, attendance).</Text>
        </Box>

        {/* search */}
        <Box mb={4} p={4} bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)">
          <form onSubmit={search}>
            <HStack spacing={3} align="flex-end" wrap="wrap">
              <FormControl flex={1} minW="240px">
                <FormLabel fontSize="xs" fontWeight={700} color="night.600">Search (RRN or phone)</FormLabel>
                <InputGroup>
                  <Input
                    placeholder="Enter RRN or phone number"
                    size="md"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
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
                    <Badge px={2} py={0.5} borderRadius="full" colorScheme="purple" fontSize="xs">RRN: {c.rrn || "—"}</Badge>
                    <Badge px={2} py={0.5} borderRadius="full" colorScheme="orange" fontSize="xs">Phone: {c.whatsappNumber || "—"}</Badge>
                    <Tag size="sm" colorScheme={c.paymentStatus === "Paid" ? "green" : c.paymentStatus === "Pending" ? "yellow" : "red"}>{c.paymentStatus}</Tag>
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
    </Layout>
  );
};

export default HelpDesk;
