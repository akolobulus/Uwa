"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import authIllustration from "./auth.png";

type Role = "mother" | "clinician";
type AuthMode = "signin" | "signup";
type SubmitState = "idle" | "loading" | "success";

const roleDetails: Record<
  Role,
  {
    title: string;
    description: string;
    icon: string;
    identityLabel: string;
    identityIcon: string;
    identityPlaceholder: string;
    identityType: "email" | "tel" | "text";
    signupExtraLabel: string;
    signupExtraPlaceholder: string;
    signupExtraIcon: string;
  }
> = {
  mother: {
    title: "Mother",
    description: "Track your health and your baby's journey.",
    icon: "pregnant_woman",
    identityLabel: "Phone number",
    identityIcon: "smartphone",
    identityPlaceholder: "Enter your registered number",
    identityType: "tel",
    signupExtraLabel: "Expected delivery month",
    signupExtraPlaceholder: "e.g. September 2026",
    signupExtraIcon: "calendar_month",
  },
  clinician: {
    title: "Clinician",
    description: "Access clinical data and patient health records.",
    icon: "medical_services",
    identityLabel: "Hospital ID",
    identityIcon: "medical_services",
    identityPlaceholder: "e.g. HOS-2024-8831",
    identityType: "text",
    signupExtraLabel: "Facility name",
    signupExtraPlaceholder: "Nurture Memorial Clinic",
    signupExtraIcon: "local_hospital",
  },
};

const inputClass =
  "block w-full rounded-lg border border-outline-variant bg-white py-3 text-body-md transition-all duration-200 placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

const labelClass = "block text-[14px] font-semibold text-on-surface-variant";

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
    <img
      src="/site logo.png"
      alt="Nurture Logo"
      className={`${size} rounded-full object-cover shadow-sm`}
      style={{ borderRadius: "50%" }}
    />
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function RoleCard({
  role,
  onSelect,
}: {
  role: Role;
  onSelect: (role: Role) => void;
}) {
  const details = roleDetails[role];

  return (
    <button
      className="group flex w-full items-start gap-4 rounded-xl border border-outline-variant/30 bg-white/60 p-4 text-left transition-all duration-300 hover:border-primary hover:bg-white hover:shadow-md active:scale-[0.99]"
      onClick={() => onSelect(role)}
      type="button"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-on-primary">
        <MaterialIcon className="text-[28px]">{details.icon}</MaterialIcon>
      </span>
      <span className="min-w-0 flex-1 whitespace-normal">
        <span className="font-headline-sm mb-1 block text-on-surface">
          {details.title}
        </span>
        <span className="block break-normal text-[14px] leading-5 text-on-surface-variant">
          {details.description}
        </span>
      </span>
    </button>
  );
}

function TextField({
  autoComplete,
  icon,
  id,
  label,
  placeholder,
  required = true,
  type = "text",
}: {
  autoComplete?: string;
  icon?: string;
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: "email" | "password" | "tel" | "text";
}) {
  return (
    <div className="space-y-1">
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
            <MaterialIcon className="text-[20px]">{icon}</MaterialIcon>
          </div>
        ) : null}
        <input
          autoComplete={autoComplete}
          className={`${inputClass} ${icon ? "pl-10 pr-3" : "px-3"}`}
          id={id}
          name={id}
          placeholder={placeholder}
          required={required}
          type={type}
        />
      </div>
    </div>
  );
}

function AuthIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container-low"
          : "relative mx-auto aspect-square w-full max-w-[440px]"
      }
    >
      {!compact ? (
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full text-primary"
          fill="none"
          viewBox="0 0 600 600"
        >
          <circle
            cx="300"
            cy="300"
            r="286"
            stroke="currentColor"
            strokeDasharray="10 20"
            strokeWidth="18"
          />
        </svg>
      ) : null}
      <div
        className={
          compact
            ? "absolute inset-0"
            : "absolute inset-[7%] overflow-hidden rounded-full bg-white/65"
        }
      >
        <Image
          alt="Pregnant mother and partner leaving a clinic"
          className="object-contain p-2 mix-blend-multiply"
          fill
          placeholder="blur"
          preload={!compact}
          quality={90}
          sizes={
            compact
              ? "96px"
              : "(min-width: 1024px) 440px, (min-width: 768px) 360px, 0px"
          }
          src={authIllustration}
        />
      </div>
    </div>
  );
}

