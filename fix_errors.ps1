function Replace-FileContent {
    param(
        [string]$Path,
        [string]$Search,
        [string]$Replace
    )
    $content = Get-Content -Raw $Path
    if ($content -match [regex]::Escape($Search)) {
        $content = $content -replace [regex]::Escape($Search), $Replace
        Set-Content -Path $Path -Value $content -NoNewline
        Write-Host "Replaced in $Path"
    } else {
        Write-Host "Search string not found in $Path"
    }
}

# 1. AdminDashboard.tsx - editingOrderId
Replace-FileContent -Path "c:\E-Com\Cart_App\src\screens\AdminDashboard.tsx" -Search "await cartService.apiFixPrice(editingOrderId, fixedItems);" -Replace "await cartService.apiFixPrice(editingOrderId as string, fixedItems);"

# 2. AdminDashboard.tsx - Social.WHATSAPP
Replace-FileContent -Path "c:\E-Com\Cart_App\src\screens\AdminDashboard.tsx" -Search "social: Share.Social.WHATSAPP," -Replace "social: Share.Social.WHATSAPP as any,"

# 3. CartScreen.tsx - duplicate overflow
$content = Get-Content -Raw "c:\E-Com\Cart_App\src\screens\CartScreen.tsx"
$content = $content -replace "borderRadius: 50, overflow: 'hidden',\r?\n\s*marginBottom: 12,\r?\n\s*overflow: 'hidden',", "borderRadius: 50, overflow: 'hidden',`r`n    marginBottom: 12,"
Set-Content -Path "c:\E-Com\Cart_App\src\screens\CartScreen.tsx" -Value $content -NoNewline

# 4. LoginScreen.tsx - absoluteFillObject -> absoluteFill
$content = Get-Content -Raw "c:\E-Com\Cart_App\src\screens\LoginScreen.tsx"
$content = $content -replace "StyleSheet.absoluteFillObject", "StyleSheet.absoluteFill"
Set-Content -Path "c:\E-Com\Cart_App\src\screens\LoginScreen.tsx" -Value $content -NoNewline

# 5. TokensScreen.tsx - import Platform
$content = Get-Content -Raw "c:\E-Com\Cart_App\src\screens\TokensScreen.tsx"
if (-not ($content -match "import \{.*Platform.*\} from 'react-native'")) {
    $content = $content -replace "import \{", "import { Platform,"
    Set-Content -Path "c:\E-Com\Cart_App\src\screens\TokensScreen.tsx" -Value $content -NoNewline
}

# 6. AdminFuelReport.tsx - getMonthlyBill as any
Replace-FileContent -Path "c:\E-Com\Cart_App\src\components\AdminFuelReport.tsx" -Search "fuelService.getMonthlyBill().then(sum => setSummaries(sum));" -Replace "fuelService.getMonthlyBill().then(sum => setSummaries(sum as any));"

# 7. AdminDashboard.tsx - inject missing styles
$stylesToInject = @"
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
"@
$content = Get-Content -Raw "c:\E-Com\Cart_App\src\screens\AdminDashboard.tsx"
# Match the very last }); and replace it with the new styles + });
$content = $content -replace "\}\);\s*$", $stylesToInject
Set-Content -Path "c:\E-Com\Cart_App\src\screens\AdminDashboard.tsx" -Value $content -NoNewline

Write-Host "All fixes applied!"
