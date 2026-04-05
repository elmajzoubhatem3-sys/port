"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
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
  oldPrice: string;
  newPrice: string;
  badge: "NEW" | "SALE" | "";
  description: string;
  sections: ProjectSection[];
};

type DbProject = {
  id: number;
  name: string;
  image_url: string;
  old_price: string;
  new_price: string | null;
  badge: string | null;
  description: string | null;
};

type DbSection = {
  id: number;
  project_id: number;
  title: string;
  text: string | null;
  image_url: string;
};

const ADMIN_PASSWORD = "vertex123";
const STORAGE_BUCKET = "portfolio";

type ViewMode = "home" | "all-projects" | "project-details";

function HeroScene() {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <motion.img
        src="/images/house.jpg"
        alt="VERTEX hero"
        className="h-full w-full object-cover"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

function mapProjects(projects: DbProject[], sections: DbSection[]): ProjectItem[] {
  return projects.map((project) => ({
    id: project.id,
    image: project.image_url,
    name: project.name,
    oldPrice: project.old_price,
    newPrice: project.new_price ?? "",
    badge: project.badge === "NEW" || project.badge === "SALE" ? project.badge : "",
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

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file, {
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

type ProjectsManagerProps = {
  isAdmin: boolean;
};

function ProjectsManager({ isAdmin }: ProjectsManagerProps) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [badge, setBadge] = useState<"NEW" | "SALE" | "">("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("home");

  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionText, setSectionText] = useState("");
  const [sectionImageFile, setSectionImageFile] = useState<File | null>(null);

  const fetchProjects = async () => {
    setLoading(true);

    const [{ data: projectRows, error: projectsError }, { data: sectionRows, error: sectionsError }] =
      await Promise.all([
        supabase
          .from("projects")
          .select("id,name,image_url,old_price,new_price,badge,description")
          .order("created_at", { ascending: false }),
        supabase
          .from("project_sections")
          .select("id,project_id,title,text,image_url")
          .order("created_at", { ascending: true }),
      ]);

    if (projectsError || sectionsError) {
      console.error(projectsError || sectionsError);
      setLoading(false);
      return;
    }

    setProjects(mapProjects((projectRows || []) as DbProject[], (sectionRows || []) as DbSection[]));
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const resetForm = () => {
    setName("");
    setOldPrice("");
    setNewPrice("");
    setDescription("");
    setImageFile(null);
    setBadge("");
    setEditingId(null);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!name.trim() || !oldPrice.trim()) return;

    try {
      setSaving(true);

      if (editingId !== null) {
        const currentProject = projects.find((project) => project.id === editingId);
        let imageUrl = currentProject?.image || "";

        if (imageFile) {
          imageUrl = await uploadImage(imageFile, "projects");
        }

        const { error } = await supabase
          .from("projects")
          .update({
            name: name.trim(),
            old_price: oldPrice.trim(),
            new_price: newPrice.trim() || null,
            description: description.trim() || null,
            badge: badge || null,
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
        old_price: oldPrice.trim(),
        new_price: newPrice.trim() || null,
        description: description.trim() || null,
        badge: badge || null,
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

      if (selectedProjectId === id) {
        setSelectedProjectId(null);
        setViewMode("home");
      }

      await fetchProjects();
    } catch (error) {
      console.error(error);
      alert("Could not delete this project.");
    }
  };

  const handleEdit = (project: ProjectItem) => {
    setEditingId(project.id);
    setName(project.name);
    setOldPrice(project.oldPrice);
    setNewPrice(project.newPrice);
    setDescription(project.description || "");
    setBadge(project.badge || "");
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSectionImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSectionImageFile(file);
  };

  const handleAddSection = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!selectedProjectId || !sectionTitle.trim() || !sectionImageFile) return;

    try {
      setSaving(true);
      const imageUrl = await uploadImage(sectionImageFile, "sections");

      const { error } = await supabase.from("project_sections").insert({
        project_id: selectedProjectId,
        title: sectionTitle.trim(),
        text: sectionText.trim() || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      setSectionTitle("");
      setSectionText("");
      setSectionImageFile(null);
      form.reset();
      await fetchProjects();
    } catch (error) {
      console.error(error);
      alert("Could not add this section.");
    } finally {
      setSaving(false);
    }
  };

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const selectedProjectSections = selectedProject?.sections || [];

  const openProjectDetails = (projectId: number) => {
    setSelectedProjectId(projectId);
    setViewMode("project-details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAllProjects = () => {
    setViewMode("all-projects");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = () => {
    setViewMode("home");
    setSelectedProjectId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <div className="mt-12 text-sm text-black/60">Loading projects...</div>;
  }

  if (viewMode === "project-details" && selectedProject) {
    return (
      <div className="mt-12">
        <button
          type="button"
          onClick={goHome}
          className="mb-8 rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Back To Projects
        </button>

        <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
          <img
            src={selectedProject.image}
            alt={selectedProject.name}
            className="h-[520px] w-full object-cover"
          />
          <div className="px-6 py-8 md:px-10">
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">Project</p>
            <h3 className="mt-3 text-4xl font-semibold text-black md:text-6xl">
              {selectedProject.name}
            </h3>
            {selectedProject.description && (
              <p className="mt-5 max-w-3xl text-sm leading-8 text-black/65 md:text-base">
                {selectedProject.description}
              </p>
            )}
            <div className="mt-6 flex items-center gap-3">
              {selectedProject.newPrice ? (
                <>
                  <p className="text-lg text-black/40 line-through">{selectedProject.oldPrice}</p>
                  <p className="text-3xl font-semibold text-green-600">{selectedProject.newPrice}</p>
                </>
              ) : (
                <p className="text-3xl font-semibold text-black">{selectedProject.oldPrice}</p>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <form
            onSubmit={handleAddSection}
            className="mt-8 grid grid-cols-1 gap-4 rounded-3xl border border-black/10 bg-[#f7f3ee] p-5 md:grid-cols-2"
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleSectionImageChange}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            />
            <input
              type="text"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="Section title: Bedroom, Bathroom, Living Room..."
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
            />
            <textarea
              value={sectionText}
              onChange={(e) => setSectionText(e.target.value)}
              placeholder="Short text beside this section"
              className="min-h-[120px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none md:col-span-2"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 md:w-fit disabled:opacity-50"
            >
              Add Section To This Project
            </button>
          </form>
        )}

        <div className="mt-10 grid gap-8">
          {selectedProjectSections.length > 0 ? (
            selectedProjectSections.map((section) => (
              <div
                key={section.id}
                className="grid gap-6 rounded-[2rem] bg-white p-5 shadow-sm md:grid-cols-2 md:items-center"
              >
                <img
                  src={section.image}
                  alt={section.title}
                  className="h-[340px] w-full rounded-[1.5rem] object-cover"
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-black/40">Section</p>
                  <h4 className="mt-2 text-2xl font-semibold text-black">{section.title}</h4>
                  {section.text && (
                    <p className="mt-4 text-sm leading-7 text-black/60 md:text-base">
                      {section.text}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[2rem] bg-white p-6 text-sm text-black/55 shadow-sm">
              No detailed sections added yet for this project.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === "all-projects") {
    return (
      <div className="mt-12">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">Archive</p>
            <h3 className="mt-2 text-3xl font-semibold text-black md:text-5xl">
              All Projects
            </h3>
          </div>
          <button
            type="button"
            onClick={goHome}
            className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
          >
            Back To Home Projects
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative overflow-hidden rounded-[2rem] bg-[#dfe5f2] shadow-[0_20px_60px_rgba(0,0,0,0.10)]"
            >
              <div className="relative h-[460px] w-full overflow-hidden">
                <img
                  src={project.image}
                  alt={project.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/60" />

                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/75">Project</p>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight">{project.name}</h3>
                  <div className="mt-3 flex items-center gap-3">
                    {project.newPrice ? (
                      <>
                        <p className="text-base text-white/55 line-through">{project.oldPrice}</p>
                        <p className="text-xl font-semibold text-white">{project.newPrice}</p>
                      </>
                    ) : (
                      <p className="text-xl font-semibold text-white">{project.oldPrice}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openProjectDetails(project.id)}
                    className="mt-4 w-full rounded-[1.25rem] bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Read More About This Project
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
            value={name || ""}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            type="text"
            value={oldPrice || ""}
            onChange={(e) => setOldPrice(e.target.value)}
            placeholder="Enter old price"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            type="text"
            value={newPrice || ""}
            onChange={(e) => setNewPrice(e