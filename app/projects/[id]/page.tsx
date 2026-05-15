"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ProjectSection = {
  id: number;
  title: string;
  text: string;
  images: string[];
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

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [project, setProject] =
    useState<ProjectItem | null>(null);

  const [loading, setLoading] = useState(true);

  const parseImages = (
    value: string | null | undefined
  ): string[] => {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item) => typeof item === "string"
        );
      }

      if (typeof parsed === "string") {
        return [parsed];
      }

      return [];
    } catch {
      return [value];
    }
  };

  const fetchProject = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const numericId = Number(projectId);

    const {
      data: projectRow,
      error: projectError,
    } = await supabase
      .from("projects")
      .select("*")
      .eq("id", numericId)
      .single();

    const {
      data: sectionRows,
      error: sectionsError,
    } = await supabase
      .from("project_sections")
      .select("*")
      .eq("project_id", numericId)
      .order("created_at", {
        ascending: true,
      });

    if (
      projectError ||
      sectionsError ||
      !projectRow
    ) {
      console.error(
        "projectError:",
        projectError
      );

      console.error(
        "sectionsError:",
        sectionsError
      );

      setProject(null);
      setLoading(false);
      return;
    }

    const mappedProject: ProjectItem = {
      id: projectRow.id,
      image: projectRow.image_url ?? "",
      name: projectRow.name ?? "",
      oldPrice: projectRow.old_price ?? "",
      newPrice: projectRow.new_price ?? "",
      description: projectRow.description ?? "",

      sections: (sectionRows || []).map(
        (section: any) => ({
          id: section.id,
          title: section.title ?? "",
          text: section.text ?? "",
          images: parseImages(
            section.image_url
          ),
        })
      ),
    };

    setProject(mappedProject);
    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-6 py-20 text-black">
        Loading...
      </div>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-white px-6 py-20 text-black md:px-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-lg font-medium">
            Not found
          </p>

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

        <div className="mt-10 grid gap-8">

          {project.sections.length > 0 ? (
            project.sections.map(
              (section) => (
                <div
                  key={section.id}
                  className="rounded-2xl bg-[#faf8f4] p-5"
                >

                  <div className="grid gap-4 md:grid-cols-2">

                    {section.images.map(
                      (img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Project image ${index + 1}`}
                          className="aspect-square w-full rounded-xl object-cover"
                        />
                      )
                    )}

                  </div>

                </div>
              )
            )
          ) : (
            <div className="rounded-2xl bg-[#faf8f4] p-6 text-sm text-black/55 shadow-sm">
              No images added yet.
            </div>
          )}

        </div>
      </div>
    </main>
  );
}