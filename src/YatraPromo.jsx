// ─────────────────────────────────────────────────────────────────────────────
// Admin → Yatra Promo
//
// One-off cross-promotion broadcast to Krishna Pulse attendees, advertising
// Yatra Clubbing. Unlike reminders/certificates this never runs on a timer —
// it only fires when someone here clicks "Send now", and templateId/imageUrl
// are typed in below rather than baked into any shared config, so this can
// never collide with certificate sending.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box, Heading, Text, Flex, HStack, VStack, Button, Badge, Spinner,
  Progress, SimpleGrid, Table, Thead, Tbody, Tr, Th, Td, Tag, Tooltip,
  Alert, AlertIcon, FormControl, FormLabel, Input, Textarea, useToast,
} from "@chakra-ui/react";
import { RepeatIcon, CheckCircleIcon } from "@chakra-ui/icons";
import Layout from "./component/Layout";
import { API_HOST } from "./config";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const POLL_MS = 8000;

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST" : "—";

const Card = ({ children, ...rest }) => (
  <Box bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)" p={4} {...rest}>
    {children}
  </Box>
);

const Stat = ({ label, value, color = "night.800" }) => (
  <Box>
    <Text fontSize="xs" fontWeight={700} color="night.400" textTransform="uppercase" letterSpacing="0.08em">
      {label}
    </Text>
    <Text fontSize="2xl" fontWeight={800} color={color} lineHeight={1.2}>{value}</Text>
  </Box>
);

const DEFAULT_TEMPLATE_ID = "92688cc1-b36b-40ce-84ee-209bca5bb776";
const DEFAULT_IMAGE_URL = "https://pub-32ade8e1209149f980ffe2aa4ddc6c99.r2.dev/media-library/1788762187970-1788762187292-file000000003c90821189787923553ed302.png";

