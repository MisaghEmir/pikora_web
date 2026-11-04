
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Spade,
  Bot,
  LockKeyhole,
  ChevronRight,
  Trophy,
  Sparkles,
} from "lucide-react";

import { useUserStore } from "@/store/userStore";
import HomeHeader from "@/components/layout/HomeHeader";
import HomeFooter from "@/components/layout/HomeFooter";

export default function Home() {
  const { user, loadUser, logout } = useUserStore();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      await loadUser();
      setIsLoaded(true);
    };

    initializeUser();
  }, [loadUser]);

  const handleLogout = async () => {
    await logout();
  };

  const gameModes = [
    {
      title: "ONLINE POKER",
      description: "Play against real players around the world.",
      subtitle: "MULTIPLAYER",
      href: "/lobby",
      icon: Spade,
      number: "01",
      disabled: !user || !isLoaded,
    },
    {
      title: "BOT POKER",
      description:
        "Challenge intelligent AI players and improve your skills.",
      subtitle: "PLAY WITH AI",
      href: "/bot",
      icon: Bot,
      number: "02",
      disabled: false,
    },
    {
      title: "PRIVATE TABLES",
      description:
        "Create your own table and invite your friends.",
      subtitle: "PLAY WITH FRIENDS",
      href: "/private-table",
      icon: LockKeyhole,
      number: "03",
      disabled: !user || !isLoaded,
    },
  ];

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#080d0b] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(17,91,59,0.23),transparent_65%)]" />

        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:55px_55px]" />

        <div className="absolute -left-40 top-40 h-96 w-96 rounded-full bg-emerald-900/10 blur-[120px]" />

        <div className="absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-yellow-700/10 blur-[120px]" />
      </div>

      {/* Header */}
      <HomeHeader
        user={user}
        chips={user?.chips ?? 10000}
        isLoaded={isLoaded}
      />

      {/* Main */}
      <section className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-1 flex-col justify-center px-5 py-12 md:px-10 md:py-16">
        {/* Title */}
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c9a45c]/20 bg-[#c9a45c]/[0.06] px-4 py-2 text-[10px] font-bold tracking-[0.22em] text-[#d9bd7d]">
            <Sparkles size={13} />
            THE NEXT LEVEL OF POKER
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
            CHOOSE YOUR{" "}
            <span className="text-[#d6b66e]">GAME</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/45 md:text-base">
            Enter the table, test your strategy and make every hand count.
          </p>
        </div>

        {/* Game Modes */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {gameModes.map((mode) => {
            const Icon = mode.icon;

            const cardContent = (
              <>
                <div className="relative flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold tracking-[0.25em] ${
                      mode.disabled
                        ? "text-white/50"
                        : "text-[#d6b66e]"
                    }`}
                  >
                    {mode.subtitle}
                  </span>

                  <span className="text-xs font-semibold text-white/20">
                    {mode.number}
                  </span>
                </div>

                <div className="relative my-auto flex items-center justify-center py-8">
                  <div
                    className={`flex h-28 w-28 items-center justify-center rounded-3xl border transition duration-500 ${
                      mode.disabled
                        ? "border-white/10 bg-white/[0.02]"
                        : "border-[#c9a45c]/20 bg-[#c9a45c]/10 group-hover:scale-110 group-hover:rotate-3"
                    }`}
                  >
                    <Icon
                      className={`h-14 w-14 ${
                        mode.disabled
                          ? "text-white/50"
                          : "text-[#d6b66e]"
                      }`}
                      strokeWidth={1.4}
                    />
                  </div>
                </div>

                <div className="relative">
                  <h2 className="text-xl font-black tracking-wide md:text-2xl">
                    {mode.title}
                  </h2>

                  <p
                    className={`mt-3 min-h-[48px] text-sm leading-6 ${
                      mode.disabled
                        ? "text-white/40"
                        : "text-white/60"
                    }`}
                  >
                    {mode.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-5">
                    <span
                      className={`text-[10px] font-bold tracking-[0.2em] ${
                        mode.disabled
                          ? "text-white/40"
                          : "text-white/70"
                      }`}
                    >
                      {mode.disabled ? "COMING SOON" : "PLAY NOW"}
                    </span>

                    {mode.disabled ? (
                      <div className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-bold tracking-wider text-white/40">
                        LOCKED
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c9a45c]/30 transition group-hover:bg-[#d6b66e] group-hover:text-black">
                        <ChevronRight size={18} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            );

            return mode.disabled ? (
              <div
                key={mode.number}
                aria-disabled="true"
                className="relative flex min-h-[300px] cursor-not-allowed flex-col overflow-hidden rounded-2xl border border-white/[0.04] bg-[#111613]/70 p-7 opacity-35 grayscale md:min-h-[350px] md:p-8"
              >
                <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-bold tracking-widest text-white/50">
                  COMING SOON
                </div>

                {cardContent}
              </div>
            ) : (
              <Link
                key={mode.number}
                href={mode.href}
                className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-[#c9a45c]/30 bg-gradient-to-br from-[#302718] via-[#171813] to-[#0b100d] p-7 transition duration-300 hover:-translate-y-2 hover:border-[#d6b66e]/60 hover:shadow-2xl hover:shadow-[#c9a45c]/10 md:min-h-[350px] md:p-8"
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#c9a45c]/10 blur-[70px]" />

                {cardContent}
              </Link>
            );
          })}
        </div>

        {/* Bottom Text */}
        <div className="mt-10 flex items-center justify-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-white/25">
          <Trophy size={14} className="text-[#c9a45c]" />
          PLAY SMART. PLAY FAIR. ENJOY THE GAME.
        </div>
      </section>

      {/* Footer */}
      <HomeFooter
        user={user}
        isLoaded={isLoaded}
        onLogout={handleLogout}
      />
    </main>
  );
}
