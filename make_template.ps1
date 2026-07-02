Add-Type -Assembly System.IO.Compression
Add-Type -Assembly System.IO.Compression.FileSystem

$enc    = [System.Text.Encoding]::UTF8
$out    = Join-Path (Get-Location) "farmer_import_template.xlsx"
if (Test-Path $out) { Remove-Item $out -Force }

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString())
$null = New-Item -ItemType Directory "$tmp"
$null = New-Item -ItemType Directory "$tmp\_rels"
$null = New-Item -ItemType Directory "$tmp\xl"
$null = New-Item -ItemType Directory "$tmp\xl\_rels"
$null = New-Item -ItemType Directory "$tmp\xl\worksheets"

[System.IO.File]::WriteAllText("$tmp\[Content_Types].xml", @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>
"@, $enc)

[System.IO.File]::WriteAllText("$tmp\_rels\.rels", @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
"@, $enc)

[System.IO.File]::WriteAllText("$tmp\xl\workbook.xml", @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Farmers" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>
"@, $enc)

[System.IO.File]::WriteAllText("$tmp\xl\_rels\workbook.xml.rels", @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"     Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"        Target="styles.xml"/>
</Relationships>
"@, $enc)

[System.IO.File]::WriteAllText("$tmp\xl\sharedStrings.xml", @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="26" uniqueCount="26">
  <si><t>Farmer ID</t></si>
  <si><t>Farmer Name</t></si>
  <si><t>Contact Number</t></si>
  <si><t>Location</t></si>
  <si><t>Initial Dues</t></si>
  <si><t>Commission Percentage</t></si>
  <si><t>F001</t></si>
  <si><t>Ramu Kumar</t></si>
  <si><t>9876543210</t></si>
  <si><t>Chennai</t></si>
  <si><t>F002</t></si>
  <si><t>Selvi Devi</t></si>
  <si><t>9123456789</t></si>
  <si><t>Coimbatore</t></si>
  <si><t>F003</t></si>
  <si><t>Murugan</t></si>
  <si><t>8765432109</t></si>
  <si><t>Madurai</t></si>
  <si><t>F004</t></si>
  <si><t>Lakshmi Bai</t></si>
  <si><t>7654321098</t></si>
  <si><t>Salem</t></si>
  <si><t>F005</t></si>
  <si><t>Kannan</t></si>
  <si><t>6543210987</t></si>
  <si><t>Tirunelveli</t></si>
</sst>
"@, $enc)

[System.IO.File]::WriteAllText("$tmp\xl\styles.xml", @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>
"@, $enc)

[System.IO.File]::WriteAllText("$tmp\xl\worksheets\sheet1.xml", @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="s" s="1"><v>0</v></c>
      <c r="B1" t="s" s="1"><v>1</v></c>
      <c r="C1" t="s" s="1"><v>2</v></c>
      <c r="D1" t="s" s="1"><v>3</v></c>
      <c r="E1" t="s" s="1"><v>4</v></c>
      <c r="F1" t="s" s="1"><v>5</v></c>
    </row>
    <row r="2">
      <c r="A2" t="s"><v>6</v></c>
      <c r="B2" t="s"><v>7</v></c>
      <c r="C2" t="s"><v>8</v></c>
      <c r="D2" t="s"><v>9</v></c>
      <c r="E2"><v>500</v></c>
      <c r="F2"><v>5</v></c>
    </row>
    <row r="3">
      <c r="A3" t="s"><v>10</v></c>
      <c r="B3" t="s"><v>11</v></c>
      <c r="C3" t="s"><v>12</v></c>
      <c r="D3" t="s"><v>13</v></c>
      <c r="E3"><v>0</v></c>
      <c r="F3"><v>3.5</v></c>
    </row>
    <row r="4">
      <c r="A4" t="s"><v>14</v></c>
      <c r="B4" t="s"><v>15</v></c>
      <c r="C4" t="s"><v>16</v></c>
      <c r="D4" t="s"><v>17</v></c>
      <c r="E4"><v>1200</v></c>
      <c r="F4"><v>4</v></c>
    </row>
    <row r="5">
      <c r="A5" t="s"><v>18</v></c>
      <c r="B5" t="s"><v>19</v></c>
      <c r="C5" t="s"><v>20</v></c>
      <c r="D5" t="s"><v>21</v></c>
      <c r="E5"><v>300</v></c>
      <c r="F5"><v>5</v></c>
    </row>
    <row r="6">
      <c r="A6" t="s"><v>22</v></c>
      <c r="B6" t="s"><v>23</v></c>
      <c r="C6" t="s"><v>24</v></c>
      <c r="D6" t="s"><v>25</v></c>
      <c r="E6"><v>0</v></c>
      <c r="F6"><v>2.5</v></c>
    </row>
  </sheetData>
</worksheet>
"@, $enc)

[System.IO.Compression.ZipFile]::CreateFromDirectory($tmp, $out)
Remove-Item -Recurse -Force $tmp

$size = (Get-Item $out).Length
Write-Host "SUCCESS: farmer_import_template.xlsx created ($size bytes)"
