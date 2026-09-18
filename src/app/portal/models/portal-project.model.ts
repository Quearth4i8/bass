export type PortalProjectSlug = string;

export interface OrderedEntity {
  id: number;
  order: number;
}

export interface PortalCarouselSlide extends OrderedEntity {
  url: string;
  title: string;
  subtitle: string;
  expanded?: boolean;
}

export interface PortalPartnerLogo extends OrderedEntity {
  url: string;
}

export interface PortalGeoSection {
  id: number;
  title: string;
  text: string;
}

export interface PortalVideoFile {
  url: string;
  name: string;
}

export interface PortalInfoBlock extends OrderedEntity {
  imageUrl: string;
  title: string;
  text: string;
}

export interface RichTextParagraph extends OrderedEntity {
  content: string;
}

export interface PartnersLogo extends OrderedEntity {
  url: string;
  name?: string;
}

export interface FunderTextLine extends OrderedEntity {
  text: string;
}

export interface GalleryImage {
  id: number;
  url: string;
  name?: string;
}

export type PortalEventStatus = 'ongoing' | 'finished' | 'canceled';

export interface PortalEvent {
  id: number;
  title: string;
  organiser: string;
  startDate: string;
  endDate: string;
  location: string;
  presentation: string;
  speaker: string;
  participants: string;
  status: PortalEventStatus;
}

export interface PortalPerson extends OrderedEntity {
  name: string;
  role: string;
  /**
   * Where they work. Optional in practice: entries created before this field
   * existed carry the institute inside `role` ("Researcher, INSTM"), and the
   * cards simply omit the line when it is empty.
   */
  institute?: string;
  image: string;
}

export interface PortalTeamSection extends OrderedEntity {
  title: string;
  members: PortalPerson[];
}

export type PortalOutputLayout = 'text-left' | 'text-right';

export interface PortalOutput extends OrderedEntity {
  title: string;
  description: string;
  videoUrl: string;
  layout: PortalOutputLayout;
  featured?: boolean;
}

export interface PortalProjectContent {
  home: {
    carousel: PortalCarouselSlide[];
    partnerLogos: PortalPartnerLogo[];
    projectId?: string;
    geoSections: PortalGeoSection[];
    video: PortalVideoFile;
    infoBlocks: PortalInfoBlock[];
  };
  scientificMerit: {
    paragraphs: RichTextParagraph[];
  };
  objectives: {
    paragraphs: RichTextParagraph[];
  };
  partnersFunders: {
    partnersLogos: PartnersLogo[];
    associatePartnersLogos: PartnersLogo[];
    funderTextLines: FunderTextLine[];
    funderLogos: PartnersLogo[];
  };
  gallery: {
    images: GalleryImage[];
  };
  events: {
    events: PortalEvent[];
  };
  team: {
    sections: PortalTeamSection[];
  };
  participants: {
    participants: PortalPerson[];
  };
  outputs: {
    outputs: PortalOutput[];
  };
}

/**
 * How the portal navbar renders a project's identity.
 * - `title-id`   title over the grant id (the long-standing default)
 * - `title`      title alone
 * - `logo`       logo alone, free to run wide - suits horizontal wordmarks
 * - `logo-title` square logo box to the left of the title - suits emblems
 */
export type PortalBrandMode = 'title-id' | 'title' | 'logo' | 'logo-title';

export const PORTAL_BRAND_MODES: { value: PortalBrandMode; label: string; hint: string }[] = [
  { value: 'title-id',   label: 'Title + project ID', hint: 'Default. No logo needed.' },
  { value: 'title',      label: 'Title only',         hint: 'For short project names.' },
  { value: 'logo',       label: 'Logo only',          hint: 'Best for wide, horizontal wordmarks.' },
  { value: 'logo-title', label: 'Logo + title',       hint: 'Best for square or round emblems.' },
];

export interface PortalProjectMeta {
  slug: PortalProjectSlug;
  title: string;
  description: string;
  image: string;
  isActive: boolean;
  /** Primary UI color (hex) for portal navbar, scroll-to-top, etc. */
  accentColor?: string;
  /** Display order on the landing page (1 = first). */
  order?: number;
  /** Project logo URL. Empty or absent for projects without one. */
  logo?: string;
  /** Which identity layout the portal navbar uses. Defaults to `title-id`. */
  brandMode?: PortalBrandMode;
}

export interface PortalProject extends PortalProjectMeta {
  content: PortalProjectContent;
}

