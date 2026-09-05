// ─────────────────────────────────────────────────────────────────────────────
// Public feedback form — reached by scanning a QR code at the venue exit.
//
// Design constraints, all driven by WHERE this gets used: someone is standing
// up to leave a hall, on their own phone, on patchy venue wifi, with friends
// waiting. So:
//
//   • One required question (overall rating). Everything else optional.
//   • Big tap targets — star rows, not dropdowns. Thumb-reachable.
//   • No login, no OTP, no required phone number. Asking for identity at the
//     exit is the fastest way to halve the response rate.
//   • Submits in one request; a double-tap is handled server-side, and
//     localStorage stops an accidental second submission on the same phone.
//   • Works on the dark festival background the rest of the site uses.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import {
  Box, Flex, VStack, HStack, Text, Heading, Textarea, Input, Button,
  useToast, Icon, Fade, FormControl, FormLabel, Divider,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { API_HOST } from "./config";

const STORAGE_KEY = "kp_feedback_submitted_2026";

const Star = ({ filled, onClick, onMouseEnter, onMouseLeave }) => (
  <Box
    as="button"
    type="button"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    aria-label="rate"
    px={1}
    fontSize={{ base: "34px", sm: "38px" }}
    lineHeight={1}
    transition="transform 0.12s ease"
    _active={{ transform: "scale(0.88)" }}
    _hover={{ transform: "scale(1.12)" }}
    color={filled ? "marigold.400" : "whiteAlpha.300"}
    filter={filled ? "drop-shadow(0 2px 8px rgba(255,176,32,0.45))" : "none"}
  >
    ★
  </Box>
);

const StarRow = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <HStack spacing={0} justify="center" py={1}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          filled={n <= shown}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        />
      ))}
    </HStack>
  );
};

const RATING_WORDS = ["", "Not great", "Okay", "Good", "Really good", "Loved it"];

const Section = ({ label, children, hint }) => (
  <Box>
    <Text fontSize="sm" fontWeight={700} color="whiteAlpha.900" textAlign="center">{label}</Text>
    {hint && <Text fontSize="xs" color="whiteAlpha.500" textAlign="center" mt={0.5}>{hint}</Text>}
    {children}
  </Box>
);

const Choice = ({ selected, onClick, children }) => (
  <Button
    type="button"
    onClick={onClick}
    flex={1}
    size="md"
    borderRadius="xl"
    fontWeight={700}
    bg={selected ? "peacock.500" : "whiteAlpha.100"}
    color={selected ? "white" : "whiteAlpha.700"}
    border="1.5px solid"
    borderColor={selected ? "peacock.400" : "whiteAlpha.200"}
    _hover={{ bg: selected ? "peacock.600" : "whiteAlpha.200" }}
    _active={{ transform: "scale(0.97)" }}
  >
    {children}
  </Button>
);

