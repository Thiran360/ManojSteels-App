$path = "C:\E-Com\Cart_App\src\screens\AdminDashboard.tsx"
$content = Get-Content -Raw $path

$newStyles = @"
  tabsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tabContent: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  customerCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerPhone: {
    color: '#666',
    marginTop: 4,
  },
});
"@

$content = $content -replace "\}\);\s*export default AdminDashboard;", "$newStyles`r`nexport default AdminDashboard;"
Set-Content -Path $path -Value $content -NoNewline
