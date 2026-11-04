"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useUserStore } from "@/store/userStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      const { token, user } = data;

      if (!token || !user) {
        throw new Error("Invalid server response.");
      }

      await useUserStore.getState().setUser(user, token);

      alert("logined");
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F1116] px-5 py-10 text-white">

      {/* Back Button */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 backdrop-blur-md transition hover:border-[#D6A64F] hover:text-[#D6A64F] active:scale-95"
      >
        <ArrowLeft size={21} />
      </button>

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage: "url('/images/backgrounds/Dark.png')",
        }}
      />

      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center justify-between gap-14 md:flex-row md:gap-10">

        {/* Left Side */}
        <section className="flex flex-col items-center text-center md:items-start md:text-left">
          <h1 className="text-5xl font-black tracking-[3px] md:text-6xl">
            PIKO<span className="text-[#D6A64F]">RA</span>
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-7 text-white/55">
            Enter the table.
            <br />
            Play your game. Make your move.
          </p>

          <Link
            href="/register"
            className="mt-8 text-sm text-white/50 transition hover:text-white"
          >
            Don&apos;t have an account?{" "}
            <span className="font-bold text-[#D6A64F]">
              Create Account
            </span>
          </Link>
        </section>

        {/* Login Box */}
        <section className="w-full max-w-[390px] rounded-xl bg-gradient-to-br from-white via-[#B87317] to-white p-[3px] shadow-[0_0_50px_rgba(184,115,23,0.12)]">
          <div className="rounded-[10px] bg-[#1D1C1C] p-7 sm:p-9">

            <div className="mb-8">
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <p className="mt-2 text-sm text-white/40">
                Login to continue playing.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm text-white/65">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                  className="h-[54px] w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#222] outline-none transition placeholder:text-gray-400 focus:border-[#D6A64F] focus:ring-2 focus:ring-[#D6A64F]/20"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm text-white/65">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="h-[54px] w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#222] outline-none transition placeholder:text-gray-400 focus:border-[#D6A64F] focus:ring-2 focus:ring-[#D6A64F]/20"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="h-[54px] w-full rounded-xl bg-[#1677ff] font-bold text-white transition hover:bg-[#0866e8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Login"}
              </button>
            </form>

            <div className="mt-7 text-center text-xs text-white/30">
              Secure login · PIKORA
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}