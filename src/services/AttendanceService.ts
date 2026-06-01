import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StaffProfile {
  id: string;
  backendId?: string | number;
  name: string;
  phone: string;
  designation: string;
  totalDays: number;
  joiningDate?: string;
  status?: 'Active' | 'Inactive';
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Leave' | 'Morning' | 'Afternoon';

export interface AttendanceRecord {
  staffId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

class AttendanceService {
  private profiles: StaffProfile[] = [];
  private records: AttendanceRecord[] = [];

  constructor() {
    this.loadData();
  }

  async loadData() {
    try {
      const savedProfiles = await AsyncStorage.getItem('staff_profiles');
      if (savedProfiles) {
        this.profiles = JSON.parse(savedProfiles);
      }
      const savedRecords = await AsyncStorage.getItem('attendance_records');
      if (savedRecords) {
        this.records = JSON.parse(savedRecords);
      }
    } catch (e) {
      console.log('Failed to load attendance data', e);
    }
  }

  async saveData() {
    try {
      await AsyncStorage.setItem('staff_profiles', JSON.stringify(this.profiles));
      await AsyncStorage.setItem('attendance_records', JSON.stringify(this.records));
    } catch (e) {
      console.log('Failed to save attendance data', e);
    }
  }

  async getStaffProfiles(): Promise<StaffProfile[]> {
    await this.loadData();
    return this.profiles;
  }

    async addStaffProfile(profile: Omit<StaffProfile, 'id'> & { id?: string }): Promise<StaffProfile> {
    const newProfile: StaffProfile = {
      ...profile,
      id: profile.id || Math.random().toString(36).substr(2, 9),
      joiningDate: profile.joiningDate || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      status: profile.status || 'Active',
    };

    try {
      const response = await fetch('https://api.codingboss.in/inventory/attendance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          staff_name: newProfile.name,
          phone: newProfile.phone,
          designation: newProfile.designation,
          joining_date: newProfile.joiningDate,
          status: newProfile.status
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          newProfile.backendId = data.id.toString();
        }
      } else {
        console.warn('Failed to add staff profile to backend:', await response.text());
      }
    } catch (e) {
      console.warn('Error saving staff profile to backend:', e);
    }

    this.profiles.push(newProfile);
    await this.saveData();
    return newProfile;
  }
  
  async deleteStaffProfile(staffId: string): Promise<void> {
    const staff = this.profiles.find(p => p.id === staffId);
    if (staff) {
      try {
        if (staff.backendId) {
          const payload = { id: Number(staff.backendId) };
          const url = 'https://api.codingboss.in/inventory/attendance/delete/';

          const response = await fetch(url, {
            method: 'DELETE', // Try POST if DELETE still fails on your backend
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            const errText = await response.text();
            console.warn('Delete failed:', errText);
          }
        }
      } catch (e) {
        console.warn('Backend delete error:', e);
      }
    }

    this.profiles = this.profiles.filter(p => p.id !== staffId);
    await this.saveData();
  }
  
  async updateStaffTotalDays(staffId: string, totalDays: number): Promise<void> {
    const idx = this.profiles.findIndex(p => p.id === staffId);
    if (idx !== -1) {
      this.profiles[idx].totalDays = totalDays;
      await this.saveData();
    }
  }

  async getAttendanceForDate(date: string): Promise<AttendanceRecord[]> {
    await this.loadData();
    return this.records.filter(r => r.date === date);
  }

  async markAttendance(staffId: string, date: string, status: AttendanceStatus): Promise<void> {
    const existingIndex = this.records.findIndex(r => r.staffId === staffId && r.date === date);
    if (existingIndex >= 0) {
      this.records[existingIndex].status = status;
    } else {
      this.records.push({ staffId, date, status });
    }
    await this.saveData();
  }

  async getStaffAttendanceStats(staffId: string, monthPrefix?: string): Promise<{ present: number; absent: number; halfDay: number; leave: number; holiday: number }> {
    await this.loadData();
    // monthPrefix e.g. "2026-05"
    let relevantRecords = this.records.filter(r => r.staffId === staffId);
    if (monthPrefix) {
      relevantRecords = relevantRecords.filter(r => r.date.startsWith(monthPrefix));
    }

    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let leave = 0;

    relevantRecords.forEach(r => {
      if (r.status === 'Present' || r.status === 'Morning' || r.status === 'Afternoon') present++;
      else if (r.status === 'Absent') absent++;
      else if (r.status === 'Half Day') halfDay++;
      else if (r.status === 'Leave') leave++;
    });

    // Absent acts as leave count
    const totalLeave = leave + absent;
    const staff = this.profiles.find(p => p.id === staffId);
    const totalDays = staff?.totalDays || 30;
    const holiday = Math.max(0, totalDays - (present + absent + halfDay + leave));

    return { present, absent, halfDay, leave: totalLeave, holiday };
  }

  async getStaffRecords(staffId: string, monthPrefix?: string): Promise<AttendanceRecord[]> {
    await this.loadData();
    let relevantRecords = this.records.filter(r => r.staffId === staffId);
    if (monthPrefix) {
      relevantRecords = relevantRecords.filter(r => r.date.startsWith(monthPrefix));
    }
    // Sort by date descending
    return relevantRecords.sort((a, b) => (a.date < b.date ? 1 : -1));
  }
}

export const attendanceService = new AttendanceService();

