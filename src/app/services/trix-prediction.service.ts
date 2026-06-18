import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { TrixSeason, TrixResult } from './trix.service';

const BASE       = 'http://41.229.139.17:8080/imasservice/api/imas';
const FLASK_BASE = (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://127.0.0.1:8088'
  : 'http://41.229.139.17:8088';

const S_SALINITY = 36; // constant salinity (PSU)

// Fallback |ΔO2%| per season when Weiss cannot be computed (no T/O2 data available)
const DO2_FALLBACK: Record<TrixSeason, number> = {
  winter: 10, spring: 5, summer: 35, autumn: 15,
};

const SEASON_MONTHS: Record<TrixSeason, number[]> = {
  winter: [12, 1, 2], spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11],
};

// ── Date helpers ─────────────────────────────────────────────────────────────

// Jan/Feb belong to the previous December's winter season-year
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

// ── Weiss (1970) dissolved oxygen saturation ──────────────────────────────────

// O2 saturation in mg/L at given temperature (°C) and salinity (PSU).
function calcO2Sat(T_celsius: number, S: number): number {
  const T = T_celsius + 273.15; // Kelvin
  const lnC = -173.4292
    + 249.6339 * (100 / T)
    + 143.3483 * Math.log(T / 100)
    - 21.8492  * (T / 100)
    + S * (-0.033096 + 0.014259 * (T / 100) - 0.001700 * Math.pow(T / 100, 2));
  return Math.exp(lnC) * 1.4276; // mL/L → mg/L (O2 density at STP)
}

// |ΔO2%| = absolute deviation of measured O2 from saturation — the DO2 term in TRIX.
// o2_mg: measured dissolved O2 in mg/L; T_celsius: water temperature (°C).
function calcDeltaO2Pct(o2_mg: number, T_celsius: number, S: number): number {
  const sat = calcO2Sat(T_celsius, S);
  if (sat <= 0) return 0;
  return Math.abs((o2_mg / sat) * 100 - 100);
}

// ── TRIX ──────────────────────────────────────────────────────────────────────

function calcTrix(din: number | null, dip: number | null, do2: number, chla: number | null): number | null {
  if (din === null || dip === null || chla === null) return null;
  const e = 0.001;
  const v = (Math.log10(
    Math.max(din, e) * Math.max(dip, e) * Math.max(do2, e) * Math.max(chla, e)
  ) + 1.5) / 1.2;
  return Math.max(0, Math.min(10, v));
}

function classify(t: number | null): Pick<TrixResult, 'eutrophication' | 'waterQuality'> {
  if (t === null) return { eutrophication: null, waterQuality: null };
  if (t <= 4)    return { eutrophication: 'Low',       waterQuality: 'High' };
  if (t <= 5)    return { eutrophication: 'Medium',    waterQuality: 'Good' };
  if (t <= 6)    return { eutrophication: 'High',      waterQuality: 'Poor' };
  return               { eutrophication: 'Very High', waterQuality: 'Bad'  };
}

// ── Current-season data aggregation ──────────────────────────────────────────

// Mean of historical observed values for (season, year) supplemented by
// ML forecast future-date points within the same season.
// Used for nutrient and chla parameters.
function seasonMean(
  records: any[],
  field: string,
  forecastPts: Array<{ date: string; value: number }>,
  season: TrixSeason,
  year: number,
): number | null {
  const todayISO = new Date().toISOString().slice(0, 10);

  const histVals = records
    .filter(r => r.date && sSeason(r.date) === season && sYear(r.date) === year)
    .map(r => Number(r[field]))
    .filter(v => isFinite(v) && v >= 0);

  const fcVals = forecastPts
    .filter(p => {
      if (!p.date || p.date < todayISO) return false;
      const d = new Date(p.date);
      return d.getFullYear() === year && SEASON_MONTHS[season].includes(d.getMonth() + 1);
    })
    .map(p => p.value)
    .filter(v => isFinite(v) && v >= 0);

  const all = [...histVals, ...fcVals];
  return all.length ? all.reduce((a, b) => a + b, 0) / all.length : null;
}

