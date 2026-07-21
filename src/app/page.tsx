"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Sparkles,
  Star,
  Rocket,
  Quote,
  AtSign,
  Mail,
  MessageCircle,
  X,
  Link2,
  BarChart3,
  QrCode,
  Zap,
  Shield,
  Globe,
  Users,
  TrendingUp,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { motion, useScroll, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { HeroDashboardMockup } from "@/components/home/login-mockup-3d";
import {
  AnimatedCounter,
} from "@/components/home/page-shared";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}

interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}

interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
  avatarBg: string;
}

const features: Feature[] = [
  {
    icon: Link2,
    title: "Smart Shortening",
    description:
      "Transform long URLs into clean, memorable short links with custom slugs and smart redirection.",
    accent: "#3D52A0",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description:
      "Track clicks by browser, OS, device, country, and referrer. Understand your audience like never before.",
    accent: "#7091E6",
  },
  {
    icon: QrCode,
    title: "QR Code Generator",
    description:
      "Generate customizable QR codes for any link. Download in high-resolution PNG for print and digital.",
    accent: "#ADBBDA",
  },
  {
    icon: Zap,
    title: "Edge Cached",
    description:
      "Sub-50ms redirects powered by Upstash Redis edge caching. Your links load fast everywhere.",
    accent: "#3D52A0",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "JWT authentication, row-level access control, bcrypt password hashing. Your data stays safe.",
    accent: "#7091E6",
  },
  {
    icon: Globe,
    title: "Custom Domains",
    description:
      "Brand your short links with your own domain. Build trust and increase click-through rates.",
    accent: "#ADBBDA",
  },
];

const stats = [
  { value: 50, suffix: "ms", label: "Avg Redirect Time", icon: Zap, accent: "#3D52A0" },
  { value: 99.9, suffix: "%", label: "Uptime SLA", icon: TrendingUp, accent: "#7091E6" },
  { value: 10, suffix: "K+", label: "Links Created", icon: Link2, accent: "#ADBBDA" },
  { value: 150, suffix: "+", label: "Countries Reached", icon: Globe, accent: "#3D52A0" },
];

const steps: HowItWorksStep[] = [
  {
    step: "01",
    title: "Create Your Account",
    description:
      "Sign up in seconds with email or Google OAuth. No credit card required for the free plan.",
    icon: Users,
    accent: "#3D52A0",
  },
  {
    step: "02",
    title: "Shorten & Customize",
    description:
      "Paste any URL, set a custom slug, add QR codes, and configure expiration dates.",
    icon: Link2,
    accent: "#7091E6",
  },
  {
    step: "03",
    title: "Share & Analyze",
    description:
      "Distribute your links anywhere. Watch real-time analytics roll in with deep insights.",
    icon: BarChart3,
    accent: "#ADBBDA",
  },
];

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Marketing Lead, TechFlow",
    content:
      "LinkVault transformed how we track campaign performance. The analytics are incredibly detailed.",
    avatar: "SC",
    avatarBg: "bg-[#3D52A0]",
  },
  {
    name: "Marcus Johnson",
    role: "Founder, LaunchPad",
    content:
      "The fastest URL shortener I've used. The edge caching makes a real difference for our global audience.",
    avatar: "MJ",
    avatarBg: "bg-[#7091E6]",
  },
  {
    name: "Emily Rodriguez",
    role: "Product Manager, ScaleUp",
    content:
      "QR code generation and custom domains helped us rebrand our entire link strategy in a day.",
    avatar: "ER",
    avatarBg: "bg-[#ADBBDA]",
  },
];

const logos = [
  "TechFlow",
  "LaunchPad",
  "ScaleUp",
  "CloudBase",
  "DataSync",
  "PixelCraft",
];

const pricingTiers = [
  {
    name: "Free",
    price: "₹0",
    description: "Perfect for personal projects and testing.",
    features: [
      "Up to 50 short links",
      "Custom slugs (3-50 chars)",
      "QR code generation (10/month)",
      "Basic analytics",
      "7-day click history",
      "Email support",
    ],
    cta: "Start for free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹99",
    description: "For professionals who need unlimited power.",
    features: [
      "Unlimited short links",
      "Custom domains",
      "Unlimited QR codes",
      "Advanced analytics & reports",
      "90-day click history",
      "CSV export",
      "UTM parameter tracking",
      "Priority support",
    ],
    cta: "Get Pro",
    href: "/signup",
    highlighted: true,
  },
];

