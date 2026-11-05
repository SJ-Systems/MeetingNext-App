import React, { useState } from 'react';
import {
  Video,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { AuthUser } from '../../types/meetingnext';
import { meetingNextApi } from '../../services/meetingNextApi';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('sarthak.jain@businessnext.com');
  const [password, setPassword] = useState('Sarthak@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await meetingNextApi.login(email.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Invalid credentials. Please verify your banking email and password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication service unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLoginAsSarthak = async () => {
    setEmail('sarthak.jain@businessnext.com');
    setPassword('Sarthak@2026');
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await meetingNextApi.login('sarthak.jain@businessnext.com', 'Sarthak@2026');
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-rose-100 selection:text-rose-700 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 flex items-center justify-center text-white shadow-sm shadow-pink-200">
              <Video className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                MeetingNext
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                CRMNEXT Enterprise Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AWS Mumbai (ap-south-1) Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header block */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              Authorized RM Identity Gateway
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Sign in to MeetingNext
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Access your meetings, customer relationship hub, and TRAI-compliant outbound telephony.
            </p>
          </div>

          {/* Quick Login Badge for Sarthak Jain */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/60 via-pink-50/30 to-amber-50/30 border border-rose-100/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-900">
                <UserCheck className="w-4 h-4 text-rose-600" />
                <span>Designated RM Session:</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                Primary Account
              </span>
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-rose-100/70 shadow-xs mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white font-bold text-sm flex items-center justify-center ring-2 ring-rose-200">
                SJ
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-sm truncate">Sarthak Jain, CFA</div>
                <div className="text-xs text-slate-500 truncate">sarthak.jain@businessnext.com</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Senior RM • Private Wealth & Lending</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickLoginAsSarthak}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-sm shadow-rose-200 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>1-Click Sign in as Sarthak Jain</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Traditional Form Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-medium text-slate-400">or sign in with password</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-2">
                <span className="font-bold">Error:</span> {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Bank Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@businessnext.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">
                  Default: <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded font-mono">Sarthak@2026</code>
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-rose-500 focus:ring-rose-400"
                />
                <span>Remember this workstation</span>
              </label>

              <button
                type="button"
                onClick={() => setPassword('Sarthak@2026')}
                className="text-xs font-medium text-rose-600 hover:text-rose-700"
              >
                Reset to default
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          {/* Security & Regulatory Footnote */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>TRAI 140/1600 CLI Enforced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                <span>Amazon Connect Integrated</span>
              </div>
            </div>
            <div className="text-[10px] text-center text-slate-400">
              CRMNEXT Enterprise Banking Session • Protected by 256-bit TLS encryption
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © 2026 MeetingNext by CRMNEXT • Bank Enterprise Communications Platform
      </footer>
    </div>
  );
};
