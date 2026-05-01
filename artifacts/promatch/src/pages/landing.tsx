import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BookOpen,
  Users,
  Briefcase,
  Brain,
  ArrowRight,
  GraduationCap,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Award,
  Building2,
  UserCheck,
} from "lucide-react";

function FadeIn({
  children,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const features = [
  {
    icon: Brain,
    color: "bg-violet-100 text-violet-600",
    title: "AI Gợi ý đề tài",
    desc: "Thuật toán AI phân tích hồ sơ sinh viên và xu hướng thị trường để gợi ý đề tài phù hợp nhất.",
  },
  {
    icon: Users,
    color: "bg-blue-100 text-blue-600",
    title: "Quản lý nhóm dự án",
    desc: "Theo dõi tiến độ, phân công công việc và đánh giá mức đóng góp của từng thành viên nhóm.",
  },
  {
    icon: Briefcase,
    color: "bg-emerald-100 text-emerald-600",
    title: "Kết nối doanh nghiệp",
    desc: "Doanh nghiệp đặt hàng đề tài thực tế, sinh viên nhận dự án có giá trị và cơ hội việc làm.",
  },
  {
    icon: BookOpen,
    color: "bg-orange-100 text-orange-600",
    title: "Kho tri thức",
    desc: "Hệ thống lưu trữ và chia sẻ tài liệu, báo cáo và kinh nghiệm từ các khóa trước.",
  },
];

const roles = [
  {
    icon: GraduationCap,
    label: "Sinh viên",
    desc: "Tìm đề tài, lập nhóm, quản lý dự án và xây dựng hồ sơ năng lực ấn tượng.",
  },
  {
    icon: UserCheck,
    label: "Giảng viên",
    desc: "Hướng dẫn nhiều nhóm hiệu quả với dashboard quản lý lớp và phân tích tiến độ.",
  },
  {
    icon: Building2,
    label: "Doanh nghiệp",
    desc: "Đặt hàng đề tài thực tế, tiếp cận nguồn nhân lực trẻ tài năng trực tiếp.",
  },
  {
    icon: Award,
    label: "Cựu sinh viên",
    desc: "Chia sẻ kinh nghiệm, mentoring và đóng góp vào kho tri thức cộng đồng.",
  },
];

const stats = [
  { value: "1,200+", label: "Sinh viên tham gia" },
  { value: "340+", label: "Đề tài đăng tải" },
  { value: "80+", label: "Doanh nghiệp đối tác" },
  { value: "95%", label: "Hài lòng với nền tảng" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-primary font-bold text-xl tracking-tight">
            <Sparkles className="w-5 h-5" />
            PROMATCH
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Tính năng</a>
            <a href="#roles" className="hover:text-foreground transition-colors">Vai trò</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Thống kê</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-xl">Đăng nhập</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-xl gap-1.5">
                Bắt đầu miễn phí <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(226,71%,40%)/0.12,transparent)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[hsl(226,71%,40%)]/5 blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-72 h-72 rounded-full bg-[hsl(180,80%,40%)]/8 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Nền tảng quản lý đề tài tốt nghiệp thông minh
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
          >
            Đề tài phù hợp,
            <br />
            <span className="text-primary">nhóm hoàn hảo</span>,
            <br />
            thành công rõ ràng
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-center text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            PROMATCH kết nối sinh viên, giảng viên và doanh nghiệp trong một nền tảng quản lý
            đề tài capstone toàn diện — từ gợi ý AI đến theo dõi tiến độ và đánh giá đóng góp.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href="/register">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="rounded-xl h-12 px-8 gap-2 font-semibold shadow-lg shadow-primary/25">
                  Bắt đầu miễn phí
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/login">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" size="lg" className="rounded-xl h-12 px-8 font-semibold">
                  Đăng nhập
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Hero visual card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 max-w-3xl mx-auto rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/8 overflow-hidden"
          >
            <div className="h-8 bg-muted/60 flex items-center gap-1.5 px-4 border-b border-border/60">
              <span className="w-3 h-3 rounded-full bg-red-400/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <span className="w-3 h-3 rounded-full bg-green-400/70" />
              <span className="ml-3 text-xs text-muted-foreground">PROMATCH — Bảng điều khiển</span>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4">
              {[
                { label: "Đề tài đang chạy", value: "3", color: "bg-blue-50 text-blue-700 border-blue-100" },
                { label: "Tiến độ trung bình", value: "72%", color: "bg-violet-50 text-violet-700 border-violet-100" },
                { label: "Gợi ý AI mới", value: "12", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs mt-0.5 opacity-80">{s.label}</div>
                </div>
              ))}
              <div className="col-span-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Tiến độ dự án: Hệ thống quản lý thư viện</span>
                  <span className="text-xs text-muted-foreground">68%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "68%" }}
                    transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"].map((name) => (
                    <span key={name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold">
                        {name[0]}
                      </span>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="py-16 border-y border-border/50 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.08}>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary">{s.value}</div>
                  <div className="text-muted-foreground text-sm mt-1">{s.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="text-primary text-sm font-semibold uppercase tracking-widest">Tính năng nổi bật</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold leading-tight">
                Mọi thứ bạn cần
                <br />
                trong một nền tảng
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Từ AI gợi ý đề tài thông minh đến quản lý nhóm và kết nối doanh nghiệp — PROMATCH có tất cả.
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <FadeIn key={f.title} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.10)" }}
                    className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300"
                  >
                    <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </motion.div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="roles" className="py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="text-primary text-sm font-semibold uppercase tracking-widest">Dành cho mọi người</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Ai cũng tìm thấy giá trị</h2>
              <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                PROMATCH phục vụ 5 nhóm người dùng khác nhau với giao diện và tính năng được tối ưu riêng.
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r, i) => {
              const Icon = r.icon;
              return (
                <FadeIn key={r.label} delay={i * 0.08}>
                  <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{r.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(226,71%,30%)] via-[hsl(226,71%,40%)] to-[hsl(200,80%,45%)] p-10 sm:p-14 text-center">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Sẵn sàng bắt đầu chưa?
                </h2>
                <p className="mt-3 text-white/70 text-lg max-w-xl mx-auto">
                  Đăng ký miễn phí hôm nay và trải nghiệm cách PROMATCH thay đổi cách bạn làm đề tài tốt nghiệp.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/register">
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                      <Button size="lg" className="rounded-xl h-12 px-8 bg-white text-primary hover:bg-white/90 font-semibold gap-2 shadow-lg">
                        Tạo tài khoản ngay
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/login">
                    <Button
                      size="lg"
                      variant="ghost"
                      className="rounded-xl h-12 px-8 text-white hover:bg-white/15 font-semibold border border-white/20"
                    >
                      Đăng nhập
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
              <Sparkles className="w-[18px] h-[18px]" />
              PROMATCH
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-foreground transition-colors">Đăng nhập</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Đăng ký</Link>
              <a href="#features" className="hover:text-foreground transition-colors">Tính năng</a>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} PROMATCH. Bảo lưu mọi quyền.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
