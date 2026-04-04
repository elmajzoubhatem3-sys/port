"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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

const ADMIN_PASSWORD = "vertex123";

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

type ProjectsManagerProps = {
  isAdmin: boolean;
};

function ProjectsManager({ isAdmin }: ProjectsManagerProps) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
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

  useEffect(() => {
  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("*");

    if (data) {
      setProjects(
        data.map((p: any) => ({
          id: p.id,
          image: p.image_url,
          name: p.name,
          oldPrice: p.old_price,
          newPrice: p.new_price || "",
          badge: p.badge || "",
          description: p.description || "",
          sections: [],
        }))
      );
    }
  };

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !oldPrice.trim()) return;

    if (editingId !== null) {
      if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageUrl = reader.result as string;
          setProjects((prev) =>
            prev.map((project) =>
              project.id === editingId
                ? {
                    ...project,
                    image: imageUrl,
                    name: name.trim(),
                    oldPrice: oldPrice.trim(),
                    newPrice: newPrice.trim(),
                    description: description.trim(),
                    badge,
                  }
                : project
            )
          );
        };
        reader.readAsDataURL(imageFile);
      } else {
        setProjects((prev) =>
          prev.map((project) =>
            project.id === editingId
              ? {
                  ...project,
                  name: name.trim(),
                  oldPrice: oldPrice.trim(),
                  newPrice: newPrice.trim(),
                  description: description.trim(),
                  badge,
                }
              : project
          )
        );
      }

      resetForm();
      e.currentTarget.reset();
      return;
    }

    if (!imageFile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      setProjects((prev) => [
        ...prev,
        {
          id: Date.now(),
          image: imageUrl,
          name: name.trim(),
          oldPrice: oldPrice.trim(),
          newPrice: newPrice.trim(),
          badge,
          description: description.trim(),
          sections: [],
        },
      ]);
    };
    reader.readAsDataURL(imageFile);

    resetForm();
    e.currentTarget.reset();
  };

  const handleDelete = (id: number) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
      setViewMode("home");
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
  };

  const handleSectionImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSectionImageFile(file);
  };

  const handleAddSection = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId || !sectionTitle.trim() || !sectionImageFile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      setProjects((prev) =>
        prev.map((project) =>
          project.id === selectedProjectId
            ? {
                ...project,
                sections: [
                  ...project.sections,
                  {
                    id: Date.now(),
                    title: sectionTitle.trim(),
                    text: sectionText.trim(),
                    image: imageUrl,
                  },
                ],
              }
            : project
        )
      );
    };
    reader.readAsDataURL(sectionImageFile);

    setSectionTitle("");
    setSectionText("");
    setSectionImageFile(null);
    e.currentTarget.reset();
  };

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const selectedProjectSections = selectedProject?.sections || [];

  const openProjectDetails = (projectId: number) => {
    setSelectedProjectId(projectId);
    setViewMode("project-details");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const openAllProjects = () => {
    setViewMode("all-projects");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goHome = () => {
    setViewMode("home");
    setSelectedProjectId(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
              className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 md:w-fit"
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
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Enter new price (optional)"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />
          <textarea
            value={description || ""}
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
              className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
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
        {projects.slice(0, 3).map((project) => (
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
                    className="relative flex flex-col items-center animate-[swing_2.5s_ease-in-out_infinite]"
                    style={{ transformOrigin: "top center" }}
                  >
                    <div className="h-6 w-[2px] bg-white/50"></div>
                    <div
                      className={`relative rounded-md px-3 py-2 text-[10px] font-semibold tracking-[0.25em] text-white shadow-md ${
                        project.badge === "SALE" ? "bg-red-500" : "bg-black/85"
                      }`}
                    >
                      {project.badge}
                      <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/75">
                      Project
                    </p>
                    <h3 className="mt-2 text-3xl font-semibold leading-tight">
                      {project.name}
                    </h3>
                  </div>
                  <p className="pt-2 text-xs text-white/70">Rating 4.8</p>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  {project.newPrice ? (
                    <>
                      <p className="text-base text-white/55 line-through">{project.oldPrice}</p>
                      <p className="text-2xl font-semibold text-white">{project.newPrice}</p>
                    </>
                  ) : (
                    <p className="text-2xl font-semibold text-white">{project.oldPrice}</p>
                  )}
                </div>

                {project.description && (
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/78">
                    {project.description}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-[1.25rem] bg-white/92 px-4 py-4 text-center text-black shadow-sm backdrop-blur-md">
                    <p className="text-2xl font-semibold">
                      {selectedProjectId === project.id
                        ? selectedProjectSections.length
                        : project.sections.length}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-black/55">
                      Spaces
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-white/92 px-4 py-4 text-center text-black shadow-sm backdrop-blur-md">
                    <p className="text-2xl font-semibold">
                      {project.newPrice ? "Offer" : "Ready"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-black/55">
                      Status
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openProjectDetails(project.id)}
                  className="mt-4 w-full rounded-[1.25rem] bg-white px-5 py-4 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Read More About This Project
                </button>

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
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={openAllProjects}
          className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          See All Projects
        </button>
      </div>
    </div>
  );
}

export default function VertexPortfolioHomePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const adminStatus = localStorage.getItem("vertex-admin") === "true";
    setIsAdmin(adminStatus);
  }, []);

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword("");
      setLoginError("");
      localStorage.setItem("vertex-admin", "true");
      return;
    }
    setLoginError("Wrong password");
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setShowLogin(false);
    setPassword("");
    setLoginError("");
    localStorage.removeItem("vertex-admin");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0b0b] text-white">
      <section className="relative h-screen w-full">
        <div className="absolute inset-0">
          <HeroScene />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute right-6 top-6 z-20 md:right-10 md:top-10">
          {!isAdmin ? (
            <button
              type="button"
              onClick={() => setShowLogin((prev) => !prev)}
              className="rounded-2xl border border-white/20 bg-black/35 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/50"
            >
              Admin Login
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-white/20 bg-black/35 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/50"
            >
              Logout
            </button>
          )}

          {showLogin && !isAdmin && (
            <form
              onSubmit={handleLogin}
              className="mt-3 w-[280px] rounded-3xl border border-white/15 bg-black/70 p-4 backdrop-blur-xl"
            >
              <p className="mb-3 text-sm font-medium text-white">Enter admin password</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
              />
              {loginError && <p className="mt-2 text-sm text-red-300">{loginError}</p>}
              <button
                type="submit"
                className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Login
              </button>
            </form>
          )}
        </div>

        <div className="relative z-10 flex h-full items-end px-6 pb-14 md:px-14 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <p className="mb-3 text-sm uppercase tracking-[0.35em] text-white/70">
              VERTEX Homes Studio
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Designing elevated homes with a luxury modern vision.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
              Architecture, interiors, and refined residential concepts crafted to feel timeless,
              precise, and premium.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#projects"
                className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                View Projects
              </a>
              <a
                href="#about"
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                About Us
              </a>
              <a
                href="#contact"
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                Contact
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="projects" className="bg-white px-6 py-20 text-black md:px-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm uppercase tracking-[0.3em] text-black/50">Selected Projects</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="text-3xl font-semibold md:text-5xl">Selected Work</h2>
            <p className="max-w-xl text-sm leading-7 text-black/55 md:text-base">
              A curated selection of residential concepts designed with balance, elegance, and a
              modern architectural point of view.
            </p>
          </div>
          <ProjectsManager isAdmin={isAdmin} />
        </div>
      </section>

      <section id="about" className="bg-[#f7f3ee] px-6 py-20 text-black md:px-14">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">About Us</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
              We design homes that feel calm, refined, and timeless.
            </h2>
          </div>
          <div className="space-y-6 text-sm leading-7 text-black/65 md:text-base">
            <p>
              VERTEX Homes Studio is focused on modern residential design with a clean visual
              language, thoughtful layouts, and elevated details.
            </p>
            <p>
              Our work blends architecture, interior direction, and premium presentation to create
              homes that look strong, elegant, and highly livable.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white px-6 py-20 text-black md:px-14">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-black/10 bg-[#faf8f4] p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-black/45">Contact</p>
          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">Let’s build your next project.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm text-black/45">Phone</p>
              <p className="mt-2 text-lg font-semibold">+961 00 000 000</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm text-black/45">Email</p>
              <p className="mt-2 text-lg font-semibold">hello@vertexhomes.com</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm text-black/45">Instagram</p>
              <p className="mt-2 text-lg font-semibold">@vertexhomesstudio</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}