import Form from "@/app/ui/jobs/create-form";
import Breadcrumbs from "@/app/ui/jobs/breadcrumbs";

export default async function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Jobs", href: "/dashboard/jobs" },
          {
            label: "Create Job",
            href: "/dashboard/jobs/create",
            active: true,
          },
        ]}
      />
      <Form />
    </main>
  );
}
