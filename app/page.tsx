"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ProjectsManager } from "./components/ProjectsManager";

function HeroScene() {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <motion.img
        src="/images/house.jpg"
        alt="VERTEX hero"
        className="h-screen w-full object-cover object-center"
        style={{ imageRendering: "auto" }}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

function FeatureIcon({ type }: { type: string }) {
  if (type === "location") {
    return (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 21s7-6.2 7-12A7 7 0 0 0 5 9c0 5.8 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    );
  }

  if (type === "estate") {
    return (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 21V7l8-4 8 4v14" />
        <path d="M9 21v-7h6v7" />
        <path d="M8 10h.01M16 10h.01" />
      </svg>
    );
  }

  if (type === "home") {
    return (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10v11h14V10" />
        <path d="M10 21v-6h4v6" />
      </svg>
    );
  }

  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 21V8h16v13" />
      <path d="M8 8V5h8v3" />
      <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </svg>
  );
}

export default function VertexPortfolioHomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f7] text-white">
      <section className="relative h-screen w-full">
        <div className="absolute inset-0">
          <HeroScene />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex h-full items-end px-6 pb-14 md:px-14 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Designing elevated homes with a luxury modern vision.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
              Architecture, interiors, and refined residential concepts crafted to feel timeless,
              precise, and premium.
            </p>

            <div className="mt-8 flex flex-nowrap gap-2 overflow-x-auto sm:gap-4">
              <a
                href="#projects"
                className="whitespace-nowrap rounded-2xl bg-white px-4 py-3 text-xs font-semibold text-black transition hover:scale-[1.02] sm:px-6 sm:text-sm"
              >
                View Projects
              </a>

              <a
                href="#about"
                className="whitespace-nowrap rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/15 sm:px-6 sm:text-sm"
              >
                About Us
              </a>

              <a
                href="#contact"
                className="whitespace-nowrap rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/15 sm:px-6 sm:text-sm"
              >
                Contact
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="projects" className="bg-[#f7f7f7] px-6 py-24 text-black md:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="text-3xl font-semibold md:text-5xl">Selected Work</h2>

            <p className="max-w-xl text-sm leading-7 text-black/55 md:text-base">
              A curated selection of residential concepts designed with balance,
              elegance, and a modern architectural point of view.
            </p>
          </div>

          <ProjectsManager isAdmin={false} mode="featured" />

          <div className="mt-10 flex justify-center">
            <Link
              href="/projects"
              className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              View All Projects
            </Link>
          </div>
        </div>
      </section>

      <section id="about" className="bg-[#f7f7f7] px-6 py-20 text-black md:px-14">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">About Us</p>

            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
              We design homes that feel calm, refined, and timeless.
            </h2>
          </div>

          <div className="space-y-6 text-sm leading-7 text-black/65 md:text-base">
            <p>
              VERTEX Homes Studio is focused on modern residential design
              with a clean visual language, thoughtful layouts,
              and elevated details.
            </p>

            <p>
              Our work blends architecture, interior direction,
              and premium presentation to create homes that look strong,
              elegant, and highly livable.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f7f7] px-6 pb-24 text-black md:px-14">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-4">
          {[
            {
              type: "location",
              title: "Top Locations",
              text: "Properties in prime areas with key amenities.",
            },
            {
              type: "estate",
              title: "Elite Estates",
              text: "Upscale properties with luxury designs.",
            },
            {
              type: "home",
              title: "Budget Homes",
              text: "Affordable options for families and individuals.",
            },
            {
              type: "business",
              title: "Business Properties",
              text: "Commercial spaces for offices and retail.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="min-h-[180px] rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm"
            >
              <div className="mb-8 text-black">
                <FeatureIcon type={item.type} />
              </div>

              <h3 className="text-xl font-semibold">{item.title}</h3>

              <p className="mt-3 text-sm leading-6 text-black/50">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-[#f7f7f7] px-6 py-20 text-black md:px-14">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-black/10 bg-white p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-black/45">Contact</p>

          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
            Let’s build your next project.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-[#f7f7f7] p-6 shadow-sm">
              <p className="text-sm text-black/45">Phone</p>
              <p className="mt-2 text-lg font-semibold">+961 00 000 000</p>
            </div>

            <div className="rounded-3xl bg-[#f7f7f7] p-6 shadow-sm">
              <p className="text-sm text-black/45">Email</p>
              <p className="mt-2 text-lg font-semibold">hello@vertexhomes.com</p>
            </div>

            <div className="rounded-3xl bg-[#f7f7f7] p-6 shadow-sm">
              <p className="text-sm text-black/45">Instagram</p>
              <p className="mt-2 text-lg font-semibold">@vertexhomesstudio</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}