const Feedback = () => {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [overallRating, setOverallRating] = useState(0);
  const [contentRating, setContentRating] = useState(0);
  const [organizationRating, setOrganizationRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [wantsFutureEvents, setWantsFutureEvents] = useState(null);
  const [likedMost, setLikedMost] = useState("");
  const [improvements, setImprovements] = useState("");
  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) setDone(true);
    } catch (e) { /* private mode — just show the form */ }
  }, []);

  const submit = async () => {
    if (!overallRating) {
      toast({ title: "Please tap a star for your overall rating", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`${API_HOST}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallRating,
          contentRating: contentRating || undefined,
          organizationRating: organizationRating || undefined,
          foodRating: foodRating || undefined,
          wouldRecommend: wouldRecommend ?? undefined,
          wantsFutureEvents: wantsFutureEvents ?? undefined,
          likedMost: likedMost.trim() || undefined,
          improvements: improvements.trim() || undefined,
          name: name.trim() || undefined,
          whatsappNumber: whatsappNumber.trim() || undefined,
          source: "exit-qr",
        }),
      });
      const j = await r.json();
      if (j.status !== "success") throw new Error(j.message || "Could not save your feedback");
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
      setDone(true);
    } catch (e) {
      toast({ title: "Couldn't send", description: e.message, status: "error", duration: 5000, isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Flex minH="100vh" bg="night.900" align="center" justify="center" p={6}>
        <Fade in>
          <VStack spacing={4} textAlign="center" maxW="380px">
            <Icon as={CheckCircleIcon} boxSize={14} color="peacock.400" />
            <Heading size="lg" color="white" fontWeight={800}>Thank you!</Heading>
            <Text color="whiteAlpha.700" fontSize="md">
              Your feedback helps us make the next Krishna Pulse better.
              We're glad you came.
            </Text>
            <Text color="whiteAlpha.400" fontSize="xs" pt={4}>
              Hare Krishna Movement · Visakhapatnam
            </Text>
          </VStack>
        </Fade>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="night.900" py={8} px={4}>
      <Box maxW="480px" mx="auto">
        {/* header */}
        <VStack spacing={1} mb={7} textAlign="center">
          <Text fontSize="xs" letterSpacing="0.22em" fontWeight={700} color="peacock.300" textTransform="uppercase">
            Krishna Pulse 2026
          </Text>
          <Heading size="lg" color="white" fontWeight={800}>How was it?</Heading>
          <Text fontSize="sm" color="whiteAlpha.600">
            Takes under a minute. Only the first question is required.
          </Text>
        </VStack>

        <VStack
          spacing={7}
          bg="whiteAlpha.50"
          borderRadius="2xl"
          border="1px solid"
          borderColor="whiteAlpha.100"
          p={{ base: 5, sm: 7 }}
          align="stretch"
        >
          {/* required */}
          <Section label="Overall, how was the festival?">
            <StarRow value={overallRating} onChange={setOverallRating} />
            <Text
              textAlign="center"
              fontSize="sm"
              fontWeight={700}
              color={overallRating ? "marigold.300" : "whiteAlpha.400"}
              minH="20px"
            >
              {overallRating ? RATING_WORDS[overallRating] : "Tap a star"}
            </Text>
          </Section>

          <Divider borderColor="whiteAlpha.100" />

          <Section label="The talks and programme">
            <StarRow value={contentRating} onChange={setContentRating} />
          </Section>

          <Section label="Organisation and volunteers">
            <StarRow value={organizationRating} onChange={setOrganizationRating} />
          </Section>

          <Section label="Prasadam">
            <StarRow value={foodRating} onChange={setFoodRating} />
          </Section>

          <Divider borderColor="whiteAlpha.100" />

          <Section label="Would you recommend it to a friend?">
            <HStack spacing={3} pt={2}>
              <Choice selected={wouldRecommend === true} onClick={() => setWouldRecommend(true)}>Yes</Choice>
              <Choice selected={wouldRecommend === false} onClick={() => setWouldRecommend(false)}>No</Choice>
            </HStack>
          </Section>

          <Section label="Want to hear about future events?">
            <HStack spacing={3} pt={2}>
              <Choice selected={wantsFutureEvents === true} onClick={() => setWantsFutureEvents(true)}>Yes</Choice>
              <Choice selected={wantsFutureEvents === false} onClick={() => setWantsFutureEvents(false)}>No</Choice>
            </HStack>
          </Section>

          <Divider borderColor="whiteAlpha.100" />

          <FormControl>
            <FormLabel fontSize="sm" color="whiteAlpha.900" fontWeight={700}>What did you enjoy most?</FormLabel>
            <Textarea
              value={likedMost}
              onChange={e => setLikedMost(e.target.value)}
              placeholder="The kirtan, the talk, meeting people…"
              rows={3}
              bg="whiteAlpha.100"
              border="1.5px solid"
              borderColor="whiteAlpha.200"
              color="white"
              _placeholder={{ color: "whiteAlpha.400" }}
              _hover={{ borderColor: "peacock.400" }}
              _focusVisible={{ borderColor: "peacock.400", boxShadow: "0 0 0 3px rgba(15,182,166,0.25)" }}
              maxLength={2000}
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" color="whiteAlpha.900" fontWeight={700}>What could we do better?</FormLabel>
            <Textarea
              value={improvements}
              onChange={e => setImprovements(e.target.value)}
              placeholder="Be honest — this is the part we learn from."
              rows={3}
              bg="whiteAlpha.100"
              border="1.5px solid"
              borderColor="whiteAlpha.200"
              color="white"
              _placeholder={{ color: "whiteAlpha.400" }}
              _hover={{ borderColor: "peacock.400" }}
              _focusVisible={{ borderColor: "peacock.400", boxShadow: "0 0 0 3px rgba(15,182,166,0.25)" }}
              maxLength={2000}
            />
          </FormControl>

          <Divider borderColor="whiteAlpha.100" />

          <Box>
            <Text fontSize="xs" color="whiteAlpha.500" mb={3} textAlign="center">
              Optional — only if you'd like us to be able to follow up.
            </Text>
            <VStack spacing={3}>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name (optional)"
                bg="whiteAlpha.100"
                border="1.5px solid"
                borderColor="whiteAlpha.200"
                color="white"
                _placeholder={{ color: "whiteAlpha.400" }}
                _hover={{ borderColor: "peacock.400" }}
                _focusVisible={{ borderColor: "peacock.400", boxShadow: "0 0 0 3px rgba(15,182,166,0.25)" }}
              />
              <Input
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="WhatsApp number (optional)"
                type="tel"
                inputMode="numeric"
                bg="whiteAlpha.100"
                border="1.5px solid"
                borderColor="whiteAlpha.200"
                color="white"
                _placeholder={{ color: "whiteAlpha.400" }}
                _hover={{ borderColor: "peacock.400" }}
                _focusVisible={{ borderColor: "peacock.400", boxShadow: "0 0 0 3px rgba(15,182,166,0.25)" }}
              />
            </VStack>
          </Box>

          <Button
            variant="pulse"
            size="lg"
            onClick={submit}
            isLoading={submitting}
            loadingText="Sending…"
            w="full"
            h="56px"
            fontSize="md"
          >
            Send feedback
          </Button>
        </VStack>

        <Text textAlign="center" fontSize="xs" color="whiteAlpha.400" mt={6}>
          Hare Krishna Movement · Visakhapatnam
        </Text>
      </Box>
    </Box>
  );
};

export default Feedback;
