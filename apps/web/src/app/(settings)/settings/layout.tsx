import { SessionProvider } from "@/components/session-provider";
import { SettingsSidebar } from "@/components/settings-sidebar";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <SessionProvider>
      <div className="flex flex-1">
        <SettingsSidebar />
        <main className="flex min-w-0 flex-1 justify-center overflow-y-auto">
          <div className="w-full max-w-2xl px-6 py-10">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
