import { useTheme } from '../context/ThemeContext';
import LoginForm from './LoginForm';

export default function LoginPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <section className={`min-h-[calc(100vh-3rem)] px-4 sm:px-6 py-10 sm:py-14 flex items-center justify-center transition-colors duration-150 ${isLight ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#060E1F] text-slate-100'}`}>
      <div className="w-full max-w-md">
          <LoginForm />
      </div>
    </section>
  );
}
