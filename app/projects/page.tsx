"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProjectsManager } from "../components/ProjectsManager";

export default function AllProjectsPage() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem("vertex-admin") === "true";
    setIsAdmin(adminStatus);
  }, []);

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black md:px-14">
      <div className="mx-auto max-w-7xl">

        <Link
          href="/"
          className="mb-6 inline-block rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black hover:bg-black hover:text-white"
        >
          Back Home
        </Link>

        <h1 className="text-4xl font-semibold mb-10">
          All Projects
        </h1>

        <ProjectsManager isAdmin={isAdmin} mode="all" />

      </div>
    </main>
  );
}