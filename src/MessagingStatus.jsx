// ─────────────────────────────────────────────────────────────────────────────
// Admin → Messaging
//
// Why this page exists: until now the only way to know whether a WhatsApp
// message actually reached a student was to open the Railway logs. That is no
// use during check-in, and no use at 9am on certificate morning.
//
// The important distinction this page makes, everywhere:
//
//   accepted   the provider took the message. NOTHING MORE. On 4 Sep the
//              number was rate-limited by Meta and 165 messages sat at
//              "accepted" forever while zero of them arrived.
//   sent       Meta actually pushed it out
//   delivered  it landed on the student's phone
//   read       they opened it
//   failed     it definitively did not arrive
//
// So "Accepted" is shown in grey, not green. Green is reserved for delivered.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box, Heading, Text, Flex, HStack, VStack, Button, Badge, Spinner, Divider,
  Table, Thead, Tbody, Tr, Th, Td, Tag, Progress, SimpleGrid, Tooltip,
  Alert, AlertIcon, Switch, FormLabel, useToast,
} from "@chakra-ui/react";
import { RepeatIcon, CheckCircleIcon, WarningTwoIcon, TimeIcon } from "@chakra-ui/icons";
import Layout from "./component/Layout";
import { API_HOST } from "./config";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const POLL_MS = 15000;

// Order matters — this is roughly the order a student experiences them.
const KIND_LABELS = {
  "registration": "Registration confirmation",
  "registration:male": "Registration (male)",
  "registration:female": "Registration (female)",
  "registrationResend": "Registration re-send",
  "slotChange": "Slot change",
  "reminder:oneDay": "Reminder — day before",
  "reminder:eventDay": "Reminder — event day",
  "reminder:twoHour": "Reminder — 2 hours",
  "attendance": "Attendance / check-in",
  "certificate": "Certificate",
};

const STATUS_ORDER = ["accepted", "sent", "delivered", "read", "failed", "undelivered", "rejected", "error"];

const STATUS_COLOR = {
  accepted: "gray",
  sent: "blue",
  delivered: "green",
  read: "purple",
  failed: "red",
  undelivered: "red",
  rejected: "red",
  error: "red",
};

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST" : "—";

const ago = (d) => {
  if (!d) return null;
  const secs = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
  return `${Math.round(secs / 86400)}d ago`;
};

const Card = ({ children, ...rest }) => (
  <Box bg="white" borderRadius="xl" boxShadow="0 1px 4px rgba(0,0,0,0.07)" p={4} {...rest}>
    {children}
  </Box>
);

const Stat = ({ label, value, sub, color = "night.800" }) => (
  <Box>
    <Text fontSize="xs" fontWeight={700} color="night.400" textTransform="uppercase" letterSpacing="0.08em">
      {label}
    </Text>
    <Text fontSize="2xl" fontWeight={800} color={color} lineHeight={1.2}>{value}</Text>
    {sub && <Text fontSize="xs" color="night.400">{sub}</Text>}
  </Box>
);

