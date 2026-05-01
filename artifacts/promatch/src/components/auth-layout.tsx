import { motion } from "framer-motion";
import { Link } from "wouter";
import { Sparkles, GraduationCap, Briefcase, Users, Award } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const floatingIcons = [
  { Icon: GraduationCap, top: "18%", left: "12%", delay: 0 },
  { Icon: Briefcase, top: "55%", left: "6%", delay: 0.4 },
  { Icon: Users, top: "30%", left: "75%", delay: 0.8 },
  { Icon: Award, top: "68%", left: "68%", delay: 0.2 },
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-[hsl(226,71%,14%)] flex-col justify-between p-12">
        {/* Gradient orbs */}
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[hsl(226,71%,40%)]/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-[hsl(180,80%,40%)]/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(226,71%,25%)]/40 blur-3xl pointer-events-none" />

        {/* Floating icons */}
        {floatingIcons.map(({ Icon, top, left, delay }, i) => (
          <motion.div
            key={i}
            className="absolute w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm"
            style={{ top, left }}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay, ease: "easeInOut" }}
          >
            <Icon className="w-5 h-5 text-white/60" />
          </motion.div>
        ))}

        {/* Logo */}
        <Link href="/landing">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 relative z-10 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">PROMATCH</span>
          </motion.div>
        </Link>

        {/* Center content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Nền tảng quản lý đề tài hàng đầu
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Kết nối sinh viên,
            <br />
            <span className="text-[hsl(180,80%,60%)]">doanh nghiệp</span>
            <br />
            &amp; giảng viên
          </h2>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm">
            PROMATCH giúp tìm đề tài phù hợp, quản lý nhóm dự án và theo dõi tiến độ một cách thông minh.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-2">
            {[
              { value: "1,200+", label: "Sinh viên" },
              { value: "340+", label: "Đề tài" },
              { value: "80+", label: "Doanh nghiệp" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-white/50 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative z-10 border-t border-white/10 pt-6"
        >
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} PROMATCH. Nền tảng quản lý đề tài tốt nghiệp.
          </p>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-[hsl(222,47%,9%)] relative overflow-hidden">
        {/* Subtle bg pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(hsl(226,71%,40%)/0.04)_1px,transparent_1px] [background-size:32px_32px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="font-bold text-xl text-primary tracking-tight">PROMATCH</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
