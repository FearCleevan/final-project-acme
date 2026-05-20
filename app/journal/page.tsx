"use client";

import Link from "next/link";
import Breadcrumb from "@/components/shared/Breadcrumb";
import Eyebrow from "@/components/shared/Eyebrow";

const posts = [
  {
    slug: "no-2-burner-night-test",
    date: "March 2026",
    tag: "Bench Notes",
    title: "What the No. 2 burner tells you after eight hours.",
    excerpt:
      "Most burner failures show up in the first twenty minutes or the last two hours. The hours in between are quiet. Here's what we watch for, and why we don't shorten the test.",
  },
  {
    slug: "pune-press-shop-dies",
    date: "January 2026",
    tag: "Workshop",
    title: "The dies that have not been recut since 1908.",
    excerpt:
      "Press Shop 4 runs on original tooling. We've replaced the press frames twice. The dies themselves have never been touched. This is why that matters to the pieces you receive.",
  },
  {
    slug: "sourcing-milk-glass",
    date: "November 2025",
    tag: "Materials",
    title: "Why milk-white cased glass is harder to source than it looks.",
    excerpt:
      "There are three suppliers left in the world making genuine cased milk glass to the original opacity spec. We use one of them. The other two produce something that photographs well and burns badly.",
  },
  {
    slug: "straw-packing-method",
    date: "September 2025",
    tag: "Dispatch",
    title: "Straw packing: the method that hasn't changed in forty years.",
    excerpt:
      "Bubble wrap is fine for electronics. For hand-blown glass, century-old brass, and triple-fired porcelain, we still use straw. Here is how we do it, and what happens if something arrives broken anyway.",
  },
  {
    slug: "porcelain-sign-firing",
    date: "July 2025",
    tag: "Signs",
    title: "The third firing: why it costs more and why it's worth it.",
    excerpt:
      "Our porcelain signs go through the kiln three times. One firing is standard. Two is common. Three is how you get a surface that holds colour in direct sun for forty years without chalking.",
  },
  {
    slug: "original-patent-1873",
    date: "May 2025",
    tag: "History",
    title: "Reading the 1873 Cattaraugus patent — what it actually says.",
    excerpt:
      "The patent document is twelve pages of Victorian technical prose. We've read it in full. The center-draft principle it describes is still the best way to burn a wide wick cleanly. Nothing has improved on it.",
  },
];

export default function JournalPage() {
  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 py-14">
        <Breadcrumb
          crumbs={[
            { label: "Storefront", href: "/" },
            { label: "Bench Notes" },
          ]}
          className="mb-10"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-16 items-start">
          {/* Posts */}
          <div>
            <Eyebrow className="mb-4">A letter, not a marketing list</Eyebrow>
            <h1
              className="font-serif font-medium text-ink-charcoal leading-tight mb-14"
              style={{ fontSize: "clamp(28px, 4vw, 52px)" }}
            >
              Bench Notes.
            </h1>

            <div className="divide-y divide-ink-rule">
              {posts.map((post) => (
                <article key={post.slug} className="py-10 first:pt-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep">
                      {post.tag}
                    </span>
                    <span className="text-ink-rule">·</span>
                    <time className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft">
                      {post.date}
                    </time>
                  </div>

                  {/* IMPLEMENTATION 1: Wrap the heading title in a Link component */}
                  <Link href={`/journal/${post.slug}`} className="block group">
                    <h2 className="font-serif text-[22px] font-medium text-ink-charcoal leading-snug mb-3 group-hover:text-brass-deep transition-colors cursor-pointer">
                      {post.title}
                    </h2>
                  </Link>

                  <p className="font-sans text-[15px] text-ink-soft leading-relaxed mb-4 max-w-[64ch]">
                    {post.excerpt}
                  </p>

                  {/* IMPLEMENTATION 2: Wrap the "Read the note" text in a Link component */}
                  <Link
                    href={`/journal/${post.slug}`}
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center text-[12px] front-mono uppercase tracking-eyebrow text-brass-deep border-b border-brass-deel/40 hover:hover-brass-deep pb-px cursor-pointer group/link transition-colors"
                  >
                    <span className="transform translate-x-0 group-hover/link:translate-x-1 transition-transform duration-200 ease-out">
                      Read the note →
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 space-y-8">
            <div className="bg-parchment-2 border border-ink-rule rounded-sm p-6">
              <Eyebrow className="mb-3">Subscribe</Eyebrow>
              <h3 className="font-serif text-[18px] text-ink-charcoal font-medium mb-2 leading-snug">
                Bench notes, once a month.
              </h3>
              <p className="font-sans text-[13px] text-ink-soft leading-relaxed mb-4">
                Real writing from the workshop. No promo codes. No
                autoresponders.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="flex-1 h-11 px-3 bg-parchment border border-ink-rule rounded-sm text-[13px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep transition-colors"
                />
                <button className="h-11 px-4 bg-brass-deep text-[#F5F1E6] rounded-btn font-sans text-[13px] font-semibold hover:bg-brass hover:text-ink-charcoal transition-colors shrink-0">
                  →
                </button>
              </div>
            </div>

            {/* Sidebar Topics */}
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-3">
                Browse by topic
              </p>
              {[
                { name: "Bench Notes", count: 5 },
                { name: "Workshop", count: 3 },
                { name: "Materials", count: 4 },
                { name: "Dispatch", count: 2 },
                { name: "Signs", count: 6 },
                { name: "History", count: 1 },
              ].map((tag) => (
                <div
                  key={tag.name}
                  className="flex items-center justify-between py-2 border-b border-ink-rule last:border-none"
                >
                  <Link
                    href={`/journal/topic/${tag.name.toLowerCase().replace(" ", "-")}`}
                    onClick={(e) => e.preventDefault()} // Intercepts and stops Next.js routing
                    className="font-sans text-[13px] text-ink-iron hover:text-brass-deep cursor-pointer group/topic inline-flex items-center transition-colors"
                  >
                    <span className="transform translate-x-0 group-hover/topic:translate-x-1 transition-transform duration-200 ease-out">
                      {tag.name}
                    </span>
                  </Link>
                  <span className="font-mono text-[10px] text-ink-soft select-none">
                    {tag.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
