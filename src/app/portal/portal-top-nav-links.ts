/** Shared flat links for public portal top navigation (home + inner pages). */
export interface PortalTopNavLink {
  path: string;
  label: string;
}

export const PORTAL_TOP_NAV_LINKS: PortalTopNavLink[] = [
  { path: 'home', label: 'Home' },
  { path: 'scientific-merit', label: 'Scientific merit' },
  { path: 'objectives', label: 'Objectives' },
  { path: 'partners-funders', label: 'Partners & Funders' },
  { path: 'gallery', label: 'Gallery' },
  { path: 'events', label: 'Events' },
  { path: 'team', label: 'Team' },
  { path: 'participants', label: 'Participants' },
  { path: 'outputs', label: 'Outputs' },
];
