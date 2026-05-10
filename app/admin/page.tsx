"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ProjectsManager } from "../components/ProjectsManager";

const ADMIN_PASSWORD = "vertex123";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
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
      setPassword("");
      setLoginError("");
      localStorage.setItem("vertex-admin", "true");
      return;
    }

    setLoginError("Wrong password");
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setPassword("");
    setLoginError("");
    localStorage.removeItem("vertex-admin");
  };

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-black md:px-14">
      <div className="mx-auto max-w-7xl">

        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">
              Vertex Admin
            </p>

            <h1 className="mt-2 text-4xl font-semibold">
              Manage Projects
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
          >
            Back Home
          </Link>
        </div>

        {!isAdmin ? (
          <form
            onSubmit={handleLogin}
            className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm"
          >
            <p className="mb-4 text-lg font-semibold">
              Admin Login
            </p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
            />

            {loginError && (
              <p className="mt-3 text-sm text-red-500">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="mt-4 w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
            >
              Login
            </button>
          </form>
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
              >
                Logout
              </button>
            </div>

            <ProjectsManager isAdmin={true} mode="all" />
          </>
        )}

      </div>
    </main>
  );
}