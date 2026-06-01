"use client";

import { motion } from "framer-motion";
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
  area: string;
  oldPrice: string;
  newPrice: string;
  description: string;
  sections: ProjectSection[];
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);

  const parseImages = (value: string | null | undefined): string[] => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === "string");
      if (typeof parsed === "string") return [parsed];
      return [];
    } catch {
      return [value];
    }
  };

  const getRoomIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("bed")) return "🛏️";
    if (lower.includes("bath")) return "🛁";
    if (lower.includes("kitchen")) return "🍴";
    if (lower.includes("living") || lower.includes("salon")) return "🛋️";
    if (lower.includes("garage")) return "🚗";
    if (lower.includes("pool")) return "🏊";
    return "🏠";
  };

  const fetchProject = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const numericId = Number(projectId);

    const { data: projectRow, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", numericId)
      .single();

    const { data: sectionRows, error: sectionsError } = await supabase
      .from("project_sections")
      .select("*")
      .eq("project_id", numericId)
      .order("created_at", { ascending: true });

    if (projectError || sectionsError || !projectRow) {
      console.error("projectError:", projectError);
      console.error("sectionsError:", sectionsError);
      setProject(null);
      setLoading(false);
      return;
    }

    setProject({
      id: projectRow.id,
      image: projectRow.image_url ?? "",
      name: projectRow.name ?? "",
      area: projectRow.area ?? "",
      oldPrice: projectRow.old_price ?? "",
      newPrice: projectRow.new_price ?? "",
      description: projectRow.description ?? "",
      sections: (sectionRows || []).map((section: any) => ({
        id: section.id,
        title: section.title ?? "",
        text: section.text ?? "",
        images: parseImages(section.image_url),
      })),
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  if (loading) {
    return <div className="min-h-screen bg-white px-6 py-20 text-black">Loading...</div>;
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-white px-6 py-20 text-black md:px-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-lg font-medium">Not found</p>
          <Link href="/" className="mt-6 inline-block rounded-2xl bg-black px-5 py-3 text-white">
            Back Home
          </Link>
        </div>
      </main>
    );
  }

  const roomInfo = project.sections.filter((section) => section.title !== "__images__");
  const roomImages = project.sections
    .filter((section) => section.title === "__images__")
    .flatMap((section) => section.images);

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black md:px-14">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-8 inline-block rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black hover:bg-black hover:text-white"
        >
          Back To Home
        </Link>

        <div className="overflow-hidden rounded-[2rem] bg-[#f7f7f7] shadow-sm">
          <div className="p-6">
            <h1 className="text-3xl font-semibold md:text-4xl">{project.name}</h1>
            
            {project.area && (
  	      <div className="mt-3 inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm">
                📐 {project.area}
              </div>
            )} 

            {project.description && (
              <p className="mt-3 max-w-2xl text-base leading-7 text-black/55">
                {project.description}
              </p>
            )}

            {roomInfo.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {roomInfo.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black/70 shadow-sm"
                  >
                    <span className="text-xl">{getRoomIcon(section.title)}</span>

                    <div className="flex items-center gap-1">
                      {section.text && (
                        <span className="font-semibold text-black">{section.text}</span>
                      )}
                      <span className="text-black/70">{section.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-5 p-5 pt-0">
            {roomImages.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {roomImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Project image ${index + 1}`}
                    className="aspect-[16/10] w-full rounded-xl object-cover"
                     whileHover={{
                       scale: 1.05,
                     }}
                     transition={{
                       duration: 0.35,
                     }}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-black/55">No images added yet.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}