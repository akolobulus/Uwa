'use client';

import Link from 'next/link';

export default function MotherDashboard() {
  return (
    <>
      {/* TopAppBar */}
      <header className="bg-background/90 backdrop-blur-md border-b border-primary/5 flex justify-between items-center px-6 py-4 w-full fixed top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-brand text-3xl text-primary">Nurture</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-surface-variant/50 px-3 py-1.5 rounded-full font-sans text-[11px] font-bold text-primary/70 tracking-wider">
            EN/YO/HA/IG
          </button>
          <button className="bg-[#D32F2F] text-white px-5 py-2 rounded-full font-sans font-bold text-sm shadow-lg shadow-red-900/20 active:scale-95 transition-transform">
            SOS
          </button>
        </div>
      </header>

      <main className="relative z-10 pt-24 px-6 mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* Header: Greeting & Organic Progress */}
        <section className="flex items-center justify-between py-2 md:col-span-2">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-3xl font-bold text-primary leading-[1.2]">
              Good morning,
              <br />
              <span className="text-secondary">Adaeze</span> ☀️
            </h1>
            <p className="text-primary/50 font-semibold text-sm mt-1 uppercase tracking-wider">Third Trimester • Day 196</p>
          </div>
          <div className="hand-drawn-circle">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle className="outline-path" cx="50" cy="50" r="40"></circle>
              <circle className="progress-path" cx="50" cy="50" r="40" strokeDashoffset="75.36"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-primary leading-none">28</span>
              <span className="text-[9px] uppercase tracking-tighter font-black text-secondary">Weeks</span>
            </div>
          </div>
        </section>

        {/* Recent Scan Card */}
        <section className="organic-card bg-secondary/10 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">visibility</span>
              <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Recent Scan</h3>
            </div>
            <span className="text-[10px] font-black text-secondary/60 uppercase tracking-widest">June 10</span>
          </div>
          <div className="relative rounded-xl overflow-hidden bg-white/50 p-2 shadow-inner">
            <img
              alt="Ultrasound Scan"
              className="w-full h-auto rounded-lg object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa_Yig2JlYuewOgT6omMZwQYJfA0PXWPhRCEBTIJIVdDZRu-LUIQWSYQmKAWI29mc8kQWTVOlnc6nQ3loUAv6tjZS3r9T1Hbp_arZtE6lAgc4vCkrU-fHPImluuyjw0f1nlKAh1-4dLyU0I5otwKA6xC3ad8nAm5-W3bzAPWQUP3D5UhwNEgwKJOe3CPDCpJoNjiNiZSB3K4YY_dBkPvWCb3aRKfrYCzid97d6zT1ZdaK2oEgmadsDYxom9NXGHR1g9qXRV3Rqk2BQ"
            />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-primary text-base">Health Milestone</h4>
            <p className="text-sm leading-relaxed text-on-surface/70">Your baby is growing strong! Your recent scan on June 10 shows everything is on track.</p>
          </div>
          <button className="w-full py-3 bg-secondary/10 text-secondary font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-secondary/20 transition-colors">
            View Report
          </button>
        </section>

        {/* Today's Lesson Card */}
        <article className="organic-card blob-bg p-8 text-on-primary group">
          <div className="relative z-10">
            <span className="bg-secondary/20 text-secondary border border-secondary/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-sm">
              Nutrition
            </span>
            <h3 className="text-3xl font-brand mt-6 leading-tight">Iron: The Power for Two</h3>
            <p className="text-on-primary/80 text-base mt-3 leading-relaxed font-light">Learn why iron is critical for your energy levels and your baby's development during this phase...</p>
            <Link href="/mother/learn" className="mt-8 flex items-center gap-3 text-secondary font-bold text-sm group-hover:translate-x-2 transition-transform">
              <span className="text-white">Read Lesson</span>
              <span className="material-symbols-outlined text-base text-white">arrow_forward</span>
            </Link>
          </div>
        </article>

        {/* Medication Reminders */}
        <section className="organic-card bg-surface p-6 space-y-5">
          <div className="flex justify-between items-end border-b border-primary/5 pb-4">
            <div>
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary font-semibold">pill</span>
                Daily Medications
              </h3>
              <p className="text-[11px] text-primary/40 font-bold uppercase tracking-wider mt-0.5">Health Tracker</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-secondary">
                2<span className="text-sm text-primary/20">/3</span>
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="check-item flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-transparent">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shadow-md shadow-secondary/20">
                  <span className="material-symbols-outlined text-white text-base font-bold">check</span>
                </div>
                <span className="text-sm font-bold text-primary">Prenatal Vitamins</span>
              </div>
              <span className="text-[10px] font-black text-primary/30 bg-white/50 px-2 py-1 rounded-md">08:00</span>
            </div>
            <div className="check-item flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-transparent">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shadow-md shadow-secondary/20">
                  <span className="material-symbols-outlined text-white text-base font-bold">check</span>
                </div>
                <span className="text-sm font-bold text-primary">Iron Supplement</span>
              </div>
              <span className="text-[10px] font-black text-primary/30 bg-white/50 px-2 py-1 rounded-md">12:30</span>
            </div>
            <div className="check-item flex items-center justify-between p-4 rounded-2xl border border-primary/10 opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-lg border-2 border-primary/20"></div>
                <span className="text-sm font-bold text-primary">Calcium</span>
              </div>
              <span className="text-[10px] font-black text-primary/30">20:00</span>
            </div>
          </div>
        </section>

        {/* Doctor's Note */}
        <section className="organic-card bg-primary text-on-primary p-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <span className="material-symbols-outlined text-8xl text-white">format_quote</span>
          </div>
          <div className="relative z-10 flex items-start gap-4">
            <img
              alt="Doctor"
              className="w-12 h-12 rounded-2xl border-2 border-secondary/30 object-cover shadow-lg"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpCIMOS_vtguKfKJG9jscYVPg_HkCjb1ncta88DIsGYs7i873kISrcBvRsLB6ecX_Dvr1QFUtai29LZagCYw-ZfL04HZ_7RMOZ8eOaQF8JbGavOnBCUG5St7OVEWFxUwvN_xXQw9L7Ke0jaEAzxO1sFBnLMNcccaYrZcRijEFITHVde9aa_X8z9uH37plXUPJAzvMsPdeCcqYbbvzz1vw_UZNMd0vikcDdpdyYXsnHoxjk2OW9G_3ewpVO-HE6b9KbW1fPUQaobh20"
            />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-white">Dr. Okoro</h4>
                  <p className="text-[9px] text-secondary font-black uppercase tracking-widest">Update • 2h ago</p>
                </div>
                <span className="material-symbols-outlined text-secondary">verified</span>
              </div>
              <p className="text-sm leading-relaxed mt-3 font-medium italic text-white/90">
                "Adaeze, your BP levels from yesterday look excellent. Keep up the high-protein diet. See you on Friday!"
              </p>
            </div>
          </div>
        </section>

        {/* Daily Check Streak */}
        <section className="organic-card bg-surface p-5 flex items-center justify-between border border-primary/5">
          <div>
            <h3 className="font-bold text-sm text-primary">Daily Check-in</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex -space-x-1">
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
              </div>
              <p className="text-[10px] text-primary/50 font-bold uppercase tracking-wider">5 day streak!</p>
            </div>
          </div>
          <div className="flex gap-1">
            <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined text-primary/10 text-xl">star</span>
            <span className="material-symbols-outlined text-primary/10 text-xl">star</span>
          </div>
        </section>

        {/* Next Appointment */}
        <section className="organic-card bg-white border border-primary/5 overflow-hidden flex h-24">
          <div className="bg-primary text-on-primary w-24 flex flex-col items-center justify-center border-r-4 border-secondary">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60 text-white">Nov</span>
            <span className="text-4xl font-brand leading-none mt-1 text-white">14</span>
          </div>
          <div className="flex-1 px-6 flex flex-col justify-center">
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.15em] mb-1">Coming Up</p>
            <h4 className="font-bold text-primary text-base">St. Mary's Clinic</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="material-symbols-outlined text-xs text-primary/40">calendar_today</span>
              <span className="text-[11px] font-bold text-primary/50">3 days • 10:30 AM</span>
            </div>
          </div>
          <div className="flex items-center pr-4">
            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary/30 text-base">chevron_right</span>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-surface/90 backdrop-blur-xl border-t border-primary/5">
        <Link href="/mother" className="flex flex-col items-center justify-center gap-1 text-primary group">
          <div className="bg-primary px-5 py-2 rounded-2xl shadow-lg shadow-primary/20 transition-all group-active:scale-90">
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest mt-1">Home</span>
        </Link>
        <Link href="/mother/learn" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">menu_book</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Learn</span>
        </Link>
        <Link href="/mother/check" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">health_and_safety</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Check</span>
        </Link>
        <Link href="/mother/baby" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">child_care</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Baby</span>
        </Link>
        <Link href="#" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">person</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
        </Link>
      </nav>
    </>
  );
}
