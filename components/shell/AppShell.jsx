import Sidebar from "./Sidebar";
import LocationSwitcher from "./LocationSwitcher";
import CommandPalette from "./CommandPalette";
export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
          <LocationSwitcher />
          <span className="text-xs text-neutral-400">⌘K</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
