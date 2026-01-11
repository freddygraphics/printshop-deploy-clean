import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import MainShell from "@/components/layout/MainShell";

export default async function ProtectedLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  return <MainShell>{children}</MainShell>;
}
