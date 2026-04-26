"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
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
  location: string;
  oldPrice: string;
  newPrice: string;
  description: string;
  sections: ProjectSection[];
};

type DbProject = {
  id: number;
  name: string;
  image_url: string;
  old_price: string;
  new_price: string | null;
  description: string | null;
  location: string | null;
};

type DbSection = {
  id: number;
  project_id: number;
  title: string;
  text: string | null;
  image_url: string;
};

const STORAGE_BUCKET = "portfolio";

function mapProjects(projects: DbProject[], sections: DbSection[]): ProjectItem[] {
  return projects.map((project) => ({
    id: project.id,
    image: project.image_url,
    name: project.name,
    location: project.location ?? "",
    oldPrice: project.old_price,
    newPrice: project.new_price ?? "",
    description: project.description ?? "",
    sections: sections
      .filter((section) => section.project_id === project.id)
      .map((section) => ({
        id: section.id,
        title: section.title,
        text: section.text ?? "",
        image: section.image_url,
      })),
  }));
}

async function uploadImage(file: File, folder: string) {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

export function ProjectsManager({ isAdmin, mode = "featured" }: { isAdmin: boolean; mode?: "featured" | "all"; }) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchProjects = async () => {
    const [{ data: projectRows }, { data: sectionRows }] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("project_sections").select("*"),
    ]);

    setProjects(mapProjects(projectRows as DbProject[], sectionRows as DbSection[]));
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) return <div>Loading...</div>;

  const visibleProjects = mode === "featured" ? projects.slice(0, 3) : projects;

  return (
    <div className="mt-12">
      {isAdmin && (
        <form className="mb-10 grid gap-4">
          <input type="file" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
          <input value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="Price" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </form>
      )}

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {visibleProjects.map((project) => (
          <div key={project.id} className="rounded-3xl overflow-hidden bg-[#dfe5f2]">

            <div className="h-[250px]">
              <img src={project.image} className="w-full h-full object-cover" />
            </div>

            <div className="p-5 text-white bg-black">
              <h3 className="text-xl font-bold">{project.name}</h3>

              <p className="text-sm opacity-80">📍 {project.location}</p>

              <p className="mt-2 text-lg">{project.oldPrice}</p>

              <Link
                href={`/projects/${project.id}`}
                className="mt-3 block bg-white text-black text-center p-2 rounded-xl"
              >
                Read More About This Project
              </Link>

            </div>
          </div>
        ))}
      </div>

      {mode === "featured" && projects.length > 3 && (
        <div className="text-center mt-10">
          <Link href="/projects">See All Projects</Link>
        </div>
      )}
    </div>
  );
}