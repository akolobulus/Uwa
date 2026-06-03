"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const riskFactors = [
  {
    name: "Malaria",
    detail:
      "Malaria remains one of the leading preventable causes of maternal anaemia, low birth weight, preterm delivery, stillbirth, and newborn death.",
  },
  {
    name: "Sickle Cell",
    detail:
      "Nigeria has the highest number of people living with sickle cell disease in the world. Over 50% of females face complications.",
  },
  {
    name: "Haemorrhage",
    detail:
      "The #1 killer of mothers during labour. Excessive bleeding after delivery.",
  },
  {
    name: "Preeclampsia",
    detail:
      "Maternal mortality rate associated with this in Nigeria is over 6%.",
  },
  {
    name: "Preterm",
    detail: "Baby coming too early, before 37 weeks.",
  },
  {
    name: "Emergency C-S",
    detail: "Emergency surgery to deliver a baby.",
  },
];

const solutionCards = [
  {
    icon: "timer",
    title: "Earlier Intervention",
    background: "linear-gradient(135deg, #ffdada 0%, #ffffff 100%)",
    body: "Earlier intervention and improved clinical preparation have been shown to prevent nearly two-thirds of severe maternal complications. Nurture's ML models flag high-risk patients as soon as the first visit.",
  },
  {
    icon: "stethoscope",
    title: "Clinical Precision",
    background: "linear-gradient(135deg, #d5e3fc 0%, #ffffff 100%)",
    body: "We automatically analyse demographic and clinical risk factors, including malaria history, sickle cell, and HIV status, to provide evidence-based interventions, giving doctors weeks to months to intervene.",
  },
  {
    icon: "book_open",
    title: "Empowered Mothers",
    background: "linear-gradient(135deg, #ffdadb 0%, #ffffff 100%)",
    body: "Through 60-second daily lessons in English, Yoruba, Hausa, and Igbo, Nurture teaches mothers about warning signs and debunks harmful myths. An informed mother is a safer mother.",
  },
];

function MaterialIcon({
  children,
  className = "",
  filled = false,
}: {
  children: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {children}
    </span>
  );
}

function LogoMark({ size = "h-10 w-10" }: { size?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`${size} flex items-center justify-center rounded-full bg-primary text-on-primary shadow-sm`}
    >
      <MaterialIcon className="text-[22px]" filled>
        favorite
      </MaterialIcon>
    </div>
  );
}

function RiskFactor({
  name,
  detail,
}: {
  name: string;
  detail: string;
}) {
  return (
    <div className="group/item relative cursor-help rounded-xl border border-outline-variant/30 bg-white p-3 text-center transition-all hover:bg-primary hover:text-on-primary">
      <span className="text-[14px] font-bold uppercase">{name}</span>
      <div className="invisible absolute bottom-full left-1/2 z-20 mb-3 w-64 -translate-x-1/2 rounded-xl border border-primary/20 bg-surface-container-highest p-4 opacity-0 shadow-xl transition-all duration-300 pointer-events-none group-hover/item:visible group-hover/item:opacity-100">
        <p className="text-left text-xs leading-relaxed text-on-surface">
          {detail}
        </p>
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-surface-container-highest" />
      </div>
    </div>
  );
}

function SolutionCard({
  icon,
  title,
  body,
  background,
  delay,
}: {
  icon: string;
  title: string;
  body: string;
  background: string;
  delay: number;
}) {
  return (
    <div
      className="solution-card group reveal-child relative flex h-full flex-col items-start overflow-hidden rounded-3xl border border-white/50 bg-white/40 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="card-warp-effect" style={{ background }} />
      <div className="relative z-10 w-full">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary-container/20 text-primary backdrop-blur-md">
          <MaterialIcon className="text-[32px]">{icon}</MaterialIcon>
        </div>
        <h3 className="font-headline-sm mb-4 text-on-surface">{title}</h3>
        <p className="text-body-md leading-relaxed text-on-surface-variant">
          {body}
        </p>
      </div>
    </div>
  );
}

