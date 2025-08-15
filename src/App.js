import React from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  Link,
  VStack,
  Code,
  Grid,
  theme,
} from '@chakra-ui/react';

import Main from './Main';
import {Routes,Route} from 'react-router-dom'
import CollegeManager from './CollegeManager';
import ThankYou from './ThankYou';
import Attendence from './Attendence';
import CandidateExport from './CandidateExport';
import AttendanceList from './AttendanceList';
import AdminQrScanner from './AdminQrScanner';
import AdminAttendanceScannedList from './AdminAttendanceScannedList';
import Login from './Login';
import Register from './Register';
import ProtectedRoute from './component/ProtectedRoute';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Routes>
      <Route path='/' element={<Main/>}/>
      <Route path='/admin/adminqrscanner' element={
        <ProtectedRoute allowedRoles={["user", "admin"]}>
          <AdminQrScanner/>
        </ProtectedRoute>
      } />
      <Route path='/admin/AdminAttendanceScannedList' element={
        <ProtectedRoute allowedRoles={["user", "admin"]}>
          <AdminAttendanceScannedList/>
        </ProtectedRoute>
      } />
     
      <Route path='/admin/college' element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <CollegeManager/>
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
