'use client';

import Link from 'next/link';

export default function MotherProfile() {
  return (
    <>
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-primary/5 flex justify-between items-center px-6 py-4 w-full">
        <div className="font-brand text-3xl text-primary">Nurture</div>
        <div className="flex items-center gap-3">
          <button className="bg-surface-variant/50 px-3 py-1.5 rounded-full text-[11px] font-bold text-primary/70 tracking-wider font-sans uppercase">
            EN/YO/HA/IG
          </button>
          <button className="bg-error text-white px-5 py-2 rounded-full font-sans font-bold text-sm shadow-lg shadow-red-900/10 active:scale-95 transition-transform">
            SOS
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-10 pb-32">
        {/* Profile Header */}
        <section className="mb-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[40px_12px_40px_12px] overflow-hidden border-4 border-white shadow-xl shrink-0">
              <img
                alt="Amina Bello"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3dY-rtASB02sdMt3mqmCQBNHFRaUYe4rElHjgd7hfy63G0e2wut5xTUzhdALAQnVyVKcKV85APpuEZSwkNHXwurPje6rNtob0b43RVb7l3FoKMFyLjJsQb8S2k8LXbyRdXGXhtM5YqESQ0jiBi2tqw-4MApE7ZyjJT5zrqQcqUCcbuOR_8GdOA0DYhheeI4C6W3ppUnOQ00J1qPwnAClYQJwyPCv155oOb9924qMM8ThvFp_65-p11zg-O2_CqxjVdYRK41fHH1a8"
              />
            </div>
            <div>
              <h1 className="text-3xl font-brand text-primary mb-2">Amina Bello</h1>
              <div className="flex flex-wrap gap-2">
                <span className="bg-primary/10 text-primary border border-primary/5 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  24 years old
                </span>
                <span className="bg-secondary/10 text-secondary border border-secondary/10 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Week 28
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Health Status Badges */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-[24px_8px_24px_8px] text-center border border-primary/5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-1">Blood Group</p>
            <p className="text-xl font-brand text-primary">O+</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-[24px_8px_24px_8px] text-center border border-primary/5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-1">Genotype</p>
            <p className="text-xl font-brand text-primary">AS</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-[24px_8px_24px_8px] text-center border border-primary/5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-1">HIV Status</p>
            <p className="text-xl font-brand text-primary">NEG</p>
          </div>
        </div>

        {/* Health Summary Section */}
        <section className="mb-10">
          <div className="flex justify-between items-end mb-6 px-2">
            <h2 className="text-xl font-brand text-primary">Health Summary</h2>
            <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest flex items-center gap-1">
              From Clinician{' '}
              <span className="material-symbols-outlined text-sm text-success">verified</span>
            </span>
          </div>
          <div className="space-y-4">
            {/* BP Card */}
            <div className="bg-white rounded-[40px_12px_40px_12px] p-6 border border-primary/5 flex items-center justify-between group hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <span className="material-symbols-outlined">vital_signs</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Blood Pressure</p>
                  <p className="text-lg font-bold text-primary">115/75 mmHg</p>
                </div>
              </div>
              <span className="bg-success/10 text-success text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                Normal
              </span>
            </div>

            {/* Haemoglobin Card */}
            <div className="bg-white rounded-[40px_12px_40px_12px] p-6 border border-primary/5 flex items-center justify-between group hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <span className="material-symbols-outlined">bloodtype</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Haemoglobin</p>
                  <p className="text-lg font-bold text-primary">11.2 g/dL</p>
                </div>
              </div>
              <span className="bg-success/10 text-success text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                Healthy
              </span>
            </div>

            {/* Malaria Card */}
            <div className="bg-white rounded-[40px_12px_40px_12px] p-6 border border-primary/5 flex items-center justify-between group hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <span className="material-symbols-outlined">biotech</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Malaria Test</p>
                  <p className="text-lg font-bold text-primary italic text-on-surface/60">Last checked: Sept 20</p>
                </div>
              </div>
              <span className="bg-success/10 text-success text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                Negative
              </span>
            </div>
          </div>
        </section>

        {/* Daily Care */}
        <section className="mb-10">
          <h2 className="text-xl font-brand text-primary mb-6 px-2">Daily Care</h2>
          <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 p-1 rounded-[40px_12px_40px_12px] shadow-lg">
            <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px_12px_40px_12px] border border-white/60 space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <span className="material-symbols-outlined text-primary">notifications_active</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary leading-tight">Take Iron Tablet</p>
                  <p className="text-xs font-semibold text-primary/40 uppercase tracking-widest mt-1">Daily at 8:00 AM</p>
                </div>
              </div>
              <div className="h-px bg-primary/10 w-full"></div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <span className="material-symbols-outlined text-primary">event</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary leading-tight">Next Malaria Dose (IPTp)</p>
                  <p className="text-xs font-semibold text-primary/40 uppercase tracking-widest mt-1">October 15, 2023</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Contacts */}
        <section className="mb-10">
          <h2 className="text-xl font-brand text-primary mb-6 px-2">Emergency Contacts</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-[40px_12px_40px_12px] p-6 border border-primary/5 flex items-center justify-between group hover:shadow-xl transition-all duration-300">
              <div>
                <p className="text-lg font-bold text-primary">St. Mary's Clinic</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mt-1">Primary Healthcare</p>
              </div>
              <button className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                <span className="material-symbols-outlined">call</span>
              </button>
            </div>
            <div className="bg-white rounded-[40px_12px_40px_12px] p-6 border border-primary/5 flex items-center justify-between group hover:shadow-xl transition-all duration-300">
              <div>
                <p className="text-lg font-bold text-primary">Dr. Okoro</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mt-1">Obstetrician</p>
              </div>
              <button className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                <span className="material-symbols-outlined">call</span>
              </button>
            </div>
            <div className="bg-white rounded-[40px_12px_40px_12px] p-6 border border-primary/5 flex items-center justify-between group hover:shadow-xl transition-all duration-300">
              <div>
                <p className="text-lg font-bold text-primary">Husband</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mt-1">Main Contact</p>
              </div>
              <button className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                <span className="material-symbols-outlined">call</span>
              </button>
            </div>
          </div>
        </section>

        {/* Appointment History */}
        <section className="mb-10">
          <h2 className="text-xl font-brand text-primary mb-6 px-2">Appointments</h2>
          <div className="space-y-4">
            {/* Upcoming */}
            <div className="bg-white rounded-[40px_12px_40px_12px] p-6 border-l-4 border-secondary shadow-lg flex items-center gap-6">
              <div className="text-center w-14 shrink-0 bg-secondary/10 py-3 rounded-[24px_8px_24px_8px]">
                <p className="text-[9px] font-black uppercase tracking-widest text-secondary">Oct</p>
                <p className="text-2xl font-brand text-secondary">12</p>
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-secondary/10 text-secondary text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                    Upcoming
                  </span>
                </div>
                <p className="text-lg font-bold text-primary">Antenatal Checkup</p>
                <p className="text-xs font-semibold text-primary/40 uppercase tracking-widest mt-1">09:00 AM</p>
              </div>
            </div>

            {/* Past Appointments */}
            <div className="bg-white/40 rounded-[40px_12px_40px_12px] p-6 border border-primary/5 flex items-center gap-6 opacity-60">
              <div className="text-center w-14 shrink-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/40">Sep</p>
                <p className="text-2xl font-brand text-primary/40">14</p>
              </div>
              <div className="flex-grow">
                <p className="text-lg font-bold text-primary/60">Routine Ultrasound</p>
                <p className="text-xs font-semibold text-primary/30 uppercase tracking-widest mt-1 italic">Completed</p>
              </div>
              <span className="material-symbols-outlined text-success">check_circle</span>
            </div>

            <div className="bg-white/40 rounded-[40px_12px_40px_12px] p-6 border border-primary/5 flex items-center gap-6 opacity-60">
              <div className="text-center w-14 shrink-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/40">Aug</p>
                <p className="text-2xl font-brand text-primary/40">10</p>
              </div>
              <div className="flex-grow">
                <p className="text-lg font-bold text-primary/60">Blood Screening</p>
                <p className="text-xs font-semibold text-primary/30 uppercase tracking-widest mt-1 italic">Completed</p>
              </div>
              <span className="material-symbols-outlined text-success">check_circle</span>
            </div>
          </div>

          <button className="w-full mt-8 bg-white border border-primary/10 text-primary font-bold py-4 rounded-[40px_12px_40px_12px] flex items-center justify-center gap-3 hover:bg-primary/5 transition-all active:scale-95 shadow-sm">
            <span className="text-xs uppercase tracking-widest">View All History</span>
          </button>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-white/90 backdrop-blur-xl border-t border-primary/5">
        <Link href="/mother" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">home</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
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
        <Link href="/mother/profile" className="flex flex-col items-center justify-center gap-1 text-primary group">
          <div className="bg-primary px-5 py-2 rounded-2xl shadow-lg shadow-primary/20 transition-all group-active:scale-90">
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              person
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest mt-1">Profile</span>
        </Link>
      </nav>
    </>
  );
}
