// ARCHIVED: Old mother learn page
// Replaced by main mother dashboard with integrated NurtureAI
// Route: /mother

/*
'use client';

import Link from 'next/link';
import { useState } from 'react';

/* export default function MotherLearn() {
  const [activeFilter, setActiveFilter] = useState('All Lessons');

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-primary/5 flex justify-between items-center px-6 py-4 w-full">
        <div className="flex items-center gap-2">
          <span className="font-brand text-3xl text-primary">Nurture</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-surface-variant/50 px-3 py-1.5 rounded-full text-[11px] font-bold text-primary/70 tracking-wider font-sans">
            EN/YO/HA/IG
          </button>
          <button className="bg-[#D32F2F] text-white px-5 py-2 rounded-full font-sans font-bold text-sm shadow-lg shadow-red-900/10 active:scale-95 transition-transform">
            SOS
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-10">
        {/* Welcome & Progress Section */}
        <section className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <div className="flex-1 w-full">
            <h1 className="text-3xl font-brand text-primary mb-2">Lesson Library</h1>
            <p className="text-on-surface/60 text-sm font-medium leading-relaxed">Knowledge for every step of your journey to motherhood.</p>
          </div>
          {/* Elegant Progress */}
          <div className="flex items-center gap-6 bg-white/60 backdrop-blur-sm p-4 pr-6 rounded-3xl border border-primary/5 shadow-sm">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-primary/5 stroke-current" cx="50" cy="50" fill="transparent" r="44" strokeWidth="6"></circle>
                <circle
                  className="text-secondary stroke-current"
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="44"
                  strokeDasharray="276.46"
                  strokeDashoffset="152.05"
                  strokeLinecap="round"
                  strokeWidth="6"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.35s' }}
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold text-sm text-primary">45%</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Your Progress</p>
              <p className="text-sm font-bold text-primary">12 of 28 lessons</p>
            </div>
          </div>
        </section>

        {/* Featured Daily Lesson */}
        <section className="mb-14">
          <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 p-1 rounded-[4.2rem] shadow-xl">
            <div className="bg-white/40 backdrop-blur-xl p-8 md:p-10 rounded-[4rem] relative overflow-hidden border border-white/60">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="material-symbols-outlined text-[140px] text-primary">menu_book</span>
              </div>
              <div className="relative z-10">
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="bg-white/80 border border-primary/5 px-4 py-1.5 rounded-full text-[10px] font-bold text-primary/70 uppercase tracking-wider">
                    Relevant to Week 28
                  </span>
                  <span className="bg-secondary/10 text-secondary border border-secondary/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Nutrition
                  </span>
                </div>
                <h2 className="text-3xl font-brand text-primary mb-3 leading-tight">Myth vs Fact: Can I eat eggs?</h2>
                <p className="text-sm font-semibold text-primary/40 uppercase tracking-widest mb-8">60-Second Lesson • Week 28</p>
                <div className="grid md:grid-cols-2 gap-5 mb-8">
                  {/* Myth Card */}
                  <div className="bg-white/60 p-6 rounded-2xl border border-white shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[#D32F2F] text-xl">cancel</span>
                      <span className="font-black text-[10px] uppercase tracking-widest text-[#D32F2F]/60">Myth</span>
                    </div>
                    <p className="text-sm font-medium italic text-on-surface/80 leading-relaxed">"Eating eggs makes the baby's head too big."</p>
                  </div>
                  {/* Fact Card */}
                  <div className="bg-white/80 p-6 rounded-2xl border border-white shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-success text-xl">check_circle</span>
                      <span className="font-black text-[10px] uppercase tracking-widest text-success/60">Fact</span>
                    </div>
                    <p className="text-sm font-bold text-primary leading-relaxed">"Eggs are a great source of protein for your baby's brain."</p>
                  </div>
                </div>
                <div className="bg-primary/5 p-6 rounded-2xl mb-8 border border-primary/5">
                  <p className="text-sm text-on-surface/80 leading-relaxed">
                    Eggs help your baby grow strong. One egg a day is very healthy for you and your baby. It provides essential nutrients like Choline that support memory and learning later in life.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95">
                    <span className="material-symbols-outlined text-xl">share</span>
                    <span className="text-sm uppercase tracking-widest">Share with family</span>
                  </button>
                  <button className="flex-1 bg-white border border-primary/10 text-primary font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-primary/5 transition-all active:scale-95">
                    <span className="text-sm uppercase tracking-widest">Mark as Complete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Filters */}
        <section className="mb-10">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary/40 mb-5 ml-2">Browse by Category</h3>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar px-1">
            {['All Lessons', 'Nutrition', 'Warning Signs', 'Labour', 'Baby Care', 'Myths'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`whitespace-nowrap px-8 py-3 rounded-full text-xs font-bold transition-all ${
                  activeFilter === category
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                    : category === 'Warning Signs'
                    ? 'bg-white text-[#D32F2F]/70 border border-[#D32F2F]/20 hover:bg-red-50'
                    : 'bg-white text-primary/60 border border-primary/10 hover:bg-primary/5'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Lesson Library Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {/* Completed Lesson */}
          <div className="bg-white organic-card p-4 hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-primary/5">
            <div className="relative h-44 overflow-hidden organic-thumb">
              <img
                alt="Fresh vegetables"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAT2NkotcK09cxEnzgYVs63CdWpylSG0di8r2hqRn8ytOnLns_kG1CFW_825U-BytulSG9UxJfEVGuKpvYOAz74By3YBEkEDrIjAptk_9nVtfy-0JhQWoT0EprnpqV5HSVxXOi4DGqAAi1v7M6ClD1oYxWR3Zpusgm-p4JZfMa5mA1ls5THGNOxb1kr7R7mFI3xe9i1wfCVFaKSpVU3SX8qAOoclwg-e9wjm4fr5IcV-hYNedeEFd2y6zoKFW35DMcWHg4PRwwlcdf8"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
              <div className="absolute top-4 right-4 bg-success text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-lg">check</span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-success/10 text-success text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">Completed</span>
              </div>
              <h4 className="text-lg font-bold text-primary group-hover:text-secondary transition-colors leading-tight">
                Daily Vitamins: Why folic acid matters
              </h4>
              <p className="text-xs text-primary/40 mt-2 font-semibold">5 min read • Nutrition</p>
            </div>
          </div>

          {/* Up Next Lesson */}
          <div className="bg-white organic-card p-4 hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-primary/5">
            <div className="relative h-44 overflow-hidden organic-thumb">
              <img
                alt="Supportive hands"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0W2zzHw6ZYZxAwJrHD6JUu2lRx0DvNJNMhSQiUlDaAvqj4RvtSQm3yvvHcT9ZQSfgC5XCoBG4-EZ0Sg2b9hXCCFl8fTYf7OEspTTbimhSFztoVpY0H4DyejP1-10GOzbzSR8O-oUyVRdxfUYftFZO3Qfb5mJ8f2E0cyQNmOJ6UWq_mRHDP59M32LOh6vcx8scIkCiNGzkB-gn8s-imZ9pNAWiavzVKE7cwF_mrmnRSaO4RQ2vdtVCRdhSUoHlEO0woadJ0g_mvEHJ"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#D32F2F]/40 to-transparent"></div>
              <div className="absolute top-4 right-4 bg-[#D32F2F] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#D32F2F]/10 text-[#D32F2F] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                  Up Next
                </span>
              </div>
              <h4 className="text-lg font-bold text-primary group-hover:text-secondary transition-colors leading-tight">When to go to the Hospital</h4>
              <p className="text-xs text-primary/40 mt-2 font-semibold">8 min video • Warning Signs</p>
            </div>
          </div>

          {/* Locked Lesson */}
          <div className="bg-white/40 organic-card p-4 border border-dashed border-primary/20 opacity-60 grayscale cursor-not-allowed">
            <div className="relative h-44 overflow-hidden organic-thumb bg-primary/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-primary/20">lock</span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary/5 text-primary/40 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">Locked</span>
              </div>
              <h4 className="text-lg font-bold text-primary/40 leading-tight">Understanding Labour Pains</h4>
              <p className="text-xs text-primary/30 mt-2 font-semibold italic">Unlocks at Week 34</p>
            </div>
          </div>

          {/* New Lesson */}
          <div className="bg-white organic-card p-4 hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-primary/5">
            <div className="relative h-44 overflow-hidden organic-thumb">
              <img
                alt="Baby items"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9NefkvDKxlg3W0vCYs9mcyX5z2GJg71ve78Inf6u6OYbJELcHRWscBaMHoU8FvGzYBV7R4NSdMrrUFUhTsZTrDJhAjOSnlSTmDRrDTPQHjZS5xFQO-s6U5g-tjL88Yl90F02ih92ads57u04EMShX8zvOcHsiCe2HRKZQOsFVjkHvixojM0MVgt0OmzWHr0bCU5sA3oO8J52XJm3FCENLBYGYiB7AlnF5MKlzeqOScxAwMmnZhzoEpby_KjGNPnzUFD_rsiMxF1Q7"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 to-transparent"></div>
              <div className="absolute top-4 right-4 bg-secondary text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-lg">menu_book</span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">New</span>
              </div>
              <h4 className="text-lg font-bold text-primary group-hover:text-secondary transition-colors leading-tight">Sleep Patterns for Newborns</h4>
              <p className="text-xs text-primary/40 mt-2 font-semibold">10 min read • Baby Care</p>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-white/90 backdrop-blur-xl border-t border-primary/5">
        <Link href="/mother" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">home</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
        </Link>
        <Link href="/mother/learn" className="flex flex-col items-center justify-center gap-1 text-primary group">
          <div className="bg-primary px-5 py-2 rounded-2xl shadow-lg shadow-primary/20 transition-all group-active:scale-90">
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              menu_book
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest mt-1">Learn</span>
        </Link>
        <Link href="/mother/check" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">health_and_safety</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Check</span>
        </Link>
        <Link href="/mother/baby" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">child_care</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Baby</span>
        </Link>
        <Link href="/mother/profile" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">person</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
        </Link>
      </nav>
    </>
  );
}
* / 
 
 