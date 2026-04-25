"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ProjectsManager } from "./components/ProjectsManager";

const ADMIN_PASSWORD = "vertex123";

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

export default function VertexPortfolioHomePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const adminStatus = localStorage.getItem("vertex-admin") === "true";
    setIsAdmin(adminStatus);
  }, []);

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword("");
      setLoginError("");
      localStorage.setItem("vertex-admin", "true");
      return;
    }

    setLoginError("Wrong password");
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setShowLogin(false);
    setPassword("");
    setLoginError("");
    localStorage.removeItem("vertex-admin");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0b0b] text-white">
      <section className="relative h-screen w-full">
        <div className="absolute inset-0">
          <HeroScene />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute right-6 top-6 z-20 md:right-10 md:top-10">
          {!isAdmin ? (
            <button
              type="button"
              onClick={() => setShowLogin((prev) => !prev)}
              className="rounded-2xl border border-white/20 bg-black/35 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/50"
            >
              Admin Login
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-white/20 bg-black/35 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/50"
            >
              Logout
            </button>
          )}

          {showLogin && !isAdmin && (
            <form
              onSubmit={handleLogin}
              className="mt-3 w-[280px] rounded-3xl border border-white/15 bg-black/70 p-4 backdrop-blur-xl"
            >
              <p className="mb-3 text-sm font-medium text-white">Enter admin password</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
              />
              {loginError && <p className="mt-2 text-sm text-red-300">{loginError}</p>}
              <button
                type="submit"
                className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Login
              </button>
            </form>
          )}
        </div>

        <div className="relative z-10 flex h-full items-end px-6 pb-14 md:px-14 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <p className="mb-3 text-sm uppercase tracking-[0.35em] text-white/70">
              VERTEX Homes Studio
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Designing elevated homes with a luxury modern vision.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
              Architecture, interiors, and refined residential concepts crafted to feel timeless,
              precise, and premium.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#projects"
                className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                View Projects
              </a>
              <a
                href="#about"
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                About Us
              </a>
              <a
                href="#contact"
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                Contact
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="projects" className="bg-white px-6 py-20 text-black md:px-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm uppercase tracking-[0.3em] text-black/50">Selected Projects</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="text-3xl font-semibold md:text-5xl">Selected Work</h2>
            <p className="max-w-xl text-sm leading-7 text-black/55 md:text-base">
              A curated selection of residential concepts designed with balance, elegance, and a
              modern architectural point of view.
            </p>
          </div>

          <ProjectsManager isAdmin={isAdmin} mode="featured" />
        </div>
      </section>

      <section id="about" className="bg-[#f7f3ee] px-6 py-20 text-black md:px-14">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">About Us</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
              We design homes that feel calm, refined, and timeless.
            </h2>
          </div>
          <div className="space-y-6 text-sm leading-7 text-black/65 md:text-base">
            <p>
              VERTEX Homes Studio is focused on modern residential design with a clean visual
              language, thoughtful layouts, and elevated details.
            </p>
            <p>
              Our work blends architecture, interior direction, and premium presentation to create
              homes that look strong, elegant, and highly livable.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white px-6 py-20 text-black md:px-14">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-black/10 bg-[#faf8f4] p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-black/45">Contact</p>
          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">Let’s build your next project.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm text-black/45">Phone</p>
              <p className="mt-2 text-lg font-semibold">+961 00 000 000</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm text-black/45">Email</p>
              <p className="mt-2 text-lg font-semibold">hello@vertexhomes.com</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm text-black/45">Instagram</p>
              <p className="mt-2 text-lg font-semibold">@vertexhomesstudio</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}