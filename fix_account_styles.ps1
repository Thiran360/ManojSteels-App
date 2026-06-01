$path = "C:\E-Com\Cart_App\src\screens\AdminDashboard.tsx"
$content = Get-Content -Raw $path

$content = $content -replace "styles\.input\b", "styles.adminInput"

$newStyles = @"
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    marginVertical: 15,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addCategoryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  addCategoryBtn: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addCategoryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
"@

$content = $content -replace "\}\);\s*export default AdminDashboard;", "$newStyles`r`nexport default AdminDashboard;"
Set-Content -Path $path -Value $content -NoNewline
