import { API_HOST } from "./config";
import React, { useState } from "react";
import { Box, Button, FormControl, FormLabel, Input, InputGroup, InputLeftAddon, FormErrorMessage, Text, Flex, Link } from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, AlertTriangle } from "lucide-react";

const Attendence = () => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [attendanceToken, setAttendanceToken] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [notFound, setNotFound] = useState(false);

  const handleSubmit = async () => {
    setError(""); setSuccessName(""); setAttendanceToken(""); setAttendanceDate(""); setNotFound(false);
    const trimmed = phone.trim().replace(/\D/g, "");
    if (!/^\d{10}$/.test(trimmed)) { setError("Enter a valid 10-digit number."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_HOST}/users/mark-attendance`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        if ((data.status === "already-marked" || data.status === "success") && data.attendanceToken) {
          setAttendanceToken(data.attendanceToken); setSuccessName(data.name || ""); setAttendanceDate(data.attendanceDate || "");
        }
        if (data.status === "success") setPhone("");
      } else {
        if (data?.message?.toLowerCase().includes("not found") || data?.message?.toLowerCase().includes("no user")) setNotFound(true);
        else setError(data.message || "Could not mark attendance");
      }
    } catch (e) { setError(e.message || "Something went wrong"); }
    setLoading(false);
  };

  return (
    <Box bg="night.900" minH="100vh" display="flex" alignItems="center" justifyContent="center" px={4} position="relative" overflow="hidden">
      <Box className="kp-blob" position="absolute" top="-60px" left="-40px" w="260px" h="260px" bgGradient="radial(peacock.400, transparent 70%)" filter="blur(20px)" opacity={0.35} pointerEvents="none" />
      <Box className="kp-blob" position="absolute" bottom="-40px" right="-40px" w="240px" h="240px" bgGradient="radial(lotus.400, transparent 70%)" filter="blur(20px)" opacity={0.3} pointerEvents="none" />

      <Box w="full" maxW="400px" position="relative">
        <Text fontSize="xs" letterSpacing="0.32em" fontWeight={700} color="peacock.300" textTransform="uppercase" textAlign="center" mb={6}>
          Krishna Pulse · Attendance
        </Text>

        <Box bg="cream" borderRadius="2xl" overflow="hidden" boxShadow="0 30px 60px -20px rgba(12,9,33,0.8)">
          <Box h="5px" bgGradient="linear(to-r, peacock.500, marigold.400, lotus.400)" />
          <Box px={8} py={8}>
            <Text fontSize="xl" fontWeight={800} color="night.800" mb={2} textAlign="center">Mark attendance</Text>
            <Text fontSize="sm" color="night.500" textAlign="center" mb={6}>Enter your WhatsApp number to check in.</Text>

            {!attendanceToken && (
              <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                <FormControl isInvalid={!!error} mb={4}>
                  <FormLabel>WhatsApp Number</FormLabel>
                  <InputGroup>
                    <InputLeftAddon bg="night.50" fontWeight={600} color="night.700">+91</InputLeftAddon>
                    <Input type="tel" placeholder="10-digit number" value={phone}
                      onChange={e => { const v = e.target.value.replace(/\D/g,""); if (v.length <= 10) setPhone(v); }}
                      maxLength={10} isDisabled={loading} />
                  </InputGroup>
                  <FormErrorMessage>{error}</FormErrorMessage>
                </FormControl>
                <Button variant="pulse" type="submit" isLoading={loading} loadingText="Marking…" w="full" py={6} isDisabled={phone.length !== 10}>
                  Mark attendance
                </Button>
              </form>
            )}

            {notFound && (
              <Box mt={4} p={4} bg="saffron.50" border="1.5px solid" borderColor="saffron.300" borderRadius="xl">
                <Flex align="center" gap={2} mb={2}><AlertTriangle size={18} color="#CC7C00" /><Text fontWeight={700} color="saffron.700" fontSize="sm">Number not registered</Text></Flex>
                <Text fontSize="sm" color="saffron.700">Register at <Link href="https://youthfest.harekrishnavizag.org/" isExternal color="peacock.600" fontWeight={600} textDecoration="underline">youthfest.harekrishnavizag.org</Link> and visit the enquiry counter.</Text>
              </Box>
            )}

            {attendanceToken && (
              <Box textAlign="center">
                <Flex justify="center" mb={3}><CheckCircle size={48} color="#0A7268" /></Flex>
                <Text fontSize="lg" fontWeight={800} color="night.800">{successName}</Text>
                {attendanceDate && <Text fontSize="xs" color="night.500" mt={1}>{new Date(attendanceDate).toLocaleString()}</Text>}
                <Text fontSize="sm" color="peacock.700" fontWeight={600} mt={4} mb={4}>Show this QR at the reporting counter to collect your entry band.</Text>
                <Flex justify="center">
                  <Box p={3} bg="white" borderRadius="xl" border="2px solid" borderColor="peacock.300">
                    <QRCodeSVG value={attendanceToken} size={180} />
                  </Box>
                </Flex>
                <Text fontSize="sm" color="night.500" mt={4}>🙏 Hare Krishna! Please visit the admin counter.</Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Attendence;
