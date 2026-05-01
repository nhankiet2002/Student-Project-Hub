import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "@/components/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

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
          className="text-destructive text-xs mt-1.5"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

const ROLES = [
  { value: "student", label: "Sinh viên" },
  { value: "instructor", label: "Giảng viên" },
  { value: "enterprise", label: "Doanh nghiệp" },
  { value: "alumni", label: "Cựu sinh viên" },
  { value: "admin", label: "Quản trị viên" },
];

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirm: false,
    role: false,
  });
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const touch = (field: keyof typeof touched) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  const errors = {
    name: touched.name && !form.name.trim() ? "Họ và tên không được để trống" : "",
    email: touched.email
      ? !form.email.trim()
        ? "Email không được để trống"
        : !isValidEmail(form.email)
          ? "Định dạng email không hợp lệ"
          : ""
      : "",
    password: touched.password
      ? !form.password
        ? "Mật khẩu không được để trống"
        : form.password.length < 8
          ? "Mật khẩu phải có ít nhất 8 ký tự"
          : ""
      : "",
    confirm: touched.confirm
      ? !form.confirm
        ? "Vui lòng xác nhận mật khẩu"
        : form.confirm !== form.password
          ? "Mật khẩu xác nhận không khớp"
          : ""
      : "",
    role: touched.role && !form.role ? "Vui lòng chọn vai trò" : "",
  };

  const isValid =
    form.name.trim() &&
    isValidEmail(form.email) &&
    form.password.length >= 8 &&
    form.confirm === form.password &&
    form.role;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true, role: true });
    if (!isValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLocation("/login");
    }, 1200);
  }

  const inputClass = (error: string) =>
    `h-11 rounded-xl transition-all ${error ? "border-destructive focus-visible:ring-destructive/30" : ""}`;

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Tham gia PROMATCH — nền tảng quản lý đề tài thông minh"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full name */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Họ và tên
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              onBlur={touch("name")}
              className={"pl-10 " + inputClass(errors.name)}
            />
          </div>
          <FieldError message={errors.name} />
        </div>

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
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              onBlur={touch("email")}
              className={"pl-10 " + inputClass(errors.email)}
            />
          </div>
          <FieldError message={errors.email} />
        </div>

        {/* Role dropdown */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Vai trò
          </label>
          <Select
            value={form.role}
            onValueChange={(v) => {
              set("role")(v);
              setTouched((t) => ({ ...t, role: true }));
            }}
          >
            <SelectTrigger
              className={`h-11 rounded-xl ${errors.role ? "border-destructive" : ""}`}
              onBlur={touch("role")}
            >
              <SelectValue placeholder="Chọn vai trò của bạn..." />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.role} />
        </div>

        {/* Password */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Ít nhất 8 ký tự"
              value={form.password}
              onChange={(e) => set("password")(e.target.value)}
              onBlur={touch("password")}
              className={"pl-10 pr-11 " + inputClass(errors.password)}
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

        {/* Confirm password */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              value={form.confirm}
              onChange={(e) => set("confirm")(e.target.value)}
              onBlur={touch("confirm")}
              className={"pl-10 pr-11 " + inputClass(errors.confirm)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <FieldError message={errors.confirm} />
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
                Đang tạo tài khoản...
              </>
            ) : (
              <>
                Đăng ký
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground pt-1">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
