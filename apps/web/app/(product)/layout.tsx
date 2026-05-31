import { PlatformShell } from "@/components/platform-shell";

export default function ProductLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PlatformShell>{children}</PlatformShell>;
}
