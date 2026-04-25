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

const STORAGE_BUCKET = "portfolio";

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

function getDeviceId() {
  const key = "vertex-rating-device-id";
  let deviceId = localStorage.getItem(key);

  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, deviceId);
  }

  return deviceId;
}

type RatingStats = {
  average: number;
  count: number;
  myRating: number | null;
};

export function ProjectsManager({
  isAdmin,
  mode = "featured",
}: {
  isAdmin: boolean;
  mode?: "featured" | "all";
}) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [ratings, setRatings] = useState<Record<number, RatingStats>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [badge, setBadge] = useState<"NEW" | "SALE" | "">("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchRatings = async () => {
    const { data, error } = await supabase.from("project_ratings").select("*");

    if (error) {
      console.error(error);
      return;
    }

    const deviceId = getDeviceId();
    const grouped: Record<number, RatingStats> = {};

    (data || []).forEach((row: any) => {
      const projectId = Number(row.project_id);

      if (!grouped[projectId]) {
        grouped[projectId] = { average: 0, count: 0, myRating: null };
      }

      grouped[projectId].average += Number(row.rating);
      grouped[projectId].count += 1;

      if (row.device_id === deviceId) {
        grouped[projectId].myRating = Number(row.rating);
      }
    });

    Object.keys(grouped).forEach((id) => {
      const item = grouped[Number(id)];
      item.average = item.count > 0 ? item.average / item.count : 0;
    });

    setRatings(grouped);
  };

  const fetchProjects = async () => {
    setLoading(true);

    const [{ data: projectRows, error: projectsError }, { data: sectionRows, error: sectionsError }] =
      await Promise.all([
        supabase.from("projects").select("*"),
        supabase.from("project_sections").select("*"),
      ]);

    if (projectsError || sectionsError) {
      console.error(projectsError || sectionsError);
      setLoading(false);
      return;
    }

    setProjects(mapProjects((projectRows || []) as DbProject[], (sectionRows || []) as DbSection[]));
    await fetchRatings();
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
    setImageFile(e.target.files?.[0] ?? null);
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

  const handleRate = async (projectId: number, rating: number) => {
    try {
      const deviceId = getDeviceId();

      const { error } = await supabase.from("project_ratings").upsert(
        {
          project_id: projectId,
          device_id: deviceId,
          rating,
        },
        { onConflict: "project_id,device_id" }
      );

      if (error) throw error;

      await fetchRatings();
    } catch (error) {
      console.error(error);
      alert("Could not save rating.");
    }
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
            value={oldPrice}
            onChange={(e) => setOldPrice(e.target.value)}
            placeholder="Enter old price"
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
          <select
            value={badge}
            onChange={(e) => setBadge(e.target.value as "NEW" | "SALE" | "")}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">No badge</option>
            <option value="NEW">NEW</option>
            <option value="SALE">SALE</option>
          </select>

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
        {visibleProjects.map((project) => {
          const rating = ratings[project.id] || { average: 0, count: 0, myRating: null };

          return (
            <div
              key={project.id}
              className="group relative overflow-hidden rounded-[2rem] bg-[#dfe5f2] shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
            >
              <div className="relative h-[520px] w-full overflow-hidden">
                <img
                  src={project.image}
                  alt={project.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/60" />

                {project.badge && (
                  <div className="absolute left-5 top-5 z-10">
                    <div
                      className={`rounded-md px-3 py-2 text-[10px] font-semibold tracking-[0.25em] text-white shadow-md ${
                        project.badge === "SALE" ? "bg-red-500" : "bg-black/85"
                      }`}
                    >
                      {project.badge}
                    </div>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-2xl font-semibold leading-tight">{project.name}</h3>

                    <div className="text-right">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRate(project.id, star)}
                            className={`text-lg leading-none ${
                              star <= Math.round(rating.average)
                                ? "text-yellow-300"
                                : "text-white/35"
                            }`}
                            title={`Rate ${star}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-white/75">
                        {rating.count > 0
                          ? `${rating.average.toFixed(1)} (${rating.count})`
                          : "No rating"}
                      </p>
                    </div>
                  </div>

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

                  {project.description && (
                    <p className="mt-3 max-w-md text-sm leading-6 text-white/78">
                      {project.description}
                    </p>
                  )}

                  <Link
                    href={`/project/${project.id}`}
                    className="mt-4 block w-full rounded-[1.25rem] bg-white px-5 py-3 text-center text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Read More About This Project
                  </Link>

                  {isAdmin && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(project)}
                        className="rounded-2xl border border-white/25 bg-black/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(project.id)}
                        className="rounded-2xl border border-white/25 bg-black/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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