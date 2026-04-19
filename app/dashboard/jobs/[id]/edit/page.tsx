import EditJobForm from "@/app/ui/jobs/edit-form";
import Breadcrumbs from "@/app/ui/jobs/breadcrumbs";
import { fetchJobById } from "@/app/lib/data";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [job] = await Promise.all([fetchJobById(id)]);
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Jobs", href: "/dashboard/jobs" },
          {
            label: "Edit Job",
            href: `/dashboard/jobs/${id}/edit`,
            active: true,
          },
        ]}
      />
      <EditJobForm job={job} />
    </main>
  );
}
