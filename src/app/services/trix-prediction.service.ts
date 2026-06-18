import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { TrixSeason, TrixResult } from './trix.service';

const BASE = 'http://41.229.139.17:8080/imasservice/api/imas';

// ── Shared constants ──────────────────────────────────────────────────────

const DO2: Record<string, Record<TrixSeason, number>> = {
  bizerte: { winter: 10, spring:  5, summer: 35, autumn: 15 },
  tunis:   { winter: 17, spring: 20, summer: 40, autumn: 30 },
  gabes:   { winter:  5, spring: 10, summer: 25, autumn: 15 },
};

const REGIONS = [
  { id: 'bizerte', label: 'Lagoon of Bizerte', keywords: ['bizert'] },
  { id: 'tunis',   label: 'Gulf of Tunis',   keywords: ['tunis', 'lac de tunis', 'lac nord'] },
  { id: 'gabes',   label: 'Gulf of Gabès',  keywords: ['gab', 'golfe de gab'] },
] as const;

const SEASON_MONTHS: Record<TrixSeason, number[]> = {
  winter: [12, 1, 2], spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11],
};

// ── Helpers ───────────────────────────────────────────────────────────────

function matchRegion(r: any): string | null {
  const hay = `${r.name ?? ''} ${r.region ?? ''} ${r.locality ?? ''}`.toLowerCase();
  for (const reg of REGIONS) {
    if ((reg.keywords as readonly string[]).some(k => hay.includes(k))) return reg.id;
  }
  return null;
}

