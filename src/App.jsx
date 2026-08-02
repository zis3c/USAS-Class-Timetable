import React, { Suspense, lazy, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import LoginForm from './components/LoginForm';
import TimetableGrid from './components/TimetableGrid';
const PdfExportModal = lazy(() => import('./components/PdfExportModal'));
const ExamScheduleModal = lazy(() => import('./components/ExamScheduleModal'));
const QrShareModal = lazy(() => import('./components/QrShareModal'));
const WhatsAppShareModal = lazy(() => import('./components/WhatsAppShareModal'));
const ToolsDrawer = lazy(() => import('./components/ToolsDrawer'));

function MainContent() {
  const { session, timetableData } = useAuth();
  const { theme } = useTheme();
  const { lang } = useLanguage();

  // Update browser tab title reactively on language change
  useEffect(() => {
    document.title = lang === 'en'
      ? 'USAS Class Timetable'
      : 'Jadual Kuliah USAS';
  }, [lang]);
  
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const isLight = theme === 'light';

  return (
    <div className={`h-screen w-screen max-h-screen overflow-hidden flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 antialiased ${
      isLight ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#060E1F] text-slate-100'
    }`}>
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

      <Suspense fallback={null}>
        {/* Tools Drawer — houses ALL secondary actions */}
        <ToolsDrawer
          isOpen={isToolsOpen}
          onClose={() => setIsToolsOpen(false)}
          onOpenPdf={() => { setIsPdfModalOpen(true); }}
          onOpenExam={() => { setIsExamModalOpen(true); }}
          onOpenQr={() => { setIsQrModalOpen(true); }}
          onOpenWhatsApp={() => { setIsWhatsAppModalOpen(true); }}
        />

        {/* Modals */}
        <PdfExportModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} />
        <ExamScheduleModal isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} courses={timetableData?.timetable || []} />
        <QrShareModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} studentName={timetableData?.studentName || session?.user_id} matricNo={session?.user_id} />
        <WhatsAppShareModal 
          isOpen={isWhatsAppModalOpen} 
          onClose={() => setIsWhatsAppModalOpen(false)} 
          timetable={timetableData?.timetable || []} 
          studentName={timetableData?.studentName} 
          matricNo={session?.user_id} 
        />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <MainContent />
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
