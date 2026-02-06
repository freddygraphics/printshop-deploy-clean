"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainShell from "@/components/layout/MainShell";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // aquí luego puedes validar sesión vía API si quieres
    setReady(true);
  }, []);

  if (!ready) return null;

  return <MainShell>{children}</MainShell>;
}
