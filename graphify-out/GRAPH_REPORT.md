# Graph Report - C:/Users/MSI/Desktop/my files/bass  (2026-10-10)

## Corpus Check
- Large corpus: 219 files · ~1,131,928 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1267 nodes · 2295 edges · 109 communities (75 shown, 34 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 155 edges (avg confidence: 0.78)
- Token cost: 128,255 input · 0 output

## Community Hubs (Navigation)
- Portal Content Editor
- Projects Admin Page
- Shared Folder Explorer
- Portal Projects Management
- Angular Schematics Config
- App Module Declarations
- TypeScript Compiler Config
- Public Projects List
- Portal Project Context
- Budget Charts
- Portal Navbar (navbar2)
- Project Service & Search
- TRIX Landing Overview
- Auth & Token Handling
- Portal Document Service
- Portal Content Models
- Portal Shared Documents Page
- Portal Gallery Lightbox
- Project Groups
- Header & Confirm Dialogs
- Design Mockup App (look)
- App Routing
- TRIX Prediction Service
- Theme, Sidebar & Media Services
- Project Export
- TRIX Index Service
- Admin Layout Shell
- Sidebars
- Portal Projects Service
- Portal Landing Pages
- Portal Home Carousel
- Runtime Dependencies
- Mockup Tweaks Panel
- Objectives & Scientific Merit
- Portal Display Shell
- Projects Landing Shell
- Project Edit Dialog
- TRIX Map Regions
- Legacy Navbar
- Build Options
- Rich Text Toolbar Dropdowns
- Portal Events Page
- Admin Navbar
- Dev Dependencies
- Document Drag & Drop
- Wiki Admin & TRIX Docs
- Back-to-Top Button
- ContentEditable Directive
- Landing Outputs Page
- Dev Server Config
- npm Scripts
- Admin Guard & Login
- Development Build Config
- CommonJS Allowlist
- Landing Portals Page
- Eco Status Service
- Email Service
- Production Build Config
- Global Stylesheets
- README & Design Tokens
- Person Card
- Delete Group Dialog
- App Root Component
- Portal Top Nav Links
- Portal Outputs Page
- Auth Guard
- Build Target
- Portal Partners Page
- Dep: @angular/compiler
- Dep: @angular/core
- Dep: @angular/forms
- Dep: @angular/material
- Dep: platform-browser
- Dep: platform-browser-dynamic
- Dep: bootstrap
- Dep: chart.js
- Dep: docx
- Dep: jspdf
- Dep: jspdf-autotable
- Dep: mammoth
- Dep: primeng
- Dep: rxjs
- Dep: tslib
- Dep: xlsx
- Light Theme Binding
- Dev Environment
- Prod Environment
- Index HTML Entry

## God Nodes (most connected - your core abstractions)
1. `PortalProjectsListComponent` - 148 edges
2. `DocsadminComponent` - 87 edges
3. `ProjectAdminComponent` - 55 edges
4. `AuthService` - 46 edges
5. `PortalProjectContextService` - 36 edges
6. `ManagementComponent` - 35 edges
7. `PortalProject` - 35 edges
8. `ProjectsComponent` - 33 edges
9. `ThemeService` - 31 edges
10. `PortalProjectDocumentService` - 27 edges

## Surprising Connections (you probably didn't know these)
- `BASSIANA Marine Ecosystems Portal design mockup` --conceptually_related_to--> `Bassiana (Angular project)`  [INFERRED]
  look/index.html → README.md
- `TreeRow` --references--> `ProjectFolder`  [EXTRACTED]
  src/app/docsadmin/docsadmin.component.ts → src/app/services/portal-project-document.service.ts
- `DocsadminComponent` --references--> `ProjectDocument`  [EXTRACTED]
  src/app/docsadmin/docsadmin.component.ts → src/app/services/portal-project-document.service.ts
- `DocsadminComponent` --references--> `ProjectFolder`  [EXTRACTED]
  src/app/docsadmin/docsadmin.component.ts → src/app/services/portal-project-document.service.ts
- `ManagementComponent` --references--> `PortalProjectMeta`  [EXTRACTED]
  src/app/management/management.component.ts → src/app/portal/models/portal-project.model.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Public portal project pages sharing hero + content model** — src_app_portal_project_display_pages_portal_page_events_portal_page_events_component, src_app_portal_project_display_pages_portal_page_funders_portal_page_funders_component, src_app_portal_project_display_pages_portal_page_gallery_portal_page_gallery_component, src_app_portal_project_display_pages_portal_page_objectives_portal_page_objectives_component, src_app_portal_project_display_pages_portal_page_outputs_portal_page_outputs_component, src_app_portal_project_display_pages_portal_page_partners_portal_page_partners_component, src_app_portal_project_display_pages_portal_page_scientific_merit_portal_page_scientific_merit_component, src_app_portal_project_display_pages_portal_page_shared_portal_page_shared_component, src_app_portal_project_display_pages_portal_page_team_portal_page_team_component, src_app_portal_project_display_components_portal_page_hero_portal_page_hero_component [EXTRACTED 1.00]
- **Admin pages using shared admin layout** — src_app_budget_charts_budget_charts_component, src_app_docsadmin_docsadmin_component, src_app_management_management_component, src_app_management_portal_projects_list_portal_projects_list_component [EXTRACTED 1.00]
- **Admin Shell Layout (navbar + sidebar + page)** — src_app_utilities_admin_navbar_admin_navbar_component, src_app_utilities_admin_sidebar_admin_sidebar_component, src_app_projectsadmin_projectadmin_component, src_app_wikiadmin_wikiadmin_component [EXTRACTED 1.00]
- **Project CRUD Dialog Flow** — src_app_projectsadmin_projectadmin_component, src_app_utilities_dialogues_dialog_content_dialog_content_component, src_app_utilities_dialogues_project_group_dialog_project_group_dialog_component, src_app_utilities_dialogues_confirmation_dialog_project_delete_confirmation_dialog_project_delete_component, src_app_utilities_dialogues_confirm_delete_group_dialog_confirm_delete_group_dialog_component [INFERRED 0.85]
- **Project Portal Shell** — src_app_portal_project_display_portal_project_display_component, src_app_utilities_navbar2_navbar2_component, src_app_utilities_footer_footer_component, src_app_utilities_upbutton_upbutton_component, src_app_portal_project_display_portal_project_display_component_portal_accent_theming [EXTRACTED 1.00]

## Communities (109 total, 34 thin omitted)

### Community 1 - "Projects Admin Page"
Cohesion: 0.06
Nodes (3): ProjectAdminComponent, Component, HostListener

### Community 3 - "Portal Projects Management"
Cohesion: 0.07
Nodes (4): ManagementComponent, Component, HostBinding, HostListener

### Community 4 - "Angular Schematics Config"
Cohesion: 0.06
Nodes (30): prefix, projectType, root, schematics, sourceRoot, analytics, cli, newProjectRoot (+22 more)

### Community 5 - "App Module Declarations"
Cohesion: 0.08
Nodes (18): Expandable landscape cards (toggle activeCard), Pipe, AppModule, NgModule, CustomButtonComponent, Component, CustomFbButton social links template, CustomFbButtonsComponent (+10 more)

### Community 6 - "TypeScript Compiler Config"
Cohesion: 0.07
Nodes (29): dom, ES2022, angularCompilerOptions, enableI18nLegacyMessageIdFormat, strictInjectionParameters, strictInputAccessModifiers, strictTemplates, compileOnSave (+21 more)

### Community 7 - "Public Projects List"
Cohesion: 0.09
Nodes (4): ProjectsComponent, Component, HostBinding, HostListener

### Community 8 - "Portal Project Context"
Cohesion: 0.19
Nodes (12): Portal page search bar pattern, Portal project content model (project.content.home/team/events/gallery/partnersFunders/...), PortalProject, PortalPageHeroComponent, Component, Input, PortalPagePartnersFundersComponent, Component (+4 more)

### Community 10 - "Portal Navbar (navbar2)"
Cohesion: 0.11
Nodes (7): PortalBrandMode, Navbar2Component, Component, HostListener, Input, Optional, ViewChild

### Community 11 - "Project Service & Search"
Cohesion: 0.19
Nodes (7): Landing Admin Login Dropdown, IMAS External Login Link, ThemeService Toggle, ProjectService, Injectable, matchesSearch(), normalizeSearch()

### Community 12 - "TRIX Landing Overview"
Cohesion: 0.12
Nodes (5): LandingOverviewComponent, Component, HostListener, TrixRegionData, TrixResult

### Community 13 - "Auth & Token Handling"
Cohesion: 0.18
Nodes (4): AuthInterceptor, Injectable, AuthService, Injectable

### Community 15 - "Portal Content Models"
Cohesion: 0.15
Nodes (16): Home partner-logo marquee (non-lazy images), FunderTextLine, GalleryImage, OrderedEntity, PartnersLogo, PortalCarouselSlide, PortalEvent, PortalEventStatus (+8 more)

### Community 16 - "Portal Shared Documents Page"
Cohesion: 0.15
Nodes (3): PortalPageSharedComponent, Component, ProjectDocument

### Community 17 - "Portal Gallery Lightbox"
Cohesion: 0.16
Nodes (3): PortalPageGalleryComponent, Component, HostListener

### Community 18 - "Project Groups"
Cohesion: 0.14
Nodes (4): ProjectGroupService, Injectable, ProjectGroupDialogComponent, Component

### Community 19 - "Header & Confirm Dialogs"
Cohesion: 0.12
Nodes (6): ConfirmDialogComponent, Component, ConfirmationDialogProjectDeleteComponent, Component, HeaderComponent, Component

### Community 20 - "Design Mockup App (look)"
Cohesion: 0.11
Nodes (7): ADMINS, DEVELOPERS, GEO_TILES, MISSION, PROJECTS, STATS, TWEAK_DEFAULTS

### Community 21 - "App Routing"
Cohesion: 0.12
Nodes (9): AppRoutingModule, routes, NgModule, PortalPageFundersComponent, Component, PortalPageTeamComponent, Component, LandingTeamComponent (+1 more)

### Community 23 - "TRIX Prediction Service"
Cohesion: 0.18
Nodes (12): calcDeltaO2Pct(), calcO2Sat(), calcTrix(), classify(), DO2_FALLBACK, forecastMean(), SEASON_MONTHS, seasonMean() (+4 more)

### Community 24 - "Theme, Sidebar & Media Services"
Cohesion: 0.15
Nodes (6): PortalMediaService, Injectable, SidebarService, Injectable, ThemeService, Injectable

### Community 25 - "Project Export"
Cohesion: 0.25
Nodes (4): ExportColumn, ProjectExportFormat, ProjectExportService, Injectable

### Community 26 - "TRIX Index Service"
Cohesion: 0.18
Nodes (12): calcTrix(), classify(), currentSeasonYear(), DO2, matchRegionId(), meanOf(), recordSeason(), REGIONS (+4 more)

### Community 27 - "Admin Layout Shell"
Cohesion: 0.21
Nodes (10): Admin layout (app-admin-navbar + app-admin-sidebar + admin-main), Budget distribution doughnut + top 5 contributors (p-chart), Shared Folder file-explorer (folder tree + contents table), Home hero carousel (project.content.home.carousel), PendingUpload, PortalProject, ProjectWithStats, PORTAL_BRAND_MODES (+2 more)

### Community 29 - "Sidebars"
Cohesion: 0.12
Nodes (5): AdminSidebarComponent, Component, Input, SidenavbarComponent, Component

### Community 30 - "Portal Projects Service"
Cohesion: 0.28
Nodes (5): PortalProjectSlug, clone(), normalizeProject(), PortalProjectsService, Injectable

### Community 31 - "Portal Landing Pages"
Cohesion: 0.15
Nodes (8): PortalProjectContent, PortalProjectMeta, BRAND_MODES, expandShortHex(), normalizeBrandMode(), normalizeHexColor(), LandingAboutComponent, Component

### Community 32 - "Portal Home Carousel"
Cohesion: 0.21
Nodes (3): PortalPageHomeComponent, Component, ViewChildren

### Community 33 - "Runtime Dependencies"
Cohesion: 0.13
Nodes (15): @angular/animations, @angular/cdk, @angular/common, @angular/router, hammerjs, dependencies, @angular/animations, @angular/cdk (+7 more)

### Community 35 - "Objectives & Scientific Merit"
Cohesion: 0.19
Nodes (6): safeHtml pipe (rich paragraph rendering), RichTextParagraph, PortalPageObjectivesComponent, Component, PortalPageScientificMeritComponent, Component

### Community 36 - "Portal Display Shell"
Cohesion: 0.16
Nodes (3): PortalProjectDisplayComponent, Component, ViewChild

### Community 37 - "Projects Landing Shell"
Cohesion: 0.16
Nodes (4): ProjectsLandingComponent, Component, HostBinding, HostListener

### Community 38 - "Project Edit Dialog"
Cohesion: 0.18
Nodes (3): DialogContentComponent, Component, HostListener

### Community 39 - "TRIX Map Regions"
Cohesion: 0.18
Nodes (10): COUNTRY_DEFS, CountryMapDef, GOV_LABEL_POS, GOV_TO_REGION_ID, GOVERNORATE_DEFS, GovernorateDef, TRIX_MOCK, TrixPredRegion (+2 more)

### Community 40 - "Legacy Navbar"
Cohesion: 0.19
Nodes (4): NavbarComponent, Component, HostListener, Optional

### Community 41 - "Build Options"
Cohesion: 0.17
Nodes (12): options, assets, index, main, outputPath, polyfills, scripts, tsConfig (+4 more)

### Community 44 - "Admin Navbar"
Cohesion: 0.18
Nodes (5): AdminNavbarComponent, Component, HostBinding, Input, Output

### Community 45 - "Dev Dependencies"
Cohesion: 0.18
Nodes (11): @angular/compiler-cli, @angular-devkit/build-angular, devDependencies, @angular/cli, @angular/compiler-cli, @angular-devkit/build-angular, @types/hammerjs, typescript (+3 more)

### Community 47 - "Document Drag & Drop"
Cohesion: 0.22
Nodes (3): TreeRow, ProjectFolder, ProjectStats

### Community 50 - "Wiki Admin & TRIX Docs"
Cohesion: 0.20
Nodes (6): TRIX Prediction/Season Comparison Panel, TRIX Trophic Index, Component, HostBinding, Weiss (1970) Oxygen Saturation Equation, WikiadminComponent

### Community 51 - "Back-to-Top Button"
Cohesion: 0.24
Nodes (4): Component, HostListener, Input, UpbuttonComponent

### Community 52 - "ContentEditable Directive"
Cohesion: 0.22
Nodes (5): Directive, ContentEditableHtmlDirective, HostListener, Input, Output

### Community 53 - "Landing Outputs Page"
Cohesion: 0.24
Nodes (3): FeaturedOutput, LandingOutputsComponent, Component

### Community 54 - "Dev Server Config"
Cohesion: 0.22
Nodes (9): extract-i18n, serve, architect, builder, options, buildTarget, builder, configurations (+1 more)

### Community 55 - "npm Scripts"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, ng, start, watch, version

### Community 58 - "Development Build Config"
Cohesion: 0.25
Nodes (8): development, buildOptimizer, buildTarget, extractLicenses, namedChunks, optimization, sourceMap, vendorChunk

### Community 59 - "CommonJS Allowlist"
Cohesion: 0.25
Nodes (8): allowedCommonJsDependencies, canvg, core-js, dompurify, html2canvas, mammoth, raf, rgbcolor

### Community 62 - "Eco Status Service"
Cohesion: 0.32
Nodes (3): EcoLatestValues, EcoStatusService, Injectable

### Community 64 - "Production Build Config"
Cohesion: 0.29
Nodes (7): production, baseHref, budgets, buildTarget, deployUrl, fileReplacements, outputHashing

### Community 65 - "Global Stylesheets"
Cohesion: 0.29
Nodes (7): styles, @angular/material/prebuilt-themes/purple-green.css, node_modules/bootstrap/dist/css/bootstrap.min.css, node_modules/primeicons/primeicons.css, node_modules/primeng/resources/primeng.min.css, node_modules/primeng/resources/themes/saga-blue/theme.css, src/styles.css

### Community 66 - "README & Design Tokens"
Cohesion: 0.29
Nodes (7): BASSIANA Marine Ecosystems Portal design mockup, Density, font and divider data-attribute variants, Dark ocean theme tokens (teal accent #4ad6c4), Bassiana README, Angular CLI 15.2.8, Bassiana (Angular project), Karma test runner

### Community 68 - "Person Card"
Cohesion: 0.38
Nodes (3): PortalPersonCardComponent, Component, Input

### Community 70 - "App Root Component"
Cohesion: 0.33
Nodes (3): AppComponent, PrimeNG p-toast + router-outlet root, Component

### Community 71 - "Portal Top Nav Links"
Cohesion: 0.60
Nodes (3): PORTAL_TOP_NAV_LINKS, PortalTopNavLink, Portal Mode vs Legacy Navigation

### Community 76 - "Build Target"
Cohesion: 0.50
Nodes (4): build, builder, configurations, defaultConfiguration

## Ambiguous Edges - Review These
- `portal-page-home.component.ts` → `BASSIANA Marine Ecosystems Portal design mockup`  [AMBIGUOUS]
  look/index.html · relation: conceptually_related_to

## Knowledge Gaps
- **166 isolated node(s):** `$schema`, `version`, `newProjectRoot`, `projectType`, `inlineTemplate` (+161 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `portal-page-home.component.ts` and `BASSIANA Marine Ecosystems Portal design mockup`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `PortalProjectsListComponent` connect `Portal Content Editor` to `App Module Declarations`, `App Routing`, `Portal Media Uploads`, `Theme, Sidebar & Media Services`, `Admin Layout Shell`, `Sidebars`, `Rich Text Toolbar Dropdowns`, `Rich Text Formatting`, `Portal Content Saving`, `Gallery Viewer Zoom`, `Events Editor`, `Team Member Ordering`, `Gallery Paging`, `Associate Partner Logos`, `Funder Lines`, `Funder Logos`, `Image Ordering`, `Info Block Ordering`, `Light Theme Binding`?**
  _High betweenness centrality (0.211) - this node is a cross-community bridge._
- **Why does `DocsadminComponent` connect `Shared Folder Explorer` to `App Module Declarations`, `Document Filters & Delete`, `Auth & Token Handling`, `Bulk Move & Delete`, `Document Drag & Drop`, `Portal Shared Documents Page`, `Portal Document Service`, `App Routing`, `Theme, Sidebar & Media Services`, `Admin Layout Shell`, `Folder Tree Loading`, `Sidebars`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Why does `mammoth` connect `CommonJS Allowlist` to `Portal Document Service`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `newProjectRoot` to the rest of the system?**
  _166 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Portal Content Editor` be split into smaller, more focused modules?**
  _Cohesion score 0.044805194805194806 - nodes in this community are weakly interconnected._
- **Should `Projects Admin Page` be split into smaller, more focused modules?**
  _Cohesion score 0.05779220779220779 - nodes in this community are weakly interconnected._