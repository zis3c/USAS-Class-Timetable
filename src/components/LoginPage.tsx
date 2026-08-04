import { useTheme, THEMES } from '../context/ThemeContext';
import LoginForm from './LoginForm';

export default function LoginPage() {
  const { theme } = useTheme();

  return (
    <section className={`min-h-[calc(100dvh-3rem)] px-4 sm:px-6 py-10 sm:py-14 flex items-center justify-center transition-colors duration-150 ${
      theme === THEMES.LIGHT ? 'bg-[#f8fafc] text-slate-800' :
      theme === THEMES.OLED ? 'bg-black text-slate-100' :
      theme === THEMES.EMERALD ? 'bg-[#012117] text-slate-100' :
      'bg-[#060E1F] text-slate-100'
    }`}>
      <div className="w-full max-w-[92vw] sm:max-w-md">
          <LoginForm />
      </div>
    </section>
  );
}
