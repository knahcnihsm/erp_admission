import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { AddAdmission } from '../pages/admission/AddAdmission';
import { ArchivedStudents } from '../pages/archive/ArchivedStudents';
import { ExportPage } from '../pages/export/ExportPage';
import { BulkUpdatePage } from '../pages/bulk/BulkUpdatePage';
import { BulkAddAdmissionPage } from '../pages/bulk/BulkAddAdmissionPage';
import { SettingsPage } from '../pages/settings/Settings';

export const AppRoutes: React.FC = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admission" element={<AddAdmission />} />
        <Route path="/EditStudent" element={<AddAdmission />} />
        <Route path="/archive" element={<ArchivedStudents />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/bulk-update" element={<BulkUpdatePage />} />
        <Route path="/bulk-add-admission" element={<BulkAddAdmissionPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
};

