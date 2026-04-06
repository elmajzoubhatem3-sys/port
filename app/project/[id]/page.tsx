"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type DbProject = {
  id: number;
  name: string;
  image_url: string;
  old_price: string;
  new_price: string | null;
  description: string | null;
};

type DbSection = {
  id: number;
  project_id: number;
  title: string;
  text: string | null;
  image_url: string;
};

type ProjectSection = {
  id: number;
  title: string;
  text: string;
  image: string;
};

type ProjectItem = {
  id: number;
  image: string;
  name: string;
  oldPrice: string;
  newPrice: string;
  description: string;
  sections: ProjectSection[];
};

export default function ProjectDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);

      const { data: projectRow, error: projectError } = await supabase
        .from("projects")
        .select("id,name,image_url,old_price,new_price,description")
        .eq("id", params.id)
        .single();

      const { data: sectionRows, error: sectionsError } = await supabase
        .from("project_sections")
        .select("id,project_id,title,text,image_url")
        .eq("project_id", params.id)
        .order("created_at", { ascending: true });

      if (projectError || sectionsError || !projectRow) {
        console.error(projectError || sectionsError);
        setLoading(false);
        return;
      }

      const mappedProject: ProjectItem = {
        id: (projectRow as DbProject).id,
        image: (projectRow as DbProject).image_url,
        name: (projectRow as DbProject).name,
        oldPrice: (projectRow as DbProject).old_price,
        newPrice: (projectRow as DbProject).new_price ?? "",
        description: (projectRow as DbProject).description ?? "",
        sections: ((sectionRows || []) as DbSection[]).map((section) => ({
          id: section.id,
          title: section.title,
          text: section.text ?? "",
          image: section.image_url,
        })),
      };

      setProject(mappedProject);
      setLoading(false);
    };

    fetchProject();
  }, [params.id]);

  if (loading) {
    return <div className="min-h-screen bg-white px-6 py-20 text-black">Loading...</div>;
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-white px-6 py-20 text-black md:px-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-lg font-medium">Project not found.</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-2xl bg-black px-5 py-3 text-white"
          >
            Back Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black md:px-14">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-8 inline-block rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Back To Home
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
          <img
            src={project.image}
            alt={project.name}
            className="h-[520px] w-full object-cover"
          />
          <div className="px-6 py-8 md:px-10">
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">Project</p>
            <h1 className="mt-3 text-4xl font-semibold text-black md:text-6xl">
              {project.name}
            </h1>

            {project.description && (
              <p className="mt-5 max-w-3xl text-sm leading-8 text-black/65 md:text-base">
                {project.description}
              </p>
            )}

            <div className="mt-6 flex items-center gap-3">
              {project.newPrice ? (
                <>
                  <p className="text-lg text-black/40 line-through">{project.oldPrice}</p>
                  <p className="text-3xl font-semibold text-green-600">{project.newPrice}</p>
                </>
              ) : (
                <p className="text-3xl font-semibold text-black">{project.oldPrice}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8">
          {project.sections.length > 0 ? (
            project.sections.map((section) => (
              <div
                key={section.id}
                className="grid gap-6 rounded-[2rem] bg-[#faf8f4] p-5 shadow-sm md:grid-cols-2 md:items-center"
              >
                <img
                  src={section.image}
                  alt={section.title}
                  className="h-[340px] w-full rounded-[1.5rem] object-cover"
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-black/40">Section</p>
                  <h2 className="mt-2 text-2xl font-semibold text-black">{section.title}</h2>
                  {section.text && (
                    <p className="mt-4 text-sm leading-7 text-black/60 md:text-base">
                      {section.text}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[2rem] bg-[#faf8f4] p-6 text-sm text-black/55 shadow-sm">
              No detailed sections added yet for this project.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}