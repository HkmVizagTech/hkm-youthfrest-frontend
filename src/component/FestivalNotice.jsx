import React from "react";
import { Box, Heading, Text, VStack, Container, Image } from "@chakra-ui/react";
import image12 from "./image.png";

const FestivalNotice = () => (
  <Box bg="night.900" minH="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" px={4} position="relative" overflow="hidden">
    {/* glow blobs */}
    <Box className="kp-blob" position="absolute" top="-80px" left="-60px" w="320px" h="320px" bgGradient="radial(peacock.400, transparent 70%)" filter="blur(20px)" opacity={0.4} pointerEvents="none" />
    <Box className="kp-blob" position="absolute" bottom="-40px" right="-50px" w="280px" h="280px" bgGradient="radial(lotus.400, transparent 70%)" filter="blur(20px)" opacity={0.35} pointerEvents="none" />

    <Container maxW="lg" position="relative" textAlign="center">
      <Text fontSize="xs" letterSpacing="0.32em" fontWeight={700} color="peacock.300" textTransform="uppercase" mb={8}>
        Hare Krishna Movement · Visakhapatnam
      </Text>

      <Box className="kp-float" mx="auto" mb={6} boxSize={{ base: "96px", md: "112px" }} borderRadius="full" overflow="hidden" border="3px solid" borderColor="marigold.400" boxShadow="0 0 40px -8px rgba(255,176,32,0.6)">
        <Image src={image12} alt="Krishna Pulse" objectFit="cover" w="100%" h="100%" />
      </Box>

      <Heading as="h1" fontWeight={800} lineHeight={0.95} letterSpacing="-0.02em" color="white" fontSize={{ base: "5xl", md: "6xl" }} mb={2}>
        Krishna{" "}
        <Box as="span" bgGradient="linear(to-r, marigold.400, saffron.500, lotus.400)" bgClip="text">Pulse</Box>
      </Heading>
      <Text fontWeight={700} letterSpacing="0.18em" textTransform="uppercase" color="whiteAlpha.700" fontSize="sm" mb={8}>
        Youth Festival
      </Text>

      {/* signature pulse waveform */}
      <Box mx="auto" maxW="420px" mb={10} opacity={0.8}>
        <svg className="kp-pulse-line" viewBox="0 0 420 50" fill="none" width="100%" height="38" aria-hidden="true">
          <path d="M0 25 H90 l10 -18 l12 36 l10 -28 l8 18 H240 l11 -22 l10 36 l9 -22 H420" stroke="url(#kpg2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="kpg2" x1="0" y1="0" x2="420" y2="0">
              <stop offset="0" stopColor="#0FB6A6" /><stop offset="0.5" stopColor="#FFB020" /><stop offset="1" stopColor="#F2478B" />
            </linearGradient>
          </defs>
        </svg>
      </Box>

      <Box bg="cream" borderRadius="2xl" overflow="hidden" boxShadow="0 30px 60px -25px rgba(12,9,33,0.8)" mx="auto">
        <Box h="5px" bgGradient="linear(to-r, peacock.500, marigold.400, lotus.400)" />
        <VStack spacing={4} px={{ base: 8, md: 12 }} py={10}>
          <Text fontSize="2xl">🙏</Text>
          <Text fontSize={{ base: "md", md: "lg" }} color="night.700" fontWeight={500} lineHeight={1.7}>
            Dear Devotees & Youth Friends,<br />
            Registrations for <Text as="span" fontWeight={800} color="night.800">Krishna Pulse Youth Festival</Text> are currently <Text as="span" fontWeight={800} color="lotus.600">closed.</Text>
          </Text>
          <Text fontSize="sm" color="night.500" fontStyle="italic" lineHeight={1.8}>
            Stay tuned for future updates and announcements.<br />
            Let's celebrate the spirit of Krishna with joy, music, and devotion! 🎶✨
          </Text>
        </VStack>
      </Box>
    </Container>

    <Text position="absolute" bottom={4} fontSize="xs" color="whiteAlpha.400" textAlign="center" w="full">
      © {new Date().getFullYear()} Krishna Pulse Youth Festival · Hare Krishna Movement, Visakhapatnam
    </Text>
  </Box>
);

export default FestivalNotice;