// ─── Reusable Section Header ──────────────────────────────────────────────────

function SectionHeader({
  tag,
  title,
  subtitle,
  align = "center",
}: {
  tag: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`mx-auto max-w-3xl ${align === "center" ? "text-center" : "text-left"}`}
    >
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="inline-flex items-center rounded-full bg-[#EDE8F5] px-3 py-1 text-xs font-semibold tracking-wider uppercase text-[#3D52A0] dark:bg-[#3D52A0]/15 dark:text-[#7091E6]"
      >
        {tag}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay: 0.05, ease: "easeOut" }}
        className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="mt-4 text-lg leading-relaxed text-slate-500 dark:text-slate-400"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

// ─── Logo Marquee ─────────────────────────────────────────────────────────────

function LogoMarquee() {
  const extended = [...logos, ...logos];
  return (
    <div className="relative overflow-hidden py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent dark:from-slate-900 z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent dark:from-slate-900 z-10" />
      <motion.div
        animate={{ x: [0, -420] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex gap-16 whitespace-nowrap"
      >
        {extended.map((name, i) => (
          <span
            key={i}
            className="text-lg font-bold text-slate-300 dark:text-slate-600 select-none tracking-wide"
          >
            {name}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Pricing Card ─────────────────────────────────────────────────────────────

function PricingCard({
  name,
  price,
  description,
  features: planFeatures,
  cta,
  href,
  highlighted = false,
  delay = 0,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      className="relative h-full"
    >
      <div
        className={`relative flex h-full flex-col rounded-2xl border bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl dark:bg-slate-800 ${
          highlighted
            ? "border-[#3D52A0] shadow-[#3D52A0]/10 dark:shadow-[#3D52A0]/20"
            : "border-slate-200 dark:border-slate-700"
        }`}
      >
        {highlighted && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3D52A0] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#3D52A0]/30">
              <Sparkles className="h-3.5 w-3.5" />
              Most Popular
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{name}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>

          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
              {price}
            </span>
            {price !== "Custom" && (
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/month</span>
            )}
          </div>

          <Link
            href={href}
            className={`mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 ${
              highlighted
                ? "bg-[#3D52A0] text-white shadow-lg shadow-[#3D52A0]/25 hover:bg-[#2E3F80] hover:shadow-xl hover:shadow-[#3D52A0]/30 active:scale-[0.98]"
                : "border-2 border-slate-200 bg-white text-slate-700 hover:border-[#3D52A0]/40 hover:bg-[#EDE8F5]/50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-[#3D52A0]/50 dark:hover:bg-[#3D52A0]/10 active:scale-[0.98]"
            }`}
          >
            {cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>

          <ul className="mt-8 space-y-3.5">
            {planFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-500" />
                <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function useNavScroll({ scrollY }: ReturnType<typeof useScroll>) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const unsub = scrollY.on("change", (v: number) => setScrolled(v > 30));
    return unsub;
  }, [scrollY]);
  return scrolled;
}

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scroll = useScroll();
  const scrolled = useNavScroll(scroll);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <motion.header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
          : "border-b border-transparent bg-white/80 backdrop-blur-sm dark:bg-slate-900/80"
      }`}
    >
      <div className="global-content flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2.5" prefetch={false}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3D52A0] shadow-md shadow-[#3D52A0]/25">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            LinkVault
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#3D52A0] dark:text-slate-400 dark:hover:text-[#7091E6]"
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#3D52A0] dark:text-slate-400 dark:hover:text-[#7091E6]"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-xl bg-[#3D52A0] px-5 text-sm font-bold text-white shadow-md shadow-[#3D52A0]/20 transition-all duration-200 hover:bg-[#2E3F80] hover:shadow-lg hover:shadow-[#3D52A0]/30 active:scale-[0.97]"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="border-t border-slate-200 bg-white/95 px-6 pb-6 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 text-sm font-medium text-slate-600 dark:text-slate-400"
              onClick={() => setMobileOpen(false)}
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/login" className="block text-center text-sm font-semibold text-slate-600 dark:text-slate-400">Log In</Link>
            <Link
              href="/signup"
              className="flex h-11 items-center justify-center rounded-xl bg-[#3D52A0] text-sm font-bold text-white"
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 22 } }}
      className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow duration-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:shadow-[#3D52A0]/15"
    >
      {/* Icon */}
      <div
        className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
        style={{ backgroundColor: `${feature.accent}18` }}
      >
        <feature.icon className="h-6 w-6" style={{ color: feature.accent }} />
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {feature.description}
      </p>

      {/* Arrow indicator */}
      <div className="mt-6 flex items-center gap-1 text-sm font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ color: feature.accent }}>
        Learn more <ChevronRight className="h-4 w-4" />
      </div>
    </motion.div>
  );
}

// ─── Dashboard Preview Section ────────────────────────────────────────────────

function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="dashboard-preview" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#3D52A0]/15 via-[#7091E6]/10 to-[#ADBBDA]/10 blur-[120px] dark:from-[#3D52A0]/20 dark:via-[#7091E6]/12 dark:to-[#ADBBDA]/15" />
      </div>

      <div className="global-content relative z-10">
        <SectionHeader
          tag="Dashboard"
          title="Your links, beautifully organized"
          subtitle="A clean, powerful dashboard to manage every link, track performance, and export data."
        />

        <motion.div
          ref={ref}
          initial={{ y: 40, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative mt-16"
        >
          {/* Glow behind */}
          <div className="absolute -inset-8 bg-gradient-to-r from-[#3D52A0]/20 via-[#7091E6]/15 to-violet-500/20 blur-3xl dark:from-[#3D52A0]/25 dark:via-[#7091E6]/20 dark:to-violet-500/25" />

          <div className="relative mx-auto max-w-5xl">
            {/* Browser chrome */}
            <div className="rounded-t-xl border border-b-0 border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400 dark:bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-400 dark:bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-green-400 dark:bg-green-500" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-white px-3 py-1 text-xs text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                  link-vault-theta.vercel.app/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="rounded-b-xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-900/50">
              <div className="grid grid-cols-12">
                {/* Sidebar mock */}
                <div className="hidden md:col-span-3 md:flex md:flex-col md:border-r md:border-slate-200 md:dark:border-slate-700 md:p-4 md:gap-1">
                  {["Overview", "All Links", "Analytics", "QR Codes", "Activity", "Settings"].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                        i === 0
                          ? "bg-[#ECEEFE] text-[#2B0094] dark:bg-[#3D52A0]/20 dark:text-[#7091E6]"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${
                          i === 0 ? "bg-[#2B0094] dark:bg-[#7091E6]" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      {item}
                    </motion.div>
                  ))}
                </div>

                {/* Main content */}
                <div className="col-span-12 p-6 md:col-span-9">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Total Clicks", value: "12.4K", change: "+12%" },
                      { label: "Active Links", value: "48", change: "+3" },
                      { label: "Top Country", value: "US", change: "" },
                      { label: "Avg CTR", value: "4.2%", change: "+0.3%" },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/80"
                      >
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {stat.label}
                        </p>
                        <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">
                          {stat.value}
                        </p>
                        {stat.change && (
                          <p className="mt-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {stat.change}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Chart mock */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-800/80"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Clicks Over Time
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Last 30 days
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {["7d", "30d", "90d"].map((d, i) => (
                          <span
                            key={d}
                            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                              i === 1
                                ? "bg-[#3D52A0] text-white"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Animated bars */}
                    <div className="mt-4 flex items-end gap-1.5 h-24">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const heights = [35, 50, 42, 65, 55, 80, 70, 60, 75, 45, 85, 68, 52, 78, 90, 62, 48, 72, 88, 58, 70, 82, 55, 67, 92, 76, 60, 84, 70, 95];
                        const h = heights[i] || 50;
                        return (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 0.6, delay: 1 + i * 0.03, ease: "easeOut" }}
                            className="flex-1 rounded-sm bg-gradient-to-t from-[#3D52A0] to-[#7091E6] dark:from-[#3D52A0] dark:to-[#7091E6]/70"
                          />
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Links table mock */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/80 overflow-hidden"
                  >
                    <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Recent Links
                      </p>
                    </div>
                    {[
                      { slug: "promo-2024", clicks: "2.4K", status: "active" },
                      { slug: "summer-sale", clicks: "1.8K", status: "active" },
                      { slug: "webinar-signup", clicks: "956", status: "active" },
                    ].map((link) => (
                      <div
                        key={link.slug}
                        className="flex items-center justify-between border-b border-slate-100 px-5 py-3 last:border-0 dark:border-slate-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="font-mono text-sm text-[#2B0094] dark:text-[#7091E6]">
                            /{link.slug}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {link.clicks} clicks
                        </span>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────

function StepCard({ step, index }: { step: HowItWorksStep; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: "easeOut" }}
      className="relative flex flex-col items-center text-center"
    >
      {/* Number circle */}
      <motion.div
        whileHover={{ scale: 1.08, transition: { type: "spring", stiffness: 300, damping: 18 } }}
        className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-extrabold text-white shadow-lg"
        style={{ backgroundColor: step.accent }}
      >
        {step.step}
        <div className="absolute -inset-1 rounded-2xl opacity-40 blur-md" style={{ backgroundColor: step.accent }} />
      </motion.div>

      {/* Icon */}
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
        <step.icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
        {step.title}
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {step.description}
      </p>

      {/* Connector line (except last) */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-8 left-[calc(50%+3rem)] w-[calc(100%-6rem)]">
          <div className="h-px bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
    >
      <Quote className="mb-4 h-8 w-8 text-[#3D52A0]/20 dark:text-[#7091E6]/20" />
      <p className="flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        &ldquo;{testimonial.content}&rdquo;
      </p>
      <div className="mt-6 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${testimonial.avatarBg}`}
        >
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {testimonial.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {testimonial.role}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="relative flex flex-col">
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <motion.div
            animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-32 top-20 h-[500px] w-[500px] rounded-full bg-[#3D52A0]/12 blur-[120px] dark:bg-[#3D52A0]/18"
          />
          <motion.div
            animate={{ y: [0, 40, 0], x: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -right-32 top-40 h-[400px] w-[400px] rounded-full bg-[#7091E6]/10 blur-[100px] dark:bg-[#7091E6]/14"
          />
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, -15, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-[#ADBBDA]/8 blur-[100px] dark:bg-[#ADBBDA]/12"
          />
        </div>

        <div className="global-content relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left - Content */}
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="inline-flex items-center gap-2 rounded-full bg-[#EDE8F5] px-4 py-1.5 dark:bg-[#3D52A0]/15"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-[#3D52A0] dark:text-[#7091E6]">
                  Now in Public Beta
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl"
              >
                Shorten links that{" "}
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#ADBBDA] bg-clip-text text-transparent">
                    convert
                  </span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none" aria-hidden="true">
                    <path d="M2 8c50-6 100-6 148-2s100 4 148-2" stroke="#3D52A0" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="mt-6 text-lg leading-relaxed text-slate-500 dark:text-slate-400"
              >
                Powerful URL shortening with deep analytics, custom branded links, and QR codes.
                Trusted by marketing teams and developers who demand performance.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <Link
                  href="/signup"
                  className="group inline-flex h-14 items-center rounded-2xl bg-[#3D52A0] px-8 text-base font-bold text-white shadow-xl shadow-[#3D52A0]/25 transition-all duration-200 hover:bg-[#2E3F80] hover:shadow-2xl hover:shadow-[#3D52A0]/30 active:scale-[0.97]"
                >
                  Get Started Free
                  <ArrowRight className="ml-2.5 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex h-14 items-center rounded-2xl border-2 border-slate-200 bg-white px-8 text-base font-bold text-slate-700 transition-all duration-200 hover:border-[#3D52A0]/30 hover:bg-[#EDE8F5]/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-[#3D52A0]/50 dark:hover:bg-[#3D52A0]/10 active:scale-[0.97]"
                  prefetch={false}
                >
                  See How It Works
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-8 flex items-center gap-4"
              >
                <div className="flex -space-x-2">
                  {["bg-[#3D52A0]", "bg-[#7091E6]", "bg-[#ADBBDA]", "bg-[#8697C4]"].map((color, i) => (
                    <div key={i} className={`h-8 w-8 rounded-full border-2 border-white ${color} dark:border-slate-800`} />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Loved by 2,000+ teams worldwide
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right - 3D Login Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative"
            >
              <HeroDashboardMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Logo Marquee ───────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/30">
        <div className="global-content">
          <p className="py-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Trusted by innovative teams worldwide
          </p>
          <LogoMarquee />
        </div>
      </section>

      {/* ── Stats Section ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3D52A0]/5 blur-[150px] dark:bg-[#3D52A0]/8" />
        </div>

        <div className="global-content relative z-10">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                className="text-center"
              >
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${stat.accent}14` }}
                >
                  <stat.icon className="h-6 w-6" style={{ color: stat.accent }} />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────────────────────── */}
      <section id="features" className="relative overflow-hidden py-24">
        <div className="global-content relative z-10">
          <SectionHeader
            tag="Features"
            title="Everything you need to manage your links"
            subtitle="From shortening to analytics, QR codes to custom domains — LinkVault gives you a complete toolkit for link management."
          />

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview ────────────────────────────────────────────── */}
      <DashboardPreview />

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative overflow-hidden bg-slate-50 py-24 dark:bg-slate-800/30">
        <div className="global-content relative z-10">
          <SectionHeader
            tag="How It Works"
            title="Get started in three simple steps"
            subtitle="No complicated setup. No credit card required. Start shortening links in under 60 seconds."
          />

          <div className="mt-20 grid gap-12 lg:grid-cols-3">
            {steps.map((step, i) => (
              <StepCard key={step.step} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section id="testimonials" className="relative overflow-hidden py-24">
        <div className="global-content">
          <SectionHeader
            tag="Testimonials"
            title="Loved by teams everywhere"
            subtitle="See why thousands of teams choose LinkVault for their link management needs."
          />

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} testimonial={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────── */}
      <section id="pricing" className="relative overflow-hidden bg-slate-50 py-24 dark:bg-slate-800/30">
        <div className="global-content relative z-10">
          <SectionHeader
            tag="Pricing"
            title="Simple, transparent pricing"
            subtitle="Start free, upgrade when you need more. No hidden fees, no surprises."
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {pricingTiers.map((tier, i) => (
              <PricingCard key={tier.name} {...tier} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#3D52A0]/15 via-[#7091E6]/10 to-[#ADBBDA]/10 blur-[120px] dark:from-[#3D52A0]/20 dark:via-[#7091E6]/12 dark:to-[#ADBBDA]/15" />
        </div>

        <div className="global-content relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#3D52A0] to-[#1F2C5C] px-8 py-16 text-center shadow-2xl shadow-[#3D52A0]/25 dark:shadow-[#3D52A0]/30 sm:px-16"
          >
            {/* Decorative */}
            <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden="true">
              <div className="h-full w-full" style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }} />
            </div>

            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Ready to supercharge your links?
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/80">
                Join thousands of teams using LinkVault to create, manage, and track their short links.
                Start free today — no credit card required.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="group inline-flex h-14 items-center rounded-2xl bg-white px-8 text-base font-bold text-[#3D52A0] shadow-lg transition-all duration-200 hover:bg-[#EDE8F5] hover:shadow-xl active:scale-[0.97]"
                >
                  Start Building for Free
                  <ArrowRight className="ml-2.5 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center rounded-2xl border-2 border-white/25 px-8 text-base font-bold text-white transition-all duration-200 hover:border-white/50 hover:bg-white/10 active:scale-[0.97]"
                >
                  Sign In
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/50">
                Free forever for personal use · No credit card required
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="global-content py-16 md:py-20">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5" prefetch={false}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3D52A0] shadow-md shadow-[#3D52A0]/25">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                  LinkVault
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Smart URL shortener with analytics, custom slugs, and QR code generation.
                Built for teams that ship.
              </p>
              <div className="mt-6 flex items-center gap-3">
                {[
                  { name: "Twitter", icon: AtSign, href: "#" },
                  { name: "Email", icon: Mail, href: "#" },
                  { name: "Chat", icon: MessageCircle, href: "#" },
                ].map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    <social.icon className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                Product
              </h3>
              <ul className="mt-4 space-y-3">
                {["Features", "Pricing", "Analytics", "QR Codes"].map((item) => (
                  <li key={item}>
                    <Link
                      href="/pricing"
                      className="text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      prefetch={false}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                Company
              </h3>
              <ul className="mt-4 space-y-3">
                {["About", "Blog", "Contact", "Careers"].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                Legal
              </h3>
              <ul className="mt-4 space-y-3">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 border-t border-slate-200 pt-8 dark:border-slate-800">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                &copy; {new Date().getFullYear()} LinkVault. All rights reserved.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Built with Next.js, Prisma, and edge caching
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
