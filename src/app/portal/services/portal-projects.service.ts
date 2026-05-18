import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  GalleryImage,
  PortalProject,
  PortalProjectContent,
  PortalProjectMeta,
  PortalProjectSlug,
  PortalPerson,
  PortalTeamSection,
} from '../models/portal-project.model';

const STORAGE_KEY = 'bass_portal_projects_v1';

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function nextId(items: { id: number }[]): number {
  return items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}

const DEFAULT_PORTAL_ACCENT = '#1a5f7a';

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function normalizeHexColor(value: string | undefined, fallback: string): string {
  const v = value?.trim();
  if (v && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v)) {
    return v.length === 4 ? expandShortHex(v) : v;
  }
  return fallback;
}

function expandShortHex(hex: string): string {
  const h = hex.slice(1);
  if (h.length !== 3) return hex;
  return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
}

function normalizeProject(p: PortalProject): PortalProject {
  return {
    ...p,
    accentColor: normalizeHexColor(p.accentColor, DEFAULT_PORTAL_ACCENT),
  };
}

@Injectable({
  providedIn: 'root',
})
export class PortalProjectsService {
  private readonly projects$ = new BehaviorSubject<PortalProject[]>([]);

  /** Emits whenever portal projects are created, updated, or deleted (localStorage today; API later). */
  readonly allProjects$: Observable<PortalProject[]> = this.projects$.asObservable();

  constructor() {
    const stored = safeParse<PortalProject[]>(localStorage.getItem(STORAGE_KEY));
    if (stored && Array.isArray(stored) && stored.length > 0) {
      this.projects$.next(stored.map((p) => normalizeProject(p)));
      return;
    }
    const seeded = [this.createDefaultImasProject()];
    this.projects$.next(seeded);
    this.persist();
  }

  list(): Observable<PortalProjectMeta[]> {
    return this.projects$.pipe(
      map((projects) => projects.map(({ content: _content, ...meta }) => meta)),
    );
  }

  listFull(): Observable<PortalProject[]> {
    return this.projects$.pipe(map((projects) => clone(projects)));
  }

  getBySlug(slug: PortalProjectSlug): Observable<PortalProject | null> {
    const project = this.projects$.value.find((p) => p.slug === slug);
    return of(project ? clone(normalizeProject(project)) : null);
  }

  create(meta: Omit<PortalProjectMeta, 'slug'> & { slug?: string }): Observable<PortalProject> {
    const slug = meta.slug && meta.slug.trim() ? slugify(meta.slug) : slugify(meta.title);
    const uniqueSlug = this.ensureUniqueSlug(slug);
    const project: PortalProject = {
      slug: uniqueSlug,
      title: meta.title,
      description: meta.description,
      image: meta.image,
      isActive: meta.isActive,
      accentColor: normalizeHexColor(meta.accentColor, DEFAULT_PORTAL_ACCENT),
      content: this.createEmptyContent(),
    };
    const next = [project, ...this.projects$.value];
    this.projects$.next(next);
    this.persist();
    return of(clone(project));
  }

  updateMeta(slug: PortalProjectSlug, patch: Partial<Omit<PortalProjectMeta, 'slug'>>): Observable<PortalProject | null> {
    const idx = this.projects$.value.findIndex((p) => p.slug === slug);
    if (idx < 0) return of(null);
    const current = this.projects$.value[idx];
    const updated: PortalProject = normalizeProject({
      ...current,
      ...patch,
      slug: current.slug,
      content: current.content,
    });
    const next = [...this.projects$.value];
    next[idx] = updated;
    this.projects$.next(next);
    this.persist();
    return of(clone(updated));
  }