const YatraPromo = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE_URL);
  // Locked by default — these should only change when setting up a
  // genuinely new campaign (a different event to promote), not casually
  // edited in passing. "Edit" requires a deliberate click + confirmation.
  const [fieldsLocked, setFieldsLocked] = useState(true);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_HOST}/users/admin/yatra-promo-status`, { headers: authHeader() });
      const json = await res.json();
      setData(json);
    } catch (e) {
      // silent — next poll will retry
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const unlockFields = () => {
    const confirmed = window.confirm(
      "Only change the template ID or banner image if you're setting up a NEW campaign (e.g. promoting a different event).\n\nThis affects every future send from this page. Continue?"
    );
    if (confirmed) setFieldsLocked(false);
  };

  const handleSend = async () => {
    if (!templateId.trim() || !imageUrl.trim()) {
      toast({ title: "Template ID and image URL are both required", status: "warning" });
      return;
    }
    const confirmed = window.confirm(
      `Send the Yatra Clubbing promo to ${data?.eligible ?? "all"} eligible people who haven't received it yet (paid + attended)?\n\nThis cannot be undone once started.`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const res = await fetch(`${API_HOST}/users/admin/send-yatra-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ templateId: templateId.trim(), imageUrl: imageUrl.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.status === "started") {
        toast({ title: "Send started", description: json.message, status: "success" });
      } else {
        toast({ title: "Could not start send", description: json.message, status: "error" });
      }
      load();
    } catch (e) {
      toast({ title: "Request failed", description: e.message, status: "error" });
    }
    setSending(false);
  };

  const handleResendAll = async () => {
    if (!templateId.trim() || !imageUrl.trim()) {
      toast({ title: "Template ID and image URL are both required", status: "warning" });
      return;
    }
    const total = data?.totalAudience ?? "everyone";
    const confirmed = window.confirm(
      `⚠️ RESEND TO EVERYONE — this will message ALL ${total} eligible people again, including the ${data?.sent ?? 0} who already received it.\n\nThis is not the usual send — only do this if you mean to message everyone a second time.\n\nAre you sure?`
    );
    if (!confirmed) return;

    setResending(true);
    try {
      const res = await fetch(`${API_HOST}/users/admin/send-yatra-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ templateId: templateId.trim(), imageUrl: imageUrl.trim(), resendAll: true }),
      });
      const json = await res.json();
      if (res.ok && json.status === "started") {
        toast({ title: "Resend started", description: json.message, status: "success" });
      } else {
        toast({ title: "Could not start resend", description: json.message, status: "error" });
      }
      load();
    } catch (e) {
      toast({ title: "Request failed", description: e.message, status: "error" });
    }
    setResending(false);
  };

  const progress = data?.progress;
  const delivery = data?.delivery || {};
  const isRunning = progress?.running;
  const totalForBar = progress?.total || data?.sent + data?.eligible || 0;
  const sentForBar = progress?.sent ?? data?.sent ?? 0;
  const pct = totalForBar ? Math.round((sentForBar / totalForBar) * 100) : 0;

  if (loading) return <Layout><Flex justify="center" align="center" minH="70vh"><Spinner size="xl" color="peacock.500" /></Flex></Layout>;

  return (
    <Layout>
      <Box py={4} maxW="900px">
        <Flex justify="space-between" align="center" mb={5} wrap="wrap" gap={3}>
          <Box>
            <Text fontSize="xs" fontWeight={700} color="night.400" textTransform="uppercase" letterSpacing="0.12em">Admin</Text>
            <Heading size="lg" color="night.800" fontWeight={800}>Yatra Promo</Heading>
            <Text fontSize="sm" color="night.500" mt={1}>Cross-promote Yatra Clubbing to Krishna Pulse attendees.</Text>
          </Box>
          <Button size="sm" leftIcon={<RepeatIcon />} onClick={load} variant="outline">Refresh</Button>
        </Flex>

        {/* send form */}
        <Card mb={5}>
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="sm" color="night.800">Send broadcast</Heading>
            {fieldsLocked ? (
              <Button size="xs" variant="ghost" onClick={unlockFields}>✏️ Edit (new campaign only)</Button>
            ) : (
              <Badge colorScheme="orange" borderRadius="full" px={3}>editing — remember to verify before sending</Badge>
            )}
          </Flex>
          <VStack spacing={3} align="stretch">
            <FormControl>
              <FormLabel fontSize="xs" fontWeight={700} color="night.600">Template ID</FormLabel>
              <Input size="sm" value={templateId} onChange={e => setTemplateId(e.target.value)} fontFamily="mono" isDisabled={fieldsLocked} bg={fieldsLocked ? "night.50" : "white"} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight={700} color="night.600">Banner image URL</FormLabel>
              <Textarea size="sm" value={imageUrl} onChange={e => setImageUrl(e.target.value)} rows={2} fontFamily="mono" fontSize="xs" isDisabled={fieldsLocked} bg={fieldsLocked ? "night.50" : "white"} />
            </FormControl>

            <HStack spacing={3} flexWrap="wrap">
              <Button
                colorScheme="teal" onClick={handleSend}
                isLoading={sending} loadingText="Starting…"
                isDisabled={isRunning || resending}
              >
                {isRunning ? `Sending… (${progress.sent}/${progress.total})` : "Send now"}
              </Button>
              <Button
                variant="outline" colorScheme="red" onClick={handleResendAll}
                isLoading={resending} loadingText="Starting…"
                isDisabled={isRunning || sending}
              >
                Resend to everyone
              </Button>
            </HStack>
            <Text fontSize="xs" color="night.400">
              <b>Send now</b> only reaches people who haven't gotten it yet. <b>Resend to everyone</b> messages the whole eligible list again, including anyone already sent.
            </Text>

            {isRunning && (
              <Alert status="info" borderRadius="lg" fontSize="xs">
                <AlertIcon />
                A send is already in progress — currently on <b>{progress.currentName || "…"}</b>. This page auto-refreshes every 8s.
              </Alert>
            )}
          </VStack>
        </Card>

        {/* run progress */}
        <Card mb={5}>
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="sm" color="night.800">📣 Broadcast status</Heading>
            <Badge colorScheme={isRunning ? "green" : "gray"} borderRadius="full" px={3}>
              {isRunning ? "sending" : "idle"}
            </Badge>
          </Flex>

          <Progress value={pct} size="sm" borderRadius="full" colorScheme={pct >= 95 ? "green" : pct > 0 ? "yellow" : "gray"} mb={3} />
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={3}>
            <Stat label="Eligible (not yet sent)" value={data?.eligible ?? "—"} />
            <Stat label="Sent" value={data?.sent ?? "—"} color="green.600" />
            <Stat label="Failed (this run)" value={progress?.failed ?? 0} color={progress?.failed ? "red.500" : "night.800"} />
            <Stat label="Started" value={progress?.startedAt ? fmt(progress.startedAt) : "—"} />
          </SimpleGrid>

          {progress?.failures?.length > 0 && (
            <Alert status="error" borderRadius="lg" fontSize="xs" mb={2} alignItems="flex-start">
              <AlertIcon mt={0.5} />
              <Box>
                <Text fontWeight={700}>{progress.failures.length} failed in the current/last run:</Text>
                {progress.failures.slice(0, 8).map((f, i) => (
                  <Text key={i}>{f.name} · {f.phone} — {f.error}</Text>
                ))}
                {progress.failures.length > 8 && <Text>…and {progress.failures.length - 8} more.</Text>}
              </Box>
            </Alert>
          )}
        </Card>

        {/* delivery breakdown — sent/delivered/read/failed from actual WhatsApp callbacks */}
        <Card mb={5}>
          <Heading size="sm" color="night.800" mb={3}>✅ Delivery (from WhatsApp)</Heading>
          <Text fontSize="xs" color="night.400" mb={3}>
            "Accepted" only means the provider took it — not that it arrived. "Delivered" and "Read" are confirmed by WhatsApp itself.
          </Text>
          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
            <Stat label="Accepted" value={delivery.accepted ?? 0} color="night.500" />
            <Stat label="Sent" value={delivery.sent ?? 0} color="blue.600" />
            <Stat label="Delivered" value={delivery.delivered ?? 0} color="green.600" />
            <Stat label="Read" value={delivery.read ?? 0} color="purple.600" />
            <Stat label="Failed" value={delivery.failed ?? 0} color={delivery.failed ? "red.500" : "night.800"} />
          </SimpleGrid>
        </Card>

        {/* recent failures with detail */}
        {data?.recentFailures?.length > 0 && (
          <Card p={0} overflow="hidden">
            <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.100">
              <Heading size="sm" color="night.800">Recent delivery failures</Heading>
              <Text fontSize="xs" color="night.400">Messages a callback confirmed did NOT arrive.</Text>
            </Box>
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead><Tr bg="night.50">
                  {["Name", "Phone", "Status", "Reason", "When"].map(h => (
                    <Th key={h} fontSize="xs" color="night.500" whiteSpace="nowrap">{h}</Th>
                  ))}
                </Tr></Thead>
                <Tbody>
                  {data.recentFailures.map(f => (
                    <Tr key={f._id} _hover={{ bg: "red.50" }}>
                      <Td fontSize="sm" fontWeight={600}>{f.name || "—"}</Td>
                      <Td fontSize="sm" whiteSpace="nowrap">{f.phone || "—"}</Td>
                      <Td><Tag size="sm" colorScheme="red">{f.status}</Tag></Td>
                      <Td><Tooltip label={f.error}><Text fontSize="xs" noOfLines={1} maxW="280px" color="night.500">{f.error || "—"}</Text></Tooltip></Td>
                      <Td fontSize="xs" color="night.400" whiteSpace="nowrap">{fmt(f.statusAt || f.createdAt)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Card>
        )}
      </Box>
    </Layout>
  );
};

export default YatraPromo;
