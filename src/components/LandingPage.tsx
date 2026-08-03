import { useState, useEffect } from 'react';
import { ArrowRight, Download, Moon, ShieldAlert, AlertTriangle, Share2, CheckCircle2, Clock, MapPin, Github, Play, Send, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

type LandingPageProps = {
  onGoToLogin: () => void;
};

export default function LandingPage({ onGoToLogin }: LandingPageProps) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Scroll offset tracking for parallax scale and layout transformations
  const [scrollY, setScrollY] = useState(0);

  // Mouse 3D tilt tracking state for timetable preview card
  const [mouseRotate, setMouseRotate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // mouse x relative to card
    const y = e.clientY - rect.top;  // mouse y relative to card
    const xc = rect.width / 2;
    const yc = rect.height / 2;

    // Calculate rotation: max 12 degrees tilt
    const rotateX = -((y - yc) / yc) * 12;
    const rotateY = ((x - xc) / xc) * 12;

    setMouseRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setMouseRotate({ x: 0, y: 0 });
  };

  // Compute scroll progress (0 to 450px scroll range)
  const scrollRange = 450;
  const progress = Math.min(1, scrollY / scrollRange);

  const copy = lang === 'ms'
    ? {
      eyebrow: 'Jadual Kuliah USAS',
      title: 'Portal Jadual Waktu Kuliah USAS Pelajar.',
      subtitle: 'Satu halaman akademik untuk mengambil, memformat, dan mengeksport jadual kuliah USAS anda secara langsung ke kalendar peranti, PDF cetakan A4, dan kertas dinding skrin kunci telefon.',
      cta: 'Log Masuk Sekarang',
      disclaimerTitle: 'Keselamatan Data & Penafian Rasmi',
      disclaimerText: 'Portal ini menghubungi API rasmi UMC USAS secara terus. Kami (pembangun & STEM USAS) tidak mempunyai pelayan tengah, tidak menyimpan, tidak memodifikasi, dan tidak menyentuh sebarang data peribadi mahupun kredensial log masuk pelajar.',
      createdBy: 'Projek Pembelajaran Bebas oleh STEM USAS',
      previewTitle: 'Paparan Contoh Jadual',
      featureOneTitle: 'Eksport Akademik Rasmi',
      featureOneDesc: 'Cetak jadual kuliah dalam format landskap A4 untuk urusan universiti, atau simpan kertas dinding telefon pintar berskala penuh.',
      featureTwoTitle: 'Pemformatan Fleksibel',
      featureTwoDesc: 'Sesuaikan penampilan jadual anda mengikut keperluan visual tersendiri, lengkap dengan mod gelap mesra mata.',
      featuresTitle: 'Semua Ciri Akademik Di Satu Tempat',
      featuresDesc: 'Dibina khusus untuk memudahkan pengurusan jadual kuliah harian dan pencapaian akademik anda.',
      featuresList: [
        { title: 'Papan Pemuka Pintar', desc: 'Paparan subjek hari ini, dewan kuliah, dan peratus kehadiran semasa.' },
        { title: 'Jadual Peperiksaan', desc: 'Semak tarikh periksa, nombor tempat duduk, dan lokasi dewan peperiksaan secara langsung.' },
        { title: 'Kalkulator GPA', desc: 'Rancang keputusan akademik dengan pengiraan GPA/CGPA tersendiri.' },
        { title: 'Waktu Solat & Notifikasi', desc: 'Integrasi waktu solat tempatan mengikut zon jadual kuliah anda.' }
      ],
      videoTitle: 'Tonton Video Panduan',
      videoDesc: 'Pelajari cara log masuk, menyelaraskan waktu, dan mengeksport kertas dinding peranti anda dalam masa 1 minit.',
      botsTitle: 'Ekosistem Telegram Bot STEM',
      botsDesc: 'Terokai bot Telegram rasmi terdahulu yang dibina untuk memudahkan urusan tugasan harian dan notifikasi pelajar USAS.',
      joinTitle: 'Bina Komuniti Bersama STEM USAS',
      joinDesc: 'Sertai kelab STEM USAS! Komuniti aktif yang menggabungkan minat teknologi dengan aktiviti kelab dan kemasyarakatan pelajar. Jom bina projek digital dan anjur program menarik bersama kami!',
      joinButton: 'Borang Pendaftaran Ahli',
    }
    : {
      eyebrow: 'USAS Class Timetable',
      title: 'The Premium Timetable Portal for USAS Students.',
      subtitle: 'A minimalist academic utility to fetch, format, and export your USAS class timetable directly into device calendars, printable A4 PDFs, and lockscreen wallpapers.',
      cta: 'Log In Now',
      disclaimerTitle: 'Data Security & Official Disclaimer',
      disclaimerText: 'This portal connects directly to the official USAS UMC API. We (the developers & STEM USAS) do not run middle servers, do not store, do not modify, and do not touch any personal student data or login credentials.',
      createdBy: 'An Independent Project by STEM USAS',
      previewTitle: 'Sample Timetable Preview',
      featureOneTitle: 'Official Academic Prints',
      featureOneDesc: 'Export your course schedule as an A4 landscape document for academic record-keeping or print-ready reference.',
      featureTwoTitle: 'Flexible Formatting',
      featureTwoDesc: 'Adapt your calendar representation instantly for your personal devices, complete with a clean night-mode view.',
      featuresTitle: 'Every Academic Feature in One Portal',
      featuresDesc: 'Engineered from the ground up to streamline your daily schedules, academic planning, and campus tracking.',
      featuresList: [
        { title: 'Smart Dashboard', desc: 'View today\'s classes, classrooms, and dynamic attendance percentages instantly.' },
        { title: 'Exam Schedules', desc: 'Retrieve your official examination dates, seat numbers, and venue halls.' },
        { title: 'GPA Calculator', desc: 'Calculate your current semester GPA and target CGPA with ease.' },
        { title: 'Prayer Times Notification', desc: 'Local prayer times integrated seamlessly alongside class hours.' }
      ],
      videoTitle: 'Watch Video Walkthrough',
      videoDesc: 'Discover how to sign in, resolve schedule overlaps, and configure high-resolution lockscreens in under 1 minute.',
      botsTitle: 'STEM Telegram Bots Ecology',
      botsDesc: 'Explore our previous official Telegram bots engineered to assist USAS students with homework alert deadlines and schedules.',
      joinTitle: 'Connect & Build. Join STEM USAS.',
      joinDesc: 'Join the STEM USAS club: an active student community blending technology with campus engagement and club events. Build digital tools and host exciting activities together with us!',
      joinButton: 'Membership Form',
    };

  const steps = lang === 'ms'
    ? [
      { n: '01', title: 'Pengesahan Rasmi', desc: 'Log masuk secara selamat menggunakan kredensial portal asal anda. Identiti akademik anda terpelihara.' },
      { n: '02', title: 'Papan Pemuka Peribadi', desc: 'Semak senarai subjek, masa kuliah, dan lokasi dewan kuliah hari ini dalam paparan kad yang tersusun.' },
      { n: '03', title: 'Dokumen & Kertas Dinding', desc: 'Jana dokumen PDF A4 rasmi untuk kegunaan akademik, atau muat turun fail kertas dinding mudah alih beresolusi ultra-tinggi.' }
    ]
    : [
      { n: '01', title: 'Official Sign In', desc: 'Authenticate securely using your official student credentials to link your academic identity.' },
      { n: '02', title: 'Personalized Dashboard', desc: 'View your subjects, schedules, and class venues in an elegant, personalized academic calendar display.' },
      { n: '03', title: 'Academic Prints & Wallpapers', desc: 'Generate official print-ready A4 PDFs or download custom high-resolution lockscreen wallpapers for your mobile device.' }
    ];

  const suiteTitle = lang === 'ms' ? 'Format & Fungsi Eksport Jadual' : 'Timetable Export Formats & Utilities';
  const suiteDesc = lang === 'ms'
    ? 'Portal ini dibina khusus untuk menyediakan akses luar talian yang pantas, mesra cetakan, dan boleh diselaraskan.'
    : 'Engineered specifically for instant offline accessibility, print integration, and calendar sync.';



  return (
    <div className={`relative isolate overflow-hidden min-h-[120vh] transition-colors duration-150 ${isLight ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#060E1F] text-slate-100'
      }`}>
      {/* Dynamic Background Blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute -top-20 right-10 h-80 w-80 rounded-full blur-3xl transition-colors ${isLight ? 'bg-amber-400/10' : 'bg-amber-400/5'
          }`} />
        <div className={`absolute top-60 left-10 h-96 w-96 rounded-full blur-3xl transition-colors ${isLight ? 'bg-sky-400/10' : 'bg-sky-400/5'
          }`} />
      </div>

      <section className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-16 sm:pt-24 pb-20">

        {/* Hero Area */}
        <div className="text-center max-w-2xl mx-auto space-y-6 mb-16">
          {/* Symmetrical Tech-Status Eyebrow */}
          <div className="inline-flex items-center justify-center gap-2.5 text-[11.5px] sm:text-xs font-black tracking-[0.25em] uppercase select-none mb-6">
            <span className="text-amber-500">STEM USAS</span>
            <span className="opacity-30 text-slate-400 font-normal select-none">•</span>
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{copy.eyebrow}</span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <h1 className={`text-4.5xl sm:text-6.5xl font-black tracking-tight leading-[0.95] ${isLight ? 'text-slate-900' : 'text-white'
            }`}>
            {copy.title}
          </h1>

          <p className={`max-w-xl mx-auto text-sm sm:text-base leading-relaxed opacity-75 ${isLight ? 'text-slate-650' : 'text-slate-300'
            }`}>
            {copy.subtitle}
          </p>

          <div className="pt-4">
            <button
              type="button"
              onClick={onGoToLogin}
              className={`inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-extrabold transition-all shadow-xl hover:scale-105 active:scale-95 ${isLight
                  ? 'bg-[#0B1E43] text-white hover:bg-[#152e63] shadow-slate-900/10'
                  : 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/10'
                }`}
            >
              {copy.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>        {/* 3D Mockup & Features Playground Grid */}
        <div className="grid gap-8 md:grid-cols-2 mt-12 max-w-3xl mx-auto items-stretch">

          {/* Left Column: Interactive 3D Mockup */}
          <div
            className="relative w-full cursor-pointer h-full"
            style={{ perspective: '1200px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`rounded-2xl border p-4 sm:p-5 shadow-2xl transition-all duration-100 ease-out origin-top-center h-full flex flex-col justify-between ${isLight
                  ? 'border-slate-200 bg-white/95'
                  : 'border-white/[0.08] bg-[#0A1428]/95'
                }`}
              style={{
                transform: `rotateX(${(12 - progress * 12) + mouseRotate.x}deg) rotateY(${mouseRotate.y}deg) scale(${0.94 + progress * 0.06}) translateY(${(1 - progress) * 15}px)`,
                transformStyle: 'preserve-3d',
                opacity: 0.85 + progress * 0.15
              }}
            >
              {/* Mockup Header */}
              <div
                className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-white/10 text-[9px] sm:text-[10px] font-bold opacity-60"
                style={{ transform: 'translateZ(30px)' }}
              >
                <span>MATRIK: AI210042</span>
                <span className={`px-2 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/[0.06] text-amber-300'}`}>
                  {copy.previewTitle}
                </span>
                <span>PROGRAM: CS</span>
              </div>

              {/* Mockup Grid Rows (Accurate timetable card UI styling) */}
              <div className="space-y-3 flex-1 flex flex-col justify-between" style={{ transform: 'translateZ(10px)' }}>
                {[
                  {
                    day: lang === 'ms' ? 'ISNIN' : 'MONDAY',
                    time: '8:30 AM - 10:30 AM',
                    code: 'CSC2103',
                    course: lang === 'ms' ? 'Struktur Data & Algoritma' : 'Data Structures & Algorithms',
                    loc: lang === 'ms' ? 'Makmal 3' : 'Lab 3',
                    theme: {
                      accent: isLight ? 'border-l-emerald-500' : 'border-l-emerald-400',
                      border: isLight ? 'border-emerald-500/20' : 'border-emerald-500/30',
                      bg: isLight ? 'bg-emerald-500/[0.08]' : 'bg-emerald-500/[0.15]',
                      text: isLight ? 'text-emerald-700' : 'text-emerald-350',
                      badge: isLight 
                        ? 'bg-emerald-600 text-white border-emerald-600/30' 
                        : 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                    }
                  },
                  {
                    day: lang === 'ms' ? 'SELASA' : 'TUESDAY',
                    time: '9:00 AM - 12:00 PM',
                    code: 'BIT2043',
                    course: lang === 'ms' ? 'Pembangunan Aplikasi Web' : 'Web Application Development',
                    loc: lang === 'ms' ? 'Makmal Perisian' : 'Software Lab',
                    theme: {
                      accent: isLight ? 'border-l-blue-500' : 'border-l-blue-400',
                      border: isLight ? 'border-blue-500/20' : 'border-blue-500/30',
                      bg: isLight ? 'bg-blue-500/[0.08]' : 'bg-blue-500/[0.15]',
                      text: isLight ? 'text-blue-700' : 'text-blue-350',
                      badge: isLight 
                        ? 'bg-blue-600 text-white border-blue-600/30' 
                        : 'bg-blue-500/30 text-blue-300 border-blue-500/50'
                    }
                  },
                  {
                    day: lang === 'ms' ? 'KHAMIS' : 'THURSDAY',
                    time: '10:00 AM - 12:00 PM',
                    code: 'CSC2103',
                    course: lang === 'ms' ? 'Struktur Data & Algoritma' : 'Data Structures & Algorithms',
                    loc: lang === 'ms' ? 'Dewan Kuliah 1' : 'Lecture Hall 1',
                    theme: {
                      accent: isLight ? 'border-l-purple-500' : 'border-l-purple-400',
                      border: isLight ? 'border-purple-500/20' : 'border-purple-500/30',
                      bg: isLight ? 'bg-purple-500/[0.08]' : 'bg-purple-500/[0.15]',
                      text: isLight ? 'text-purple-700' : 'text-purple-350',
                      badge: isLight 
                        ? 'bg-purple-600 text-white border-purple-600/30' 
                        : 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                    }
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border border-l-2 p-3 text-left transition-all duration-300 ${item.theme.accent} ${item.theme.border} ${item.theme.bg}`}
                    style={{ transform: 'translateZ(20px)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-[10px] font-black tracking-wider ${item.theme.text}`}>{item.code}</span>
                        <div className="flex items-center gap-1 text-[9.5px] opacity-70">
                          <Clock className="w-3 h-3 text-amber-500/80" />
                          <span className="leading-none">{item.time}</span>
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${item.theme.badge}`}>
                        {item.day}
                      </span>
                    </div>

                    <h3 className="text-[11.5px] font-bold leading-snug mt-1.5 opacity-90">
                      {item.course}
                    </h3>

                    <div className="flex items-center gap-1 text-[9.5px] opacity-75 mt-2">
                      <MapPin className="w-3 h-3 text-red-500/80" />
                      <span>{item.loc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Portal Features List */}
          <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between gap-5 text-xs h-full ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.015] border-white/[0.04]'}`}>
            <div>
              <h4 className="font-extrabold uppercase tracking-wider text-amber-500 mb-1">
                {copy.featuresTitle}
              </h4>
              <p className="opacity-75 leading-relaxed text-[11px] mb-4">
                {copy.featuresDesc}
              </p>
            </div>

            {/* Features Listing */}
            <div className="space-y-4">
              {copy.featuresList.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs leading-none">{feat.title}</h5>
                    <p className="text-[11px] opacity-70 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Step-by-Step Minimalist Timeline */}
        <div className="mt-20 max-w-2xl mx-auto">
          <div className="grid gap-6 md:grid-cols-3 relative">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`relative p-5 rounded-2xl border transition-all duration-350 hover:-translate-y-1 hover:shadow-md ${isLight
                    ? 'bg-white border-slate-200/60 shadow-sm'
                    : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.03]'
                  }`}
              >
                {/* Outline step number */}
                <div className="absolute top-2 right-4 text-5xl font-black opacity-10 tracking-tighter select-none font-mono">
                  {step.n}
                </div>

                <div className="space-y-2 relative z-10 pt-4">
                  <h3 className="text-xs font-black tracking-wider uppercase text-amber-500">
                    {step.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed opacity-75">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Grid Features Showcase */}
        <div className="mt-24 max-w-2xl mx-auto space-y-6">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-black tracking-tight text-amber-500">{suiteTitle}</h3>
            <p className="text-xs opacity-75">{suiteDesc}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">

            {/* CARD 1: DOWNLOADABLE FORMATS (A4 PDF & Lockscreen Wallpapers) - md:col-span-2 */}
            <div className={`md:col-span-2 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2 max-w-[50%] sm:max-w-[52%]">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <Download className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">
                    {lang === 'ms' ? 'Jadual Muat Turun (A4 PDF & Wallpaper)' : 'Timetable Downloads (A4 PDF & Wallpapers)'}
                  </h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {lang === 'ms'
                    ? 'Eksport jadual kuliah anda dalam format PDF rasmi landskap A4 untuk rujukan universiti, atau kertas dinding kunci (lockscreen) berkualiti 8K telefon pintar.'
                    : 'Export your timetable as official landscape A4 PDFs or high-density lockscreen wallpapers matching your device screen sizes.'}
                </p>
              </div>

              {/* Graphical Stack representation inside Bento grid card */}
              <div className="absolute right-3 bottom-0 top-6 w-32 hidden sm:block pointer-events-none" style={{ perspective: '800px' }}>
                {/* Miniature Wallpaper Stack */}
                <div className="absolute right-0 bottom-[-10px] w-14 h-24 rounded-lg bg-amber-500/10 border border-amber-500/20 rotate-[-12deg] shadow-lg flex flex-col p-1 gap-1 text-[4px] leading-none select-none">
                  <div className="h-2 w-full bg-amber-500/20 rounded-sm" />
                  <div className="h-1 bg-white/20 rounded-sm" />
                  <div className="h-1 bg-white/20 rounded-sm" />
                </div>
                {/* Miniature PDF Stack */}
                <div className="absolute right-6 bottom-[-5px] w-20 h-16 rounded-md bg-slate-500/10 border border-slate-500/25 rotate-[8deg] shadow-lg flex flex-col p-1 gap-1 text-[3px] leading-none select-none">
                  <div className="h-1.5 w-full bg-slate-500/20 rounded-sm" />
                  <div className="grid grid-cols-3 gap-0.5">
                    <div className="h-6 bg-white/10 rounded-sm" />
                    <div className="h-6 bg-white/10 rounded-sm" />
                    <div className="h-6 bg-white/10 rounded-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: CALENDAR SYNC (.ICS) - md:col-span-1 */}
            <div className={`md:col-span-1 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <Moon className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">
                    {lang === 'ms' ? 'Segerak Kalendar (.ICS)' : 'Calendar Sync (.ICS)'}
                  </h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {lang === 'ms'
                    ? 'Eksport subjek kuliah anda ke Google Calendar, Apple iCal, atau Microsoft Outlook dengan cepat.'
                    : 'Export all your lecture schedules directly into standard digital calendar clients.'}
                </p>
              </div>
            </div>

            {/* CARD 3: WHATSAPP & QR SHARING - md:col-span-1 */}
            <div className={`md:col-span-1 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <Share2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">
                    {lang === 'ms' ? 'Kongsi QR & WhatsApp' : 'WhatsApp & QR Sharing'}
                  </h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {lang === 'ms'
                    ? 'Hantar pautan jadual kuliah anda kepada rakan kelas, atau biarkan mereka mengimbas kod QR peribadi.'
                    : 'Dispatch schedules to your peer groups instantly via WhatsApp or customized scan codes.'}
                </p>
              </div>
            </div>

            {/* CARD 4: CLASH DETECTION & ATTENDANCE - md:col-span-2 */}
            <div className={`md:col-span-2 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2 max-w-[50%] sm:max-w-[52%]">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">
                    {lang === 'ms' ? 'Utiliti Konflik & Kehadiran' : 'Conflict Alerts & Attendance'}
                  </h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {lang === 'ms'
                    ? 'Sistem mengesan pertindihan masa kuliah secara automatik untuk mengelakkan kekeliruan, di samping memantau peratusan kehadiran kuliah.'
                    : 'System automatically flags overlapping sessions to prevent clashes while checking lecture presence records.'}
                </p>
              </div>

              {/* Decorative mini widgets in bento card */}
              <div className="absolute right-5 bottom-4 hidden sm:flex items-center gap-3 pointer-events-none">
                {/* Clash alert mockup */}
                <div className="px-2 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-[8px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{lang === 'ms' ? 'Terdapat Pertindihan' : 'Class Clash Detected'}</span>
                </div>
                {/* Attendance ring mockup */}
                <div className="relative h-10 w-10 flex items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[9px] font-black text-emerald-500">
                  95%
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Video Tutorial Walkthrough Section */}
        <div className="mt-24 max-w-2xl mx-auto space-y-6">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-black tracking-tight text-amber-500">{copy.videoTitle}</h3>
            <p className="text-xs opacity-75">{copy.videoDesc}</p>
          </div>

          <div
            className={`group rounded-2xl border p-4 transition-all duration-300 relative overflow-hidden aspect-video flex items-center justify-center cursor-pointer shadow-md ${isLight
                ? 'bg-slate-100/50 border-slate-200'
                : 'bg-white/[0.015] border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.025]'
              }`}
            onClick={() => window.open('https://github.com/zis3c/USAS-Class-Timetable', '_blank')}
          >
            {/* Dark glass cover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity z-0" />

            {/* Glowing play ring button */}
            <div className="h-16 w-16 rounded-full bg-[#0A1428]/80 backdrop-blur border border-white/20 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:text-amber-300 transition-all duration-300 shadow-xl z-10">
              <Play className="w-6 h-6 fill-amber-400 group-hover:fill-amber-300 translate-x-[1px]" />
            </div>

            {/* Minimal Playback HUD Controls Mockup */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[8px] tracking-widest font-mono text-white/50 z-10 select-none">
              <span>0:00 / 0:59</span>
              <div className="flex-1 mx-3 h-[2px] rounded-full bg-white/20 overflow-hidden">
                <div className="w-[18%] h-full bg-amber-500 rounded-full" />
              </div>
              <span>1080P HD</span>
            </div>
          </div>
        </div>

        {/* Previous STEM Projects - Tele Ecology */}
        <div className="mt-24 max-w-2xl mx-auto space-y-6">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-black tracking-tight text-amber-500">{copy.botsTitle}</h3>
            <p className="text-xs opacity-75">{copy.botsDesc}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                name: 'STEM USAS Bot',
                tag: '@stemusasbot',
                link: 'https://t.me/stemusasbot',
                desc: lang === 'ms' 
                  ? 'Bot Telegram pengurusan ahli STEM USAS untuk semakan status keahlian, pengesahan kelayakan sistem ahli, dan rekod pangkalan data kelab secara automatik.'
                  : 'STEM USAS Telegram bot engineered to manage the membership verification process, status checks, and club directory system automations.',
                color: 'text-emerald-500 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.04]'
              },
              {
                name: 'USAS Due Bot',
                tag: '@usas_duebot',
                link: 'https://t.me/usas_duebot',
                desc: lang === 'ms' 
                  ? 'Bot notifikasi tugasan USAS yang menyemak portal LMS secara pintar untuk menghantar peringatan tarikh akhir tugasan kuliah terus ke Telegram.'
                  : 'Automated assignment notifier bot that queries the USAS LMS portal and alerts students on upcoming coursework deadlines instantly.',
                color: 'text-blue-500 dark:text-blue-400 border-blue-500/20 bg-blue-500/[0.04]'
              }
            ].map((bot, idx) => (
              <a
                key={idx}
                href={bot.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[140px] hover:shadow-lg ${isLight
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
                  }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${bot.color}`}>
                        TELEGRAM
                      </span>
                      <span className="text-[10px] opacity-40 font-bold font-mono">{bot.tag}</span>
                    </div>
                    <Send className="w-3.5 h-3.5 opacity-45 hover:opacity-100 hover:text-amber-500 transition-all" />
                  </div>
                  <h4 className="font-extrabold text-sm text-left">{bot.name}</h4>
                  <p className="text-[11px] opacity-70 leading-relaxed text-left">{bot.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Join STEM USAS Membership Card */}
        <div className="mt-24 max-w-2xl mx-auto">
          <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden transition-all duration-300 hover:shadow-xl ${isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-gradient-to-br from-amber-500/[0.03] to-transparent border-white/[0.05] hover:border-white/[0.08]'
            }`}>
            <div className="space-y-2 text-center sm:text-left max-w-sm">
              <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-widest bg-amber-500/10 text-amber-500">
                {lang === 'ms' ? 'KEAHLIAN' : 'MEMBERSHIP'}
              </span>
              <h3 className="text-lg font-black tracking-tight">{copy.joinTitle}</h3>
              <p className="text-xs opacity-70 leading-relaxed">{copy.joinDesc}</p>
            </div>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSchZH3A3wvlq2RQE47KorzGNLqDgX48zc4PP46kapENjnBiBA/viewform?fbzx=7657887268860346255&pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-900 transition-all transform hover:scale-105 shadow-md shrink-0 uppercase tracking-widest font-mono"
            >
              <span>{copy.joinButton}</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5px]" />
            </a>
          </div>
        </div>

        {/* Security & Data Privacy Disclaimer Card */}
        <div className={`mt-12 border rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 max-w-2xl mx-auto ${isLight
            ? 'bg-amber-50/40 border-amber-200/50 text-amber-900 shadow-sm'
            : 'bg-amber-500/[0.02] border-amber-500/10 text-slate-300'
          }`}>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/10 text-amber-400'
            }`}>
            <ShieldAlert className="w-5.5 h-5.5" />
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className={`text-xs font-black tracking-wider uppercase ${isLight ? 'text-amber-850' : 'text-amber-400'}`}>
              {copy.disclaimerTitle}
            </h3>
            <p className="text-xs leading-relaxed opacity-75">
              {copy.disclaimerText}
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-slate-200/40 dark:border-white/5 pt-6 flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.25em] opacity-60">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-amber-500">STEM USAS</span>
            <span className="opacity-30 text-[8px]">•</span>
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>zis3c</span>
          </div>
          <a
            href="https://github.com/zis3c/USAS-Class-Timetable"
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/30 transition-all shadow-sm"
          >
            <Github className="w-4 h-4" />
          </a>
        </footer>

      </section>
    </div>
  );
}