  saveContent(slug: PortalProjectSlug, content: PortalProjectContent): Observable<PortalProject | null> {
    const idx = this.projects$.value.findIndex((p) => p.slug === slug);
    if (idx < 0) return of(null);
    const current = this.projects$.value[idx];
    const updated: PortalProject = normalizeProject({ ...current, content: clone(content) });
    const next = [...this.projects$.value];
    next[idx] = updated;
    this.projects$.next(next);
    this.persist();
    return of(clone(updated));
  }

  delete(slug: PortalProjectSlug): Observable<boolean> {
    const next = this.projects$.value.filter((p) => p.slug !== slug);
    const changed = next.length !== this.projects$.value.length;
    if (changed) {
      this.projects$.next(next);
      this.persist();
    }
    return of(changed);
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects$.value));
  }

  private ensureUniqueSlug(base: string): string {
    const normalized = base || 'project';
    if (!this.projects$.value.some((p) => p.slug === normalized)) return normalized;
    let i = 2;
    while (this.projects$.value.some((p) => p.slug === `${normalized}-${i}`)) {
      i += 1;
    }
    return `${normalized}-${i}`;
  }

  private createEmptyContent(): PortalProjectContent {
    return {
      home: {
        carousel: [{ id: 1, url: '', title: '', subtitle: '', order: 1, expanded: true }],
        partnerLogos: [{ id: 1, url: '', order: 1 }],
        geoSections: [
          { id: 1, title: '', text: '' },
          { id: 2, title: '', text: '' },
          { id: 3, title: '', text: '' },
        ],
        video: { url: '', name: '' },
        infoBlocks: [{ id: 1, imageUrl: '', title: '', text: '', order: 1 }],
      },
      scientificMerit: {
        paragraphs: [{ id: 1, content: '', order: 1 }],
      },
      objectives: {
        paragraphs: [{ id: 1, content: '', order: 1 }],
      },
      partnersFunders: {
        partnersLogos: [{ id: 1, url: '', order: 1 }],
        funderTextLines: [{ id: 1, text: '', order: 1 }],
        funderLogos: [{ id: 1, url: '', order: 1 }],
      },
      gallery: {
        images: [],
      },
      events: {
        events: [],
      },
      team: {
        sections: [],
      },
      participants: {
        participants: [],
      },
      outputs: {
        outputs: [],
      },
    };
  }

  private createDefaultImasProject(): PortalProject {
    const content = this.createEmptyContent();

    content.home.carousel = [
      { id: 1, url: 'assets/images/4.png', title: 'Real-Time Ecosystem Monotoring & Evaluation', subtitle: 'IMAS-ICHKEUL database is supported by the United States Agency for Development (USAID, USA) and managed by the National Academy of Sciences (NAS, USA) under the Cycle 8 of the Partnerships for Enhanced Engagement in Research (PEER) Program.', order: 1, expanded: true },
      { id: 2, url: 'assets/images/1.png', title: 'Exchanging Ecosystem Data for Practical Problems Application', subtitle: 'IMAS-ICHKEUL database gathers Biological, Chemical, Physical, Physico-chemical, Sedimentological and Fishery data for a long period at the level of the Mediterranean.', order: 2, expanded: true },
      { id: 3, url: 'assets/images/2.png', title: 'IMAS-ICHKEUL Ecosystems Database', subtitle: 'Carrying out an environmental approach, especially in oceanography, requires reliable data. The IMAS-ICHKEUL interactive database responds perfectly to the mentioned need.', order: 3, expanded: true },
      { id: 4, url: 'assets/images/3.png', title: 'IMAS-ICHKEUL Interractive Ecosystems Database', subtitle: 'IMAS-ICHKEUL database is designed as a means of collecting and exchanging ecosystem data for practical application. These data are provided from different sources of national and international projects and initiatives.', order: 4, expanded: true },
    ];

    content.home.partnerLogos = [
      { id: 1, url: 'assets/images/Tunisia.gif', order: 1 },
      { id: 2, url: 'assets/images/LOGOAG.png', order: 2 },
      { id: 3, url: 'assets/images/LOGOIRESA.png', order: 3 },
      { id: 4, url: 'assets/images/LOGOINSTM.png', order: 4 },
      { id: 5, url: 'assets/images/LOGONAS.png', order: 5 },
      { id: 6, url: 'assets/images/LOGOUSAID.png', order: 6 },
    ];

    content.home.video = { url: 'assets/videos/1.mp4', name: '1.mp4' };

    content.home.infoBlocks = [
      { id: 1, title: 'BASSIANA Ecosystems Database with real-time ecosystem monitoring and evaluation', text: 'Accessing the Ecosystems Database allows users to manage their own data to run any of the dedicated geospatial analysis chains.', imageUrl: 'assets/images/5.png', order: 1 },
      { id: 2, title: 'Key element', text: 'The main keys for sustainable development in Ichkeul region are the management of water budget for the Lake. Controlling the water level in the lake will help to safeguard biodiversity in this ecosystem.', imageUrl: 'assets/images/6.jpg', order: 2 },
      { id: 3, title: 'Initiative of BASSIANA Ecosystems Database', text: 'The website and the Ecosystems Database are the result of the capstone project of team “IMAS-Ichkeul”.', imageUrl: 'assets/images/7.jpg', order: 3 },
      { id: 4, title: 'IMAS-Ichkeul', text: 'The IMAS-Ichkeul is a project funded under the Partnerships for Enhanced Engagement in Research (PEER), Cycle 8 program.', imageUrl: 'assets/images/8.jpg', order: 4 },
    ];

    content.scientificMerit.paragraphs = [
      {
        id: 1,
        order: 1,
        content:
          '<img src="assets/svg/planet.svg" style="width:12px;padding-bottom:3px;margin-right:5px;"> In northern Tunisia, near the shore of the Mediterranean Sea, the Ichkeul Lake and its wetlands are among the most productive ecosystems in Tunisia. It is an important stopping area of migrating birds (Ramsar, 2012). Concurrently, it is ecologically a sensitive environment exhibiting enormous diversity due to its geographical location, hydrology, biodiversity ecological international interest with eels migration between Ichkeul and Sargasso Sea.',
      },
      {
        id: 2,
        order: 2,
        content:
          '<img src="assets/svg/planet.svg" style="width:12px;padding-bottom:3px;margin-right:5px;"> A series of dams were built on rivers flowing into the lake. The decrease of freshwater supply into the lake derived from winter rainfall allowing for a greater flow back of water from the sea has affected the main fishing activity by decreasing the eel stock. During the dry season, the water level falls to 30 cm in depth while the salinity increases significantly, with high sedimentation of the channel between the Ichkeul Lake and the Bizerte lagoon. This influences the recruitment of the Juveniles and eels inside the lake. The fish production has decreased from 110 tons in 2007 to 43 tons in 2011 (DGPA, 2017). In addition, the decrease of water level has affected the food needed for the migratory birds in the area.',
      },
      {
        id: 3,
        order: 3,
        content:
          '<img src="assets/svg/planet.svg" style="width:12px;padding-bottom:3px;margin-right:5px;"> These problematics issues clearly call for careful investigation and the development of decision tools. Thus, this IMAS-Ichkeul proposal is focused on water management in the Ichkeul region. Interrelationships among constraints related to water and to the supporting ecosystems will be investigated under conditions of global climate, anthropogenic activity in the catchment area and socioeconomic change in order to provide socially and environmentally sustainable growth.',
      },
      {
        id: 4,
        order: 4,
        content:
          '<img src="assets/svg/planet.svg" style="width:12px;padding-bottom:3px;margin-right:5px;"> The main theme for the integrated scientific analysis follows these specific objectives:<br><br>• Increase the understanding of the interactions among variables.<br><br>• Development of models, covering relevant socioeconomic and ecosystem processes, consistent with global climate and constraints to provide information for decision-making.<br><br>• Stakeholder engagement.',
      },
    ];

    content.objectives.paragraphs = [
      {
        id: 1,
        order: 1,
        content:
          '<img src="assets/svg/planet.svg" style="width:12px;padding-bottom:3px;margin-right:5px;"> The main keys for sustainable development in Ichkeul region is the management of water budget in the Lake. Controlling the water level in the Lake will help to safeguard biodiversity in this ecosystem well known by its high biodiversity and promote a sustainable development (fishery and tourism).',
      },
      {
        id: 2,
        order: 2,
        content:
          'The General objective of IMAS-Ichkeul is to develop an advanced class of integrated models and decision support tools based on biophysical and socio-economic drivers processes and policy integration related to biodiversity and ecosystem functioning.',
      },
      {
        id: 3,
        order: 3,
        content:
          'The specific objective of IMAS-Ichkeul project is to manage the water budget in the Lake based on numerical approach and knowledge based on measurement thought the development of a new toolkit encompassing:<br><br>• A remote sensing and GIS data base needed for both models.<br><br>• The newest version of SWAT model to provide the river inputs into the Lake.<br><br>• A one-dimensional hydrodynamic model to simulate the exchange of water between the Ichkeul Lake and Bizerte Lagoon.<br><br>• The Land Ocean Interactions Coastal Zone (LOICZ).',
      },
    ];

    content.partnersFunders.partnersLogos = [
      { id: 1, url: 'assets/images/logo1pp.png', order: 1 },
      { id: 2, url: 'assets/images/logo2p.png', order: 2 },
    ];

    content.partnersFunders.funderTextLines = [
      { id: 1, text: 'NAS: The National Academy of Sciences', order: 1 },
      { id: 2, text: 'USAID: United States Agency for International Development, USA', order: 2 },
      { id: 3, text: 'AID-OAA-A-11-00012', order: 3 },
    ];

    content.partnersFunders.funderLogos = [
      { id: 1, url: 'assets/images/LOGOUSAID.png', order: 1 },
      { id: 2, url: 'assets/images/LOGONAS.png', order: 2 },
    ];

    content.gallery.images = this.createDefaultGalleryImages();

    content.events.events = [
      {
        id: 1,
        date: '2020-11-22',
        timeFrom: '09:00',
        timeTo: '15:30',
        title: 'OFFICIAL LAUNCH OF THE PROJECT',
        location: 'INSTM',
        description: 'Presenting the working methodology and discussing it with all patterns.',
        status: 'finished',
      },
    ];

    content.team.sections = this.createDefaultTeam();
    content.participants.participants = this.createDefaultParticipants();
    content.outputs.outputs = this.createDefaultOutputs();

    return {
      slug: 'imas-ichkeul',
      title: 'IMAS-ICHKEUL',
      description: 'About IMAS-ICHKEUL',
      image: 'assets/images/ichkeul_home.jpg',
      isActive: true,
      accentColor: DEFAULT_PORTAL_ACCENT,
      content,
    };
  }

  private createDefaultGalleryImages(): GalleryImage[] {
    const urls = [
      'assets/images/gallery/img1.jpg',
      'assets/images/gallery/img2.jpg',
      'assets/images/gallery/img3.jpg',
      'assets/images/gallery/img4.jpg',
      'assets/images/gallery/img5.jpg',
      'assets/images/gallery/img6.jpg',
      'assets/images/gallery/img7.jpg',
      'assets/images/gallery/img8.jpg',
      'assets/images/gallery/img9.jpg',
      'assets/images/gallery/img10.jpg',
      'assets/images/gallery/img11.jpg',
      'assets/images/gallery/img12.jpg',
      'assets/images/gallery/img13.jpg',
      'assets/images/gallery/img14.jpg',
      'assets/images/gallery/img15.jpg',
      'assets/images/gallery/img16.jpg',
      'assets/images/gallery/img17.jpg',
      'assets/images/gallery/img18.jpg',
      'assets/images/gallery/img19.jpg',
      'assets/images/gallery/img20.jpg',
      'assets/images/gallery/img21.jpg',
    ];
    return urls.map((url, idx) => ({ id: idx + 1, url, name: `img${idx + 1}.jpg` }));
  }

  private createDefaultTeam(): PortalTeamSection[] {
    const sections: PortalTeamSection[] = [];
    const investigators: PortalPerson[] = [
      { id: 1, name: 'Béchir Béjaoui', role: 'Project Coordinator', image: 'assets/team/bb.jpg', order: 1 },
      { id: 2, name: 'Sihem Benabdallah', role: 'Team member', image: 'assets/team/sa.png', order: 2 },
    ];
    sections.push({ id: 1, title: 'Project Investigators', members: investigators, order: 1 });
    return sections;
  }

  private createDefaultParticipants(): PortalPerson[] {
    const base = [
      { image: 'assets/team/af.png', name: 'Afef Fathali', role: 'Researcher,INSTM' },
      { image: 'assets/team/bb.jpg', name: 'Béchir Bejaoui', role: 'Researcher,INSTM' },
      { image: 'assets/team/nz.png', name: 'Noureddine Zaaboub', role: 'Researcher,INSTM' },
      { image: 'assets/team/oula.jpg', name: 'Oula Amrouni', role: 'Researcher,INSTM' },
    ];
    return base.map((p, idx) => ({
      id: idx + 1,
      name: p.name,
      role: p.role,
      image: p.image,
      order: idx + 1,
    }));
  }

  private createDefaultOutputs() {
    const outputs = [
      {
        title: 'Sea Surface Circulation Patterns Along Coastal Tunisian Areas',
        description:
          'Sea surface current magnitude results have a color range, between 0-0.6 m/s. This circulation shows the bifurcation of Algerian Current (AC) into the Atlantic Tunisian Current (ATC) and the Atlantic Iionian Stream (AIS) and the entrance of the Sicily Strait, as described by Béranger et al. (2004).',
        videoUrl: 'assets/videos/current.mp4',
        layout: 'text-left' as const,
      },
      {
        title: 'Sea Surface Temperature Patterns Along Coastal Tunisian Areas',
        description:
          'Sea Surface Temperature is shown in the adjacent video. The video shows the SST contrast at a level of spatial and temporal variations.',
        videoUrl: 'assets/videos/temp.mp4',
        layout: 'text-right' as const,
      },
      {
        title: 'Sea Surface Chlorophyll-a Patterns Along Coastal Tunisian Areas',
        description:
          'Sea Surface Chlorophyll-a is shown in the adjacent video. The video shows the Chla contrast at a level of spatial and temporal variations. The video has a color range, between 0-3 mg/m3 of Chla. The model shows higher values in the area of influence of the AC and in the coastal area of the Gulf of Gabes.',
        videoUrl: 'assets/videos/chla.mp4',
        layout: 'text-left' as const,
      },
      {
        title: 'Sea Surface Salinity Patterns in the Bizerte Lagoon',
        description:
          'Sea Surface Salinity is shown in the adjacent video. The video shows the SSS contrast at a level of spatial and temporal variations in the Bizerte Lagoon.',
        videoUrl: 'assets/videos/salinity.mp4',
        layout: 'text-right' as const,
      },
      {
        title: 'Sea Surface Circulation Patterns in the Bizerte Lagoon',
        description:
          'Sea Surface Current is shown in the adjacent video. The video shows the magnitude of the current intensity in the Lagoon.',
        videoUrl: 'assets/videos/circulation bizerte.mp4',
        layout: 'text-left' as const,
      },
    ];
    return outputs.map((o, idx) => ({
      id: idx + 1,
      title: o.title,
      description: o.description,
      videoUrl: o.videoUrl,
      layout: o.layout,
      order: idx + 1,
    }));
  }
}

