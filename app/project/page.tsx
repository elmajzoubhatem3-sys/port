"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ProjectsManager } from "../components/ProjectsManager";

const ADMIN_PASSWORD = "vertex123";

export default function AllProjectsPage() {
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
    <main className="min-h-screen bg-white px-6 py-10 text-black md:px-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/"
              className="inline-block rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            >
              Back Home
            </Link>

            <p className="mt-8 text-sm uppercase tracking-[0.3em] text-black/45">
              Archive
            </p>
            <h1 className="mt-2 text-4xl font-semibold md:text-6xl">
              All Projects
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-black/55 md:text-base">
              View and manage the full project collection.
            </p>
          </div>

          <div>
            {!isAdmin ? (
              <button
                type="button"
                onClick={() => setShowLogin((prev) => !prev)}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
              >
                Admin Login
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
              >
                Logout
              </button>
            )}

            {showLogin && !isAdmin && (
              <form
                onSubmit={handleLogin}
                className="mt-3 w-[280px] rounded-3xl border border-black/10 bg-white p-4 shadow-lg"
              >
                <p className="mb-3 text-sm font-medium text-black">Enter admin password</p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none"
                />
                {loginError && <p className="mt-2 text-sm text-red-500">{loginError}</p>}
                <button
                  type="submit"
                  className="mt-3 w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
                >
                  Login
                </button>
              </form>
            )}
          </div>
        </div>

        <ProjectsManager isAdmin={isAdmin} mode="all" />
      </div>
    </main>
  );
}