// Jan/Feb belong to the previous December's winter
function sYear(dateStr: string): number {
  const d = new Date(dateStr.replace(/\//g, '-'));
  if (isNaN(d.getTime())) return 0;
  const m = d.getMonth() + 1;
  return m <= 2 ? d.getFullYear() - 1 : d.getFullYear();
}

function sSeason(dateStr: string): TrixSeason | null {
  const d = new Date(dateStr.replace(/\//g, '-'));
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  for (const [s, months] of Object.entries(SEASON_MONTHS) as [TrixSeason, number[]][]) {
    if (months.includes(m)) return s;
  }
  return null;
}

function calcTrix(din: number | null, dip: number | null, do2: number, chla: number | null): number | null {
  if (din === null || dip === null || chla === null) return null;
  const e = 0.001;
  const v = (Math.log10(Math.max(din, e) * Math.max(dip, e) * Math.max(do2, e) * Math.max(chla, e)) + 1.5) / 1.2;
  return Math.max(0, Math.min(10, v));
}

function classify(t: number | null): Pick<TrixResult, 'eutrophication' | 'waterQuality'> {
  if (t === null) return { eutrophication: null, waterQuality: null };
  if (t <= 4)     return { eutrophication: 'Low',       waterQuality: 'High' };
  if (t <= 5)     return { eutrophication: 'Medium',    waterQuality: 'Good' };
  if (t <= 6)     return { eutrophication: 'High',      waterQuality: 'Poor' };
  return                 { eutrophication: 'Very High', waterQuality: 'Bad'  };
}

// ── Ordinary Least Squares regression ────────────────────────────────────

function ols(pts: { x: number; y: number }[]): { m: number; b: number; r2: number } | null {
  const n = pts.length;
  if (n < 2) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  const ssXX = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const ssXY = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  if (ssXX === 0) return null;
  const m  = ssXY / ssXX;
  const b  = my - m * mx;
  const ssRes = pts.reduce((s, p) => s + (p.y - (m * p.x + b)) ** 2, 0);
  const ssTot = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 1;
  return { m, b, r2: Math.min(1, Math.max(0, r2)) };
}

// Predict a single parameter for targetYear using OLS over past yearly means
interface ParamPred { val: number | null; r2: number | null; trend: 'up' | 'down' | 'stable' | null; }

function predictParam(records: any[], field: string, targetYear: number): ParamPred {
  const byYear = new Map<number, number[]>();
  for (const r of records) {
    const v = Number(r[field]);
    if (!isFinite(v) || isNaN(v) || v < 0) continue;
    const yr = sYear(r.date);
    if (yr <= 0 || yr >= targetYear) continue; // only train on past data
    if (!byYear.has(yr)) byYear.set(yr, []);
    byYear.get(yr)!.push(v);
  }

  const pts = Array.from(byYear.entries())
    .map(([x, vals]) => ({ x, y: vals.reduce((a, b) => a + b) / vals.length }))
    .sort((a, b) => a.x - b.x);

  if (pts.length === 0) return { val: null, r2: null, trend: null };
  if (pts.length === 1) return { val: pts[0].y, r2: null, trend: null };

  const reg = ols(pts);
  if (!reg) return { val: null, r2: null, trend: null };

  const val  = Math.max(0, reg.m * targetYear + reg.b);
  const mean = pts.reduce((s, p) => s + p.y, 0) / pts.length || 1;
  const trend: 'up' | 'down' | 'stable' =
    reg.m >  mean * 0.04 ? 'up' :
    reg.m < -mean * 0.04 ? 'down' : 'stable';

  return { val, r2: reg.r2, trend };
}

// ── Public types ──────────────────────────────────────────────────────────

export interface TrixPredResult {
  trix:           number | null;
  eutrophication: string | null;
  waterQuality:   string | null;
  din:            number | null;
  dip:            number | null;
  chla:           number | null;
  do2:            number;
  trend:          'up' | 'down' | 'stable' | null;
  dinTrend:       'up' | 'down' | 'stable' | null;
  dipTrend:       'up' | 'down' | 'stable' | null;
  chlaTrend:      'up' | 'down' | 'stable' | null;
  r2:             number | null;
  dataYears:      number;
}

export interface TrixPredRegion {
  id:      string;
  label:   string;
  seasons: Record<TrixSeason, TrixPredResult>;
}

// ── Service ───────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TrixPredictionService {
  constructor(private http: HttpClient) {}

  // Fetch all pages sequentially using page-size=200 to stay within server limits
  private fetchAll(path: string): Observable<any[]> {
    const size = 200;
    return this.http
      .get<any>(`${BASE}/${path}`, { params: { page: '0', size: String(size) } })
      .pipe(
        catchError(() => of({ values: [], totalPages: 1 })),
        switchMap((first: any) => {
          const firstVals  = first?.values  ?? [];
          const totalPages = first?.totalPages ?? 1;
          const maxPages   = Math.min(totalPages, 15); // cap at 3000 records

          if (maxPages <= 1) return of(firstVals);

          return forkJoin(
            Array.from({ length: maxPages - 1 }, (_, i) =>
              this.http
                .get<any>(`${BASE}/${path}`, { params: { page: String(i + 1), size: String(size) } })
                .pipe(catchError(() => of({ values: [] })), map((r: any) => r?.values ?? []))
            )
          ).pipe(map(rest => [...firstVals, ...rest.flat()]));
        })
      );
  }

  getPredictions(): Observable<TrixPredRegion[]> {
    const now = new Date();
    const cm  = now.getMonth() + 1;
    const targetYear = cm <= 2 ? now.getFullYear() - 1 : now.getFullYear();

    return forkJoin({
      chem:  this.fetchAll('wat_chemical'),
      phyto: this.fetchAll('wat_phytoplankton'),
    }).pipe(map(({ chem, phyto }) => {
      if (!chem.length && !phyto.length) return this.buildEmpty(targetYear);

      // Filter only valid dated records
      const chemAll  = chem.filter(r => r.date);
      const phytoAll = phyto.filter(r => r.date);

      return REGIONS.map(region => {
        const useChemR  = chemAll.filter(r => matchRegion(r) === region.id);
        const usePhytoR = phytoAll.filter(r => matchRegion(r) === region.id);

        const seasons = {} as Record<TrixSeason, TrixPredResult>;

        for (const sid of Object.keys(SEASON_MONTHS) as TrixSeason[]) {
          const cS = useChemR.filter(r => sSeason(r.date) === sid);
          const pS = usePhytoR.filter(r => sSeason(r.date) === sid);

          const nh4P  = predictParam(cS, 'nh4',  targetYear);
          const no3P  = predictParam(cS, 'no3',  targetYear);
          const no2P  = predictParam(cS, 'no2',  targetYear);
          const po4P  = predictParam(cS, 'po4',  targetYear);
          const chlaP = predictParam(pS, 'chla', targetYear);

          const do2  = DO2[region.id][sid];
          // no2 is treated as 0 when absent — it is typically the smallest DIN component
          // Source values are in µmol/L; convert to µg/L (DIN ×14 for N, DIP ×31 for P)
          const din  = (nh4P.val !== null && no3P.val !== null)
                        ? (nh4P.val + no3P.val + (no2P.val ?? 0)) * 14 : null;
          const dip  = po4P.val !== null ? po4P.val * 31 : null;
          const trix = calcTrix(din, dip, do2, chlaP.val);

          // Mean R² across all predicted parameters
          const r2vals = [nh4P.r2, no3P.r2, no2P.r2, po4P.r2, chlaP.r2]
            .filter((v): v is number => v !== null);
          const r2 = r2vals.length ? r2vals.reduce((a, b) => a + b) / r2vals.length : null;

          // Trend: dominant direction across all predicted parameters (DIN + DIP + Chl-a)
          const trends = [nh4P.trend, no3P.trend, no2P.trend, po4P.trend, chlaP.trend].filter(Boolean);
          const upCount   = trends.filter(t => t === 'up').length;
          const downCount = trends.filter(t => t === 'down').length;
          const trend: 'up' | 'down' | 'stable' =
            upCount > downCount ? 'up' : downCount > upCount ? 'down' : 'stable';

          const allYears = new Set([
            ...cS.map(r => sYear(r.date)).filter(y => y > 0 && y < targetYear),
            ...pS.map(r => sYear(r.date)).filter(y => y > 0 && y < targetYear),
          ]);

          // DIN trend: dominant across NH4/NO3/NO2
          const dinTrends = [nh4P.trend, no3P.trend, no2P.trend].filter(Boolean);
          const dinUp   = dinTrends.filter(t => t === 'up').length;
          const dinDown = dinTrends.filter(t => t === 'down').length;
          const dinTrend: 'up' | 'down' | 'stable' | null = dinTrends.length
            ? (dinUp > dinDown ? 'up' : dinDown > dinUp ? 'down' : 'stable')
            : null;

          seasons[sid] = {
            trix, ...classify(trix),
            din, dip, chla: chlaP.val, do2,
            trend, dinTrend, dipTrend: po4P.trend, chlaTrend: chlaP.trend,
            r2, dataYears: allYears.size,
          };
        }

        return { id: region.id, label: region.label, seasons };
      });
    }));
  }

  private buildEmpty(targetYear: number): TrixPredRegion[] {
    return REGIONS.map(r => ({
      id: r.id, label: r.label,
      seasons: Object.fromEntries(
        (Object.keys(SEASON_MONTHS) as TrixSeason[]).map(s => [s, {
          trix: null, eutrophication: null, waterQuality: null,
          din: null, dip: null, chla: null, do2: DO2[r.id][s],
          trend: null, dinTrend: null, dipTrend: null, chlaTrend: null,
          r2: null, dataYears: 0,
        }])
      ) as Record<TrixSeason, TrixPredResult>
    }));
  }
}