// Mean of saved forecast green-dot points only (future dates, no historical mixing).
// Used for T and O2 so the Weiss formula stays purely forecast-based.
function forecastMean(
  forecastPts: Array<{ date: string; value: number }>,
  season: TrixSeason,
  year: number,
): number | null {
  const todayISO = new Date().toISOString().slice(0, 10);
  const vals = forecastPts
    .filter(p => {
      if (!p.date || p.date < todayISO) return false;
      const d = new Date(p.date);
      return d.getFullYear() === year && SEASON_MONTHS[season].includes(d.getMonth() + 1);
    })
    .map(p => p.value)
    .filter(v => isFinite(v) && v >= 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

// ── Public types ──────────────────────────────────────────────────────────────

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
  // Intermediate values for formula inspection
  nh4:       number | null;
  no3:       number | null;
  no2:       number | null;
  po4:       number | null;
  o2_mg:     number | null;
  T_celsius: number | null;
  o2sat:     number | null;
  do_pct:    number | null;
}

export interface TrixPredRegion {
  id:      string;
  label:   string;
  seasons: Record<TrixSeason, TrixPredResult>;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TrixPredictionService {
  constructor(private http: HttpClient) {}

  private fetchForecast(target: string): Observable<Array<{ date: string; value: number }>> {
    return this.http.get<any>(`${FLASK_BASE}/forecast_data?target=${target}`).pipe(
      catchError(() => of({ points: [] })),
      map((r: any) => Array.isArray(r?.points) ? r.points : [])
    );
  }

  private fetchAll(path: string): Observable<any[]> {
    const size = 200;
    return this.http
      .get<any>(`${BASE}/${path}`, { params: { page: '0', size: String(size) } })
      .pipe(
        catchError(() => of({ values: [], totalPages: 1 })),
        switchMap((first: any) => {
          const firstVals  = first?.values  ?? [];
          const totalPages = first?.totalPages ?? 1;
          const maxPages   = Math.min(totalPages, 15); // cap at 3 000 records

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
    // Jan/Feb belong to the prior year's winter
    const targetYear    = cm <= 2 ? now.getFullYear() - 1 : now.getFullYear();
    const currentSeason = (Object.keys(SEASON_MONTHS) as TrixSeason[])
      .find(s => SEASON_MONTHS[s].includes(cm)) ?? 'summer';

    return forkJoin({
      chem:    this.fetchAll('wat_chemical'),
      phyto:   this.fetchAll('wat_phytoplankton'),
      fcNh4:   this.fetchForecast('nh4'),
      fcNo3:   this.fetchForecast('no3'),
      fcNo2:   this.fetchForecast('no2'),
      fcPo4:   this.fetchForecast('po4'),
      fcChla:  this.fetchForecast('chla'),
      fcO2:    this.fetchForecast('oxygen'),
      fcT:     this.fetchForecast('temperature'),
    }).pipe(map(({ chem, phyto, fcNh4, fcNo3, fcNo2, fcPo4, fcChla, fcO2, fcT }) => {
      const chemAll  = chem.filter((r: any) => r.date);
      const phytoAll = phyto.filter((r: any) => r.date);

      const sid = currentSeason;

      // ── Current-season means: observed this year + ML forecast future days ──
      const nh4  = seasonMean(chemAll,  'nh4',  fcNh4,  sid, targetYear);
      const no3  = seasonMean(chemAll,  'no3',  fcNo3,  sid, targetYear);
      const no2  = seasonMean(chemAll,  'no2',  fcNo2,  sid, targetYear);
      const po4  = seasonMean(chemAll,  'po4',  fcPo4,  sid, targetYear);
      const chla = seasonMean(phytoAll, 'chla', fcChla, sid, targetYear);
      // T and O2 come purely from saved forecast green dots (Weiss formula stays forward-looking)
      const o2   = forecastMean(fcO2, sid, targetYear);
      const T    = forecastMean(fcT,  sid, targetYear);

      // DIN: µmol/L → µg/L N  (×14);  DIP: µmol/L → µg/L P  (×31)
      const din = (nh4 !== null && no3 !== null)
        ? (nh4 + no3 + (no2 ?? 0)) * 14
        : null;
      const dip = po4 !== null ? po4 * 31 : null;

      // |ΔO2%| via Weiss (1970), S = 36 PSU; fallback to seasonal constant
      const do2 = (o2 !== null && T !== null)
        ? calcDeltaO2Pct(o2, T, S_SALINITY)
        : DO2_FALLBACK[sid];

      const trix = calcTrix(din, dip, do2, chla);

      const o2sat  = (o2 !== null && T !== null) ? calcO2Sat(T, S_SALINITY) : null;
      const do_pct = (o2 !== null && o2sat !== null) ? (o2 / o2sat) * 100 : null;

      const seasonResult: TrixPredResult = {
        trix,
        ...classify(trix),
        din, dip, chla, do2,
        trend: null, dinTrend: null, dipTrend: null, chlaTrend: null,
        r2: null, dataYears: 1,
        nh4, no3, no2, po4,
        o2_mg: o2, T_celsius: T, o2sat, do_pct,
      };

      const emptyResult = (s: TrixSeason): TrixPredResult => ({
        trix: null, eutrophication: null, waterQuality: null,
        din: null, dip: null, chla: null, do2: DO2_FALLBACK[s],
        trend: null, dinTrend: null, dipTrend: null, chlaTrend: null,
        r2: null, dataYears: 0,
        nh4: null, no3: null, no2: null, po4: null,
        o2_mg: null, T_celsius: null, o2sat: null, do_pct: null,
      });

      const seasons = Object.fromEntries(
        (Object.keys(SEASON_MONTHS) as TrixSeason[]).map(s => [
          s, s === sid ? seasonResult : emptyResult(s),
        ])
      ) as Record<TrixSeason, TrixPredResult>;

      const emptySeasons = (Object.keys(SEASON_MONTHS) as TrixSeason[]).reduce(
        (acc, s) => { acc[s] = emptyResult(s); return acc; },
        {} as Record<TrixSeason, TrixPredResult>
      );

      return [
        { id: 'bizerte', label: 'Lagoon of Bizerte',  seasons },
        { id: 'gabes',   label: 'Gulf of Gabes',       seasons: emptySeasons },
        { id: 'tunis',   label: 'Gulf of Tunis',        seasons: emptySeasons },
      ];
    }));
  }
}
