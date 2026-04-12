"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type DbProject = {
  id: number;
  name: string;
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

export default function ProjectDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);

  // 👇 admin check
  const [isAdmin, setIsAdmin] = useState(false);

  // 👇 section form
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionText, setSectionText] = useState("");
  const [sectionImageFile, setSectionImageFile] = useState<File | null>(null);

  useEffect(() => {
    const adminStatus = localStorage.getItem("vertex-admin") === "true";
    setIsAdmin(adminStatus);
  }, []);

  const fetchProject = async () => {
    setLoading(true);

    const { data: projectRow } = await supabase
      .from("projects")
      .select("id,name,image_url,old_price,new_price,description")
      .eq("id", params.id)
      .single();

    const { data: sectionRows } = await supabase
      .from("project_sections")
      .select("id,project_id,title,text,image_url")
      .eq("project_id", params.id)
      .order("created_at", { ascending: true });

    if (!projectRow) {
      setLoading(false);
      return;
    }

    const mappedProject: ProjectItem = {
      id: projectRow.id,
      image: projectRow.image_url,
      name: projectRow.name,
      oldPrice: projectRow.old_price,
      newPrice: projectRow.new_price ?? "",
      description: projectRow.description ?? "",
      sections: (sectionRows || []).map((section) => ({
        id: section.id,
        title: section.title,
        text: section.text ?? "",
        image: section.image_url,
      })),
    };

    setProject(mappedProject);
    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  // 🔥 add section
  const handleAddSection = async (e: FormEvent) => {
    e.preventDefault();
    if (!sectionTitle || !sectionImageFile) return;

    const fileName = `sections/${Date.now()}-${sectionImageFile.name}`;

    await supabase.storage.from("portfolio").upload(fileName, sectionImageFile);

    const { data } = supabase.storage.from("portfolio").getPublicUrl(fileName);

    await supabase.from("project_sections").insert({
      project_id: params.id,
      title: sectionTitle,
      text: sectionText,
      image_url: data.publicUrl,
    });

    setSectionTitle("");
    setSectionText("");
    setSectionImageFile(null);

    fetchProject();
  };

  if (loading) {
    return <div className="min-h-screen bg-white px-6 py-20 text-black">Loading...</div>;
  }

  if (!project) {
    return <div>Not found</div>;
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black md:px-14">
      <div className="mx-auto max-w-7xl">

        {/* BACK */}
        <Link
          href="/"
          className="mb-8 inline-block rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black hover:bg-black hover:text-white"
        >
          Back To Home
        </Link>

        {/* MAIN IMAGE */}
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

        {/* 🔥 ADD SECTION (ADMIN ONLY) */}
        {isAdmin && (
          <form
            onSubmit={handleAddSection}
            className="mt-8 bg-gray-100 p-6 rounded-2xl grid gap-4"
          >
            <input
              type="file"
              onChange={(e) => setSectionImageFile(e.target.files?.[0] || null)}
            />
            <input
              type="text"
              placeholder="Room name"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              className="p-2 border"
            />
            <textarea
              placeholder="Description"
              value={sectionText}
              onChange={(e) => setSectionText(e.target.value)}
              className="p-2 border"
            />
            <button className="bg-black text-white p-3 rounded-xl">
              Add Room
            </button>
          </form>
        )}

        {/* SECTIONS */}
        <div className="mt-10 grid gap-8">
          {project.sections.map((section) => (
            <div key={section.id} className="grid md:grid-cols-2 gap-6 bg-[#faf8f4] p-5 rounded-2xl">
              <img src={section.image} className="h-[300px] w-full object-cover rounded-xl" />
              <div>
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <p className="mt-2 text-black/60">{section.text}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}