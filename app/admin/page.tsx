"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ProjectsManager } from "../components/ProjectsManager";

const ADMIN_PASSWORD = "vertex123";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Project = {
  id: number;
  name: string;
};

type ProjectSection = {
  id: number;
  project_id: number;
  title: string;
  text: string | null;
  image_url: string;
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [sections, setSections] = useState<ProjectSection[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [roomTitle, setRoomTitle] = useState("");
  const [roomText, setRoomText] = useState("");
  const [roomImages, setRoomImages] = useState<File[]>([]);
  const [savingRoom, setSavingRoom] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

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

  const loadAdminData = async () => {
    const [{ data: projectRows }, { data: sectionRows }] = await Promise.all([
      supabase.from("projects").select("id,name").order("created_at", { ascending: false }),
      supabase.from("project_sections").select("*").order("created_at", { ascending: false }),
    ]);

    setProjects((projectRows || []) as Project[]);
    setSections((sectionRows || []) as ProjectSection[]);
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setPassword("");
      setLoginError("");
      localStorage.setItem("vertex-admin", "true");
      return;
    }

    setLoginError("Wrong password");
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setPassword("");
    setLoginError("");
    localStorage.removeItem("vertex-admin");
  };

  const resetRoomForm = () => {
    setSelectedProjectId("");
    setRoomTitle("");
    setRoomText("");
    setRoomImages([]);
    setEditingRoomId(null);
  };

  const handleSaveRoom = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedProjectId || !roomTitle.trim()) {
      alert("Choose project and add room type.");
      return;
    }

    if (editingRoomId === null && roomImages.length === 0) {
      alert("Add at least one image.");
      return;
    }

    try {
      setSavingRoom(true);

      let uploadedImages: string[] = [];

      for (const file of roomImages) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `sections/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("portfolio")
          .upload(fileName, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("portfolio").getPublicUrl(fileName);
        uploadedImages.push(data.publicUrl);
      }

      if (editingRoomId !== null) {
        const currentSection = sections.find((section) => section.id === editingRoomId);
        const oldImages = parseImages(currentSection?.image_url);

        if (uploadedImages.length === 0) {
          uploadedImages = oldImages;
        }

        const { error } = await supabase
          .from("project_sections")
          .update({
            project_id: Number(selectedProjectId),
            title: roomTitle.trim(),
            text: roomText.trim() || null,
            image_url: JSON.stringify(uploadedImages),
          })
          .eq("id", editingRoomId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_sections").insert({
          project_id: Number(selectedProjectId),
          title: roomTitle.trim(),
          text: roomText.trim() || null,
          image_url: JSON.stringify(uploadedImages),
        });

        if (error) throw error;
      }

      resetRoomForm();
      await loadAdminData();
    } catch (error) {
      console.error(error);
      alert("Could not save room.");
    } finally {
      setSavingRoom(false);
    }
  };

  const handleEditRoom = (section: ProjectSection) => {
    setEditingRoomId(section.id);
    setSelectedProjectId(String(section.project_id));
    setRoomTitle(section.title);
    setRoomText(section.text || "");
    setRoomImages([]);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteRoom = async (id: number) => {
    try {
      const { error } = await supabase.from("project_sections").delete().eq("id", id);
      if (error) throw error;

      await loadAdminData();
    } catch (error) {
      console.error(error);
      alert("Could not delete room.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-black md:px-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">
              Vertex Admin
            </p>

            <h1 className="mt-2 text-4xl font-semibold">Manage Projects</h1>
          </div>

          <Link
            href="/"
            className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
          >
            Back Home
          </Link>
        </div>

        {!isAdmin ? (
          <form
            onSubmit={handleLogin}
            className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm"
          >
            <p className="mb-4 text-lg font-semibold">Admin Login</p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
            />

            {loginError && <p className="mt-3 text-sm text-red-500">{loginError}</p>}

            <button
              type="submit"
              className="mt-4 w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
            >
              Login
            </button>
          </form>
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
              >
                Logout
              </button>
            </div>

            <ProjectsManager isAdmin={true} mode="all" />

            <section className="mt-12 rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.3em] text-black/45">
                  Rooms
                </p>
                <h2 className="mt-2 text-3xl font-semibold">
                  {editingRoomId !== null ? "Edit Room" : "Add Rooms To Project"}
                </h2>
              </div>

              <form onSubmit={handleSaveRoom} className="grid gap-4 md:grid-cols-2">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="">Choose project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setRoomImages(Array.from(e.target.files || []))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                />

                <input
                  type="text"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  placeholder="Room type e.g. Bedroom, Bathroom, Kitchen"
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />

                <input
                  type="text"
                  value={roomText}
                  onChange={(e) => setRoomText(e.target.value)}
                  placeholder="Number e.g. 3"
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />

                <button
                  type="submit"
                  disabled={savingRoom}
                  className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {savingRoom
                    ? "Saving..."
                    : editingRoomId !== null
                    ? "Save Room Changes"
                    : "Add Room"}
                </button>

                {editingRoomId !== null && (
                  <button
                    type="button"
                    onClick={resetRoomForm}
                    className="rounded-2xl border border-black/10 px-6 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </section>

            <section className="mt-8 grid gap-5">
              {sections.map((section) => {
                const project = projects.find((item) => item.id === section.project_id);
                const images = parseImages(section.image_url);

                return (
                  <div key={section.id} className="rounded-3xl bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-black/45">Project</p>

                        <h3 className="text-xl font-semibold">
                          {project?.name || `Project #${section.project_id}`}
                        </h3>

                        <p className="mt-1 text-sm text-black/50">
                          {section.text ? `${section.text} ${section.title}` : section.title}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditRoom(section)}
                          className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(section.id)}
                          className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      {images.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Room image ${index + 1}`}
                          className="aspect-square w-full rounded-2xl object-cover"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}