export default function NurtureAuthPortal() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const activeRole = selectedRole ?? "clinician";
  const role = roleDetails[activeRole];
  const isSignUp = mode === "signup";
  const isSubmitting = submitState === "loading";

  function resetSubmitState() {
    setSubmitState("idle");
  }

  function handleRoleSelect(nextRole: Role) {
    setSelectedRole(nextRole);
    setMode("signin");
    resetSubmitState();
  }

  function handleBackToRoles() {
    setSelectedRole(null);
    setMode("signin");
    resetSubmitState();
  }

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    resetSubmitState();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitState("loading");
    window.setTimeout(() => {
      setSubmitState("success");
      // Redirect based on role
      if (activeRole === "clinician") {
        router.push("/clinician/dashboard");
      } else {
        router.push("/mother");
      }
    }, 1000);
  }

  return (
    <main className="auth-gradient min-h-screen w-full text-on-surface">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)]">
        <section className="relative hidden min-h-screen overflow-hidden px-margin-desktop py-xl lg:flex lg:flex-col lg:items-start lg:justify-between">
          <div
            className="relative z-10 min-w-[20rem] max-w-[36rem]"
            style={{ width: "min(36rem, 100%)" }}
          >
            <Link
              aria-label="Go to Nurture home"
              className="mb-gutter inline-flex items-center gap-3 transition-transform active:scale-95"
              href="/"
            >
              <LogoMark size="h-12 w-12" />
              <span className="font-mother-headline text-[28px] text-primary">
                Nurture
              </span>
            </Link>

            <h1 className="font-headline-md text-headline-md mb-base max-w-[32rem] whitespace-normal break-normal text-primary">
              Every mother, every life protected.
            </h1>
            <p className="text-body-lg max-w-[36rem] whitespace-normal break-normal text-on-surface-variant">
              The bridge between precision clinical data and the intimate
              journey of motherhood. Nurture safeguards the future with predictive
              care.
            </p>
          </div>

          <div
            className="relative z-10 my-10"
            style={{ width: "min(27.5rem, 100%)" }}
          >
            <AuthIllustration />
          </div>

          <div
            className="relative z-10 grid min-w-[20rem] max-w-[36rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-gutter"
            style={{ width: "min(36rem, 100%)" }}
          >
            <div className="flex min-w-0 flex-col">
              <span className="font-headline-sm text-primary">Trust</span>
              <span className="whitespace-normal break-normal text-body-md text-on-surface-variant">
                Validated by clinical experts
              </span>
            </div>
            <div className="h-12 w-px bg-outline-variant" />
            <div className="flex min-w-0 flex-col">
              <span className="font-headline-sm text-tertiary">Security</span>
              <span className="whitespace-normal break-normal text-body-md text-on-surface-variant">
                Encrypted health records
              </span>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-margin-mobile py-xl md:px-gutter">
          <Link
            aria-label="Go to Nurture home"
            className="absolute left-margin-mobile top-8 flex items-center gap-3 transition-transform active:scale-95 lg:hidden"
            href="/"
          >
            <LogoMark />
            <span className="font-mother-headline text-primary">Nurture</span>
          </Link>

          <div
            className={`auth-glass-panel w-full rounded-xl border border-outline-variant/30 p-gutter shadow-xl transition-all duration-300 ${
              isSignUp && selectedRole ? "max-w-[560px]" : "max-w-[480px]"
            }`}
          >
            {!selectedRole ? (
              <div>
                <div className="mb-gutter text-center">
                  <h2 className="font-headline-md text-headline-md mb-2 text-on-surface">
                    How can we help?
                  </h2>
                  <p className="text-body-md text-on-surface-variant">
                    Choose your portal to continue.
                  </p>
                </div>

                <div className="space-y-4">
                  <RoleCard role="mother" onSelect={handleRoleSelect} />
                  <RoleCard role="clinician" onSelect={handleRoleSelect} />
                </div>
              </div>
            ) : (
              <div>
                <button
                  className="mb-6 flex items-center gap-1 text-[14px] font-semibold text-primary transition-all hover:underline"
                  onClick={handleBackToRoles}
                  type="button"
                >
                  <MaterialIcon className="text-[18px]">arrow_back</MaterialIcon>
                  Back to role selection
                </button>

                {isSignUp ? (
                  <div className="mb-gutter flex items-center gap-4 rounded-lg border border-outline-variant/30 bg-white/65 p-3">
                    <AuthIllustration compact />
                    <div className="min-w-0">
                      <p className="font-headline-sm text-on-surface">
                        {role.title} account
                      </p>
                      <p className="text-[14px] leading-5 text-on-surface-variant">
                        Secure onboarding for your Nurture portal.
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="mb-gutter">
                  <h2 className="font-headline-md text-headline-md mb-1 text-on-surface">
                    {isSignUp ? "Create Account" : "Welcome back"}
                  </h2>
                  <p className="text-body-md text-on-surface-variant">
                    {isSignUp
                      ? `Signing up as ${role.title}`
                      : `Signing in as ${role.title}`}
                  </p>
                </div>

                <form className="space-y-base" onSubmit={handleSubmit}>
                  {isSignUp ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField
                          autoComplete="given-name"
                          id="first-name"
                          label="First Name"
                          placeholder="Jane"
                        />
                        <TextField
                          autoComplete="family-name"
                          id="last-name"
                          label="Last Name"
                          placeholder="Doe"
                        />
                      </div>

                      <TextField
                        autoComplete="email"
                        icon="mail"
                        id="signup-email"
                        label="Email Address"
                        placeholder="jane@example.com"
                        type="email"
                      />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField
                          autoComplete={
                            role.identityType === "tel" ? "tel" : undefined
                          }
                          icon={role.identityIcon}
                          id="signup-identity"
                          label={role.identityLabel}
                          placeholder={role.identityPlaceholder}
                          type={role.identityType}
                        />
                        <TextField
                          icon={role.signupExtraIcon}
                          id="signup-extra"
                          label={role.signupExtraLabel}
                          placeholder={role.signupExtraPlaceholder}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField
                          autoComplete="new-password"
                          icon="lock"
                          id="signup-password"
                          label="Password"
                          placeholder="Password"
                          type="password"
                        />
                        <TextField
                          autoComplete="new-password"
                          icon="lock_reset"
                          id="confirm-password"
                          label="Confirm Password"
                          placeholder="Repeat password"
                          type="password"
                        />
                      </div>

                      <label className="flex items-start gap-2 py-1 text-[14px] text-on-surface-variant">
                        <input
                          className="mt-1 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-primary"
                          required
                          type="checkbox"
                        />
                        <span>I agree to the Nurture Terms and Privacy Policy.</span>
                      </label>

                      <button
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-body-md font-semibold text-on-primary shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
                        disabled={isSubmitting}
                        type="submit"
                      >
                        {isSubmitting ? (
                          <>
                            <MaterialIcon className="animate-spin text-[22px]">
                              progress_activity
                            </MaterialIcon>
                            Creating account
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <TextField
                        autoComplete={
                          role.identityType === "tel" ? "tel" : "username"
                        }
                        icon={role.identityIcon}
                        id="identity"
                        label={role.identityLabel}
                        placeholder={role.identityPlaceholder}
                        type={role.identityType}
                      />

                      <div className="space-y-1">
                        <TextField
                          autoComplete="current-password"
                          icon="lock"
                          id="password"
                          label="Password"
                          placeholder="Password"
                          type="password"
                        />
                        <div className="flex justify-end">
                          <a
                            className="text-[14px] font-semibold text-primary hover:underline"
                            href="#"
                          >
                            Forgot password?
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 py-1">
                        <input
                          className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                          id="remember"
                          type="checkbox"
                        />
                        <label
                          className="text-[14px] text-on-surface-variant"
                          htmlFor="remember"
                        >
                          Keep me signed in
                        </label>
                      </div>

                      <button
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-body-md font-semibold text-on-primary shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
                        disabled={isSubmitting}
                        type="submit"
                      >
                        {isSubmitting ? (
                          <MaterialIcon className="animate-spin text-[22px]">
                            progress_activity
                          </MaterialIcon>
                        ) : (
                          "Sign In"
                        )}
                      </button>
                    </>
                  )}

                  {submitState === "success" ? (
                    <p
                      aria-live="polite"
                      className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center text-[14px] font-semibold text-primary"
                    >
                      {isSignUp
                        ? "Account details captured."
                        : "Sign-in details captured."}
                    </p>
                  ) : null}

                  <button
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant py-4 text-body-md font-semibold text-on-surface transition-all duration-200 hover:bg-surface-container"
                    type="button"
                  >
                    <GoogleMark />
                    Continue with Google
                  </button>

                  {isSignUp ? (
                    <div className="mt-4 text-center">
                      <button
                        className="text-[14px] font-semibold text-primary hover:underline"
                        onClick={() => handleModeChange("signin")}
                        type="button"
                      >
                        Already have an account? Sign In
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-outline-variant/30" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                          <span className="bg-white/80 px-2 font-label-md text-on-surface-variant">
                            New to Nurture?
                          </span>
                        </div>
                      </div>

                      <button
                        className="w-full rounded-lg border border-primary py-3 text-[14px] font-semibold text-primary transition-colors hover:bg-primary/5"
                        onClick={() => handleModeChange("signup")}
                        type="button"
                      >
                        Create Account
                      </button>
                    </>
                  )}
                </form>
              </div>
            )}

            <div className="mt-gutter text-center">
              <p className="text-[12px] text-on-surface-variant opacity-70">
                By signing in, you agree to our{" "}
                <a className="underline" href="#">
                  Terms
                </a>{" "}
                and{" "}
                <a className="underline" href="#">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
