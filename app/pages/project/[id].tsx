import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function ProjectDetailsPage() {
  const [project, setProject] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      const fetchProject = async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error(error);
          return;
        }

        setProject(data);
      };

      fetchProject();
    }
  }, [id]);

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="project-details">
      <img src={project.image_url} alt={project.name} />
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <p>{project.old_price}</p>
      <p>{project.new_price}</p>
    </div>
  );
}

export default ProjectDetailsPage;