function BottomNavItem({
  icon,
  label,
  active = false,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={
        active
          ? "flex flex-col items-center justify-center rounded-full bg-secondary-container px-6 py-1 text-on-secondary-container"
          : "flex flex-col items-center justify-center text-on-surface-variant opacity-70"
      }
    >
      <MaterialIcon filled={active}>{icon}</MaterialIcon>
      <span className="font-label-md text-label-md">{label}</span>
    </div>
  );
}

export default function Home() {
  const [quizRevealed, setQuizRevealed] = useState(false);

  useEffect(() => {
    function createBubbles() {
      const container = document.getElementById("bubble-container");
      if (!container) return;

      container.innerHTML = "";

      for (let i = 0; i < 45; i++) {
        const bubble = document.createElement("div");
        const size = Math.random() * 45 + 15;

        bubble.className = "bubble";
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDelay = `${Math.random() * 25}s`;
        bubble.style.animationDuration = `${Math.random() * 12 + 18}s`;
        bubble.style.setProperty("--sway", `${Math.random() * 20 - 10}px`);

        container.appendChild(bubble);
      }
    }

    function handleAnchorClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest(
        "a[href^='#']",
      ) as HTMLAnchorElement | null;

      if (!anchor) return;

      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId === "#") {
        event.preventDefault();
        return;
      }

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    createBubbles();
    document.addEventListener("click", handleAnchorClick);
    document.querySelectorAll(".reveal-child").forEach((el) => {
      observer.observe(el);
    });

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 text-on-surface md:pb-0">
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md">
        <nav className="flex w-full items-center justify-between px-margin-mobile py-4 md:px-margin-desktop">
          <a
            className="flex items-center gap-3 transition-transform active:scale-95"
            href="#hero"
          >
            <LogoMark />
            <span className="font-mother-headline text-mother-headline tracking-tight text-primary">
              Nurture
            </span>
          </a>

          <div className="hidden items-center space-x-lg md:flex">
            <a
              className="font-clinical-data text-clinical-data rounded-lg px-3 py-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
              href="#the-problem"
            >
              The Problem
            </a>
            <a
              className="font-clinical-data text-clinical-data rounded-lg px-3 py-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
              href="#our-solution"
            >
              Our Solution
            </a>
            <a
              className="font-clinical-data text-clinical-data rounded-lg px-3 py-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
              href="#platforms"
            >
              Portals
            </a>
            <a
              className="font-clinical-data text-clinical-data rounded-full bg-primary px-6 py-2.5 text-on-primary shadow-md transition-all hover:opacity-90 active:scale-95"
              href="#mission"
            >
              Join the Mission
            </a>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <MaterialIcon className="text-primary">language</MaterialIcon>
            <MaterialIcon className="text-primary">account_circle</MaterialIcon>
          </div>
        </nav>
      </header>

      <main>
        <section
          className="relative flex min-h-[80vh] flex-col justify-center overflow-hidden px-margin-mobile py-lg md:px-margin-desktop md:py-xl"
          id="hero"
        >
          <div
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
            id="bubble-container"
          />

          <div className="relative z-10 mx-auto grid w-full max-w-[90rem] grid-cols-1 items-center gap-lg lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-xl">
            <div className="order-2 flex items-center justify-center lg:order-1">
              <div className="animate-float relative w-full max-w-[42rem] xl:max-w-[46rem]">
                <div className="absolute inset-0 -z-10 scale-125 rounded-full bg-primary/5 blur-3xl" />
                <Image
                  alt="Diverse pregnant women in a circle on grass with a park bench and woven mat"
                  className="h-auto w-full rounded-[5%] drop-shadow-2xl"
                  height={1024}
                  priority
                  src="/hero.png"
                  width={1024}
                />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="mb-md inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-secondary-container/90 px-4 py-1.5 text-on-secondary-container backdrop-blur-sm">
                <MaterialIcon className="text-[20px]" filled>
                  auto_awesome
                </MaterialIcon>
                <span className="font-label-md text-label-md">
                  Preventing Maternal Mortality with ML
                </span>
              </div>
              <h1 className="font-display-lg-mobile text-display-lg-mobile mb-md text-on-surface md:font-display-lg md:text-display-lg">
                Rewriting the Odds for{" "}
                <span className="italic text-primary">Maternal Health</span> in
                Nigeria.
              </h1>
              <p className="font-body-lg text-body-lg mb-lg max-w-2xl leading-relaxed text-on-surface-variant">
                Detecting pregnancy complications before they become emergencies.
                <br />
                <br />
                An early warning system that helps clinicians identify high-risk pregnancies sooner, enabling earlier intervention, safer deliveries, and better outcomes for mothers and babies.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  className="font-clinical-data flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-[16px] text-on-primary transition-all hover:shadow-lg active:scale-95"
                  href="/auth"
                >
                  Get Started for Clinicians
                  <MaterialIcon>arrow_forward</MaterialIcon>
                </Link>
                <Link
                  className="font-clinical-data flex items-center justify-center gap-2 rounded-xl bg-surface-container-high/80 px-8 py-4 text-[16px] text-on-surface backdrop-blur-sm transition-all hover:bg-surface-variant active:scale-95"
                  href="/auth"
                >
                  Explore Mother Portal
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          className="overflow-hidden bg-surface-container-low px-margin-mobile py-lg md:px-margin-desktop md:py-xl"
          id="the-problem"
        >
          <div className="mx-auto max-w-7xl">
            <div className="reveal-child mb-xl">
              <span className="font-label-md text-label-md mb-4 block uppercase tracking-[0.1em] text-primary">
                The Context
              </span>
              <h2 className="font-display-lg-mobile text-display-lg-mobile text-on-surface md:font-headline-md md:text-headline-md">
                The Weight of a Global Inequity
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
              <div className="space-y-md md:col-span-7">
                <div className="reveal-child clinical-shadow rounded-2xl border border-outline-variant/30 bg-surface p-8">
                  <div className="flex flex-col items-center gap-8 md:flex-row">
                    <div className="shrink-0">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-primary">
                        <span className="text-headline-md text-primary">
                          28.5%
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-headline-sm mb-2 text-on-surface">
                        Global Death Share
                      </h3>
                      <p className="text-body-md text-on-surface-variant">
                        Nigeria accounts for nearly 28.5% of all global maternal
                        deaths. It is a crisis that demands more than
                        traditional methods.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="reveal-child clinical-shadow rounded-2xl border border-outline-variant/30 bg-surface p-8">
                  <h3 className="font-headline-sm mb-6 text-on-surface">
                    A Radical Disparity
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="font-clinical-data text-clinical-data mb-1 flex justify-between">
                        <span>Lifetime Risk in Nigeria</span>
                        <span className="font-bold text-primary">1 in 19</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                        <div className="h-full w-[85%] rounded-full bg-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-clinical-data text-clinical-data mb-1 flex justify-between">
                        <span>Developed Nations</span>
                        <span className="text-on-surface-variant">
                          1 in 4,900
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                        <div className="h-full w-[2%] rounded-full bg-secondary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-md md:col-span-5">
                <div className="reveal-child rounded-2xl border border-primary/10 bg-primary-container/20 p-8">
                  <h3 className="font-label-md mb-6 uppercase tracking-widest text-primary">
                    Unique Risk Factors in Nigeria
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {riskFactors.map((factor) => (
                      <RiskFactor key={factor.name} {...factor} />
                    ))}
                  </div>
                </div>

                <button
                  className={`reveal-child group w-full cursor-pointer rounded-2xl bg-inverse-surface p-8 text-left text-inverse-on-surface ${
                    quizRevealed ? "" : "animate-pulse-shimmer"
                  }`}
                  onClick={() => setQuizRevealed(true)}
                  type="button"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <MaterialIcon className="text-primary-fixed-dim">
                      quiz
                    </MaterialIcon>
                    <span className="font-label-md uppercase tracking-widest text-primary-fixed-dim">
                      Quick Quiz
                    </span>
                  </div>
                  <p className="font-headline-sm mb-6 leading-tight">
                    What percentage of maternal deaths are caused by the
                    &quot;First Delay&quot; in seeking care?
                  </p>
                  <div className="rounded-xl bg-white/10 p-4 text-center transition-all duration-500 group-hover:bg-primary">
                    <span
                      className={`text-[14px] opacity-70 ${
                        quizRevealed ? "hidden" : "block group-hover:hidden"
                      }`}
                    >
                      Click to reveal the data
                    </span>
                    <span
                      className={`font-display-lg text-primary-fixed-dim ${
                        quizRevealed ? "block" : "hidden group-hover:block"
                      }`}
                    >
                      22%
                    </span>
                  </div>
                  <p
                    className={`mt-4 text-[13px] opacity-60 ${
                      quizRevealed ? "block" : "hidden group-hover:block"
                    }`}
                  >
                    This 22% of deaths could be eliminated purely through better
                    awareness and early warning systems.
                  </p>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          className="bg-background px-margin-mobile py-lg md:px-margin-desktop md:py-xl"
          id="our-solution"
        >
          <div className="mx-auto max-w-7xl">
            <div className="reveal-child mb-16 text-center">
              <h2 className="font-display-lg-mobile text-display-lg-mobile mb-4 text-on-surface md:font-display-lg md:text-display-lg">
                Our Solution
              </h2>
              <p className="text-body-lg mx-auto max-w-2xl text-on-surface-variant">
                Evolving care through predictive intelligence and community
                knowledge.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {solutionCards.map((card, index) => (
                <SolutionCard
                  key={card.title}
                  {...card}
                  delay={index * 100}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          className="bg-surface-container-lowest px-margin-mobile py-lg md:px-margin-desktop md:py-xl"
          id="platforms"
        >
          <div className="reveal-child mb-xl text-center">
            <h2 className="font-headline-md text-headline-md mb-4 text-on-surface">
              A Dual-Sided Ecosystem of Care
            </h2>
            <p className="mx-auto block w-full max-w-[36rem] whitespace-normal break-normal text-center text-on-surface-variant">
              One platform, two distinct experiences designed for the unique
              needs of healers and heroes.
            </p>
          </div>

          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-lg lg:grid-cols-2">
            <div className="reveal-child clinical-shadow group relative overflow-hidden rounded-[2rem] border border-outline-variant bg-surface p-base">
              <div className="p-8">
                <div className="mb-4 flex items-center gap-3">
                  <MaterialIcon className="text-primary">
                    clinical_notes
                  </MaterialIcon>
                  <span className="font-label-md text-label-md uppercase tracking-widest text-primary">
                    Clinician Portal
                  </span>
                </div>
                <h3 className="font-mother-headline text-mother-headline mb-4">
                  High-Precision Risk Prediction
                </h3>
                <p className="mb-8 leading-relaxed text-on-surface-variant">
                  A high-density dashboard designed for rapid intervention.
                  Clinicians see live alerts, population health trends, and
                  individualized risk scores for every mother in their care.
                </p>
                <div className="space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container p-4 transition-transform duration-500 group-hover:scale-[1.02]">
                  <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                    <span className="font-clinical-data text-[14px]">
                      Postpartum Hemorrhage Risk
                    </span>
                    <span className="font-bold text-error">CRITICAL</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                    <span className="font-clinical-data text-[14px]">
                      Gestational Diabetes Alert
                    </span>
                    <span className="font-bold text-tertiary">MODERATE</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal-child group relative overflow-hidden rounded-[2rem] border border-outline-variant bg-secondary-container/30 p-base">
              <div className="p-8">
                <div className="mb-4 flex items-center gap-3">
                  <MaterialIcon className="text-secondary" filled>
                    favorite
                  </MaterialIcon>
                  <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                    Mother Portal
                  </span>
                </div>
                <h3 className="font-mother-headline text-mother-headline mb-4">
                  Daily Education &amp; Empowerment
                </h3>
                <p className="mb-8 leading-relaxed text-on-surface-variant">
                  A calm, approachable &quot;digital sanctuary.&quot; Mothers
                  receive culturally relevant daily health tips, symptom
                  checkers, and direct lines to their care teams.
                </p>
                <div className="flex gap-4 overflow-hidden transition-transform duration-500 group-hover:translate-x-[-10px]">
                  <div className="min-w-[160px] rounded-2xl border border-outline-variant/30 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container">
                      <MaterialIcon className="text-secondary">
                        auto_stories
                      </MaterialIcon>
                    </div>
                    <p className="text-[13px] font-medium">
                      Week 24: Baby&apos;s Growth
                    </p>
                  </div>
                  <div className="min-w-[160px] rounded-2xl border border-outline-variant/30 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container">
                      <MaterialIcon className="text-on-tertiary-container">
                        nutrition
                      </MaterialIcon>
                    </div>
                    <p className="text-[13px] font-medium">
                      Local Nutrition Guide
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="px-margin-mobile py-xl md:px-margin-desktop"
          id="mission"
        >
          <div className="reveal-child relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-primary p-lg text-center shadow-2xl md:p-xl">
            <div className="nurture-dot-pattern absolute inset-0 opacity-10 pointer-events-none" />
            <h2 className="font-display-lg-mobile text-display-lg-mobile relative z-10 mb-6 text-on-primary md:font-headline-md md:text-headline-md">
              Join the Mission to Protect Life
            </h2>
            <p className="font-body-lg text-body-lg relative z-10 mx-auto mb-lg max-w-2xl text-on-primary-container">
              Whether you are a clinician looking to save more lives or a mother
              seeking the best care, Nurture is your partner in this journey.
            </p>
            <div className="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                className="font-mother-headline flex items-center justify-center rounded-2xl bg-tertiary px-10 py-5 text-[18px] text-on-tertiary shadow-xl transition-all hover:opacity-90 active:scale-95"
                href="#platforms"
              >
                Register Your Clinic
              </a>
              <a
                className="font-mother-headline flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-10 py-5 text-[18px] text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                href="#platforms"
              >
                Download Mother App
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-surface-container px-margin-mobile py-xl md:px-margin-desktop">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-lg md:grid-cols-4">
          <div className="text-left md:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <LogoMark size="h-8 w-8" />
              <span className="font-mother-headline text-[20px] text-primary">
                Nurture
              </span>
            </div>
            <p className="block w-full max-w-[24rem] whitespace-normal break-normal text-left text-[14px] leading-relaxed text-on-surface-variant">
              Bridging clinical precision with maternal care. Protecting the
              heart of every family through predictive technology.
            </p>
          </div>

          <div className="flex flex-col justify-start md:col-span-1">
            <h4 className="font-clinical-data text-clinical-data mb-6 uppercase tracking-wider">
              Contact
            </h4>
            <a
              className="text-[14px] text-on-surface-variant transition-colors hover:text-primary"
              href="#mission"
            >
              Contact Support
            </a>
          </div>

          <div className="flex items-start justify-start md:col-span-1 md:items-end">
            <div className="flex gap-4">
              <a
                aria-label="Share Nurture"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest transition-all hover:text-primary"
                href="#"
              >
                <MaterialIcon className="text-[20px]">share</MaterialIcon>
              </a>
              <a
                aria-label="Email Nurture"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest transition-all hover:text-primary"
                href="#"
              >
                <MaterialIcon className="text-[20px]">mail</MaterialIcon>
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-xl flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-outline-variant pt-base md:flex-row">
          <p className="text-[12px] text-on-surface-variant">
            &copy; 2026 Nurture Health Technologies. All rights reserved.
          </p>
          <div className="flex gap-lg">
            <span className="flex items-center gap-1 text-[12px] text-on-surface-variant">
              <MaterialIcon className="text-[14px]">location_on</MaterialIcon>
              Lagos, Nigeria
            </span>
          </div>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl bg-surface px-4 pb-6 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] md:hidden">
        <BottomNavItem active icon="home" label="Home" />
        <BottomNavItem icon="auto_stories" label="Journey" />
        <BottomNavItem icon="diversity_1" label="Community" />
        <BottomNavItem icon="chat_bubble" label="Support" />
      </nav>
    </div>
  );
}
