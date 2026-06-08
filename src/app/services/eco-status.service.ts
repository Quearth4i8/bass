import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

const BASE = 'http://41.229.139.17:8080/imasservice/api/imas';

export interface EcoLatestValues {
  nh4:  number | null;
  no3:  number | null;
  no2:  number | null;
  po4:  number | null;
  si:   number | null;
  toc:  number | null;
  do:   number | null;
  temp: number | null;
  turb: number | null;
  chl:  number | null;
}

@Injectable({ providedIn: 'root' })
export class EcoStatusService {

  constructor(private http: HttpClient) {}

  private latestOf(records: any[], field: string): number | null {
    const hits = records
      .filter(r => r[field] != null && r[field] !== '' && !isNaN(+r[field]))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!hits.length) return null;
    return +parseFloat(hits[0][field]).toFixed(3);
  }

  private fetch(path: string): Observable<any[]> {
    return this.http
      .get<any>(`${BASE}/${path}`, { params: { page: '0', size: '200' } })
      .pipe(
        map(r => r?.values ?? []),
        catchError(() => of([]))
      );
  }

  getLatestValues(): Observable<EcoLatestValues> {
    return forkJoin({
      chem:  this.fetch('wat_chemical'),
      phys:  this.fetch('wat_physico_chemical'),
      phyto: this.fetch('wat_phytoplankton'),
    }).pipe(
      map(({ chem, phys, phyto }) => ({
        nh4:  this.latestOf(chem,  'nh4'),
        no3:  this.latestOf(chem,  'no3'),
        no2:  this.latestOf(chem,  'no2'),
        po4:  this.latestOf(chem,  'po4'),
        si:   this.latestOf(chem,  'si'),
        toc:  this.latestOf(chem,  'toc'),
        do:   this.latestOf(phys,  'o2'),
        temp: this.latestOf(phys,  't'),
        turb: this.latestOf(phys,  'tr'),
        chl:  this.latestOf(phyto, 'chla'),
      }))
    );
  }
}
