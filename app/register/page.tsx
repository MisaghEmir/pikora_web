
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      const { token, user } = data;

      if (!token || !user) {
        throw new Error("Invalid server response.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      router.replace("/bot");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create your account.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F1116] px-5 py-10 text-white">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage: "url('/images/backgrounds/Dark.png')",
        }}
      />

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center justify-between gap-12 md:flex-row md:gap-10">
        {/* Left Side */}
        <section className="flex flex-col items-center text-center md:items-start md:text-left">
          <h1 className="text-5xl font-black tracking-[3px] md:text-6xl">
            PIKO<span className="text-[#D6A64F]">RA</span>
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-7 text-white/55">
            Create your account.
            <br />
            Join the table and start playing.
          </p>

          <Link
            href="/login"
            className="mt-8 text-sm text-white/50 transition hover:text-white"
          >
            Already have an account?{" "}
            <span className="font-bold text-[#D6A64F]">Login</span>
          </Link>
        </section>

        {/* Register Box */}
        <section className="w-full max-w-[420px] rounded-xl bg-gradient-to-br from-white via-[#B87317] to-white p-[3px] shadow-[0_0_50px_rgba(184,115,23,0.12)]">
          <div className="rounded-[10px] bg-[#1D1C1C] p-7 sm:p-9">
            <div className="mb-7">
              <h2 className="text-2xl font-bold">Create Account</h2>
              <p className="mt-2 text-sm text-white/40">
                Fill in your details to get started.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Username */}
              <div>
                <label className="mb-2 block text-sm text-white/65">
                  Username
                </label>

                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  required
                  className="h-[52px] w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#222] outline-none transition placeholder:text-gray-400 focus:border-[#D6A64F] focus:ring-2 focus:ring-[#D6A64F]/20"
                />
              </div>

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
                  className="h-[52px] w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#222] outline-none transition placeholder:text-gray-400 focus:border-[#D6A64F] focus:ring-2 focus:ring-[#D6A64F]/20"
                />
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/65">
                    Password
                  </label>

                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="h-[52px] w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#222] outline-none transition placeholder:text-gray-400 focus:border-[#D6A64F] focus:ring-2 focus:ring-[#D6A64F]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/65">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    placeholder="Confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="h-[52px] w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#222] outline-none transition placeholder:text-gray-400 focus:border-[#D6A64F] focus:ring-2 focus:ring-[#D6A64F]/20"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-3 h-[54px] w-full rounded-xl bg-[#1677ff] font-bold text-white transition hover:bg-[#0866e8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <div className="mt-7 text-center text-xs text-white/30">
              Secure registration · PIKORA
            </div>
          </div>
        </section>
      </div>
      </main>
  );
}
