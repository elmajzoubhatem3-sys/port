"use client";

import Link from "next/link";
import { ProjectsManager } from "../components/ProjectsManager";

export default function AllProjectsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black md:px-14">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-6 inline-block rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black hover:bg-black hover:text-white"
        >
          Back Home
        </Link>

        <h1 className="mb-10 text-4xl font-semibold">All Projects</h1>

        <ProjectsManager isAdmin={false} mode="all" />
      </div>
    </main>
  );
}