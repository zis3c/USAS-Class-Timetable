import { ArrowRight, BadgeCheck, CalendarDays, ChevronRight, Clock3, Download, Palette, ShieldCheck, Sparkles, Smartphone, Workflow } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

type LandingPageProps = {
  onGoToLogin: () => void;
};

type FeatureCard = {
  title: string;
  desc: string;
  icon: typeof Sparkles;
};

export default function LandingPage({ onGoToLogin }: LandingPageProps) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const copy = lang === 'ms'
    ? {
        eyebrow: 'Portal Jadual Waktu USAS',
        title: 'Jadual kuliah yang rasa premium, tersusun, dan mudah dibaca.',
        subtitle: 'Satu halaman. Satu aliran. Dari landing terus ke log masuk dengan scroll yang lembut, kemudian masuk ke jadual, eksport, dan perkongsian dalam satu tempat.',
        ctaPrimary: 'Terus ke Log Masuk',
        ctaSecondary: 'Lihat ciri utama',
        statOneLabel: 'Infografik',
        statTwoLabel: 'Lenis Scroll',
        statThreeLabel: 'Light / Dark',
        flowTitle: 'Langkah ringkas',
        flowDesc: 'Dibina untuk rasa lancar dari pandangan pertama sampai ke tindakan utama.',
        featuresTitle: 'Apa yang pengguna nampak dulu',
        featuresDesc: 'Susun atur ringkas, premium, dan masih setia dengan identiti USAS.',
        trustA: 'Dibina untuk pelajar USAS',
        trustB: 'Eksport PDF / PNG',
        trustC: 'Sedia mobile',
      }
    : {
        eyebrow: 'USAS Timetable Portal',
        title: 'A premium timetable landing page that stays clear, smooth, and useful.',
        subtitle: 'One page. One flow. Smooth Lenis scroll takes users from first impression to login, then into timetable, export, and sharing tools.',
        ctaPrimary: 'Go to Login',
        ctaSecondary: 'See features',
        statOneLabel: 'Infographic',
        statTwoLabel: 'Lenis Scroll',
        statThreeLabel: 'Light / Dark',
        flowTitle: 'Simple flow',
        flowDesc: 'Built to feel smooth from the first view to the main action.',
        featuresTitle: 'What users see first',
        featuresDesc: 'Clean, premium, and still faithful to the USAS identity.',
        trustA: 'Made for USAS students',
        trustB: 'PDF / PNG export',
        trustC: 'Mobile ready',
      };

  const features: FeatureCard[] = [
    {
      title: lang === 'ms' ? 'Jadual hidup' : 'Live timetable',
      desc: lang === 'ms'
        ? 'Paparan kelas, masa, lokasi, dan status hari ini dalam satu susun atur bersih.'
        : 'See class time, location, and today status in one clean layout.',
      icon: CalendarDays,
    },
    {
      title: lang === 'ms' ? 'Eksport pantas' : 'Fast export',
      desc: lang === 'ms'
        ? 'Muat turun PDF atau PNG dengan output yang sesuai untuk telefon dan perkongsian.'
        : 'Download PDF or PNG with output tuned for phone use and sharing.',
      icon: Download,
    },
    {
      title: lang === 'ms' ? 'Tema adaptif' : 'Adaptive theme',
      desc: lang === 'ms'
        ? 'Reka bentuk terang dan gelap ikut mood sistem tanpa hilang identiti brand.'
        : 'Light and dark modes stay on-brand without losing the USAS look.',
      icon: Palette,
    },
    {
      title: lang === 'ms' ? 'Aliran lancar' : 'Smooth flow',
      desc: lang === 'ms'
        ? 'Lenis buat scroll rasa lebih lembut dan premium dari hero ke log masuk.'
        : 'Lenis makes scrolling feel softer and more premium from hero to login.',
      icon: Workflow,
    },
  ];

  const steps = [
    {
      n: '01',
      title: lang === 'ms' ? 'Buka landing' : 'Open the landing page',
      desc: lang === 'ms' ? 'Hero terus berikan konteks dan identiti portal.' : 'The hero gives instant context and brand tone.',
    },
    {
      n: '02',
      title: lang === 'ms' ? 'Lihat ringkasan' : 'Scan the summary',
      desc: lang === 'ms' ? 'Kad infografik tunjuk fungsi utama secara pantas.' : 'Infographic cards show the main functions quickly.',
    },
    {
      n: '03',
      title: lang === 'ms' ? 'Masuk ke portal' : 'Enter the portal',
      desc: lang === 'ms' ? 'Scroll terus ke login dan mula gunakan sistem.' : 'Scroll to login and start using the system.',
    },
  ];

  const scrollToFeatures = () => {
    const target = document.getElementById('landing-features');
    if (!target) return;
    const lenis = (window as Window & { lenis?: { scrollTo: (target: Element | string) => void } }).lenis;
    if (lenis) {
      lenis.scrollTo(target);
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`relative isolate overflow-hidden transition-colors duration-150 ${isLight ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#060E1F] text-slate-100'}`}>
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute -top-24 right-0 h-72 w-72 rounded-full blur-3xl ${isLight ? 'bg-amber-400/15' : 'bg-amber-400/10'}`} />
        <div className={`absolute top-32 left-0 h-96 w-96 rounded-full blur-3xl ${isLight ? 'bg-sky-400/10' : 'bg-sky-400/6'}`} />
        <div className={`absolute inset-x-0 top-0 h-px ${isLight ? 'bg-gradient-to-r from-transparent via-amber-300/60 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-400/30 to-transparent'}`} />
      </div>

      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.22em] uppercase ${isLight ? 'bg-white/80 border-slate-200 text-slate-600 shadow-sm' : 'bg-white/[0.03] border-white/[0.08] text-amber-300/80'}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{copy.eyebrow}</span>
            </div>

            <div className="space-y-4 max-w-2xl">
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {copy.title}
              </h1>
              <p className={`max-w-xl text-sm sm:text-base leading-7 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {copy.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGoToLogin}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors shadow-lg ${isLight ? 'bg-[#0B1E43] text-white hover:bg-[#152e63]' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'}`}
              >
                {copy.ctaPrimary}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollToFeatures}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${isLight ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50' : 'border-white/[0.08] bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'}`}
              >
                {copy.ctaSecondary}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                [copy.statOneLabel, lang === 'ms' ? 'Ringkas, visual, dan terus ke poin.' : 'Compact, visual, and straight to the point.'],
                [copy.statTwoLabel, lang === 'ms' ? 'Scroll lembut untuk landing moden.' : 'Soft scroll for a modern landing feel.'],
                [copy.statThreeLabel, lang === 'ms' ? 'Tema ikut suasana tanpa pecah identiti.' : 'Theme adapts without breaking the brand.'],
              ].map(([label, desc]) => (
                <div key={label} className={`rounded-2xl border p-4 ${isLight ? 'bg-white/85 border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/[0.08]'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isLight ? 'text-amber-700' : 'text-amber-300/80'}`}>{label}</div>
                  <p className={`mt-2 text-xs leading-5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className={`absolute -inset-4 rounded-[2rem] blur-2xl ${isLight ? 'bg-amber-400/10' : 'bg-amber-400/6'}`} />
            <div className={`relative overflow-hidden rounded-[2rem] border p-4 sm:p-5 shadow-2xl ${isLight ? 'border-slate-200 bg-white/90' : 'border-white/[0.08] bg-[#0A1428]/95'}`}>
              <div className="flex items-center justify-between pb-4">
                <div>
                  <div className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{lang === 'ms' ? 'Paparan ringkas' : 'Quick preview'}</div>
                  <div className={`mt-1 text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>USAS Class Timetable</div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${isLight ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}>
                  {lang === 'ms' ? 'Live' : 'Live'}
                </div>
              </div>

              <div className={`grid gap-3 rounded-2xl border p-3 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.06] bg-[#060E1F]/80'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{lang === 'ms' ? 'Sesi seterusnya' : 'Next session'}</div>
                    <div className={`mt-1 text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{lang === 'ms' ? '10:00 - 11:00' : '10:00 - 11:00'}</div>
                  </div>
                  <div className={`rounded-xl px-3 py-2 text-right ${isLight ? 'bg-white border border-slate-200' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isLight ? 'text-amber-700' : 'text-amber-300/80'}`}>FKP 2012</div>
                    <div className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/90'}`}>Web Design</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'PDF', value: 'HD' },
                    { label: 'PNG', value: 'HD' },
                    { label: lang === 'ms' ? 'Kehadiran' : 'Attendance', value: '95%' },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-xl p-3 text-center ${isLight ? 'bg-white border border-slate-200' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{item.label}</div>
                      <div className={`mt-1 text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {['10-11', '11-12', '12-13'].map((slot, idx) => (
                    <div key={slot} className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${isLight ? 'bg-white border border-slate-200 text-slate-700' : 'bg-white/[0.03] border border-white/[0.06] text-slate-300'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${idx === 0 ? 'bg-emerald-400' : idx === 1 ? 'bg-amber-400' : 'bg-sky-400'}`} />
                        <span className="font-semibold">{slot}</span>
                      </div>
                      <span className={`${isLight ? 'text-slate-400' : 'text-white/30'}`}>{lang === 'ms' ? 'Ruang kelas' : 'Class room'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className={`rounded-2xl border p-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/[0.08]'}`}>
                  <div className="flex items-center gap-2">
                    <Clock3 className={`${isLight ? 'text-amber-700' : 'text-amber-300'} w-4 h-4`} />
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>{lang === 'ms' ? 'Aliran masa' : 'Time flow'}</span>
                  </div>
                  <p className={`mt-2 text-xs leading-5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{lang === 'ms' ? 'Setiap waktu dipotong jelas supaya mudah dibaca di telefon.' : 'Each time block is crisp and easy to scan on mobile.'}</p>
                </div>
                <div className={`rounded-2xl border p-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/[0.08]'}`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`${isLight ? 'text-emerald-700' : 'text-emerald-300'} w-4 h-4`} />
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>{lang === 'ms' ? 'Brand safe' : 'Brand safe'}</span>
                  </div>
                  <p className={`mt-2 text-xs leading-5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{lang === 'ms' ? 'Warna, bentuk, dan rasa kekal selari dengan tema asal projek.' : 'Color, shape, and feel stay aligned with the project theme.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="landing-features" className="mt-12 sm:mt-16">
          <div className="max-w-2xl">
            <div className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{copy.featuresTitle}</div>
            <h2 className={`mt-2 text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{copy.featuresDesc}</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={`rounded-3xl border p-5 transition-transform duration-150 hover:-translate-y-0.5 ${isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/[0.08]'}`}
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${isLight ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-400/10 text-amber-300 border border-amber-400/20'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-amber-500/90">
                    0{index + 1}
                  </div>
                  <h3 className={`mt-2 text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.title}</h3>
                  <p className={`mt-2 text-sm leading-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <div className={`rounded-[2rem] border p-5 ${isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/[0.08]'}`}>
            <div className="flex items-center gap-2 text-amber-500">
              <BadgeCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{copy.flowTitle}</span>
            </div>
            <h3 className={`mt-3 text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{copy.flowDesc}</h3>
          </div>

          {steps.map((step) => (
            <div key={step.n} className={`rounded-[2rem] border p-5 ${isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/[0.08]'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black tracking-[0.24em] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{step.n}</span>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isLight ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-400/10 text-amber-300 border border-amber-400/20'}`}>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              <h4 className={`mt-3 text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{step.title}</h4>
              <p className={`mt-2 text-sm leading-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{step.desc}</p>
            </div>
          ))}
        </div>

        <div className={`mt-12 flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border px-5 py-4 ${isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/[0.08]'}`}>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
              <ShieldCheck className="w-4 h-4" />
              {copy.trustA}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${isLight ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}`}>
              <Download className="w-4 h-4" />
              {copy.trustB}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${isLight ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'}`}>
              <Smartphone className="w-4 h-4" />
              {copy.trustC}
            </span>
          </div>
          <button
            type="button"
            onClick={onGoToLogin}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'}`}
          >
            {lang === 'ms' ? 'Ke bahagian log masuk' : 'Jump to login'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
