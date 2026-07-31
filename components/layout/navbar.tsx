/**
 * Top navigation bar component
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  Calendar,
  CalendarRange,
  Settings,
  FileText,
  LogOut,
  MoreVertical,
  User,
  Command,
  ArrowBigUp as Shift,
  Option,
  Zap,
  Tag,
  ClipboardCheck,
  Layers,
  BarChart3,
  AlertCircle,
  Search,
  Keyboard,
  ArrowRight,
  Menu,
  Palette,
} from 'lucide-react';
import { NavLink } from './nav-link';
import { IdentityPicker } from './identity-picker';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-auth';
import { useQuickFind } from '@/hooks/use-quick-find';
import { useSequentialMode } from '@/hooks/use-sequential-mode';
import { useCommandMenu } from '@/hooks/use-command-menu';
import { useKeyboardShortcutsReferenceContext } from '@/components/keyboard-shortcuts/keyboard-shortcuts-reference';
import { useSettings } from '@/hooks/use-settings';
import { collections } from '@/lib/pocketbase/client';
import { toast } from 'sonner';

interface MenuTileProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  shortcut?: { keys: string[] };
  onClick?: () => void;
  href?: string;
}

function MenuTile({ icon, label, description, shortcut, onClick, href }: MenuTileProps) {
  const content = (
    <>
      {/* Icon + label + keyboard shortcut on one row */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-primary group-hover:text-accent-foreground transition-colors shrink-0">
            {icon}
          </div>
          <div
            className="font-semibold text-sm truncate group-hover:text-accent-foreground transition-colors"
            title={label}
          >
            {label}
          </div>
        </div>
        {shortcut && (
          <div className="flex items-center gap-0.5 shrink-0">
            {shortcut.keys.map((key, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground/60 transition-colors" />}
                <kbd className="px-1.5 py-0.5 text-[12px] font-mono font-medium bg-muted group-hover:bg-accent-foreground/10 group-hover:text-accent-foreground transition-colors rounded">
                  {key}
                </kbd>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="text-xs text-muted-foreground group-hover:text-accent-foreground/80 transition-colors hyphens-auto">
        {description}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group flex flex-col p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer h-full"
        role="menuitem"
        aria-label={`${label}: ${description}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group flex flex-col p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer text-left h-full w-full"
      role="menuitem"
      aria-label={`${label}: ${description}`}
    >
      {content}
    </button>
  );
}

const navigationItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/customers',
    icon: Users,
    label: 'Nutzer:innen',
  },
  {
    href: '/items',
    icon: Package,
    label: 'Gegenstände',
  },
  {
    href: '/rentals',
    icon: ClipboardList,
    label: 'Leihvorgänge',
  },
  {
    href: '/reservations',
    icon: Calendar,
    label: 'Reservierungen',
  },
  {
    href: '/bookings',
    icon: CalendarRange,
    label: 'Buchungen',
  },
];

/**
 * Isolated date display — re-renders every 60s so the calendar date
 * updates past midnight without forcing the rest of the navbar
 * (and every useSettings consumer) to re-render.
 */
function NavbarDate() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="font-mono">
      {today.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })}
    </div>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const { setOpen } = useQuickFind();
  const { setOpen: setSequentialModeOpen } = useSequentialMode();
  const { setOpen: setCommandMenuOpen } = useCommandMenu();
  const { setOpen: setKeyboardShortcutsOpen } = useKeyboardShortcutsReferenceContext();
  const { settings, getFileUrl } = useSettings();
  const logoUrl = getFileUrl(settings.logo);
  const userEmail = user?.email || 'admin@leihlokal.de';
  const pathname = usePathname();
  const navScrollRef = useRef<HTMLDivElement>(null);

  // Detect OS for keyboard shortcut display
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Centre the active nav item within the (potentially) scrollable strip.
  // Measured via bounding rects rather than offsetLeft: the strip is not a
  // positioned element, so offsetLeft would resolve against the fixed <nav>
  // and include the logo/padding to its left.
  useEffect(() => {
    const container = navScrollRef.current;
    const el = container?.querySelector<HTMLElement>('a[data-active="true"]');
    if (!container || !el) return;
    const offsetInStrip =
      el.getBoundingClientRect().left - container.getBoundingClientRect().left;
    const target =
      container.scrollLeft + offsetInStrip - (container.clientWidth - el.offsetWidth) / 2;
    const max = container.scrollWidth - container.clientWidth;
    container.scrollLeft = Math.max(0, Math.min(target, max));
  }, [pathname]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b-2 border-primary bg-background">
      <div className="flex h-full items-center px-4">
        {/* Logo */}
        <div
          onDoubleClick={() => setSequentialModeOpen(true)}
          className="flex items-center cursor-pointer"
          title="Doppelklick für Sequential Mode"
        >
          <Link href="/dashboard" className="flex items-center">
            <Image
              src={logoUrl || `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/smile.svg`}
              alt={settings.app_name || 'LeihLokal'}
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              unoptimized
              priority
            />
          </Link>
        </div>

        {/* Main Navigation */}
        <div
          ref={navScrollRef}
          className="ml-8 flex min-w-0 flex-1 items-center space-x-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {navigationItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              disabled={item.href === '/reservations' && !settings.reservations_enabled}
              disabledTitle="Reservierungen sind in den Einstellungen deaktiviert"
            />
          ))}
        </div>

        {/* Time and Date */}
        <div className="hidden md:flex flex-col items-end mr-4 text-sm">
          <NavbarDate />
        </div>

        {/* Identity Picker */}
        <IdentityPicker />

        {/* Overflow Menu */}
        <div className="flex ml-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mehr Optionen">
                <Menu className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              collisionPadding={8}
              className="w-[calc(100vw-2rem)] max-w-[520px] p-0 max-h-(--radix-popover-content-available-height) overflow-y-auto overscroll-contain"
              role="menu"
              aria-label="Navigations-Menü"
            >
              <div className="p-4 space-y-4">
                {/* Actions Category */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
                    Mehr Aktionen
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <MenuTile
                      icon={<Search className="h-4 w-4" />}
                      label="Suchen"
                      description="Suche nach Nutzer, Gegenstand, oder Leihvorgang."
                      shortcut={{ keys: ['O', 'S'] }}
                      onClick={() => setCommandMenuOpen(true)}
                    />
                    <MenuTile
                      icon={<Zap className="h-4 w-4" />}
                      label="Finden"
                      description="Finde eine ID-Nummer im System."
                      shortcut={{ keys: ['O', 'F'] }}
                      onClick={() => setOpen(true)}
                    />
                    <MenuTile
                      icon={<Layers className="h-4 w-4" />}
                      label="Eintragen"
                      description="Trage einen neuen Leihvorgang schnell ein."
                      shortcut={{ keys: ['O', 'O'] }}
                      onClick={() => setSequentialModeOpen(true)}
                    />
                  </div>
                </section>

                {/* Tools Category */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
                    Werkzeuge
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <MenuTile
                      icon={<AlertCircle className="h-4 w-4" />}
                      label="Überfällige Ausleihen"
                      description="Sieh dir schnell alle überfälligen Ausleihen an."
                      shortcut={{ keys: ['G', 'O'] }}
                      href="/overdue"
                    />
                    <MenuTile
                      icon={<BarChart3 className="h-4 w-4" />}
                      label="Inventaranalyse"
                      description="Sieh dir an, welche Gegenstände beliebt sind, und welche nicht genutzt werden."
                      shortcut={{ keys: ['G', 'I'] }}
                      href="/items/analytics"
                    />
                    <MenuTile
                      icon={<ClipboardCheck className="h-4 w-4" />}
                      label="Systemcheck"
                      description="Prüfe die Leihumschläge gegen die Informationen in der Datenbank."
                      shortcut={{ keys: ['G', 'S'] }}
                      href="/system-check"
                    />
                    <MenuTile
                      icon={<Tag className="h-4 w-4" />}
                      label="Label Designer"
                      description="Erstelle und drucke Etiketten für Gegenstände."
                      shortcut={{ keys: ['G', 'P'] }}
                      href="/label-designer"
                    />
                  </div>
                </section>

                {/* System Category */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
                    System
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <MenuTile
                      icon={<FileText className="h-4 w-4" />}
                      label="Logs"
                      description="Sieh dir alle Kommunikation mit dem Server an."
                      shortcut={{ keys: ['G', 'L'] }}
                      href="/logs"
                    />
                    <MenuTile
                      icon={<Keyboard className="h-4 w-4" />}
                      label="Tastaturkürzel"
                      description="Sieh eine Liste aller Kurzbefehle an."
                      shortcut={{ keys: ['/'] }}
                      onClick={() => setKeyboardShortcutsOpen(true)}
                    />
                    <MenuTile
                      icon={<LogOut className="h-4 w-4" />}
                      label="Trennen"
                      description="Trenne LLKA-V2 vom Server."
                      onClick={logout}
                    />
                  </div>
                </section>

                {/* Footer with settings link + build metadata */}
                <div className="border-t pt-3 mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground/80 tabular-nums">
                    v{process.env.NEXT_PUBLIC_APP_VERSION}
                    {process.env.NEXT_PUBLIC_BUILD_COMMIT ? (
                      <> · {process.env.NEXT_PUBLIC_BUILD_COMMIT}</>
                    ) : null}
                  </span>
                  <Link
                    href="/settings"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Settings className="h-3 w-3" />
                    Konfiguration
                  </Link>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </nav>
  );
}
