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
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch {
      return [value];
    }
  };

  const fetchProject = async () => {
    if (!projectId) return;

    setLoading(true);

    const { data: projectRow } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    const { data: sectionRows } = await supabase
      .from("project_sections")
      .select("*")
      .eq("project_id", projectId);

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

    if (!sectionTitle || sectionImageFiles.length === 0) return;

    const uploadedImages: string[] = [];

    for (const file of sectionImageFiles) {
      const fileName = `sections/${Date.now()}-${file.name}`;
      await supabase.storage.from("portfolio").upload(fileName, file);
      const { data } = supabase.storage.from("portfolio").getPublicUrl(fileName);
      uploadedImages.push(data.publicUrl);
    }

    await supabase.from("project_sections").insert({
      project_id: projectId,
      title: sectionTitle,
      text: sectionText,
      image_url: JSON.stringify(uploadedImages),
    });

    setSectionTitle("");
    setSectionText("");
    setSectionImageFiles([]);

    fetchProject();
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Not found</div>;

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black md:px-14">
      <div className="mx-auto max-w-7xl">

        <Link href="/" className="mb-8 inline-block">
          Back Home
        </Link>

        {/* ❌ شلنا صورة المشروع من هون */}

        <div className="px-6 py-8">
          <h1 className="text-4xl font-semibold">{project.name}</h1>

          {project.description && (
            <p className="mt-4 text-black/70">{project.description}</p>
          )}

          <div className="mt-4">
            {project.newPrice ? (
              <>
                <span className="line-through text-gray-400">{project.oldPrice}</span>
                <span className="ml-3 text-2xl text-green-600">{project.newPrice}</span>
              </>
            ) : (
              <span className="text-2xl">{project.oldPrice}</span>
            )}
          </div>
        </div>

        {isAdmin && (
          <form onSubmit={handleAddSection} className="mt-8">
            <input
              type="file"
              multiple
              onChange={(e) => setSectionImageFiles(Array.from(e.target.files || []))}
            />
            <input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="Room name"
            />
            <textarea
              value={sectionText}
              onChange={(e) => setSectionText(e.target.value)}
            />
            <button>Add Room</button>
          </form>
        )}

        <div className="mt-10">
          {project.sections.map((section) => (
            <div key={section.id}>
              {section.images.map((img, i) => (
                <img key={i} src={img} className="aspect-square w-full" />
              ))}
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}