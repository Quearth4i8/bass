import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

const BASE = 'http://41.229.139.17:8080/imasservice/api/imas';

export type TrixSeason = 'winter' | 'spring' | 'summer' | 'autumn';

export interface TrixResult {
  trix:           number | null;
  eutrophication: string | null;
  waterQuality:   string | null;
  din:            number | null;
  dip:            number | null;
  chla:           number | null;
  do2:            number;
}

export interface TrixRegionData {
  id:      string;
  label:   string;
  seasons: Record<TrixSeason, TrixResult>;
}

// |O₂_sat% − 100| per region per season — hardcoded from literature values
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
  winter: [12, 1, 2],
  spring: [3,  4, 5],
  summer: [6,  7, 8],
  autumn: [9, 10, 11],
};

function matchRegionId(record: any): string | null {
  const hay = `${record.name ?? ''} ${record.region ?? ''} ${record.locality ?? ''}`.toLowerCase();
  for (const r of REGIONS) {
    if ((r.keywords as readonly string[]).some(k => hay.includes(k))) return r.id;
  }
  return null;
}

// Returns the "season year" — Jan/Feb belong to the previous December's winter
function seasonYear(dateStr: string): number {
  const d = new Date(dateStr.replace(/\//g, '-'));
  if (isNaN(d.getTime())) return 0;
  const month = d.getMonth() + 1;
  return month <= 2 ? d.getFullYear() - 1 : d.getFullYear();
}

function currentSeasonYear(): number {
  const month = new Date().getMonth() + 1;
  return month <= 2 ? new Date().getFullYear() - 1 : new Date().getFullYear();
}

function recordSeason(dateStr: string): TrixSeason | null {
  const d = new Date(dateStr.replace(/\//g, '-'));
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  for (const [s, months] of Object.entries(SEASON_MONTHS) as [TrixSeason, number[]][]) {
    if (months.includes(m)) return s;
  }
  return null;
}

function meanOf(values: (string | number | null | undefined)[]): number | null {
  const nums = values.map(Number).filter(v => !isNaN(v) && isFinite(v));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

export function calcTrix(din: number | null, dip: number | null, do2: number, chla: number | null): number | null {
  if (din === null || dip === null || chla === null) return null;
  const e = 0.001;
  const v = (Math.log10(Math.max(din, e) * Math.max(dip, e) * Math.max(do2, e) * Math.max(chla, e)) + 1.5) / 1.2;
  return Math.max(0, Math.min(10, v));
}

export function classify(t: number | null): Pick<TrixResult, 'eutrophication' | 'waterQuality'> {
  if (t === null) return { eutrophication: null, waterQuality: null };
  if (t <= 4)     return { eutrophication: 'Low',       waterQuality: 'High' };
  if (t <= 5)     return { eutrophication: 'Medium',    waterQuality: 'Good' };
  if (t <= 6)     return { eutrophication: 'High',      waterQuality: 'Poor' };
  return                 { eutrophication: 'Very High', waterQuality: 'Bad'  };
}

@Injectable({ providedIn: 'root' })
export class TrixService {
  constructor(private http: HttpClient) {}

  private fetchAll(path: string): Observable<any[]> {
    return this.http
      .get<any>(`${BASE}/${path}`, { params: { page: '0', size: '200' } })
      .pipe(map(r => r?.values ?? []), catchError(() => of([])));
  }

  getTrixData(): Observable<TrixRegionData[]> {
    return forkJoin({
      chem:  this.fetchAll('wat_chemical'),
      phyto: this.fetchAll('wat_phytoplankton'),
    }).pipe(map(({ chem, phyto }) => {
      const thisYear = currentSeasonYear();
      const prevYear = thisYear - 1;

      if (!chem.length && !phyto.length) return this.buildEmpty();

      const chemAll  = chem.filter(r => r.date);
      const phytoAll = phyto.filter(r => r.date);

      return REGIONS.map(region => {
        const chemR  = chemAll.filter(r => matchRegionId(r) === region.id);
        const phytoR = phytoAll.filter(r => matchRegionId(r) === region.id);

        const byYear = (records: any[], yr: number, sid: TrixSeason) =>
          records.filter(r => seasonYear(r.date) === yr && recordSeason(r.date) === sid);

        const seasons = {} as Record<TrixSeason, TrixResult>;
        for (const sid of Object.keys(SEASON_MONTHS) as TrixSeason[]) {
          // Use this year's data; fall back to previous year if none
          let cS = byYear(chemR, thisYear, sid);
          let pS = byYear(phytoR, thisYear, sid);
          if (!cS.length && !pS.length) {
            cS = byYear(chemR, prevYear, sid);
            pS = byYear(phytoR, prevYear, sid);
          }

          const nh4  = meanOf(cS.map(r => r.nh4));
          const no3  = meanOf(cS.map(r => r.no3));
          const no2  = meanOf(cS.map(r => r.no2));
          const po4  = meanOf(cS.map(r => r.po4));
          const chla = meanOf(pS.map(r => r.chla));
          const do2  = DO2[region.id][sid];

          // no2 is treated as 0 when absent — it is typically the smallest DIN component
          // Source values are in µmol/L; convert to µg/L (DIN ×14 for N, DIP ×31 for P)
          const din = (nh4 !== null && no3 !== null) ? (nh4 + no3 + (no2 ?? 0)) * 14 : null;
          const dip = po4 !== null ? po4 * 31 : null;
          const trix = calcTrix(din, dip, do2, chla);

          seasons[sid] = { trix, ...classify(trix), din, dip, chla, do2 };
        }
        return { id: region.id, label: region.label, seasons };
      });
    }));
  }

  private buildEmpty(): TrixRegionData[] {
    return REGIONS.map(r => ({
      id: r.id, label: r.label,
      seasons: Object.fromEntries(
        (Object.keys(SEASON_MONTHS) as TrixSeason[]).map(s => [
          s,
          { trix: null, eutrophication: null, waterQuality: null,
            din: null, dip: null, chla: null, do2: DO2[r.id][s] }
        ])
      ) as Record<TrixSeason, TrixResult>
    }));
  }
}
