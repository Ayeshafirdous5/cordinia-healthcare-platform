import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AppLayout from '../layouts/AppLayout';

// Pages
import LandingPage from '../pages/public/LandingPage';
import NotFoundPage from '../pages/public/NotFoundPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import NurseDashboard from '../pages/nurse/NurseDashboard';
import PatientDashboard from '../pages/patient/PatientDashboard';
import PatientAccess from '../pages/patient/PatientAccess';
import HospitalRegister from '../pages/hospital/HospitalRegister';
import HospitalWorkspace from '../pages/hospital/HospitalWorkspace';
import HospitalStructure from '../pages/hospital/HospitalStructure';
import ClinicalStaff from '../pages/hospital/ClinicalStaff';
import PatientManagement from '../pages/hospital/PatientManagement';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/hospital/register" element={<HospitalRegister />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Workspaces & Role Views */}
      <Route element={<AppLayout />}>
        <Route path="/hospital/workspace" element={<HospitalWorkspace />} />
        <Route path="/hospital/structure" element={<HospitalStructure />} />
        <Route path="/hospital/staff" element={<ClinicalStaff />} />
        <Route path="/hospital/patients" element={<PatientManagement />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/nurse" element={<NurseDashboard />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/access" element={<PatientAccess />} />
      </Route>
    </Routes>
  );
}
