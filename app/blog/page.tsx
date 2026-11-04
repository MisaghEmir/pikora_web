import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blogPosts";

export const metadata: Metadata = {
  title: "Poker Blog | Guides, Rules & Strategies | PIKORA",
  description:
    "Explore poker guides, Texas Hold'em rules, poker hand rankings, beginner strategies, and helpful tips from PIKORA.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#0F1116] text-white">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute w-[500px] h-[500px] bg-[#E6B72B]/10 blur-[140px] rounded-full -top-60 left-1/2 -translate-x-1/2" />

        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <p className="text-[#E6B72B] uppercase tracking-[0.3em] text-sm font-bold">
            PIKORA Blog
          </p>

          <h1 className="text-4xl md:text-6xl font-black mt-5">
            Learn More About Poker
          </h1>

          <p className="max-w-2xl mx-auto mt-6 text-white/55 text-lg leading-8">
            Discover poker rules, hand rankings, beginner guides, and
            strategies to help you understand and enjoy the game.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[#E6B72B] text-sm font-bold uppercase tracking-widest">
              Latest Articles
            </p>

            <h2 className="text-3xl font-extrabold mt-3">
              Poker Guides & Articles
            </h2>
          </div>

          <p className="text-white/40 text-sm">
            {blogPosts.length} articles
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post, index) => (
            <article
              key={post.slug}
              className="group flex flex-col rounded-2xl border border-white/10 bg-[#1A1D24] overflow-hidden hover:border-[#E6B72B]/40 transition"
            >
              <div className="h-44 relative bg-gradient-to-br from-[#29271D] via-[#1D211F] to-[#14171D] flex items-center justify-center overflow-hidden">
                <div className="absolute w-40 h-40 rounded-full bg-[#E6B72B]/10 blur-3xl group-hover:bg-[#E6B72B]/20 transition" />

                <span className="relative text-6xl font-black text-[#E6B72B]/80">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="absolute bottom-4 left-5 text-xs font-bold uppercase tracking-widest text-[#E6B72B]">
                  {post.category}
                </span>
              </div>

              <div className="flex flex-col flex-1 p-6">
                <div className="flex items-center gap-3 text-xs text-white/35">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>

                <h3 className="text-xl font-bold mt-4 leading-7 group-hover:text-[#E6B72B] transition">
                  {post.title}
                </h3>

                <p className="text-white/50 text-sm leading-7 mt-3 flex-1">
                  {post.excerpt}
                </p>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 mt-6 text-[#E6B72B] text-sm font-bold hover:gap-3 transition-all"
                >
                  Read Article
                  <span>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-3xl border border-white/10 bg-[#1A1D24] p-8 md:p-12 text-center">
          <p className="text-[#E6B72B] text-sm font-bold uppercase tracking-widest">
            Practice What You Learn
          </p>

          <h2 className="text-3xl font-extrabold mt-4">
            Ready for Your Next Hand?
          </h2>

          <p className="text-white/50 mt-4 max-w-xl mx-auto leading-7">
            Put your poker knowledge into practice and enjoy a game
            against bots on PIKORA.
          </p>

          <Link
            href="/bot"
            className="inline-flex mt-7 px-8 py-3.5 rounded-xl bg-[#E6B72B] text-black font-bold hover:bg-[#f0c94c] transition"
          >
            Play Poker
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-7 text-center text-white/30 text-sm">
        © {new Date().getFullYear()} PIKORA. All rights reserved.
      </footer>
    </main>
  );
}