import React, { useEffect, useState } from 'react';
import { Box, Button, Center, Flex, Heading, Icon, Image, Text, VStack, HStack, Spinner, Link, SimpleGrid } from '@chakra-ui/react';
import { CheckCircle, Calendar, MapPin, Phone, Mail, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import krishnaPulseLogo from './component/image.png';

const API_BASE = 'https://hkm-youtfrest-backend-razorpay-882278565284.asia-south1.run.app/users';

export default function ThankYouPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [candidate, setCandidate] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const res = await axios.get(`${API_BASE}/verify-payment/${id}`);
        if (res.data.success) { setCandidate(res.data.candidate); setStatus('success'); }
        else setStatus('invalid');
      } catch { setStatus('error'); }
    };
    if (id) verifyPayment();
  }, [id]);

  if (status === 'loading') return (
    <Center minH="100vh" bg="night.900">
      <VStack spacing={4}>
        <Spinner size="xl" color="peacock.400" thickness="3px" />
        <Text color="whiteAlpha.600" fontSize="sm">Verifying your registration…</Text>
      </VStack>
    </Center>
  );

  if (status === 'invalid' || status === 'error') return (
    <Box bg="night.900" minH="100vh" display="flex" alignItems="center" justifyContent="center" px={4}>
      <Box bg="cream" borderRadius="2xl" overflow="hidden" maxW="md" w="full" boxShadow="0 30px 60px -20px rgba(12,9,33,0.8)" textAlign="center">
        <Box h="5px" bg={status === 'invalid' ? 'lotus.500' : 'saffron.500'} />
        <VStack spacing={4} px={8} py={10}>
          <Text fontSize="3xl">{status === 'invalid' ? '⚠️' : '🔌'}</Text>
          <Heading size="md" color="night.800">{status === 'invalid' ? 'Invalid payment' : 'Something went wrong'}</Heading>
          <Text fontSize="sm" color="night.500">{status === 'invalid' ? "This payment ID doesn't match any registration." : 'We couldn\'t verify your payment. Please try again later.'}</Text>
          <Button variant="pulse" onClick={() => navigate('/')} mt={2}>Back to home</Button>
        </VStack>
      </Box>
    </Box>
  );

  const details = [
    { icon: Calendar, label: 'Event date', value: 'August 15, 2025' },
    { icon: MapPin, label: 'Venue', value: 'Gadiraju Palace, Beach Road, Visakhapatnam' },
    { icon: Phone, label: 'WhatsApp updates', value: "You'll receive event updates on WhatsApp" },
  ];

  return (
    <Box bg="night.900" minH="100vh" position="relative" overflow="hidden">
      <Box className="kp-blob" position="absolute" top="-80px" left="-60px" w="320px" h="320px" bgGradient="radial(peacock.400, transparent 70%)" filter="blur(20px)" opacity={0.35} pointerEvents="none" />
      <Box className="kp-blob" position="absolute" bottom="0" right="-50px" w="280px" h="280px" bgGradient="radial(lotus.400, transparent 70%)" filter="blur(20px)" opacity={0.3} pointerEvents="none" />

      {/* hero */}
      <Box pt={{ base: 10, md: 14 }} pb={{ base: 24, md: 28 }} px={4} textAlign="center" position="relative">
        <Text fontSize="xs" letterSpacing="0.32em" fontWeight={700} color="peacock.300" textTransform="uppercase" mb={6}>
          Hare Krishna Movement · Visakhapatnam
        </Text>
        <Box className="kp-float" mx="auto" mb={5} position="relative" display="inline-block">
          <Box boxSize={{ base: "96px", md: "112px" }} borderRadius="full" overflow="hidden" border="3px solid" borderColor="marigold.400" boxShadow="0 0 40px -8px rgba(255,176,32,0.6)">
            <Image src={krishnaPulseLogo} alt="Krishna Pulse" objectFit="cover" w="100%" h="100%" />
          </Box>
          <Box position="absolute" bottom={0} right={0} bg="peacock.500" borderRadius="full" p="6px" border="2px solid" borderColor="night.900">
            <CheckCircle size={16} color="white" />
          </Box>
        </Box>
        <Heading fontWeight={800} lineHeight={0.95} letterSpacing="-0.02em" color="white" fontSize={{ base: "4xl", md: "5xl" }}>
          Krishna <Box as="span" bgGradient="linear(to-r, marigold.400, saffron.500, lotus.400)" bgClip="text">Pulse</Box>
        </Heading>
        <Text fontWeight={700} letterSpacing="0.18em" textTransform="uppercase" color="whiteAlpha.600" fontSize="xs" mt={1}>
          Youth Festival
        </Text>
      </Box>

      {/* pass card */}
      <Center px={4} pb={16} mt={{ base: -16, md: -20 }}>
        <Box maxW="xl" w="full">
          {/* success banner */}
          <Box bg="peacock.600" borderRadius="2xl" px={6} py={5} mb={4} textAlign="center" boxShadow="0 16px 40px -16px rgba(15,182,166,0.5)">
            <HStack justify="center" spacing={2} mb={1}>
              <CheckCircle size={20} color="white" />
              <Text fontWeight={800} color="white" fontSize="lg">Registration confirmed!</Text>
            </HStack>
            <Text color="whiteAlpha.800" fontSize="sm">Welcome to Krishna Pulse Youth Fest 2025</Text>
          </Box>

          <Box bg="cream" borderRadius="2xl" overflow="hidden" boxShadow="0 30px 60px -25px rgba(12,9,33,0.7)">
            <Box h="5px" bgGradient="linear(to-r, peacock.500, marigold.400, lotus.400)" />

            {candidate && (
              <Box px={{ base: 6, md: 10 }} pt={8} pb={5} borderBottom="1px solid" borderColor="blackAlpha.100">
                <Text fontSize="xl" fontWeight={800} color="night.800">Hare Krishna, {candidate.name}! 🙏</Text>
                <HStack mt={1} spacing={4} fontSize="sm" color="night.500" flexWrap="wrap">
                  <Text>Payment ₹{candidate.paymentAmount}</Text>
                  <Text>·</Text>
                  <Text fontFamily="mono" fontSize="xs">ID: {candidate.paymentId}</Text>
                </HStack>
              </Box>
            )}

            <VStack spacing={3} px={{ base: 6, md: 10 }} py={6} align="stretch">
              {details.map(({ icon: Ic, label, value }) => (
                <Flex key={label} align="flex-start" gap={3} p={4} bg="night.50" borderRadius="xl">
                  <Box mt="2px" color="peacock.600" flexShrink={0}><Ic size={18} /></Box>
                  <Box>
                    <Text fontSize="xs" fontWeight={700} color="night.500" textTransform="uppercase" letterSpacing="0.08em">{label}</Text>
                    <Text fontSize="sm" fontWeight={600} color="night.800" mt={0.5}>{value}</Text>
                  </Box>
                </Flex>
              ))}
            </VStack>

            <Box px={{ base: 6, md: 10 }} pb={6}>
              <Box bg="night.800" borderRadius="xl" px={5} py={4} textAlign="center">
                <Text fontWeight={700} color="marigold.300" mb={1}>🙏 Radhe Krishna! 🙏</Text>
                <Text fontSize="sm" color="whiteAlpha.700">We're excited to celebrate with you!</Text>
              </Box>

              <HStack justify="center" spacing={5} mt={5} fontSize="sm">
                <Link href="mailto:krishnapulse@gmail.com" color="peacock.600" fontWeight={600} display="flex" alignItems="center" gap={1}>
                  <Mail size={14} /> Email support
                </Link>
              </HStack>
            </Box>
          </Box>

          <Center mt={6}>
            <Button variant="peacockGhost" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/')} size="sm">
              Register another participant
            </Button>
          </Center>
        </Box>
      </Center>
    </Box>
  );
}
