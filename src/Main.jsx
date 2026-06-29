import React, { useState, useEffect } from "react";
import image12 from "./component/image.png";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  RadioGroup,
  Radio,
  VStack,
  HStack,
  Heading,
  useToast,
  Select as ChakraSelect,
  Text,
  Container,
  Stack,
  InputGroup,
  InputLeftAddon,
  Image,
  Flex,
  SimpleGrid,
} from "@chakra-ui/react";
import Select from "react-select";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const initialState = {
  serialNo: "",
  name: "",
  whatsappNumber: "",
  email: "",
  gender: "",
  collegeOrWorking: "",
  companyName: "",
  college: "",
  course: "",
  year: "",
  dob: "",
  slot: "",
  amount: "1.00",
};

const slotOptions = [
  { value: "Morning", label: "Morning (11AM - 1PM)" },
  { value: "Evening", label: "Evening (5PM - 7PM)" },
];

const RAZORPAY_KEY = "rzp_live_HBAc3tlMK0X5Xd";
const API_BASE =
  "https://hkm-youtfrest-backend-razorpay-882278565284.asia-south1.run.app/users";

const Main = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [otherCollege, setOtherCollege] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await axios.get(
          "https://vrc-server-110406681774.asia-south1.run.app/college"
        );
        const options = res.data.map((college) => ({
          label: college.name,
          value: college.name,
        }));

        options.push({ label: "Other College", value: "Other College" });
        setCollegeOptions(options);
      } catch (err) {
        console.error("Failed to fetch colleges:", err);
      }
    };
    fetchColleges();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "college" && value !== "Other College") {
      setOtherCollege("");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const {
      name,
      whatsappNumber,
      email,
      gender,
      collegeOrWorking,
      companyName,
      college,
      course,
      year,
      dob,
      slot,
    } = formData;

    if (!name.trim()) newErrors.name = "Name is required";
    if (!dob) newErrors.dob = "Date of birth is required";
    if (!whatsappNumber.trim()) {
      newErrors.whatsappNumber = "WhatsApp number is required";
    } else if (!/^\d{10}$/.test(whatsappNumber.replace(/\D/g, ""))) {
      newErrors.whatsappNumber = "Enter a valid 10-digit number";
    }
    if (!email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Enter a valid email";
    if (!gender) newErrors.gender = "Please select gender";
    if (!collegeOrWorking) newErrors.collegeOrWorking = "Please select one option";
    if (collegeOrWorking === "Working" && !companyName.trim())
      newErrors.companyName = "Company name is required";
    if (collegeOrWorking === "College" && !college.trim())
      newErrors.college = "College name is required";
    if (
      collegeOrWorking === "College" &&
      college === "Other College" &&
      !otherCollege.trim()
    ) {
      newErrors.college = "Please enter your college name";
    }
    if (collegeOrWorking === "College" && !course.trim())
      newErrors.course = "Course is required";
    if (collegeOrWorking === "College" && !year) newErrors.year = "Year is required";
    if (!slot) newErrors.slot = "Please select your slot";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    const finalFormData = {
      ...formData,
      college:
        formData.collegeOrWorking === "College" &&
        formData.college === "Other College"
          ? otherCollege
          : formData.college,
    };

    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      // Amount in paise for Razorpay
      const amountInPaise = 49 * 100;

      const orderRes = await fetch(`${API_BASE}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInPaise, formData: finalFormData }),
      });
      const orderData = await orderRes.json();
      if (!orderData.id) throw new Error("Order creation failed");

      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: "INR",
        name: "Krishna Pulse Youth Fest",
        description: "Registration Fee",
        order_id: orderData.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                formData: {
                  ...finalFormData,
                  paymentMethod: "Online",
                  receipt: `receipt_${Date.now()}`,
                },
              }),
            });
            const result = await verifyRes.json();

            if (
              result.message === "success" ||
              result.message === "Already Registered"
            ) {
              toast({
                title: "Registration Successful!",
                description: "Your registration is confirmed.",
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "top-right",
              });
              navigate(`/thankyou/${response.razorpay_payment_id}`);
            } else {
              throw new Error(result.message);
            }
          } catch (err) {
            toast({
              title: "Payment verification failed",
              description: err.message || "Try again later",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          } finally {
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: finalFormData.name,
          email: finalFormData.email,
          contact: `91${finalFormData.whatsappNumber}`,
        },
        theme: { color: "#0FB6A6" },
        modal: {
          ondismiss: () => setIsSubmitting(false),
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast({
          title: "Payment failed",
          description:
            response.error && response.error.description
              ? response.error.description
              : "Try again later",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (err) {
      toast({
        title: "Payment failed",
        description: err.message || "Try again later",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
    }
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? "#0FB6A6" : "rgba(0,0,0,0.12)",
      borderWidth: "1.5px",
      borderRadius: "8px",
      minHeight: "44px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(15,182,166,0.25)" : "none",
      "&:hover": { borderColor: "#4CD9CB" },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#0FB6A6"
        : state.isFocused
        ? "#E5FBF8"
        : "white",
      color: state.isSelected ? "white" : "#221C33",
    }),
    menu: (base) => ({ ...base, zIndex: 20 }),
  };

  const facts = [
    { label: "Cultural Events", icon: "🎭" },
    { label: "Youth Connect", icon: "🫶" },
    { label: "2-Hour Experience", icon: "⏱️" },
    { label: "Entry ₹49", icon: "🎟️" },
  ];

  return (
    <Box bg="night.900" minH="100vh">
      {/* ── Hero ─────────────────────────────────────────── */}
      <Box
        position="relative"
        overflow="hidden"
        bgGradient="linear(to-b, night.800, night.900)"
        pt={{ base: 12, md: 16 }}
        pb={{ base: 24, md: 28 }}
        px={4}
      >
        {/* peacock-eye glow blobs */}
        <Box
          className="kp-blob"
          position="absolute"
          top="-80px"
          left="-60px"
          w="320px"
          h="320px"
          bgGradient="radial(peacock.400, transparent 70%)"
          filter="blur(20px)"
          opacity={0.5}
          pointerEvents="none"
        />
        <Box
          className="kp-blob"
          position="absolute"
          bottom="-40px"
          right="-50px"
          w="300px"
          h="300px"
          bgGradient="radial(lotus.400, transparent 70%)"
          filter="blur(20px)"
          opacity={0.45}
          pointerEvents="none"
        />

        <Container maxW="3xl" position="relative" textAlign="center">
          <Text
            fontSize="xs"
            letterSpacing="0.32em"
            fontWeight={700}
            color="peacock.300"
            textTransform="uppercase"
            mb={6}
          >
            Hare Krishna Movement · Visakhapatnam
          </Text>

          <Box
            className="kp-float"
            mx="auto"
            mb={6}
            boxSize={{ base: "104px", md: "120px" }}
            borderRadius="full"
            overflow="hidden"
            border="3px solid"
            borderColor="marigold.400"
            boxShadow="0 0 40px -8px rgba(255,176,32,0.6)"
          >
            <Image
              src={image12}
              alt="Krishna Pulse"
              objectFit="cover"
              w="100%"
              h="100%"
            />
          </Box>

          <Heading
            as="h1"
            fontWeight={800}
            lineHeight={0.95}
            letterSpacing="-0.02em"
            color="white"
            fontSize={{ base: "5xl", md: "7xl" }}
          >
            Krishna{" "}
            <Box
              as="span"
              bgGradient="linear(to-r, marigold.400, saffron.500, lotus.400)"
              bgClip="text"
            >
              Pulse
            </Box>
          </Heading>
          <Text
            mt={2}
            fontWeight={700}
            letterSpacing="0.18em"
            textTransform="uppercase"
            color="whiteAlpha.800"
            fontSize={{ base: "sm", md: "md" }}
          >
            Youth Festival
          </Text>
          <Text mt={4} color="whiteAlpha.700" fontSize={{ base: "md", md: "lg" }}>
            A Fest of Fun, Faith &amp; Freedom
          </Text>

          {/* signature pulse waveform */}
          <Box mt={8} mx="auto" maxW="520px" opacity={0.9}>
            <svg
              className="kp-pulse-line"
              viewBox="0 0 520 60"
              fill="none"
              width="100%"
              height="48"
              aria-hidden="true"
            >
              <path
                d="M0 30 H120 l12 -22 l14 44 l12 -34 l10 22 H300 l14 -28 l12 44 l10 -28 H520"
                stroke="url(#kpgrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="kpgrad" x1="0" y1="0" x2="520" y2="0">
                  <stop offset="0" stopColor="#0FB6A6" />
                  <stop offset="0.5" stopColor="#FFB020" />
                  <stop offset="1" stopColor="#F2478B" />
                </linearGradient>
              </defs>
            </svg>
          </Box>
        </Container>
      </Box>

      {/* ── Registration pass ────────────────────────────── */}
      <Container maxW="2xl" px={4} pb={16} mt={{ base: -16, md: -20 }}>
        {/* fact strip */}
        <SimpleGrid
          columns={{ base: 2, md: 4 }}
          spacing={3}
          mb={6}
          position="relative"
          zIndex={1}
        >
          {facts.map((f) => (
            <VStack
              key={f.label}
              bg="whiteAlpha.900"
              backdropFilter="blur(6px)"
              borderRadius="xl"
              py={3}
              spacing={1}
              boxShadow="0 8px 24px -16px rgba(0,0,0,0.6)"
            >
              <Text fontSize="xl">{f.icon}</Text>
              <Text fontSize="xs" fontWeight={700} color="night.700">
                {f.label}
              </Text>
            </VStack>
          ))}
        </SimpleGrid>

        <Box
          bg="cream"
          borderRadius="2xl"
          overflow="hidden"
          boxShadow="0 30px 60px -25px rgba(12,9,33,0.7)"
        >
          {/* pass top accent */}
          <Box h="6px" bgGradient="linear(to-r, peacock.500, marigold.400, lotus.400)" />

          <Box px={{ base: 6, md: 10 }} pt={8} pb={4} textAlign="center">
            <Heading size="lg" color="night.800" letterSpacing="-0.01em">
              Claim your pass
            </Heading>
            <Text color="night.500" mt={2} fontSize="sm">
              <Text as="span" color="lotus.500">
                *
              </Text>{" "}
              indicates a required field
            </Text>
          </Box>

          <Box px={{ base: 6, md: 10 }} pb={10}>
            <VStack spacing={5} align="stretch">
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>
                  Name{" "}
                  <Text as="span" color="lotus.500">
                    *
                  </Text>
                </FormLabel>
                <Input
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.dob}>
                <FormLabel>
                  Date of Birth{" "}
                  <Text as="span" color="lotus.500">
                    *
                  </Text>
                </FormLabel>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                />
                <FormErrorMessage>{errors.dob}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.whatsappNumber}>
                <FormLabel>
                  WhatsApp Number{" "}
                  <Text as="span" color="lotus.500">
                    *
                  </Text>
                </FormLabel>
                <InputGroup>
                  <InputLeftAddon
                    bg="night.50"
                    borderColor="blackAlpha.200"
                    color="night.700"
                    fontWeight={600}
                  >
                    +91
                  </InputLeftAddon>
                  <Input
                    type="tel"
                    placeholder="Your WhatsApp number"
                    value={formData.whatsappNumber}
                    onChange={(e) =>
                      handleInputChange("whatsappNumber", e.target.value)
                    }
                  />
                </InputGroup>
                <FormErrorMessage>{errors.whatsappNumber}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel>
                  Email{" "}
                  <Text as="span" color="lotus.500">
                    *
                  </Text>
                </FormLabel>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.gender}>
                <FormLabel>
                  Gender{" "}
                  <Text as="span" color="lotus.500">
                    *
                  </Text>
                </FormLabel>
                <RadioGroup
                  value={formData.gender}
                  onChange={(val) => handleInputChange("gender", val)}
                >
                  <HStack spacing={6}>
                    <Radio value="Male" colorScheme="peacock">
                      Male
                    </Radio>
                    <Radio value="Female" colorScheme="peacock">
                      Female
                    </Radio>
                  </HStack>
                </RadioGroup>
                <FormErrorMessage>{errors.gender}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.collegeOrWorking}>
                <FormLabel>
                  College / Working Professional{" "}
                  <Text as="span" color="lotus.500">
                    *
                  </Text>
                </FormLabel>
                <ChakraSelect
                  placeholder="--Select--"
                  value={formData.collegeOrWorking}
                  onChange={(e) =>
                    handleInputChange("collegeOrWorking", e.target.value)
                  }
                >
                  <option value="College">College</option>
                  <option value="Working">Working</option>
                </ChakraSelect>
                <FormErrorMessage>{errors.collegeOrWorking}</FormErrorMessage>
              </FormControl>

              {formData.collegeOrWorking === "Working" && (
                <FormControl isInvalid={!!errors.companyName}>
                  <FormLabel>
                    Company Name{" "}
                    <Text as="span" color="lotus.500">
                      *
                    </Text>
                  </FormLabel>
                  <Input
                    placeholder="Your company name"
                    value={formData.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                  />
                  <FormErrorMessage>{errors.companyName}</FormErrorMessage>
                </FormControl>
              )}

              {formData.collegeOrWorking === "College" && (
                <FormControl isInvalid={!!errors.college}>
                  <FormLabel>
                    College Name{" "}
                    <Text as="span" color="lotus.500">
                      *
                    </Text>
                  </FormLabel>
                  <Box>
                    <Select
                      options={collegeOptions}
                      value={collegeOptions.find(
                        (opt) => opt.value === formData.college
                      )}
                      onChange={(option) => {
                        handleInputChange("college", option?.value || "");
                      }}
                      placeholder="Select your college"
                      isClearable
                      styles={customSelectStyles}
                    />
                  </Box>

                  {formData.college === "Other College" && (
                    <Input
                      mt={2}
                      placeholder="Enter your college name"
                      value={otherCollege}
                      onChange={(e) => setOtherCollege(e.target.value)}
                    />
                  )}
                  <FormErrorMessage>{errors.college}</FormErrorMessage>
                </FormControl>
              )}

              {formData.collegeOrWorking === "College" && (
                <FormControl isInvalid={!!errors.course}>
                  <FormLabel>
                    Course{" "}
                    <Text as="span" color="lotus.500">
                      *
                    </Text>
                  </FormLabel>
                  <Input
                    placeholder="e.g., B.Tech, MBA"
                    value={formData.course}
                    onChange={(e) => handleInputChange("course", e.target.value)}
                  />
                  <FormErrorMessage>{errors.course}</FormErrorMessage>
                </FormControl>
              )}

              {formData.collegeOrWorking === "College" && (
                <FormControl isInvalid={!!errors.year}>
                  <FormLabel>
                    Year{" "}
                    <Text as="span" color="lotus.500">
                      *
                    </Text>
                  </FormLabel>
                  <ChakraSelect
                    placeholder="--Select Year--"
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                  >
                    <option value="1">1st</option>
                    <option value="2">2nd</option>
                    <option value="3">3rd</option>
                    <option value="4">4th</option>
                  </ChakraSelect>
                  <FormErrorMessage>{errors.year}</FormErrorMessage>
                </FormControl>
              )}

              <FormControl isInvalid={!!errors.slot}>
                <FormLabel>
                  Slot{" "}
                  <Text as="span" color="lotus.500">
                    *
                  </Text>
                </FormLabel>
                <Select
                  options={slotOptions}
                  value={slotOptions.find((opt) => opt.value === formData.slot)}
                  onChange={(option) =>
                    handleInputChange("slot", option?.value || "")
                  }
                  placeholder="Select your slot"
                  isClearable
                  styles={customSelectStyles}
                />
                <FormErrorMessage>{errors.slot}</FormErrorMessage>
              </FormControl>

              <Button
                onClick={handlePayment}
                isLoading={isSubmitting}
                loadingText="Processing"
                variant="pulse"
                size="lg"
                py={7}
                w="full"
                isDisabled={isSubmitting}
                type="button"
                mt={2}
              >
                Register now — ₹49
              </Button>

              <Text textAlign="center" fontSize="sm" color="night.500">
                Questions? Write to{" "}
                <Text
                  as="a"
                  href="mailto:krishnapulse@gmail.com"
                  color="peacock.600"
                  fontWeight={600}
                  textDecoration="underline"
                >
                  krishnapulse@gmail.com
                </Text>
              </Text>
            </VStack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Main;
