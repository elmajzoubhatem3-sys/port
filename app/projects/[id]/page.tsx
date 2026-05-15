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
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionText, setSectionText] = useState("");
  const [sectionImageFiles, setSectionImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem("vertex-admin") === "true";
    setIsAdmin(adminStatus);
  }, []);

  const parseImages = (value: string | null | undefined): string[] => {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === "string");
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
      image: projectRow.image_url ?? "",
      name: projectRow.name ?? "",
      oldPrice: projectRow.old_price ?? "",
      newPrice: projectRow.new_price ?? "",
      description: projectRow.description ?? "",
      sections: (sectionRows || []).map((section: any) => ({
        id: section.id,
        title: section.title ?? "",
        text: section.text ?? "",
        images: parseImages(section.image_url),
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

    if (!projectId || !sectionTitle.trim() || sectionImageFiles.length === 0) {
      alert("Please add room name and at least one image.");
      return;
    }

    try {
      setSaving(true);

      const uploadedImages: string[] = [];

      for (const file of sectionImageFiles) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `sections/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("portfolio")
          .upload(fileName, file, {
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("portfolio").getPublicUrl(fileName);
        uploadedImages.push(data.publicUrl);
      }

      const { error: insertError } = await supabase.from("project_sections").insert({
        project_id: Number(projectId),
        title: sectionTitle.trim(),
        text: sectionText.trim() || null,
        image_url: JSON.stringify(uploadedImages),
      });

      if (insertError) throw insertError;

      setSectionTitle("");
      setSectionText("");
      setSectionImageFiles([]);

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

        {isAdmin && (
          <form
            onSubmit={handleAddSection}
            className="mb-10 grid gap-4 rounded-2xl bg-gray-100 p-6"
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setSectionImageFiles(Array.from(e.target.files || []))}
              className="rounded-xl border bg-white p-3"
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
              <div key={section.id} className="rounded-2xl bg-[#faf8f4] p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  {section.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Project image ${index + 1}`}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                  ))}
                </div>
              </div>
            ))
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