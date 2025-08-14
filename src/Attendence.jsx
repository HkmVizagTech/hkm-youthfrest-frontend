import React, { useState } from "react";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  FormErrorMessage,
  useToast,
  InputGroup,
  InputLeftAddon,
  Flex,
  Text,
  Icon,
  Fade,
  Image,
  Link, 
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons"; 
import { QRCodeSVG } from "qrcode.react";

const Attendence = () => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [attendanceToken, setAttendanceToken] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(""); 
  const [notFound, setNotFound] = useState(false); 
  const toast = useToast();

  const handleSubmit = async () => {
    setError("");
    setSuccessName("");
    setAttendanceToken("");
    setAttendanceDate(""); 
    setNotFound(false); 
    const trimmedPhone = phone.trim().replace(/\D/g, "");

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://hkm-youtfrest-backend-razorpay-882278565284.asia-south1.run.app/users/mark-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber: trimmedPhone }),
      });

      const data = await res.json();

      if (res.ok) {
        if ((data.status === "already-marked" || data.status === "success") && data.attendanceToken) {
          setAttendanceToken(data.attendanceToken);
          setSuccessName(data.name || "");
          setAttendanceDate(data.attendanceDate || ""); 
        }

        if (data.status === "already-marked") {
          toast({
            title: "Already Marked",
            description: data.message || "Attendance has already been marked.",
            status: "info",
            duration: 3500,
            isClosable: true,
          });
        } else if (data.status === "success") {
          toast({
            title: "Attendance Marked!",
            description: `Marked for ${data.name}`,
            status: "success",
            duration: 3500,
            isClosable: true,
          });
          setSuccessName(data.name);
          setPhone("");
        }
      } else {
        if (
          data?.message?.toLowerCase().includes("not found") ||
          data?.message?.toLowerCase().includes("no user")
        ) {
          setNotFound(true);
        } else {
          toast({
            title: "Error",
            description: data.message || "Could not mark attendance",
            status: "error",
            duration: 3500,
            isClosable: true,
          });
        }
      }
    } catch (err) {
      toast({
        title: "Server error",
        description: err.message || "Something went wrong",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleString(); 
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" px={2}>
      <Box
        w="full"
        maxW="400px"
        bg="white"
        p={8}
        borderRadius="2xl"
        boxShadow="xl"
        textAlign="center"
      >
        <Heading mb={2} size="lg" color="teal.600" fontWeight="bold">
          Mark Attendance
        </Heading>
        <Text mb={7} fontSize="md" color="gray.500">
          Enter your WhatsApp mobile number to mark your attendance.
        </Text>

        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <FormControl isInvalid={!!error}>
            <FormLabel htmlFor="phone" fontWeight="medium">
              WhatsApp Number
            </FormLabel>
            <InputGroup>
              <InputLeftAddon children="+91" />
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit mobile"
                value={phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) setPhone(val);
                }}
                maxLength={10}
                autoComplete="tel"
                bg="gray.100"
                fontWeight="medium"
                letterSpacing="wide"
                required
                isDisabled={loading}
              />
            </InputGroup>
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>

          <Button
            mt={6}
            colorScheme="teal"
            width="full"
            type="submit"
            isLoading={loading}
            loadingText="Marking..."
            disabled={loading || phone.length !== 10}
            fontWeight="bold"
            fontSize="lg"
            borderRadius="lg"
            boxShadow="md"
          >
            Mark Attendance
          </Button>
        </form>

        <Fade in={notFound}>
          {notFound && (
            <Box mt={6} p={4} borderRadius="lg" bg="orange.50" border="1px solid" borderColor="orange.200" textAlign="left">
              <Flex align="center" mb={2}>
                <Icon as={WarningIcon} color="orange.400" mr={2} boxSize={6} />
                <Text fontWeight="bold" color="orange.600">
                  Number not registered!
                </Text>
              </Flex>
              <Text color="orange.700" fontSize="md" mb={2}>
                Please register here:{" "}
                <Link color="teal.600" href="https://youthfest.harekrishnavizag.org/" isExternal fontWeight="bold" textDecoration="underline">
                  https://youthfest.harekrishnavizag.org/
                </Link>
              </Text>
              <Text color="orange.700" fontSize="md">
                And please visit the enquiry counter.
              </Text>
            </Box>
          )}
        </Fade>

        <Fade in={!!attendanceToken}>
          {attendanceToken && (
            <Box mt={8} textAlign="center">
              <Icon as={CheckCircleIcon} w={12} h={12} color="green.400" />
              {successName && (
                <>
                  <Text mt={3} fontSize="xl" fontWeight="bold" color="green.600">
                    Attendance marked for
                  </Text>
                  <Text fontSize="2xl" fontWeight="extrabold" color="teal.700">
                    {successName}
                  </Text>
                </>
              )}
              {attendanceDate && (
                <Text fontSize="md" color="gray.700" mt={2}>
                  Attendance marked on: <b>{formatDate(attendanceDate)}</b>
                </Text>
              )}
              <Text fontSize="lg" color="teal.700" mb={2} mt={2}>
                Show this QR at Reporting Counter and Collect Entry Band
              </Text>
              <Box display="flex" justifyContent="center" alignItems="center">
                <QRCodeSVG value={attendanceToken} size={200} />
              </Box>
              <Image
                mt={2}
                mx="auto"
                src="https://cdn.dribbble.com/users/1615584/screenshots/4187826/check02.gif"
                alt="Success"
                boxSize="80px"
                borderRadius="full"
                objectFit="cover"
              />
              <Text mt={4} fontSize="md" fontWeight="bold" color="teal.600">
                Please visit the admin counter.
              </Text>
            </Box>
          )}
        </Fade>
      </Box>
    </Flex>
  );
};

export default Attendence;