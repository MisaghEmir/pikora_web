import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | PIKORA",
  description:
    "Learn about PIKORA, an online poker platform built for fun, learning, and friendly competition.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0F1116] text-white">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute w-[500px] h-[500px] bg-[#E6B72B]/10 blur-[140px] rounded-full -top-60 left-1/2 -translate-x-1/2" />

        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <p className="text-[#E6B72B] uppercase tracking-[0.3em] text-sm font-bold">
            About PIKORA
          </p>

          <h1 className="text-4xl md:text-6xl font-black mt-5">
            Poker is more than a game.
          </h1>

          <p className="max-w-2xl mx-auto mt-6 text-white/55 text-lg leading-8">
            PIKORA is a place where players can enjoy poker, improve their
            skills, and experience the excitement of the game in a simple and
            welcoming environment.
          </p>

          <Link
            href="/bot"
            className="inline-flex mt-9 px-8 py-3.5 rounded-xl bg-[#E6B72B] text-black font-bold hover:bg-[#f0c94c] transition"
          >
            Play Now
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#E6B72B] text-sm font-bold uppercase tracking-widest">
              Who We Are
            </p>

            <h2 className="text-3xl md:text-4xl font-extrabold mt-4">
              Welcome to PIKORA
            </h2>

            <p className="text-white/55 leading-8 mt-6">
              We created PIKORA with one goal: to make poker accessible and
              enjoyable for everyone. Whether you are learning the basics or
              already understand the game, PIKORA gives you a place to practice
              and have fun.
            </p>

            <p className="text-white/55 leading-8 mt-4">
              Our platform focuses on a smooth experience, easy-to-use gameplay,
              and opportunities to play at your own pace.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#1A1D24] p-8 md:p-10">
            <div className="text-5xl font-black text-[#E6B72B]">P</div>

            <h3 className="text-2xl font-bold mt-5">Play. Learn. Improve.</h3>

            <p className="text-white/50 leading-7 mt-4">
              Discover poker, practice your decisions, and enjoy every hand with
              PIKORA.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#14171D]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-extrabold text-center">
            What We Believe In
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {[
              {
                title: "Fun First",
                description:
                  "Games should be enjoyable, accessible, and easy to explore.",
              },
              {
                title: "Keep Learning",
                description:
                  "Every hand is an opportunity to understand the game better.",
              },
              {
                title: "Fair Play",
                description:
                  "We aim to provide a friendly environment built around the game.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-[#1A1D24] p-7"
              >
                <div className="w-10 h-1 rounded-full bg-[#E6B72B]" />

                <h3 className="text-xl font-bold mt-6">{item.title}</h3>

                <p className="text-white/50 leading-7 mt-3">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold">Ready to play?</h2>

        <p className="text-white/50 mt-4">
          Start a game and discover the world of PIKORA.
        </p>

        <Link
          href="/bot"
          className="inline-flex mt-7 px-8 py-3.5 rounded-xl bg-[#E6B72B] text-black font-bold hover:bg-[#f0c94c] transition"
        >
          Start Playing
        </Link>
      </section>

      <footer className="border-t border-white/5 py-7 text-center text-white/30 text-sm">
        © 2026 PIKORA. All rights reserved.
      </footer>
    </main>
  );
}
