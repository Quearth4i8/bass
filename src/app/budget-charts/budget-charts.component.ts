import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ProjectService } from '../services/ProjectService';
import { SidebarService } from '../services/sidebarservice';
import { AuthService } from '../services/AuthService';

@Component({
  selector: 'app-budget-charts',
  standalone: true,
  imports: [CommonModule, RouterModule, ChartModule],
  templateUrl: './budget-charts.component.html',
  styleUrls: ['./budget-charts.component.scss']
})
export class BudgetChartsComponent implements OnInit {
  
  projects: any[] = [];
  budgetData: any[] = [];
  incomeGrowthData: any[] = [];
  budgetCategories: Array<{ name: string; budget: number; color: string; isActive: boolean }> = [];

  doughnutData: any;
  doughnutOptions: any;
  barData: any;
  barOptions: any;
  barCategories: Array<{ name: string; budget: number; color: string; isActive: boolean }> = [];
  lineData: any;
  lineOptions: any;
  trendData: any;
  trendOptions: any;
  barChartOptions: any;
  totalBudget = 0;
  isSidebarVisible = true;
  isLoading = false;

  isUserMenuOpen = false;

  constructor(
    private projectService: ProjectService,
    private sidebarService: SidebarService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchProjects();
    this.sidebarService.sidebarVisibility$.subscribe((isVisible) => {
      this.isSidebarVisible = isVisible;
    });
  }

  fetchProjects(): void {
    this.isLoading = true;
    this.projectService.getAllProjects().subscribe(
      (data: any[]) => {
        this.projects = data.sort((a, b) => a.id - b.id);
        this.processBudgetData();
        this.buildCharts();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching projects:', error);
        this.isLoading = false;
      }
    );
  }

  processBudgetData(): void {
    // Group projects by acronym and calculate budgets
    const budgetMap = new Map<string, number>();
    const activeMap = new Map<string, boolean>();
    const colors = ['#10b981', '#1a5f7a', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];
    let colorIndex = 0;

    this.projects.forEach(project => {
      if (project.budget && project.budget > 0) {
        const category = project.acronyme || 'NA';
        const currentBudget = budgetMap.get(category) || 0;
        budgetMap.set(category, currentBudget + (project.budget || 0));

        const isActive = (project.title || '').toString().trim().toUpperCase() === 'ONGOING PROJECTS';
        if (isActive) {
          activeMap.set(category, true);
        } else if (!activeMap.has(category)) {
          activeMap.set(category, false);
        }
      }
    });

    // Convert map to array with colors
    this.budgetData = Array.from(budgetMap.entries()).map(([name, budget]) => ({
      name,
      budget,
      color: colors[colorIndex++ % colors.length],
      isActive: activeMap.get(name) ?? false
    }));

    this.budgetCategories = this.budgetData;

    this.processIncomeGrowthData();
    this.calculateTotalBudget();
  }

  private getTopCategories(
    data: Array<{ name: string; budget: number; color: string; isActive: boolean }>,
    maxItems: number
  ): Array<{ name: string; budget: number; color: string; isActive: boolean }> {
    return [...data].sort((a, b) => b.budget - a.budget);
  }

  processIncomeGrowthData(): void {
    // Group projects by year and calculate total budget per year
    const yearMap = new Map<number, number>();
    
    this.projects.forEach(project => {
      if (project.budget && project.budget > 0 && project.startyear) {
        const year = parseInt(project.startyear.toString());
        const currentBudget = yearMap.get(year) || 0;
        yearMap.set(year, currentBudget + project.budget);
      }
    });

    // Convert to array and sort by year
    this.incomeGrowthData = Array.from(yearMap.entries())
      .map(([year, budget]) => ({ year, budget }))
      .sort((a, b) => a.year - b.year);

    // Fill in missing years with zero budget for continuous line
    if (this.incomeGrowthData.length > 0) {
      const startYear = this.incomeGrowthData[0].year;
      const endYear = this.incomeGrowthData[this.incomeGrowthData.length - 1].year;
      const completeData = [];
      
      for (let year = startYear; year <= endYear; year++) {
        const found = this.incomeGrowthData.find(item => item.year === year);
        completeData.push({
          year,
          budget: found ? found.budget : 0
        });
      }
      
      this.incomeGrowthData = completeData;
    }
  }

  calculateTotalBudget(): void {
    this.totalBudget = this.budgetData.reduce((sum, item) => sum + item.budget, 0);
  }

