/** Shared flat links for public portal top navigation (home + inner pages). */
export interface PortalTopNavLink {
  path: string;
  label: string;
  /** Boxicons class. The library is loaded globally in index.html; every name
   *  here is one already in use elsewhere in the app, since an unknown name
   *  renders as an empty box rather than failing loudly. */
  icon: string;
}

export const PORTAL_TOP_NAV_LINKS: PortalTopNavLink[] = [
  { path: 'home',             label: 'Home',             icon: 'bx-home-alt' },
  { path: 'scientific-merit', label: 'Scientific merit', icon: 'bx-test-tube' },
  { path: 'objectives',       label: 'Objectives',       icon: 'bx-target-lock' },
  { path: 'partners',         label: 'Partners',         icon: 'bx-buildings' },
  { path: 'funders',          label: 'Funders',          icon: 'bx-coin-stack' },
  { path: 'team',             label: 'Team',             icon: 'bx-group' },
  { path: 'participants',     label: 'Participants',     icon: 'bx-user-voice' },
  { path: 'events',           label: 'Events',           icon: 'bx-calendar-event' },
  { path: 'gallery',          label: 'Gallery',          icon: 'bx-images' },
  { path: 'outputs',          label: 'Outputs',          icon: 'bx-file' },
];
