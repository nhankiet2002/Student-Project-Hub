import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "@/components/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function FieldError({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="text-destructive text-xs mt-1.5 flex items-center gap-1"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function SocialButton({
  provider,
  icon,
  onClick,
}: {
  provider: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2.5 rounded-xl border border-border bg-background hover:bg-muted py-2.5 text-sm font-medium text-foreground transition-colors shadow-sm"
    >
      {icon}
      {provider}
    </motion.button>
  );
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const errors = {
    email: touched.email
      ? !email.trim()
        ? "Email không được để trống"
        : !isValidEmail(email)
          ? "Định dạng email không hợp lệ"
          : ""
      : "",
    password: touched.password && !password ? "Mật khẩu không được để trống" : "",
  };

  const isValid = isValidEmail(email) && password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;
    setApiError("");
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/home");
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      const msg = raw.replace(/^HTTP \d+ [^:]+: /, "") || "Email hoặc mật khẩu không đúng";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục với PROMATCH"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* API Error */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {apiError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="email"
              placeholder="ten@truong.edu.vn"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setApiError(""); }}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className={`pl-10 h-11 rounded-xl transition-all ${errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
            />
          </div>
          <FieldError message={errors.email} />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-foreground">Mật khẩu</label>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setLocation("/forgot-password")}
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setApiError(""); }}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              className={`pl-10 pr-11 h-11 rounded-xl transition-all ${errors.password ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <FieldError message={errors.password} />
        </div>

        {/* Hint: available accounts */}
        <div className="rounded-lg bg-muted/60 border border-border px-3 py-2.5 text-xs text-muted-foreground space-y-1">
          <div className="font-medium text-foreground mb-1">Tài khoản demo (Mật khẩu: password123):</div>
          <div>Sinh viên: <span className="font-mono">minhanh@student.edu.vn</span></div>
          <div>Giảng viên: <span className="font-mono">qbao@edu.vn</span></div>
          <div>Doanh nghiệp: <span className="font-mono">partner@fpt-software.vn</span></div>

          <div>Quản trị (1 tài khoản): <span className="font-mono">admin@promatch.vn</span></div>
        </div>

        {/* Submit */}
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold text-sm gap-2 mt-1"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              <>
                Đăng nhập
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">hoặc tiếp tục với</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social buttons */}
        <div className="flex gap-3">
          <SocialButton
            provider="Google"
            icon={
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            }
            onClick={() => {}}
          />
          <SocialButton
            provider="GitHub"
            icon={
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-foreground">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            }
            onClick={() => {}}
          />
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-muted-foreground pt-1">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
