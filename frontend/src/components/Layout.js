import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { List, X, Compass, Plus, ClockCounterClockwise, CurrencyDollar, ChartBar } from "@phosphor-icons/react";

const NAV_ITEMS = [
  { path: "/", label: "DASHBOARD", icon: ChartBar },
  { path: "/new-shipment", label: "NEW SHIPMENT", icon: Plus },
  { path: "/history", label: "DECISION MEMORY", icon: ClockCounterClockwise },
  { path: "/finance", label: "FINANCE", icon: CurrencyDollar },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white" data-testid="app-layout">
      {/* Top Bar */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50" data-testid="app-header">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <Link to="/" className="flex items-center gap-3 group" data-testid="app-logo">
            <Compass weight="bold" className="w-6 h-6 text-zinc-950" />
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-[0.15em] uppercase text-zinc-950 leading-none">
                TRADEIQ
              </span>
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-500 leading-none">
                SENTINEL 3.0
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" data-testid="desktop-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                    isActive
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  <Icon weight={isActive ? "bold" : "regular"} className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 hover:bg-zinc-100"
            data-testid="mobile-menu-toggle"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-zinc-200 bg-white" data-testid="mobile-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest border-b border-zinc-100 ${
                    isActive ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <Icon weight="regular" className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>
    </div>
  );
}
