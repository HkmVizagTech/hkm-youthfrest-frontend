import React from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  Link,
  VStack,
  Code,
  Grid,
} from '@chakra-ui/react';

import Main from './Main';
import theme from './theme';
import {Routes,Route} from 'react-router-dom'
import CollegeManager from './CollegeManager';
import Team from './Team';
import ThankYou from './ThankYou';
import Attendence from './Attendence';
import CandidateExport from './CandidateExport';
import AttendanceList from './AttendanceList';
import AdminQrScanner from './AdminQrScanner';
import AdminAttendanceScannedList from './AdminAttendanceScannedList';
import Login from './Login';
import Register from './Register';
import ProtectedRoute from './component/ProtectedRoute';
import FestivalNotice from './component/FestivalNotice';
import SendCertificate from './component/sendCertificate';
function App() {
  return (
    <ChakraProvider theme={theme}>
      <Routes>
      <Route path='/' element={<Main/>}/>
  <Route path='/send' element={<SendCertificate/>}/>
      <Route path='/admin/adminqrscanner' element={
        <ProtectedRoute allowedRoles={["volunteer", "user", "admin"]}>
          <AdminQrScanner/>
        </ProtectedRoute>
      } />
      <Route path='/admin/AdminAttendanceScannedList' element={
        <ProtectedRoute allowedRoles={["volunteer", "user", "admin"]}>
          <AdminAttendanceScannedList/>
        </ProtectedRoute>
      } />
     
      <Route path='/admin/college' element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <CollegeManager/>
        </ProtectedRoute>
      }/>
      <Route path='/admin/team' element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <Team/>
        </ProtectedRoute>
      }/>
      <Route path='/thankyou/:id' element={
       <ThankYou />
      }/>
      <Route path='/attendance' element={<Attendence/>}/>
      <Route path='/admin' element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <CandidateExport/>
        </ProtectedRoute>
      }/>
      <Route path='/admin/attendance' element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AttendanceList/>
        </ProtectedRoute>
      }/>
      <Route path='/admin/login' element={<Login/>} />
      <Route path='/admin/register' element={<Register/>} />
      </Routes> 
    </ChakraProvider>
  );
}

export default App;
