import React from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Container,
  useColorModeValue,
} from "@chakra-ui/react";

const FestivalNotice = () => {
  const bgGradient = useColorModeValue(
    "linear(to-b, purple.100, yellow.100)",
    "linear(to-b, purple.900, yellow.800)"
  );

  return (
    <Box
      minH="100vh"
      bgGradient={bgGradient}
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <Container
        maxW="lg"
        bg={useColorModeValue("white", "gray.800")}
        boxShadow="2xl"
        rounded="2xl"
        p={10}
        textAlign="center"
      >
        <VStack spacing={5}>
          <Heading size="xl" color="purple.700">
            KRISHNA PULSE YOUTH FESTIVAL
          </Heading>

          <Heading size="md" color="yellow.500" fontWeight="semibold">
            A Fest of Fun, Faith & Freedom
          </Heading>

          <Text fontSize="lg" color="gray.700">
            🙏 Dear Devotees & Youth Friends,
            <br />
            Currently, we have{" "}
            <Text as="span" fontWeight="bold" color="red.500">
              stopped the registrations
            </Text>{" "}
            for the Krishna Pulse Youth Festival.
          </Text>

          <Text fontSize="md" color="gray.600" fontStyle="italic">
            Please stay tuned for future updates and announcements.
            <br />
            Let's celebrate together the spirit of Krishna with joy, music, and
            devotion! 🎶✨
          </Text>
        </VStack>
      </Container>

      <Box
        as="footer"
        position="absolute"
        bottom="4"
        textAlign="center"
        w="full"
        color="gray.600"
        fontSize="sm"
      >
        © {new Date().getFullYear()} Krishna Pulse Youth Festival
      </Box>
    </Box>
  );
};

export default FestivalNotice;
