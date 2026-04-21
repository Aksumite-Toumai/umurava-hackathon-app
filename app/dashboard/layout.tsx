import SideNav from "@/app/ui/dashboard/sidenav";
import UserMenu from "@/app/ui/user-menu";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/app/ui/language-switcher";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex flex-col grow md:overflow-hidden">
        <header className="flex items-center h-16 shrink-0 px-2 border-b border-amber-700/20 gap-2 justify-end">
          <LanguageSwitcher />
          <UserMenu
            username={session.user.username}
            email={session.user.email ?? ""}
          />
        </header>

        <main className="grow overflow-y-auto p-6 md:p-12">{children}</main>
      </div>
    </div>
  );
}
