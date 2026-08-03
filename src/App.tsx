import React, { Suspense, lazy, useState, useEffect } from 'react';
import Lenis from 'lenis';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import TimetableGrid from './components/TimetableGrid';
import { PrayerTimesNotifier } from './components/PrayerTimesWidget';
const PdfExportModal = lazy(() => import('./components/PdfExportModal'));
const ExamScheduleModal = lazy(() => import('./components/ExamScheduleModal'));
const QrShareModal = lazy(() => import('./components/QrShareModal'));
const WhatsAppShareModal = lazy(() => import('./components/WhatsAppShareModal'));
const ToolsDrawer = lazy(() => import('./components/ToolsDrawer'));

function MainContent() {
  const { session, timetableData } = useAuth();
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const [pathname, setPathname] = useState(() => window.location.pathname || '/');

  // Update browser tab title reactively on language change
  useEffect(() => {
    const view = session
      ? 'app'
      : pathname === '/login'
        ? 'login'
        : 'landing';

    document.title = view === 'app'
      ? (lang === 'en' ? 'USAS Class Timetable' : 'Jadual Kuliah USAS')
      : view === 'login'
        ? (lang === 'en' ? 'Login | USAS Class Timetable' : 'Log Masuk | Jadual Kuliah USAS')
        : (lang === 'en' ? 'USAS Class Timetable | Landing' : 'Jadual Kuliah USAS | Laman Utama');
  }, [lang, pathname, session]);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || '/');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    body.style.overflowX = 'hidden';
    body.style.overflowY = session ? 'hidden' : 'auto';
    body.style.height = session ? '100%' : 'auto';
    root.style.overflowX = 'hidden';
    root.style.overflowY = session ? 'hidden' : 'auto';
    root.style.height = session ? '100%' : 'auto';

    return () => {
      body.style.overflowX = '';
      body.style.overflowY = '';
      body.style.height = '';
      root.style.overflowX = '';
      root.style.overflowY = '';
      root.style.height = '';
    };
  }, [session]);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      smoothTouch: false,
    });
    (window as Window & { lenis?: Lenis }).lenis = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete (window as Window & { lenis?: Lenis }).lenis;
    };
  }, []);

  useEffect(() => {
    if (session) {
      if (pathname !== '/app') {
        window.history.replaceState({}, '', '/app');
        setPathname('/app');
      }
      return;
    }

    if (pathname === '/app') {
      window.history.replaceState({}, '', '/login');
      setPathname('/login');
    }
  }, [pathname, session]);
  
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const isLight = theme === 'light';

  const navigateTo = (nextPath: '/' | '/login' | '/app') => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
      setPathname(nextPath);
      window.scrollTo(0, 0);
    }
  };

  const view = session
    ? 'app'
    : pathname === '/login'
      ? 'login'
      : 'landing';

  return (
    <div className={`w-screen ${view === 'app' ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'} flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 antialiased ${
      isLight ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#060E1F] text-slate-100'
    }`}>
      <Navbar 
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        view={view}
        onNavigateHome={() => navigateTo('/')}
        onNavigateLogin={() => navigateTo('/login')}
      />
      {session && <PrayerTimesNotifier />}
      
      <main className={view === 'app' ? 'flex-1 overflow-hidden relative' : 'flex-1 relative'}>
        {!session && view === 'landing' && (
          <LandingPage onGoToLogin={() => navigateTo('/login')} />
        )}
        {!session && view === 'login' && (
          <LoginPage />
        )}
        {session && (
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
