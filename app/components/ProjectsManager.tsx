"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  location: string | null;
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
  const fileName = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

export function ProjectsManager({
  isAdmin,
  mode = "featured",
}: {
  isAdmin: boolean;
  mode?: "featured" | "all";
}) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchProjects = async () => {
    setLoading(true);

    const [
      { data: projectRows, error: projectsError },
      { data: sectionRows, error: sectionsError },
    ] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("project_sections").select("*"),
    ]);

    if (projectsError || sectionsError) {
      console.error(projectsError || sectionsError);
      setLoading(false);
      return;
    }

    setProjects(
      mapProjects(
        (projectRows || []) as DbProject[],
        (sectionRows || []) as DbSection[]
      )
    );

    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const resetForm = () => {
    setName("");
    setLocation("");
    setOldPrice("");
    setNewPrice("");
    setDescription("");
    setImageFile(null);
    setEditingId(null);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageFile(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!name.trim() || !oldPrice.trim()) return;

    try {
      setSaving(true);

      if (editingId !== null) {
        const currentProject = projects.find(
          (project) => project.id === editingId
        );
        let imageUrl = currentProject?.image || "";

        if (imageFile) {
          imageUrl = await uploadImage(imageFile, "projects");
        }

        const { error } = await supabase
          .from("projects")
          .update({
            name: name.trim(),
            location: location.trim() || null,
            old_price: oldPrice.trim(),
            new_price: newPrice.trim() || null,
            description: description.trim() || null,
            image_url: imageUrl,
          })
          .eq("id", editingId);

        if (error) throw error;

        resetForm();
        form.reset();
        await fetchProjects();
        return;
      }

      if (!imageFile) return;

      const imageUrl = await uploadImage(imageFile, "projects");

      const { error } = await supabase.from("projects").insert({
        name: name.trim(),
        location: location.trim() || null,
        old_price: oldPrice.trim(),
        new_price: newPrice.trim() || null,
        description: description.trim() || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      resetForm();
      form.reset();
      await fetchProjects();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving the project.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      await fetchProjects();
    } catch (error) {
      console.error(error);
      alert("Could not delete this project.");
    }
  };

  const handleEdit = (project: ProjectItem) => {
    setEditingId(project.id);
    setName(project.name);
    setLocation(project.location);
    setOldPrice(project.oldPrice);
    setNewPrice(project.newPrice);
    setDescription(project.description || "");
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <div className="mt-12 text-sm text-black/60">Loading projects...</div>;
  }

  const visibleProjects = mode === "featured" ? projects.slice(0, 3) : projects;

  return (
    <div className="mt-12">
      {isAdmin && (
        <form
          onSubmit={handleSubmit}
          className="mb-10 grid grid-cols-1 gap-4 rounded-3xl border border-black/10 bg-[#f7f3ee] p-5 md:grid-cols-2"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
          />

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter project location"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />

          <input
            type="text"
            value={oldPrice}
            onChange={(e) => setOldPrice(e.target.value)}
            placeholder="Enter price"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />

          <input
            type="text"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Enter new price (optional)"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short project description"
            className="min-h-[120px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none md:col-span-2"
          />

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {editingId !== null ? "Save Changes" : "Add Project"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-black/10 px-6 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {visibleProjects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="group relative overflow-hidden rounded-[2rem] bg-[#dfe5f2] shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
          >
            <Link href={`/projects/${project.id}`}>
              <div className="relative h-[250px] w-full overflow-hidden">
                <img
                  src={project.image}
                  alt={project.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/60" />

                {project.location && (
                  <div className="absolute left-4 top-4 z-10 rounded-2xl bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">
                    📍 {project.location}
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 z-10">
                  <div className="bg-black/25 px-5 py-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4 text-white">
                      <h3 className="text-2xl font-semibold leading-tight tracking-wide">
                        {project.name}
                      </h3>

                      <div className="shrink-0 text-right">
                        {project.newPrice ? (
                          <>
                            <p className="text-xs text-white/55 line-through">
                              {project.oldPrice}
                            </p>
                            <p className="text-xl font-semibold text-white">
                              {project.newPrice}
                            </p>
                          </>
                        ) : (
                          <p className="text-xl font-semibold text-white">
                            {project.oldPrice}
                          </p>
                        )}
                      </div>
                    </div>

                    {project.description && (
                      <p className="mt-3 max-w-md text-sm leading-6 text-white/78">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            {isAdmin && (
              <div className="flex flex-wrap gap-3 bg-[#dfe5f2] p-5">
                <button
                  type="button"
                  onClick={() => handleEdit(project)}
                  className="rounded-2xl border border-black/10 bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(project.id)}
                  className="rounded-2xl border border-black/10 bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {mode === "featured" && projects.length > 3 && (
        <div className="mt-10 flex justify-center">
          <Link
            href="/projects"
            className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            See All Projects
          </Link>
        </div>
      )}
    </div>
  );
}