const MessagingStatus = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const [templates, setTemplates] = useState(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const timer = useRef(null);
  const alive = useRef(true);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const r = await fetch(`${API_HOST}/users/admin/messaging-overview`, { headers: authHeader() });
      if (r.status === 401 || r.status === 403) throw new Error("Not authorised — sign in again as admin.");
      const j = await r.json();
      if (!alive.current) return;
      if (j.status !== "success") throw new Error(j.message || "Failed to load");
      setData(j);
      setError(null);
      setLastFetch(new Date());
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load(true);
    return () => { alive.current = false; clearInterval(timer.current); };
  }, [load]);

  useEffect(() => {
    clearInterval(timer.current);
    if (autoRefresh) timer.current = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(timer.current);
  }, [autoRefresh, load]);

  // Template check hits Gupshup's API, so it is a button, never a poll.
  const checkTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const r = await fetch(`${API_HOST}/users/admin/template-check`, { headers: authHeader() });
      const j = await r.json();
      if (j.status !== "success") throw new Error(j.message || "Failed");
      setTemplates(j);
      toast({
        title: j.ready ? "All templates look correct" : "Template problems found",
        status: j.ready ? "success" : "warning",
        duration: 4000, isClosable: true,
      });
    } catch (e) {
      toast({ title: "Template check failed", description: e.message, status: "error", duration: 6000, isClosable: true });
    } finally {
      setTemplatesLoading(false);
    }
  };

  if (loading && !data) {
    return <Layout><Flex justify="center" align="center" minH="70vh"><Spinner size="xl" color="peacock.500" /></Flex></Layout>;
  }

  const kinds = data ? Object.keys(data.byKind || {}) : [];
  kinds.sort((a, b) => {
    const ka = Object.keys(KIND_LABELS).indexOf(a);
    const kb = Object.keys(KIND_LABELS).indexOf(b);
    return (ka === -1 ? 99 : ka) - (kb === -1 ? 99 : kb);
  });

  const cert = data?.certificate;
  const totalAccepted = kinds.reduce((n, k) => n + (data.byKind[k].accepted || 0), 0);
  const totalDelivered = kinds.reduce((n, k) => n + (data.byKind[k].delivered || 0) + (data.byKind[k].read || 0), 0);
  const totalFailed = kinds.reduce(
    (n, k) => n + ["failed", "undelivered", "rejected", "error"].reduce((m, s) => m + (data.byKind[k][s] || 0), 0), 0);
  const totalMessages = kinds.reduce((n, k) => n + Object.values(data.byKind[k]).reduce((m, v) => m + v, 0), 0);

  // No callback in a long while, while messages are going out, means the
  // webhook has stopped feeding us the truth — worth saying out loud.
  const callbacksStale =
    data?.lastSentAt && (!data.lastCallbackAt ||
      new Date(data.lastCallbackAt).getTime() < Date.now() - 60 * 60 * 1000);

  return (
    <Layout>
      <Box py={4}>
        {/* ── header ─────────────────────────────────────────────────────── */}
        <Flex justify="space-between" align="center" mb={5} wrap="wrap" gap={3}>
          <Box>
            <Text fontSize="xs" fontWeight={700} color="night.400" textTransform="uppercase" letterSpacing="0.12em">Admin</Text>
            <Heading size="lg" color="night.800" fontWeight={800}>Messaging &amp; Delivery</Heading>
            <Text fontSize="xs" color="night.400" mt={1}>
              Server time {data?.serverTimeIst || "—"}
              {lastFetch && ` · refreshed ${ago(lastFetch)}`}
            </Text>
          </Box>
          <HStack spacing={3}>
            <HStack spacing={2}>
              <FormLabel htmlFor="auto" fontSize="xs" fontWeight={700} color="night.500" mb={0}>Auto</FormLabel>
              <Switch id="auto" size="sm" colorScheme="teal" isChecked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)} />
            </HStack>
            <Button size="sm" leftIcon={<RepeatIcon />} colorScheme="teal" variant="outline"
              onClick={() => load(false)} isLoading={loading}>Refresh</Button>
          </HStack>
        </Flex>

        {error && (
          <Alert status="error" borderRadius="lg" mb={4} fontSize="sm">
            <AlertIcon />{error}
          </Alert>
        )}

        {callbacksStale && (
          <Alert status="warning" borderRadius="lg" mb={4} fontSize="sm">
            <AlertIcon />
            <Box>
              <Text fontWeight={700}>No delivery callback in over an hour.</Text>
              <Text>
                Counts below may be stuck at “accepted” because the webhook has stopped
                reporting, not because messages failed. Last callback: {fmt(data?.lastCallbackAt)}.
              </Text>
            </Box>
          </Alert>
        )}

        {/* ── top line ───────────────────────────────────────────────────── */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4} mb={5}>
          <Card><Stat label="Paid" value={data?.totals?.paid ?? "—"} /></Card>
          <Card><Stat label="Checked in" value={data?.totals?.attended ?? "—"}
            sub={data?.totals?.paid ? `${Math.round((data.totals.attended / data.totals.paid) * 100)}% of paid` : null}
            color="peacock.600" /></Card>
          <Card><Stat label="Messages sent" value={totalMessages} sub={`${totalAccepted} still only accepted`} /></Card>
          <Card><Stat label="Confirmed delivered" value={totalDelivered} color="green.600" /></Card>
          <Card><Stat label="Failed" value={totalFailed} color={totalFailed ? "red.500" : "night.800"} /></Card>
        </SimpleGrid>

        {/* ── the "accepted is not delivered" warning, permanently ────────── */}
        <Alert status="info" borderRadius="lg" mb={5} fontSize="xs" alignItems="flex-start">
          <AlertIcon mt={0.5} />
          <Text>
            <b>Accepted ≠ delivered.</b> “Accepted” only means Gupshup or Flaxxa took the
            message. Green means a delivery callback confirmed it reached the phone. If a
            batch sits entirely at accepted, treat it as <b>not delivered</b> and check the
            number for a Meta rate limit before re-sending.
          </Text>
        </Alert>

        {/* ── per-kind delivery table ────────────────────────────────────── */}
        <Card mb={5} p={0} overflow="hidden">
          <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.100">
            <Heading size="sm" color="night.800">By message type</Heading>
          </Box>
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead><Tr bg="night.50">
                <Th fontSize="xs" color="night.500">Message</Th>
                <Th fontSize="xs" color="night.500" isNumeric>Total</Th>
                {STATUS_ORDER.map(s => (
                  <Th key={s} fontSize="xs" color="night.500" isNumeric textTransform="capitalize">{s}</Th>
                ))}
                <Th fontSize="xs" color="night.500">Delivered</Th>
              </Tr></Thead>
              <Tbody>
                {kinds.map(k => {
                  const row = data.byKind[k];
                  const total = Object.values(row).reduce((a, b) => a + b, 0);
                  const delivered = (row.delivered || 0) + (row.read || 0);
                  const pct = total ? Math.round((delivered / total) * 100) : 0;
                  return (
                    <Tr key={k} _hover={{ bg: "peacock.50" }}>
                      <Td><Text fontSize="sm" fontWeight={600} color="night.800">{KIND_LABELS[k] || k}</Text>
                        <Text fontSize="xs" color="night.300">{k}</Text></Td>
                      <Td isNumeric fontSize="sm" fontWeight={700}>{total}</Td>
                      {STATUS_ORDER.map(s => (
                        <Td key={s} isNumeric fontSize="sm"
                          color={row[s] ? (STATUS_COLOR[s] === "gray" ? "night.500" : `${STATUS_COLOR[s]}.600`) : "night.200"}
                          fontWeight={row[s] ? 700 : 400}>
                          {row[s] || "—"}
                        </Td>
                      ))}
                      <Td minW="130px">
                        <Tooltip label={`${delivered} of ${total} confirmed on the phone`}>
                          <Box>
                            <Progress value={pct} size="xs" borderRadius="full"
                              colorScheme={pct >= 80 ? "green" : pct > 0 ? "yellow" : "gray"} />
                            <Text fontSize="xs" color="night.400" mt={0.5}>{pct}%</Text>
                          </Box>
                        </Tooltip>
                      </Td>
                    </Tr>
                  );
                })}
                {kinds.length === 0 && (
                  <Tr><Td colSpan={STATUS_ORDER.length + 3}>
                    <Text color="night.300" textAlign="center" py={8} fontSize="sm">No messages logged yet.</Text>
                  </Td></Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Card>

        {/* ── certificates ───────────────────────────────────────────────── */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mb={5}>
          <Card>
            <Flex justify="space-between" align="center" mb={3}>
              <Heading size="sm" color="night.800">🎓 Certificates</Heading>
              {cert && (
                <Badge colorScheme={cert.open ? "green" : "gray"} borderRadius="full" px={3}>
                  {cert.open ? "window open" : "waiting"}
                </Badge>
              )}
            </Flex>

            {cert && (
              <>
                <Text fontSize="xs" color="night.400" mb={3}>
                  <TimeIcon mr={1} mb={0.5} />
                  Goes out automatically at <b>{fmt(cert.opensAt)}</b> to everyone Paid + Attended.
                  {!cert.jobEnabled && <Text as="span" color="red.500" fontWeight={700}> Auto-send is DISABLED.</Text>}
                </Text>

                <Progress value={cert.eligible ? (cert.sent / cert.eligible) * 100 : 0}
                  size="sm" borderRadius="full" colorScheme="green" mb={2} />
                <HStack spacing={6} mb={3}>
                  <Stat label="Eligible" value={cert.eligible} />
                  <Stat label="Sent" value={cert.sent} color="green.600" />
                  <Stat label="Pending" value={cert.pending} />
                  <Stat label="Failing" value={cert.failing} color={cert.failing ? "red.500" : "night.800"} />
                </HStack>

                {cert.needsManualFix?.length > 0 && (
                  <Alert status="error" borderRadius="lg" fontSize="xs" mb={2} alignItems="flex-start">
                    <AlertIcon mt={0.5} />
                    <Box>
                      <Text fontWeight={700}>
                        {cert.needsManualFix.length} gave up after {cert.maxAttempts} attempts — these need a manual resend.
                      </Text>
                      {cert.needsManualFix.slice(0, 8).map((c, i) => (
                        <Text key={i}>{c.name} · {c.phone} — {c.error}</Text>
                      ))}
                      {cert.needsManualFix.length > 8 && <Text>…and {cert.needsManualFix.length - 8} more.</Text>}
                    </Box>
                  </Alert>
                )}

                {cert.retrying?.length > 0 && (
                  <Box fontSize="xs" color="night.500">
                    <Text fontWeight={700} mb={1}>Retrying ({cert.retrying.length}):</Text>
                    {cert.retrying.slice(0, 5).map((c, i) => (
                      <Text key={i} noOfLines={1}>
                        {c.name} · attempt {c.attempts}/{cert.maxAttempts} — {c.error}
                      </Text>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Card>

          {/* ── reminders ─────────────────────────────────────────────────── */}
          <Card>
            <Flex justify="space-between" align="center" mb={3}>
              <Heading size="sm" color="night.800">📣 Reminders</Heading>
              <Badge colorScheme={data?.remindersJobEnabled ? "green" : "red"} borderRadius="full" px={3}>
                {data?.remindersJobEnabled ? "automatic" : "DISABLED"}
              </Badge>
            </Flex>

            <VStack align="stretch" spacing={4}>
              {(data?.reminders || []).map(r => {
                const pct = r.audience ? Math.round((r.sent / r.audience) * 100) : 0;
                return (
                  <Box key={r.type}>
                    <Flex justify="space-between" align="baseline" mb={1}>
                      <Text fontSize="sm" fontWeight={700} color="night.800">
                        {KIND_LABELS[`reminder:${r.type}`] || r.type}
                      </Text>
                      <HStack spacing={2}>
                        <Tag size="sm" colorScheme={r.open ? "green" : "gray"}>{r.open ? "sent/sending" : "waiting"}</Tag>
                        <Text fontSize="xs" color="night.400">{r.sent}/{r.audience}</Text>
                      </HStack>
                    </Flex>
                    <Progress value={pct} size="xs" borderRadius="full"
                      colorScheme={pct >= 95 ? "green" : pct > 0 ? "yellow" : "gray"} />
                    <Text fontSize="xs" color="night.400" mt={1}>
                      Fires {fmt(r.opensAt)} · audience: {r.audienceLabel}
                      {r.pending > 0 && r.open && <Text as="span" color="orange.500" fontWeight={700}> · {r.pending} still pending</Text>}
                    </Text>
                  </Box>
                );
              })}
              {(!data?.reminders || data.reminders.length === 0) && (
                <Text fontSize="sm" color="night.300">No reminder schedule configured.</Text>
              )}
            </VStack>
          </Card>
        </SimpleGrid>

        {/* ── recent failures ────────────────────────────────────────────── */}
        <Card mb={5} p={0} overflow="hidden">
          <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.100">
            <Heading size="sm" color="night.800">Recent failures</Heading>
            <Text fontSize="xs" color="night.400">Messages a callback confirmed did NOT arrive.</Text>
          </Box>
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead><Tr bg="night.50">
                {["Name", "Phone", "Message", "Status", "Reason", "When"].map(h => (
                  <Th key={h} fontSize="xs" color="night.500" whiteSpace="nowrap">{h}</Th>
                ))}
              </Tr></Thead>
              <Tbody>
                {(data?.recentFailures || []).map(f => (
                  <Tr key={f._id} _hover={{ bg: "red.50" }}>
                    <Td fontSize="sm" fontWeight={600}>{f.name || "—"}</Td>
                    <Td fontSize="sm" whiteSpace="nowrap">{f.phone || "—"}</Td>
                    <Td fontSize="xs">{KIND_LABELS[f.kind] || f.kind}</Td>
                    <Td><Tag size="sm" colorScheme="red">{f.status}</Tag></Td>
                    <Td><Tooltip label={f.error}><Text fontSize="xs" noOfLines={1} maxW="280px" color="night.500">{f.error || "—"}</Text></Tooltip></Td>
                    <Td fontSize="xs" color="night.400" whiteSpace="nowrap">{fmt(f.statusAt || f.createdAt)}</Td>
                  </Tr>
                ))}
                {(!data?.recentFailures || data.recentFailures.length === 0) && (
                  <Tr><Td colSpan={6}>
                    <Text color="night.300" textAlign="center" py={8} fontSize="sm">
                      <CheckCircleIcon color="green.300" mr={2} mb={0.5} />No confirmed failures.
                    </Text>
                  </Td></Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Card>

        {/* ── providers + template preflight ─────────────────────────────── */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
          <Card>
            <Heading size="sm" color="night.800" mb={3}>Providers</Heading>
            {data?.providers && (
              <>
                <HStack mb={3} spacing={3}>
                  <Tag colorScheme={data.providers.gupshup?.configured ? "green" : "red"} size="sm">
                    Gupshup {data.providers.gupshup?.configured ? "ready" : "NOT configured"}
                  </Tag>
                  <Tag colorScheme={data.providers.flaxxa?.configured ? "green" : "gray"} size="sm">
                    Flaxxa {data.providers.flaxxa?.configured ? "ready" : "off"}
                  </Tag>
                  <Text fontSize="xs" color="night.400">default: <b>{data.providers.default}</b></Text>
                </HStack>
                {data.providers.gupshup?.missing?.length > 0 && (
                  <Alert status="error" borderRadius="lg" fontSize="xs" mb={2}>
                    <AlertIcon />Missing env vars: {data.providers.gupshup.missing.join(", ")}
                  </Alert>
                )}
                <Divider my={2} />
                <Text fontSize="xs" fontWeight={700} color="night.400" mb={1}>Routing</Text>
                <SimpleGrid columns={2} spacing={1}>
                  {Object.entries(data.providers.routing || {}).map(([k, v]) => (
                    <Text key={k} fontSize="xs" color="night.500">
                      {KIND_LABELS[k] || k} → <b>{v}</b>
                    </Text>
                  ))}
                </SimpleGrid>
                <Text fontSize="xs" color="night.300" mt={3}>
                  Last message sent {fmt(data.lastSentAt)} · last callback {fmt(data.lastCallbackAt)}
                </Text>
              </>
            )}
          </Card>

          <Card>
            <Flex justify="space-between" align="center" mb={3}>
              <Box>
                <Heading size="sm" color="night.800">Template preflight</Heading>
                <Text fontSize="xs" color="night.400">
                  Checks approval status and variable counts against Gupshup. Run before any bulk send.
                </Text>
              </Box>
              <Button size="sm" colorScheme="purple" variant="outline" onClick={checkTemplates}
                isLoading={templatesLoading}>Check</Button>
            </Flex>

            {templates && (
              <>
                <Alert status={templates.ready ? "success" : "warning"} borderRadius="lg" fontSize="xs" mb={3}>
                  <AlertIcon />
                  {templates.ready
                    ? "Every configured template is approved and the variable counts match."
                    : "Some templates have problems — Meta drops mismatched messages silently."}
                </Alert>
                <VStack align="stretch" spacing={2}>
                  {templates.templates?.map(t => (
                    <Box key={t.kind} borderLeft="3px solid" borderColor={t.ok ? "green.400" : "red.400"} pl={3}>
                      <HStack spacing={2}>
                        {t.ok ? <CheckCircleIcon color="green.400" boxSize={3} /> : <WarningTwoIcon color="red.400" boxSize={3} />}
                        <Text fontSize="sm" fontWeight={600}>{KIND_LABELS[t.kind] || t.kind}</Text>
                        <Tag size="sm" colorScheme={t.status === "APPROVED" ? "green" : "red"}>{t.status}</Tag>
                        <Text fontSize="xs" color="night.400">{t.actualVars ?? "?"} vars / code sends {t.expects}</Text>
                      </HStack>
                      {t.problems?.map((p, i) => (
                        <Text key={i} fontSize="xs" color="red.500">• {p}</Text>
                      ))}
                    </Box>
                  ))}
                </VStack>
              </>
            )}
            {!templates && !templatesLoading && (
              <Text fontSize="sm" color="night.300">Not checked yet.</Text>
            )}
          </Card>
        </SimpleGrid>
      </Box>
    </Layout>
  );
};

export default MessagingStatus;
