import { SessionProvider } from "@/components/session-provider";
import { SettingsSidebar } from "@/components/settings-sidebar";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <SessionProvider>
      <div className="flex flex-1 flex-col md:flex-row">
        <SettingsSidebar />
        <main className="flex min-w-0 flex-1 justify-center overflow-y-auto">
          <div className="flex w-full max-w-2xl flex-col gap-8 px-4 py-6 md:px-6 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
