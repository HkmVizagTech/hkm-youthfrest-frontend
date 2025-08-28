import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Spinner,
  useToast,
  Divider,
  Icon,
  SimpleGrid,
  Stack,
  useColorModeValue,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
  InputGroup,
  InputLeftElement,
  ButtonGroup
} from '@chakra-ui/react';
import { 
  FaCertificate, 
  FaUsers, 
  FaCheckCircle, 
  FaClock, 
  FaSync, 
  FaPaperPlane,
  FaGraduationCap,
  FaEnvelope,
  FaWhatsapp,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFilter
} from 'react-icons/fa';

const SendCertificate = () => {
  const [allCandidates, setAllCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [displayedCandidates, setDisplayedCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [collegeFilter, setCollegeFilter] = useState('');
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const API_BASE_URL = 'https://hkm-youtfrest-backend-razorpay-882278565284.asia-south1.run.app/users';


  const safeToLowerCase = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).toLowerCase();
  };


  const safeToString = (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  useEffect(() => {
    fetchEligibleCandidates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allCandidates, searchTerm, statusFilter, collegeFilter]);

  useEffect(() => {
    updateDisplayedCandidates();
  }, [filteredCandidates, currentPage, itemsPerPage]);

  const fetchEligibleCandidates = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching eligible candidates...');
      
      const response = await fetch(`${API_BASE_URL}/eligible-for-certificate`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.status === 'success') {
      
        const cleanedCandidates = data.candidates.map(candidate => ({
          ...candidate,
          name: candidate.name || 'Unknown',
          email: candidate.email || 'No email',
          college: candidate.college || 'Unknown College',
          course: candidate.course || 'Unknown Course',
          whatsappNumber: candidate.whatsappNumber || 'No number',
          gender: candidate.gender || 'Not specified'
        }));
        
        setAllCandidates(cleanedCandidates);
        setSummary(data.summary);
        console.log(`Loaded ${cleanedCandidates.length} eligible candidates`);
        
        
        setCurrentPage(1);
      } else {
        setError(data.message || 'Failed to fetch candidates');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Error fetching eligible candidates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    try {
      let filtered = [...allCandidates];

   
      if (searchTerm && searchTerm.trim()) {
        const searchTermLower = searchTerm.toLowerCase().trim();
        
        filtered = filtered.filter(candidate => {
          if (!candidate) return false;
          
          const name = safeToLowerCase(candidate.name);
          const email = safeToLowerCase(candidate.email);
          const college = safeToLowerCase(candidate.college);
          const course = safeToLowerCase(candidate.course);
          const whatsappNumber = safeToString(candidate.whatsappNumber);
          
          return (
            name.includes(searchTermLower) ||
            email.includes(searchTermLower) ||
            college.includes(searchTermLower) ||
            course.includes(searchTermLower) ||
            whatsappNumber.includes(searchTerm)
          );
        });
      }

      if (statusFilter === 'sent') {
        filtered = filtered.filter(candidate => candidate && candidate.certificateSent === true);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(candidate => candidate && candidate.certificateSent !== true);
      }

      if (collegeFilter && collegeFilter.trim()) {
        const collegeFilterLower = collegeFilter.toLowerCase().trim();
        filtered = filtered.filter(candidate => {
          if (!candidate) return false;
          const college = safeToLowerCase(candidate.college);
          return college.includes(collegeFilterLower);
        });
      }

      setFilteredCandidates(filtered);
      setCurrentPage(1); 
    } catch (error) {
      console.error('Error in applyFilters:', error);
      setError('Error filtering candidates: ' + error.message);
    }
  };

  const updateDisplayedCandidates = () => {
    try {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const displayed = filteredCandidates.slice(startIndex, endIndex);
      
      setDisplayedCandidates(displayed);
      setTotalPages(Math.ceil(filteredCandidates.length / itemsPerPage));
    } catch (error) {
      console.error('Error in updateDisplayedCandidates:', error);
      setError('Error updating displayed candidates: ' + error.message);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    
      document.getElementById('candidates-section')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    const pendingDisplayedCandidates = displayedCandidates
      .filter(c => c && !c.certificateSent)
      .map(c => c._id)
      .filter(id => id); 
    
    if (pendingDisplayedCandidates.every(id => selectedCandidates.includes(id))) {
     
      setSelectedCandidates(prev => 
        prev.filter(id => !pendingDisplayedCandidates.includes(id))
      );
    } else {
    
      setSelectedCandidates(prev => [
        ...prev.filter(id => !pendingDisplayedCandidates.includes(id)),
        ...pendingDisplayedCandidates
      ]);
    }
  };

  const handleSelectAllPages = () => {
    const allPendingCandidates = filteredCandidates
      .filter(c => c && !c.certificateSent)
      .map(c => c._id)
      .filter(id => id);
    
    if (allPendingCandidates.every(id => selectedCandidates.includes(id))) {
    
      setSelectedCandidates([]);
    } else {
      
      setSelectedCandidates(allPendingCandidates);
    }
  };

  const handleCandidateSelect = (candidateId) => {
    if (!candidateId) return;
    
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCollegeFilter('');
    setCurrentPage(1);
  };

  const sendCertificates = async (candidateIds = null) => {
    try {
      setLoading(true);
      setError('');
      setResults(null);

      const payload = candidateIds ? { candidateIds } : {};
      console.log('Sending certificates with payload:', payload);
      
      const response = await fetch(`${API_BASE_URL}/send-certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Send certificates response:', data);
      
      if (data.status === 'completed') {
        setResults(data);
        toast({
          title: "Certificates Sent!",
          description: `Successfully sent ${data.summary.successful} certificates`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        await fetchEligibleCandidates();
        setSelectedCandidates([]);
      } else {
        setError(data.message || 'Failed to send certificates');
      }
    } catch (err) {
      console.error('Send certificates error:', err);
      setError('Error sending certificates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const sendSingleCertificate = async (candidateId, candidateName) => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`Sending certificate to ${candidateName} (${candidateId})`);
      
      const response = await fetch(`${API_BASE_URL}/send-single-certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ candidateId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Single certificate response:', data);
      
     
      if (data.status === 'success' || data.status === 'success-with-warning') {
        toast({
          title: data.status === 'success-with-warning' ? "Certificate Sent (Text Notification)" : "Certificate Sent!",
          description: data.status === 'success-with-warning' 
            ? `Text notification sent to ${candidateName}. Certificate generated but image delivery had technical issues.`
            : `Certificate sent to ${candidateName}`,
          status: data.status === 'success-with-warning' ? "warning" : "success",
          duration: 5000,
          isClosable: true,
        });
        await fetchEligibleCandidates();
      } else if (data.status === 'already-sent') {
        toast({
          title: "Already Sent",
          description: data.message,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      } else {
        setError(data.message || 'Failed to send certificate');
      }
    } catch (err) {
      console.error('Send single certificate error:', err);
      setError('Error sending certificate: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const generateSingleCertificateOnly = async (candidateId, candidateName) => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`Generating certificate for ${candidateName} (${candidateId})`);
      
      const response = await fetch(`${API_BASE_URL}/generate-single-certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ candidateId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Generate single certificate response:', data);

      if (data.status === 'success') {
        toast({
          title: "Certificate Generated",
          description: `Certificate generated for ${candidateName} (stored at ${data.path})`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        setError(data.message || 'Failed to generate certificate');
      }
    } catch (err) {
      console.error('Generate certificate error:', err);
      setError('Error generating certificate: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

 
  const uniqueColleges = [...new Set(
    allCandidates
      .map(c => c && c.college ? c.college : 'Unknown College')
      .filter(college => college && college !== 'Unknown College')
  )].sort();

  return (
    <Container maxW="7xl" py={6}>
      <VStack spacing={6} align="stretch">
       
        <Box textAlign="center">
          <Heading size="lg" color="blue.600" mb={2}>
            <Icon as={FaCertificate} mr={3} />
            Send Certificates
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Send completion certificates to candidates who attended and paid
          </Text>
          <Text fontSize="sm" color="gray.500" mt={2}>
            Connected to: {API_BASE_URL} | User: saikiran11461 | {new Date().toLocaleString()}
          </Text>
        </Box>


        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
            <CloseButton onClick={() => setError('')} />
          </Alert>
        )}

       
        {summary && (
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <StatGroup>
                <Stat textAlign="center">
                  <StatLabel>
                    <Icon as={FaUsers} mr={2} />
                    Total Eligible
                  </StatLabel>
                  <StatNumber color="blue.500">{summary.total}</StatNumber>
                </Stat>
                <Stat textAlign="center">
                  <StatLabel>
                    <Icon as={FaCheckCircle} mr={2} />
                    Certificates Sent
                  </StatLabel>
                  <StatNumber color="green.500">{summary.certificatesSent}</StatNumber>
                </Stat>
                <Stat textAlign="center">
                  <StatLabel>
                    <Icon as={FaClock} mr={2} />
                    Pending Certificates
                  </StatLabel>
                  <StatNumber color="orange.500">{summary.pendingCertificates}</StatNumber>
                </Stat>
                <Stat textAlign="center">
                  <StatLabel>Filtered Results</StatLabel>
                  <StatNumber color="purple.500">{filteredCandidates.length}</StatNumber>
                </Stat>
              </StatGroup>
            </CardBody>
          </Card>
        )}

      
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Stack direction={{ base: 'column', lg: 'row' }} spacing={4}>
              <Button
                leftIcon={<FaPaperPlane />}
                colorScheme="blue"
                size="lg"
                onClick={() => sendCertificates()}
                isLoading={loading}
                loadingText="Sending..."
                isDisabled={!summary || summary.pendingCertificates === 0}
                flex={1}
              >
                Send ALL Pending ({summary?.pendingCertificates || 0})
              </Button>

              <Button
                leftIcon={<FaPaperPlane />}
                colorScheme="green"
                variant="outline"
                size="lg"
                onClick={() => sendCertificates(selectedCandidates)}
                isLoading={loading}
                isDisabled={selectedCandidates.length === 0}
                flex={1}
              >
                Send Selected ({selectedCandidates.length})
              </Button>

              <Button
                leftIcon={<FaSync />}
                variant="outline"
                size="lg"
                onClick={fetchEligibleCandidates}
                isLoading={loading}
              >
                Refresh
              </Button>
            </Stack>
          </CardBody>
        </Card>

      
        <Card bg={cardBg} shadow="md">
          <CardHeader>
            <Heading size="md">
              <Icon as={FaFilter} mr={2} />
              Filters & Search
            </Heading>
          </CardHeader>
          <CardBody>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
              <InputGroup flex={2}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by name, email, college, course, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                flex={1}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Only</option>
                <option value="sent">Sent Only</option>
              </Select>

              <Select
                placeholder="Filter by College"
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                flex={1}
              >
                {uniqueColleges.map(college => (
                  <option key={college} value={college}>{college}</option>
                ))}
              </Select>

              <Button
                onClick={clearFilters}
                variant="outline"
                colorScheme="red"
                size="md"
              >
                Clear
              </Button>
            </Stack>

          
            {(searchTerm || statusFilter !== 'all' || collegeFilter) && (
              <Box mt={4} p={3} bg="blue.50" borderRadius="md">
                <Text fontSize="sm" color="blue.600">
                  <strong>Active Filters:</strong>{' '}
                  {searchTerm && `Search: "${searchTerm}" • `}
                  {statusFilter !== 'all' && `Status: ${statusFilter} • `}
                  {collegeFilter && `College: ${collegeFilter} • `}
                  Showing {filteredCandidates.length} of {allCandidates.length} candidates
                </Text>
              </Box>
            )}
          </CardBody>
        </Card>

    
        {results && (
          <Card bg={cardBg} shadow="md">
            <CardHeader>
              <Heading size="md">📊 Sending Results</Heading>
            </CardHeader>
            <CardBody>
              <HStack spacing={6} mb={4} wrap="wrap">
                <Badge colorScheme="green" p={3} borderRadius="md" fontSize="sm">
                  ✅ Success: {results.summary.successful}
                </Badge>
                <Badge colorScheme="red" p={3} borderRadius="md" fontSize="sm">
                  ❌ Failed: {results.summary.failed}
                </Badge>
                <Badge colorScheme="yellow" p={3} borderRadius="md" fontSize="sm">
                  ⚠️ Already Sent: {results.summary.alreadySent}
                </Badge>
              </HStack>
              
              {results.results.some(r => r.status === 'failed') && (
                <Box mt={4} p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
                  <Heading size="sm" color="red.600" mb={3}>❌ Failed Sends:</Heading>
                  <VStack align="stretch" spacing={2}>
                    {results.results
                      .filter(r => r.status === 'failed')
                      .map(result => (
                        <Box key={result.candidateId} p={2} bg="white" borderRadius="md">
                          <Text color="red.600" fontSize="sm">
                            <strong>{result.name || 'Unknown'}</strong> ({result.whatsappNumber || 'No number'})
                          </Text>
                          <Text color="red.500" fontSize="xs">{result.error}</Text>
                        </Box>
                      ))}
                  </VStack>
                </Box>
              )}
            </CardBody>
          </Card>
        )}

       
        <Card bg={cardBg} shadow="md" id="candidates-section">
          <CardHeader>
            <Flex justify="space-between" align="center" wrap="wrap">
              <VStack align="start" spacing={1}>
                <Heading size="md">
                  <Icon as={FaUsers} mr={2} />
                  Candidates ({filteredCandidates.length})
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  Page {currentPage} of {totalPages} • Showing {displayedCandidates.length} candidates
                </Text>
              </VStack>
              
              <Stack direction={{ base: 'column', md: 'row' }} spacing={2}>
                {filteredCandidates.filter(c => c && !c.certificateSent).length > 0 && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSelectAll}
                    >
                      {displayedCandidates.filter(c => c && !c.certificateSent).every(c => selectedCandidates.includes(c._id))
                        ? 'Deselect Page' 
                        : 'Select Page'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      onClick={handleSelectAllPages}
                    >
                      {filteredCandidates.filter(c => c && !c.certificateSent).every(c => selectedCandidates.includes(c._id))
                        ? 'Deselect All Pages' 
                        : 'Select All Pages'}
                    </Button>
                  </>
                )}
              </Stack>
            </Flex>
          </CardHeader>
          
          <CardBody>
       
            {totalPages > 1 && (
              <Flex justify="space-between" align="center" mb={6} wrap="wrap">
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.600">Show:</Text>
                  <Select
                    size="sm"
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    width="auto"
                  >
                    <option value={6}>6 per page</option>
                    <option value={12}>12 per page</option>
                    <option value={24}>24 per page</option>
                    <option value={50}>50 per page</option>
                  </Select>
                </HStack>

                <ButtonGroup size="sm" isAttached variant="outline">
                  <Button
                    onClick={() => handlePageChange(1)}
                    isDisabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    leftIcon={<FaChevronLeft />}
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                  >
                    Prev
                  </Button>
                  
               
                  {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = index + 1;
                    } else if (currentPage <= 3) {
                      pageNum = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + index;
                    } else {
                      pageNum = currentPage - 2 + index;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        colorScheme={currentPage === pageNum ? "blue" : "gray"}
                        variant={currentPage === pageNum ? "solid" : "outline"}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    rightIcon={<FaChevronRight />}
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    onClick={() => handlePageChange(totalPages)}
                    isDisabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </ButtonGroup>
              </Flex>
            )}

            {loading && (
              <Flex justify="center" py={10}>
                <VStack>
                  <Spinner size="xl" color="blue.500" />
                  <Text fontSize="lg" color="blue.500">Loading candidates...</Text>
                </VStack>
              </Flex>
            )}

            {!loading && filteredCandidates.length === 0 && (
              <Box textAlign="center" py={10}>
                <Icon as={FaGraduationCap} boxSize={16} color="gray.400" mb={4} />
                <Heading size="md" color="gray.500" mb={2}>
                  No Candidates Found
                </Heading>
                <Text color="gray.500" mb={4}>
                  {allCandidates.length === 0 
                    ? "There are no candidates who have both attended and completed payment."
                    : "No candidates match your current filters."
                  }
                </Text>
                <Stack direction="row" spacing={4} justify="center">
                  <Button leftIcon={<FaSync />} onClick={fetchEligibleCandidates} variant="outline">
                    Refresh Data
                  </Button>
                  {(searchTerm || statusFilter !== 'all' || collegeFilter) && (
                    <Button onClick={clearFilters} colorScheme="blue" variant="outline">
                      Clear Filters
                    </Button>
                  )}
                </Stack>
              </Box>
            )}

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {displayedCandidates.map(candidate => {
               
                if (!candidate || !candidate._id) return null;
                
                return (
                  <Card 
                    key={candidate._id} 
                    variant="outline" 
                    borderColor={borderColor}
                    _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                    transition="all 0.2s"
                    bg={candidate.certificateSent ? "green.50" : "white"}
                  >
                    <CardHeader pb={2}>
                      <Flex justify="space-between" align="flex-start">
                        <Box flex={1}>
                          <Heading size="sm" mb={1} color={candidate.certificateSent ? "green.700" : "gray.800"}>
                            {candidate.name || 'Unknown Name'}
                          </Heading>
                          <Text fontSize="sm" color="gray.600" mb={1} noOfLines={1}>
                            <Icon as={FaGraduationCap} mr={1} />
                            {candidate.college || 'Unknown College'}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {candidate.course || 'Unknown Course'} • {candidate.gender || 'Not specified'}
                          </Text>
                        </Box>
                        <Badge 
                          colorScheme={candidate.certificateSent ? "green" : "orange"}
                          variant="solid"
                          fontSize="xs"
                        >
                          {candidate.certificateSent ? "✅ Sent" : "⏳ Pending"}
                        </Badge>
                      </Flex>
                    </CardHeader>

                    <CardBody pt={0}>
                      <VStack align="stretch" spacing={3}>
                        <Box>
                          <Text fontSize="xs" color="gray.500" fontWeight="bold">Contact:</Text>
                          <Text fontSize="sm" noOfLines={1} title={candidate.email || 'No email'}>
                            <Icon as={FaEnvelope} mr={1} />
                            {candidate.email || 'No email'}
                          </Text>
                          <Text fontSize="sm">
                            <Icon as={FaWhatsapp} mr={1} color="green.500" />
                            {candidate.whatsappNumber || 'No number'}
                          </Text>
                        </Box>

                        <Divider />

                        <Box>
                          <Text fontSize="xs" color="gray.500" fontWeight="bold">Timeline:</Text>
                          <Text fontSize="sm">
                            <strong>Attended:</strong> {
                              candidate.attendanceDate 
                                ? new Date(candidate.attendanceDate).toLocaleDateString()
                                : 'Unknown date'
                            }
                          </Text>
                          {candidate.certificateSent && candidate.certificateSentDate && (
                            <Text fontSize="sm" color="green.600">
                              <strong>Certificate Sent:</strong> {new Date(candidate.certificateSentDate).toLocaleDateString()}
                            </Text>
                          )}
                        </Box>

                        {!candidate.certificateSent && (
                          <VStack spacing={3}>
                            <Checkbox
                              isChecked={selectedCandidates.includes(candidate._id)}
                              onChange={() => handleCandidateSelect(candidate._id)}
                              colorScheme="blue"
                              size="sm"
                              width="full"
                            >
                              <Text fontSize="sm">Select for batch send</Text>
                            </Checkbox>
                            
                            <Button
                              leftIcon={<FaPaperPlane />}
                              colorScheme="blue"
                              size="sm"
                              width="full"
                              onClick={() => sendSingleCertificate(candidate._id, candidate.name || 'Unknown')}
                              isLoading={loading}
                              loadingText="Sending..."
                            >
                              Send Certificate
                            </Button>
                          
                            <Button
                              leftIcon={<FaCertificate />}
                              colorScheme="purple"
                              variant="outline"
                              size="sm"
                              width="full"
                              onClick={() => generateSingleCertificateOnly(candidate._id, candidate.name || 'Unknown')}
                              isLoading={loading}
                              loadingText="Generating..."
                            >
                              Generate Only
                            </Button>
                          </VStack>
                        )}

                        {candidate.certificateSent && (
                          <Box 
                            bg="green.100" 
                            p={3} 
                            borderRadius="md" 
                            textAlign="center"
                            border="1px solid"
                            borderColor="green.300"
                          >
                            <Text fontSize="sm" color="green.700" fontWeight="bold">
                              📜 Certificate sent successfully!
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>

      
            {totalPages > 1 && (
              <Flex justify="center" mt={8}>
                <ButtonGroup size="md" isAttached variant="outline">
                  <Button
                    onClick={() => handlePageChange(1)}
                    isDisabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    leftIcon={<FaChevronLeft />}
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <Box px={4} py={2} bg="gray.100" display="flex" alignItems="center">
                    <Text fontSize="sm" fontWeight="medium">
                      Page {currentPage} of {totalPages}
                    </Text>
                  </Box>

                  <Button
                    rightIcon={<FaChevronRight />}
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    onClick={() => handlePageChange(totalPages)}
                    isDisabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </ButtonGroup>
              </Flex>
            )}

           
            {selectedCandidates.length > 0 && (
              <Box mt={6} p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                <Text color="blue.700" fontSize="sm" fontWeight="medium">
                  📋 Selected {selectedCandidates.length} candidates for batch certificate sending
                </Text>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default SendCertificate;