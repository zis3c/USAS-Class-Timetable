import React, { Suspense, lazy, useState, useEffect } from 'react';
import Lenis from 'lenis';
import { AuthProvider, useAuth } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { ThemeProvider, useTheme, THEMES } from '@/app/providers/ThemeProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import Navbar from '@/app/shell/Navbar';
import LandingPage from '@/features/landing/pages/LandingPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import TimetableGrid from '@/features/timetable/components/TimetableGrid';
import { PrayerTimesNotifier } from '@/features/timetable/components/PrayerTimesWidget';
import ErrorScreen from '@/app/shell/ErrorScreen';
import ErrorBoundary from '@/app/shell/ErrorBoundary';
const PdfExportModal = lazy(() => import('@/features/export/modals/PdfExportModal'));
const ExamScheduleModal = lazy(() => import('@/features/planning/modals/ExamScheduleModal'));
const QrShareModal = lazy(() => import('@/features/sharing/modals/QrShareModal'));
const WhatsAppShareModal = lazy(() => import('@/features/sharing/modals/WhatsAppShareModal'));
const ToolsDrawer = lazy(() => import('@/app/shell/ToolsDrawer'));
const GpaCalculatorModal = lazy(() => import('@/features/planning/modals/GpaCalculatorModal'));

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
      allowNestedScroll: true,
    });
    const lenisWindow = window as unknown as Window & { usasLenis?: Lenis };
    lenisWindow.usasLenis = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete lenisWindow.usasLenis;
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
  const [isGpaModalOpen, setIsGpaModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

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

  const validPaths = new Set(['/', '/login', '/app']);
  if (!validPaths.has(pathname)) {
    return (
      <ErrorScreen
        status={404}
        title={lang === 'ms' ? 'Halaman tidak dijumpai' : 'Page not found'}
        message={lang === 'ms' ? 'Laluan ini tidak wujud dalam portal ini.' : 'The path you requested does not exist in this portal.'}
        primaryLabel={lang === 'ms' ? 'Mula semula' : 'Go home'}
        secondaryLabel={lang === 'ms' ? 'Muat semula' : 'Reload'}
        onPrimary={() => window.location.replace('/')}
        onSecondary={() => window.location.reload()}
      />
    );
  }

  return (
    <div className={`w-full ${view === 'app' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'} flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 antialiased ${
      theme === THEMES.LIGHT ? 'bg-[#f8fafc] text-slate-800' :
      theme === THEMES.OLED ? 'bg-black text-slate-100' :
      theme === THEMES.EMERALD ? 'bg-[#012117] text-slate-100' :
      'bg-[#060E1F] text-slate-100'
    }`}>
      <Navbar 
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        view={view}
        onNavigateHome={() => navigateTo('/')}
        onNavigateLogin={() => navigateTo('/login')}
      />
      {session && <PrayerTimesNotifier />}
      
      <main className={view === 'app' ? 'flex-1 min-h-0 overflow-hidden relative' : 'flex-1 relative'}>
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
        {/* Tools Drawer â€” houses ALL secondary actions */}
        <ToolsDrawer
          isOpen={isToolsOpen}
          onClose={() => setIsToolsOpen(false)}
          onOpenPdf={() => { setIsPdfModalOpen(true); }}
          onOpenExam={() => { setIsExamModalOpen(true); }}
          onOpenQr={() => { setIsQrModalOpen(true); }}
          onOpenWhatsApp={() => { setIsWhatsAppModalOpen(true); }}
          onOpenGpa={() => { setIsGpaModalOpen(true); }}
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
        <GpaCalculatorModal isOpen={isGpaModalOpen} onClose={() => setIsGpaModalOpen(false)} courses={timetableData?.timetable || []} />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <ErrorBoundary>
            <MainContent />
          </ErrorBoundary>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

















