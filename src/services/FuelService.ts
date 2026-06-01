import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FuelRecord {
  id: string;
  truckNo: string;
  employeeName: string;
  fuelPrice: number;
  amount: number;
  liters: number;
  date: string;
  timestamp: number;
}

const FUEL_STORAGE_KEY = '@manojsteels_fuel_records';
const FUEL_PAID_KEY = '@manojsteels_fuel_paid_amount';
const FUEL_PAYMENTS_KEY = '@manojsteels_fuel_payments';

class FuelService {
  private records: FuelRecord[] = [];
  private totalPaidAmount: number = 0;
  private payments: Array<{ month: string; amount: number }> = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadData();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private async loadData() {
    try {
      const data = await AsyncStorage.getItem(FUEL_STORAGE_KEY);
      if (data) {
        this.records = JSON.parse(data);
      }
      
      const paidData = await AsyncStorage.getItem(FUEL_PAID_KEY);
      if (paidData) {
        this.totalPaidAmount = parseFloat(paidData);
      }
      const paymentsData = await AsyncStorage.getItem(FUEL_PAYMENTS_KEY);
      if (paymentsData) {
        this.payments = JSON.parse(paymentsData);
      }
      this.notify();
    } catch (e) {
      console.error('Failed to load fuel records', e);
    }
  }

  private async saveData() {
    try {
      await AsyncStorage.setItem(FUEL_STORAGE_KEY, JSON.stringify(this.records));
      this.notify();
    } catch (e) {
      console.error('Failed to save fuel records', e);
    }
  }

  // Clear all fuel data (records, payments, totals)
  async clearAllData(): Promise<void> {
    this.records = [];
    this.totalPaidAmount = 0;
    this.payments = [];
    try {
      await Promise.all([
        AsyncStorage.removeItem(FUEL_STORAGE_KEY),
        AsyncStorage.removeItem(FUEL_PAID_KEY),
        AsyncStorage.removeItem(FUEL_PAYMENTS_KEY),
      ]);
      this.notify();
    } catch (e) {
      console.error('Failed to clear fuel data', e);
    }
  }

  async getFuelRecords(): Promise<FuelRecord[]> {
    try {
      const response = await fetch('https://api.codingboss.in/inventory/fuel/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const apiRecords: FuelRecord[] = data.map((item: any) => ({
          id: item.id ? item.id.toString() : Math.random().toString(36).substr(2, 9),
          truckNo: item.truckNo || item.truck_no || '',
          employeeName: item.employeeName || item.employee_name || '',
          fuelPrice: parseFloat(item.fuelPrice || item.fuel_price || 0),
          amount: parseFloat(item.amount || 0),
          liters: parseFloat(item.liters || 0),
          date: item.date || '',
          timestamp: new Date(item.created_at || item.date || Date.now()).getTime()
        }));
        
        // Replace local records with API records
        this.records = apiRecords;
        await this.saveData();
      }
    } catch (e) {
      console.warn('Failed to fetch fuel records from API', e);
      if (this.records.length === 0) {
        await this.loadData();
      }
    }

    if (this.records.length === 0) {
      await this.loadData();
    }
    return [...this.records].sort((a, b) => b.timestamp - a.timestamp);
  }

  getLocalFuelRecords(): FuelRecord[] {
    return [...this.records].sort((a, b) => b.timestamp - a.timestamp);
  }


  async addFuelRecord(record: Omit<FuelRecord, 'id' | 'timestamp'>): Promise<FuelRecord> {
    try {
      let formattedDate = record.date;
      if (formattedDate.includes('-') && formattedDate.split('-')[0].length === 2) {
        const [d, m, y] = formattedDate.split('-');
        formattedDate = `${y}-${m}-${d}`;
      }

      const payload = {
        truckNo: record.truckNo,
        employeeName: record.employeeName,
        fuelPrice: record.fuelPrice,
        amount: record.amount,
        liters: record.liters,
        date: formattedDate
      };

      const response = await fetch('https://api.codingboss.in/inventory/fuel/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errText = await response.text();
        console.warn('Backend fuel record save error:', errText);
      }
    } catch (e) {
      console.warn('Backend fuel record save error:', e);
    }

    const newRecord: FuelRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    this.records.push(newRecord);
    await this.saveData();
    return newRecord;
  }

  async getMonthlyBill(): Promise<Array<{ month: string; total: number }>> {
    // Ensure records are loaded
    if (this.records.length === 0) {
      await this.loadData();
    }
    const monthlyMap: Record<string, number> = {};
    this.records.forEach(r => {
      let month = '';
      if (!r.date) return;
      if (r.date.includes('-')) {
        const parts = r.date.split('-');
        if (parts[0].length === 4) {
          month = `${parts[0]}-${parts[1]}`; // YYYY-MM
        } else if (parts[2] && parts[2].length === 4) {
          month = `${parts[2]}-${parts[1]}`; // DD-MM-YYYY -> YYYY-MM
        } else {
          month = r.date.slice(0, 7);
        }
      } else if (r.date.includes('/')) {
        const parts = r.date.split('/');
        if (parts[0].length === 4) {
          month = `${parts[0]}-${parts[1]}`;
        } else if (parts[2] && parts[2].length === 4) {
          month = `${parts[2]}-${parts[0]}`; // MM/DD/YYYY -> YYYY-MM
        }
      } else {
        month = r.date.slice(0, 7);
      }
      
      monthlyMap[month] = (monthlyMap[month] || 0) + r.amount;
    });
    const result = Object.entries(monthlyMap).map(([month, total]) => ({ month, total }));
    result.sort((a, b) => b.month.localeCompare(a.month));
    return result;
  }

  async getOverallStats(): Promise<{ totalLiters: number; totalCost: number }> {
    // Ensure records are loaded
    if (this.records.length === 0) {
      await this.loadData();
    }
    let totalLiters = 0;
    let totalCost = 0;
    this.records.forEach(r => {
      totalLiters += r.liters;
      totalCost += r.amount;
    });
    return { totalLiters, totalCost };
  }

  async deleteFuelRecord(id: string): Promise<void> {
    this.records = this.records.filter(r => r.id !== id);
    await this.saveData();
  }

  getFuelPaidAmount(): number {
    return this.totalPaidAmount;
  }

  /**
   * Returns month‑wise summary including total, paid and balance.
   */
  async getMonthlySummary(): Promise<Array<{ month: string; total: number; paid: number; balance: number }>> {
    const bills = await this.getMonthlyBill();
    const paymentsMap: Record<string, number> = {};
    this.payments.forEach(p => {
      paymentsMap[p.month] = (paymentsMap[p.month] || 0) + p.amount;
    });
    return bills.map(b => ({
      month: b.month,
      total: b.total,
      paid: paymentsMap[b.month] || 0,
      balance: b.total - (paymentsMap[b.month] || 0),
    }));
  }

  // Add payment for a specific month
  async addFuelPayment(month: string, amount: number): Promise<void> {
    this.totalPaidAmount += amount;
    const existing = this.payments.find(p => p.month === month);
    if (existing) {
      existing.amount += amount;
    } else {
      this.payments.push({ month, amount });
    }
    await Promise.all([
      AsyncStorage.setItem(FUEL_PAID_KEY, this.totalPaidAmount.toString()),
      AsyncStorage.setItem(FUEL_PAYMENTS_KEY, JSON.stringify(this.payments)),
    ]);
    this.notify();
  }
}

export const fuelService = new FuelService();