  private buildCharts(): void {
    const labels = this.budgetCategories.map((c) => c.name);
    const values = this.budgetCategories.map((c) => c.budget);
    const colors = this.budgetCategories.map((c) => c.color);

    this.doughnutData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 8
        }
      ]
    };

    this.doughnutOptions = {
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const v = ctx.raw ?? 0;
              const pct = this.totalBudget ? (v / this.totalBudget) * 100 : 0;
              return `${ctx.label}: ${this.formatCurrency(v)} (${pct.toFixed(1)}%)`;
            }
          }
        }
      },
      maintainAspectRatio: false
    };

    const sortedCategories = [...this.budgetCategories].sort((a, b) => b.budget - a.budget);
    this.barCategories = sortedCategories.slice(0, 5);

    const barLabels = this.barCategories.map((c) => c.name);
    const barValues = this.barCategories.map((c) => c.budget);
    const barColors = this.barCategories.map((c) => c.color);

    this.barData = {
      labels: barLabels,
      datasets: [
        {
          label: 'Budget',
          data: barValues,
          backgroundColor: barColors,
          borderRadius: 10,
          barThickness: 16
        }
      ]
    };

    this.barOptions = {
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => this.formatCurrency(ctx.raw ?? 0)
          }
        }
      },
      scales: {
        x: {
          ticks: {
            callback: (value: any) => {
              const v = Number(value);
              if (!Number.isFinite(v)) return value;
              return this.formatCurrency(v);
            }
          },
          grid: { color: 'rgba(148, 163, 184, 0.25)' }
        },
        y: {
          grid: { display: false }
        }
      },
      maintainAspectRatio: false
    };

    const years = this.incomeGrowthData.map((p) => p.year);
    const yearBudgets = this.incomeGrowthData.map((p) => p.budget);

    this.lineData = {
      labels: years,
      datasets: [
        {
          label: 'Income',
          data: yearBudgets,
          tension: 0.45,
          fill: true,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.18)',
          pointRadius: 2,
          pointHoverRadius: 6,
          pointBackgroundColor: '#8b5cf6',
          borderWidth: 3
        }
      ]
    };

    this.lineOptions = {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => this.formatCurrency(ctx.raw ?? 0)
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          ticks: {
            callback: (value: any) => {
              const v = Number(value);
              if (!Number.isFinite(v)) return value;
              return this.formatCurrency(v);
            }
          },
          grid: { color: 'rgba(148, 163, 184, 0.25)' }
        }
      },
      maintainAspectRatio: false
    };

    this.trendData = {
      labels: years,
      datasets: [
        {
          label: 'Budget',
          data: yearBudgets,
          backgroundColor: '#1a5f7a',
          borderRadius: 6,
          barThickness: 20
        }
      ]
    };

    this.trendOptions = {
      ...this.lineOptions,
      plugins: {
        ...this.lineOptions?.plugins,
        tooltip: {
          callbacks: {
            label: (ctx: any) => this.formatCurrency(ctx.raw ?? 0)
          }
        }
      }
    };

    this.barChartOptions = {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => this.formatCurrency(ctx.raw ?? 0)
          }
        }
      },
      scales: {
        x: { 
          grid: { display: false },
          ticks: { font: { size: 10 } }
        },
        y: {
          ticks: {
            callback: (value: any) => {
              const v = Number(value);
              if (!Number.isFinite(v)) return value;
              return this.formatCurrency(v);
            },
            font: { size: 10 }
          },
          grid: { color: 'rgba(148, 163, 184, 0.25)' }
        }
      },
      maintainAspectRatio: false,
      borderRadius: 6,
      barThickness: 20
    };
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  logoutModalVisible = false;

  showLogoutModal(event: Event): void {
    console.log('showLogoutModal called');
    event.preventDefault();
    event.stopPropagation();
    this.logoutModalVisible = true;
    this.isUserMenuOpen = false;
    console.log('logoutModalVisible set to:', this.logoutModalVisible);
  }

  closeLogoutModal(): void {
    console.log('closeLogoutModal called');
    this.logoutModalVisible = false;
  }

  confirmLogout(): void {
    console.log('confirmLogout called - logging out...');
    this.logoutModalVisible = false;
    this.authService.logout();
    console.log('Navigating to /projects');
    this.router.navigate(['/projects'], { replaceUrl: true });
  }

  getBudgetPercentage(budget: number): number {
    return (budget / this.totalBudget) * 100;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getDashOffset(index: number): number {
    if (index === 0) return 0;
    
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += this.getBudgetPercentage(this.budgetData[i].budget);
    }
    return -offset;
  }

  refreshData(): void {
    this.fetchProjects();
  }

  exportCharts(): void {
    // Export charts logic
    console.log('Exporting charts...');
  }

  toggleChartType(): void {
    // Toggle chart type logic
    console.log('Toggling chart type...');
  }

  sortData(field: string): void {
    // Sort data logic
    console.log('Sorting by:', field);
  }

  // Line chart helper methods
  getMaxBudget(): number {
    return Math.max(...this.incomeGrowthData.map(item => item.budget));
  }

  getMinBudget(): number {
    return Math.min(...this.incomeGrowthData.map(item => item.budget));
  }

  getLineChartPoints(): string {
    if (this.incomeGrowthData.length === 0) return '';
    
    const width = 400;
    const height = 200;
    const padding = 40;
    const maxBudget = this.getMaxBudget();
    const minBudget = this.getMinBudget();
    const budgetRange = maxBudget - minBudget || 1;
    
    return this.incomeGrowthData.map((item, index) => {
      const x = padding + (index / (this.incomeGrowthData.length - 1 || 1)) * (width - 2 * padding);
      const y = padding + ((maxBudget - item.budget) / budgetRange) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
  }

  getLineChartArea(): string {
    if (this.incomeGrowthData.length === 0) return '';
    
    const width = 400;
    const height = 200;
    const padding = 40;
    const maxBudget = this.getMaxBudget();
    const minBudget = this.getMinBudget();
    const budgetRange = maxBudget - minBudget || 1;
    
    const points = this.incomeGrowthData.map((item, index) => {
      const x = padding + (index / (this.incomeGrowthData.length - 1 || 1)) * (width - 2 * padding);
      const y = padding + ((maxBudget - item.budget) / budgetRange) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    // Create area by adding bottom corners
    const firstX = padding;
    const lastX = padding + (width - 2 * padding);
    const bottomY = height - padding;
    
    return `${points.join(' ')} ${lastX},${bottomY} ${firstX},${bottomY}`;
  }

  getTotalProjects(): number {
    return this.projects.length;
  }

  getActiveProjects(): number {
    return this.projects.filter(p => p.budget && p.budget > 0).length;
  }

  getAverageProjectBudget(): number {
    const budgetedProjects = this.projects.filter(p => p.budget && p.budget > 0);
    if (budgetedProjects.length === 0) return 0;
    return budgetedProjects.reduce((sum, p) => sum + p.budget, 0) / budgetedProjects.length;
  }
}
