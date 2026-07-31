/**
 * Navigation link component with active state
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  disabled?: boolean;
  disabledTitle?: string;
}

/** Shared box/typography of a nav item — the enabled <Link> and the disabled <span> render identically. */
const NAV_ITEM_BASE =
  'flex items-center gap-2 px-3 py-2 font-medium transition-colors border shrink-0 whitespace-nowrap';

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLink({ href, icon: Icon, label, collapsed, disabled, disabledTitle }, ref) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    if (disabled) {
      return (
        <span
          className={cn(
            NAV_ITEM_BASE,
            'cursor-not-allowed border-transparent text-muted-foreground/50 text-base',
            collapsed && 'justify-center'
          )}
          title={disabledTitle || `${label} ist deaktiviert`}
        >
          <Icon className="shrink-0 h-4 w-4" />
          {/* sm:not-sr-only resets white-space to normal, so re-assert nowrap above the icon-only breakpoint */}
          {!collapsed && (
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{label}</span>
          )}
        </span>
      );
    }

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          NAV_ITEM_BASE,
          isActive
            ? 'border-primary bg-primary/90 text-white text-base'
            : 'border-transparent text-foreground/80 hover:text-foreground hover:bg-muted/50 text-base',
          collapsed && 'justify-center'
        )}
        title={collapsed ? label : undefined}
        // aria-current, not data-active: data-* never reaches the accessibility
        // tree, and below sm: the only visual cue is the icon's fill colour.
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className="shrink-0 h-4 w-4" />
        {/* sm:not-sr-only resets white-space to normal, so re-assert nowrap above the icon-only breakpoint */}
        {!collapsed && (
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{label}</span>
        )}
      </Link>
    );
  }
);
