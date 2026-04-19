"use client";

import { useEffect, useState, FormEvent } from "react";
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

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionText, setSectionText] = useState("");
  const [sectionImageFile, setSectionImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem("vertex-admin") === "true";
    setIsAdmin(adminStatus);
  }, []);

  const fetchProject = async () => {
    if (!projectId) return;

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

    const mappedProject: ProjectItem = {
      id: projectRow.id,
      image: projectRow.image_url,
      name: projectRow.name,
      oldPrice: projectRow.old_price ?? "",
      newPrice: projectRow.new_price ?? "",
      description: projectRow.description ?? "",
      sections: (sectionRows || []).map((section: any) => ({
        id: section.id,
        title: section.title ?? "",
        text: section.text ?? "",
        image: section.image_url ?? "",
      })),
    };

    setProject(mappedProject);
    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleAddSection = async (e: FormEvent) => {
    e.preventDefault();

    if (!projectId || !sectionTitle.trim() || !sectionImageFile) return;

    try {
      setSaving(true);

      const fileExt = sectionImageFile.name.split(".").pop() || "jpg";
      const fileName = `sections/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(fileName, sectionImageFile, {
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("portfolio").getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("project_sections").insert({
        project_id: Number(projectId),
        title: sectionTitle.trim(),
        text: sectionText.trim() || null,
        image_url: data.publicUrl,
      });

      if (insertError) throw insertError;

      setSectionTitle("");
      setSectionText("");
      setSectionImageFile(null);

      await fetchProject();
    } catch (error) {
      console.error(error);
      alert("Could not add room.");
    } finally {
      setSaving(false);
    }
  };

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
          <p className="text-lg font-medium">Not found</p>
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
          className="mb-8 inline-block rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black hover:bg-black hover:text-white"
        >
          Back To Home
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
          <img
            src={project.image}
            alt={project.name}
            className="w-full h-[520px] object-cover"
          />
          <div className="px-6 py-8 md:px-10">
            <h1 className="text-4xl font-semibold">{project.name}</h1>

            {project.description && (
              <p className="mt-4 text-black/70">{project.description}</p>
            )}

            <div className="mt-4">
              {project.newPrice ? (
                <>
                  <span className="line-through text-gray-400">{project.oldPrice}</span>
                  <span className="ml-3 text-green-600 text-2xl">{project.newPrice}</span>
                </>
              ) : (
                <span className="text-2xl">{project.oldPrice}</span>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <form
            onSubmit={handleAddSection}
            className="mt-8 grid gap-4 rounded-2xl bg-gray-100 p-6"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSectionImageFile(e.target.files?.[0] || null)}
            />
            <input
              type="text"
              placeholder="Room name"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              className="rounded-xl border p-3"
            />
            <textarea
              placeholder="Description"
              value={sectionText}
              onChange={(e) => setSectionText(e.target.value)}
              className="rounded-xl border p-3"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black p-3 text-white disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Room"}
            </button>
          </form>
        )}

        <div className="mt-10 grid gap-8">
          {project.sections.length > 0 ? (
            project.sections.map((section) => (
              <div
                key={section.id}
                className="grid gap-6 rounded-2xl bg-[#faf8f4] p-5 md:grid-cols-2"
              >
                <img
                  src={section.image}
                  alt={section.title}
                  className="h-[300px] w-full rounded-xl object-cover"
                />
                <div>
                  <h2 className="text-2xl font-semibold">{section.title}</h2>
                  <p className="mt-2 text-black/60">{section.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-[#faf8f4] p-6 text-sm text-black/55 shadow-sm">
              No rooms added yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}