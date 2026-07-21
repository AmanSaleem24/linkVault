"use client";

import { motion } from "framer-motion";

export function HeroDashboardMockup() {
  return (
    <div className="relative h-[520px] w-full">
      {/* Ambient glow */}
      <div className="absolute -inset-12 bg-gradient-to-br from-[#3D52A0]/20 via-[#7091E6]/10 to-[#ADBBDA]/15 blur-3xl dark:from-[#3D52A0]/25 dark:via-[#7091E6]/15 dark:to-[#ADBBDA]/20" />

      <motion.div
        whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 22 } }}
        className="relative h-full w-full rounded-2xl bg-white shadow-2xl shadow-[#3D52A0]/10 dark:bg-slate-800 dark:shadow-[#3D52A0]/20 overflow-hidden"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-700/50">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400 dark:bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-amber-400 dark:bg-amber-500" />
            <div className="h-3 w-3 rounded-full bg-green-400 dark:bg-green-500" />
          </div>
          <div className="flex-1 rounded-md bg-white px-3 py-1 text-xs text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            vault.app/dashboard
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-5 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Clicks", value: "12.4K", change: "+12%", positive: true },
              { label: "Active Links", value: "48", change: "+3", positive: true },
              { label: "Top Country", value: "US", change: "", positive: true },
              { label: "Avg CTR", value: "4.2%", change: "+0.3%", positive: true },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/80"
              >
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {stat.change}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/80"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Clicks Over Time
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Last 30 days
                </p>
              </div>
              <div className="flex gap-1">
                {["7d", "30d", "90d"].map((d, i) => (
                  <span
                    key={d}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
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
            <div className="mt-3 flex items-end gap-1.5 h-16">
              {[35, 50, 42, 65, 55, 80, 70, 60, 75, 45, 85, 68, 52, 78, 90].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{
                    duration: 0.5,
                    delay: 0.9 + i * 0.03,
                    ease: "easeOut",
                  }}
                  className="flex-1 rounded-sm bg-gradient-to-t from-[#3D52A0] to-[#7091E6] dark:from-[#3D52A0] dark:to-[#7091E6]/70"
                  style={{
                    animation: `bar-shimmer 3s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Recent Links */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/80 overflow-hidden"
          >
            <div className="border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Recent Links
              </p>
            </div>
            {[
              { slug: "promo-2024", clicks: "2.4K" },
              { slug: "summer-sale", clicks: "1.8K" },
              { slug: "webinar-signup", clicks: "956" },
            ].map((link, i) => (
              <motion.div
                key={link.slug}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + i * 0.08, duration: 0.3 }}
                className="flex items-center justify-between border-b border-slate-100 px-4 py-2 last:border-0 dark:border-slate-700/50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-xs text-[#3D52A0] dark:text-[#7091E6]">
                    /{link.slug}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {link.clicks} clicks
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
