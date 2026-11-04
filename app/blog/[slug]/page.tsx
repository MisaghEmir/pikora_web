import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/blogPosts";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return {
      title: "Article Not Found | PIKORA",
    };
  }

  return {
    title: `${post.title} | PIKORA`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | PIKORA`,
      description: post.excerpt,
      type: "article",
      siteName: "PIKORA",
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0F1116] text-white">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute w-[500px] h-[500px] bg-[#E6B72B]/10 blur-[140px] rounded-full -top-60 left-1/2 -translate-x-1/2" />

        <div className="relative max-w-4xl mx-auto px-6 py-20">
          <Link
            href="/blog"
            className="text-white/40 text-sm hover:text-[#E6B72B] transition"
          >
            ← Back to Blog
          </Link>

          <p className="text-[#E6B72B] text-sm font-bold uppercase tracking-widest mt-10">
            {post.category}
          </p>

          <h1 className="text-3xl md:text-5xl font-black leading-tight mt-5">
            {post.title}
          </h1>

          <p className="text-white/55 text-lg leading-8 mt-6">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-4 mt-7 text-sm text-white/35">
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="space-y-12">
          {post.content.map((section, index) => (
            <section key={index}>
              <h2 className="text-2xl md:text-3xl font-extrabold">
                {section.heading}
              </h2>

              <div className="space-y-5 mt-6">
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className="text-white/60 text-base leading-8"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <Link
            href="/blog"
            className="text-[#E6B72B] font-bold hover:underline"
          >
            ← Explore More Articles
          </Link>
        </div>
      </article>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-3xl border border-white/10 bg-[#1A1D24] p-8 text-center">
          <h2 className="text-2xl font-extrabold">
            Put Your Knowledge Into Practice
          </h2>

          <p className="text-white/50 mt-4">
            Start playing poker and improve your understanding of the game.
          </p>

          <Link
            href="/bot"
            className="inline-flex mt-7 px-8 py-3 rounded-xl bg-[#E6B72B] text-black font-bold hover:bg-[#f0c94c] transition"
          >
            Play Now
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-7 text-center text-white/30 text-sm">
        © {new Date().getFullYear()} PIKORA. All rights reserved.
      </footer>
    </main>
  );
}