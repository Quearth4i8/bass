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
}

export interface PortalProject extends PortalProjectMeta {
  content: PortalProjectContent;
}

