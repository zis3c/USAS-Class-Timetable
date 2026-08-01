import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import LoginForm from './components/LoginForm';
import TimetableGrid from './components/TimetableGrid';
import PdfExportModal from './components/PdfExportModal';
import ExamScheduleModal from './components/ExamScheduleModal';
import QrShareModal from './components/QrShareModal';
import ToolsDrawer from './components/ToolsDrawer';

function MainContent() {
  const { session, timetableData } = useAuth();
  
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-[#060E1F] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 antialiased">
      <Navbar 
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
      />
      
      <main className="flex-1 overflow-hidden relative">
        {!session ? (
          <LoginForm />
        ) : (
          <TimetableGrid />
        )}
      </main>

      {/* Tools Drawer — houses ALL secondary actions */}
      <ToolsDrawer
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        onOpenPdf={() => { setIsToolsOpen(false); setIsPdfModalOpen(true); }}
        onOpenExam={() => { setIsToolsOpen(false); setIsExamModalOpen(true); }}
        onOpenQr={() => { setIsToolsOpen(false); setIsQrModalOpen(true); }}
      />

      {/* Modals */}
      <PdfExportModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} />
      <ExamScheduleModal isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} courses={timetableData?.timetable || []} />
      <QrShareModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} studentName={timetableData?.studentName || session?.user_id} matricNo={session?.user_id} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
