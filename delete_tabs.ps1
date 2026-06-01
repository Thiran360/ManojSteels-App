$path = "c:\E-Com\Cart_App\src\screens\AdminDashboard.tsx"
$lines = Get-Content $path
$newLines = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($i -eq 826) {
        $newLines.Add("          {['Orders', 'Tokens', 'Inventory', 'Receipt Options', 'Attendance', 'Fuel'].map((t) => (")
    }
    elseif ($i -ge 1802 -and $i -le 2008) {
        # Skip Customers and Employees sections
    }
    elseif ($i -eq 2009) {
        $newLines.Add("        ) : activeTab === 'Attendance' ? (")
    }
    elseif ($i -ge 2049 -and $i -le 2133) {
        # Skip Settings section
    }
    else {
        $newLines.Add($lines[$i])
    }
}

Set-Content -Path $path -Value $newLines
Write-Host "Done"
