$path = "c:\E-Com\Cart_App\src\screens\AdminDashboard.tsx"
$content = Get-Content $path -Raw

# 1. Imports
$content = $content -replace "(import \{ authService \} from '\.\./services/AuthService';)", "`$1`nimport { attendanceService } from '../services/AttendanceService';`nimport { fuelService } from '../services/FuelService';"

# 2. State
$content = $content -replace "(const \[refreshing, setRefreshing\] = useState\(false\);)", "`$1`n  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);`n  const [fuelRecords, setFuelRecords] = useState<any[]>([]);"

# 3. Tabs
$content = $content -replace "\['Orders', 'Tokens', 'Inventory', 'Receipt Options', 'Settings'\]", "['Orders', 'Tokens', 'Inventory', 'Receipt Options', 'Attendance', 'Fuel', 'Settings']"

# 4. useEffect
$useEffect = @"
  useEffect(() => {
    if (activeTab === 'Attendance') {
      const today = new Date().toISOString().split('T')[0];
      attendanceService.getAttendanceForDate(today).then(setAttendanceRecords).catch(console.error);
    } else if (activeTab === 'Fuel') {
      fuelService.getFuelRecords().then(setFuelRecords).catch(console.error);
    }
  }, [activeTab]);

"@
$content = $content -replace "(?s)(  useEffect\(\(\) => \{\r?\n    const update = \(\) => \{)", "$useEffect`$1"

# 5. UI
$ui = @"
        ) : activeTab === 'Attendance' ? (
          <View style={styles.section}>
            <Text style={[Typography.h3, styles.sectionTitle]}>Attendance Report</Text>
            <View style={styles.brandManageCard}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Today's Records</Text>
                  <Text style={styles.statValue}>{attendanceRecords.length}</Text>
                </View>
              </View>
              <ScrollView style={{ maxHeight: 400 }}>
                {attendanceRecords.length > 0 ? attendanceRecords.map((r, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <Text style={{ fontWeight: 'bold' }}>{r.staffId}</Text>
                    <Text>{r.status}</Text>
                  </View>
                )) : <Text style={{ padding: 12 }}>No attendance records found.</Text>}
              </ScrollView>
            </View>
          </View>
        ) : activeTab === 'Fuel' ? (
          <View style={styles.section}>
            <Text style={[Typography.h3, styles.sectionTitle]}>Fuel Report</Text>
            <View style={styles.brandManageCard}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Fuel Records</Text>
                  <Text style={styles.statValue}>{fuelRecords.length}</Text>
                </View>
              </View>
              <ScrollView style={{ maxHeight: 400 }}>
                {fuelRecords.length > 0 ? fuelRecords.map((r, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <Text style={{ fontWeight: 'bold' }}>{r.employeeName || 'Unknown'}</Text>
                    <Text>₹{r.amount} (Price: ₹{r.fuelPrice})</Text>
                  </View>
                )) : <Text style={{ padding: 12 }}>No fuel records found.</Text>}
              </ScrollView>
            </View>
          </View>
"@
$content = $content -replace "(?s)(\) : activeTab === 'Settings' \? \()", "$ui`n        `$1"

Set-Content -Path $path -Value $content
Write-Host "Done"
