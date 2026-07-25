"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { HospitalProvider } from "@/components/hospital-provider";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}><HospitalProvider>{children}</HospitalProvider><Toaster richColors position="top-right"/></QueryClientProvider>;
}