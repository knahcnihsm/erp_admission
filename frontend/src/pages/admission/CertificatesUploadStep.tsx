import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Button,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
} from '@mui/material';
import { UploadCloud, Eye, Trash2, CheckCircle2, Download } from 'lucide-react';
import { useAdmission } from '../../context/AdmissionContext';
import { useThemeContext } from '../../context/ThemeContext';
import { AppCard } from '../../components/ui/AppCard';
import { CertificateItem } from '../../types';

import { handleFormEnterKeyDown } from '../../utils/enterKeyNavigation';
import { resolveFileUrl, downloadFile } from '../../api/client';

export const CertificatesUploadStep: React.FC<{ onSave: () => void }> = ({ onSave }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { draftStudent, updateDraftSection, isViewReadOnly } = useAdmission();

  const [certificates, setCertificates] = useState<CertificateItem[]>(
    draftStudent.certificates || []
  );

  const [previewCert, setPreviewCert] = useState<{ name: string; url: string } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // Keep uploaded/checked certificates synchronized with the shared draft so
  // unsaved changes survive navigating between sidebar sections.
  useEffect(() => {
    updateDraftSection('certificates', certificates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificates]);

  const truncateFileName = (name: string, maxLen: number = 18): string => {
    if (!name) return '';
    if (name.length <= maxLen) return name;
    const extIdx = name.lastIndexOf('.');
    if (extIdx !== -1 && name.length - extIdx <= 5) {
      const ext = name.slice(extIdx);
      const base = name.slice(0, extIdx);
      return base.slice(0, maxLen - ext.length - 3) + '...' + ext;
    }
    return name.slice(0, maxLen - 3) + '...';
  };

  const handleFileUpload = (id: string, file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const isValidExt = ['.pdf', '.jpg', '.jpeg', '.png'].includes(fileExt);

    if (!validTypes.includes(file.type) && !isValidExt) {
      setUploadErrors((prev) => ({
        ...prev,
        [id]: 'Only PDF, JPG, JPEG and PNG files up to 10 MB are allowed.',
      }));
      return;
    }

    // Validate size (10 MB = 10 * 1024 * 1024 bytes)
    if (file.size > 10 * 1024 * 1024) {
      setUploadErrors((prev) => ({
        ...prev,
        [id]: 'Only PDF, JPG, JPEG and PNG files up to 10 MB are allowed.',
      }));
      return;
    }

    // Clear error on successful validation
    setUploadErrors((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    const objectUrl = URL.createObjectURL(file);
    setCertificates((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              received: true,
              file,
              fileName: file.name,
              uploadedAt: new Date().toISOString().split('T')[0],
            }
          : c
      )
    );
    return () => URL.revokeObjectURL(objectUrl);
  };

  const resolvePreviewUrl = (cert: CertificateItem): string | null => {
    if (cert.file instanceof File) return URL.createObjectURL(cert.file);
    if (typeof cert.file === 'string') return resolveFileUrl(cert.file);
    return null;
  };

  const handleDownload = async (cert: CertificateItem) => {
    if (cert.file instanceof File) {
      const url = URL.createObjectURL(cert.file);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = cert.fileName || cert.file.name || 'document';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      return;
    }
    if (typeof cert.file === 'string') {
      try {
        await downloadFile(cert.file, cert.fileName);
      } catch {
        // ignore; snackbar elsewhere
      }
    }
  };

  const handleRemoveFile = (id: string) => {
    if (isViewReadOnly) return;
    if (window.confirm('Are you sure you want to remove this certificate file?')) {
      setCertificates((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, received: false, file: undefined, fileName: undefined, uploadedAt: undefined }
            : c
        )
      );
      setUploadErrors((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const receivedCount = certificates.filter((c) => c.received).length;
  const uploadedCount = certificates.filter((c) => c.file).length;
  const pendingCount = certificates.length - uploadedCount;
  const progressPct = certificates.length > 0 ? (uploadedCount / certificates.length) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateDraftSection('certificates', certificates);
    await onSave();
  };

  return (
    <Box
      component="form"
      id="wizard-step-form"
      onSubmit={handleSubmit}
      autoComplete="off"
      onKeyDown={(e) => handleFormEnterKeyDown(e, async () => { updateDraftSection('certificates', certificates); await onSave(); })}
    >
      {/* Hidden dummy inputs to trap Chrome profile autofill */}
      <input type="text" name="prevent_autofill_user" id="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      <input type="password" name="prevent_autofill_pass" id="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <AppCard>
        <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0D47A1', marginBottom: '4px', fontSize: '22px' }}>
          Certificates & Document Verification
        </Typography>
        <Typography sx={{ color: isDark ? '#CBD5E1' : '#667085', marginBottom: '24px', fontSize: '14px' }}>
          Verify received physical certificates and upload digitized PDF/Image documents.
        </Typography>

        <Table sx={{ border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`, borderRadius: '8px', overflow: 'hidden' }}>
          <TableHead sx={{ backgroundColor: isDark ? '#0F172A' : '#F5F8FC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0D47A1', width: '90px', fontSize: '14px', padding: '10px 14px' }}>Received</TableCell>
              <TableCell sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0D47A1', fontSize: '14px', padding: '10px 14px' }}>Certificate Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0D47A1', width: '240px', fontSize: '14px', padding: '10px 14px' }}>Upload File</TableCell>
              <TableCell sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0D47A1', width: '240px', fontSize: '14px', padding: '10px 14px' }}>Actions / Preview</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((cert) => (
              <TableRow key={cert.id} hover>
                <TableCell sx={{ padding: '8px 14px' }}>
                  <Checkbox
                    checked={cert.received}
                    disabled // Enabled/checked automatically by file upload, read-only to user
                    color="primary"
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: isDark ? '#FFFFFF' : '#1A2B49', fontSize: '13px', padding: '8px 14px' }}>
                  {cert.name}
                </TableCell>
                <TableCell sx={{ padding: '8px 14px' }}>
                  {cert.file ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#16A34A" />
                      <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#16A34A' }}>
                        {truncateFileName(cert.fileName || 'document')}
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Button
                        variant="outlined"
                        component="label"
                        disabled={isViewReadOnly}
                        startIcon={<UploadCloud size={14} />}
                        sx={{ borderRadius: '8px', fontSize: '11.5px', padding: '4px 10px' }}
                      >
                        Choose File
                        <input
                          type="file"
                          hidden
                          accept=".pdf, .jpg, .jpeg, .png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(cert.id, file);
                          }}
                        />
                      </Button>
                      {uploadErrors[cert.id] && (
                        <Typography sx={{ color: '#D32F2F', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>
                          {uploadErrors[cert.id]}
                        </Typography>
                      )}
                    </Box>
                  )}
                </TableCell>
                <TableCell sx={{ padding: '8px 14px' }}>
                  <Box sx={{ display: 'flex', gap: '8px' }}>
                    {cert.file && (
                      <>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => {
                            const url = resolvePreviewUrl(cert);
                            if (url) setPreviewCert({ name: cert.name, url });
                          }}
                          startIcon={<Eye size={12} />}
                          sx={{ color: isDark ? '#38BDF8' : '#0D47A1', fontWeight: 600, fontSize: '12px' }}
                        >
                          Preview
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => handleDownload(cert)}
                          startIcon={<Download size={12} />}
                          sx={{ color: isDark ? '#38BDF8' : '#0D47A1', fontWeight: 600, fontSize: '12px' }}
                        >
                          Download
                        </Button>
                        {!isViewReadOnly && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemoveFile(cert.id)}
                            sx={{ minWidth: '28px' }}
                          >
                            <Trash2 size={12} />
                          </Button>
                        )}
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Upload Progress & Summary Card */}
        <Box sx={{ marginTop: '16px', backgroundColor: isDark ? '#0F172A' : '#F7FAFC', border: `1px solid ${isDark ? '#334155' : '#D8E4F2'}`, padding: '14px 16px', borderRadius: '12px' }}>
          <Typography sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0D47A1', marginBottom: '8px', fontSize: '14px' }}>
            Document Upload Progress: {uploadedCount} / {certificates.length} Completed
          </Typography>
          <LinearProgress variant="determinate" value={progressPct} sx={{ height: 6, borderRadius: 3, marginBottom: '12px' }} />
          <Box sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 600, color: '#16A34A', fontSize: '12px' }}>
              • Received: {receivedCount}
            </Typography>
            <Typography sx={{ fontWeight: 600, color: isDark ? '#38BDF8' : '#0D47A1', fontSize: '12px' }}>
              • Uploaded: {uploadedCount}
            </Typography>
            <Typography sx={{ fontWeight: 600, color: '#F59E0B', fontSize: '12px' }}>
              • Pending: {pendingCount}
            </Typography>
          </Box>
        </Box>
      </AppCard>

      {/* Document Preview Modal */}
      <Dialog
        open={Boolean(previewCert)}
        onClose={() => setPreviewCert(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', backgroundColor: isDark ? '#1E293B' : '#FFFFFF' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0D47A1', fontSize: '15px', padding: '12px 18px' }}>
          Document Preview: {previewCert?.name}
        </DialogTitle>
        <DialogContent sx={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px 18px' }}>
          {previewCert?.url ? (
            <Box
              component="iframe"
              src={previewCert.url}
              sx={{ width: '100%', height: '480px', border: 'none', borderRadius: '8px' }}
            />
          ) : (
            <Typography variant="body2" sx={{ color: '#667085', fontSize: '12px' }}>
              No document available for preview.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
