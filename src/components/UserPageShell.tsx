import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import FallBeamBackground from "@/components/lightswind/fall-beam-background";

type UserPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  showNavbar?: boolean;
  mainClassName?: string;
  contentClassName?: string;
};

const panelClassName =
  "rounded-[2rem] border border-white/60 bg-white/78 backdrop-blur-xl shadow-[0_24px_80px_rgba(14,116,144,0.12)]";

const joinClassNames = (...classNames: Array<string | undefined | false>) => classNames.filter(Boolean).join(" ");

const UserPageShell = ({
  eyebrow,
  title,
  description,
  children,
  actions,
  aside,
  backHref,
  backLabel = "Back",
  onBack,
  showNavbar = true,
  mainClassName,
  contentClassName,
}: UserPageShellProps) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(34,211,238,0.14),_transparent_28%),linear-gradient(180deg,_#f4fffe_0%,_#f8fbff_48%,_#eef8ff_100%)] text-slate-900">
      {showNavbar ? <Navbar /> : null}

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-20 left-[8%] h-56 w-56 rounded-full bg-teal-300/18 blur-3xl" />
          <div className="absolute right-[6%] top-16 h-72 w-72 rounded-full bg-cyan-300/14 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-200/20 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:56px_56px]" />
        </div>

        <FallBeamBackground lineCount={10} beamColorClass="cyan-300" />

        <main className={joinClassNames("relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10", mainClassName)}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            {backHref ? (
              <Link
                to={backHref}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            ) : onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </button>
            ) : (
              <div />
            )}

            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>

          <section className={joinClassNames("grid gap-6", aside ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : undefined)}>
            <div className={joinClassNames(panelClassName, "p-6 sm:p-8 lg:p-10")}>
              <div className="inline-flex items-center rounded-full border border-teal-200 bg-teal-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-teal-700">
                {eyebrow}
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                {description}
              </p>
            </div>

            {aside ? <aside className={joinClassNames(panelClassName, "p-6")}>{aside}</aside> : null}
          </section>

          <div className={joinClassNames("mt-8", contentClassName)}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default UserPageShell;