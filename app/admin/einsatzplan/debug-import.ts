// Debug version of processRohExcel with extensive logging
export const debugProcessRohExcel = (file: File, XLSX: any, getRegionFromPLZ: (plz: string) => string) => {
  console.log('🔵 DEBUG START - processRohExcel');
  console.log('🔵 File:', { name: file.name, size: file.size, type: file.type });
  
  const reader = new FileReader();
  
  reader.onerror = (error) => {
    console.error('🔴 FileReader ERROR:', error);
  };
  
  reader.onload = async (e) => {
    console.log('🔵 FileReader onload triggered');
    
    try {
      // Step 1: Read file
      const arrayBuffer = e.target?.result;
      if (!arrayBuffer) {
        throw new Error('No data from FileReader');
      }
      
      const data = new Uint8Array(arrayBuffer as ArrayBuffer);
      console.log('🔵 ArrayBuffer size:', data.length, 'bytes');
      
      // Step 2: Parse with XLSX
      const workbook = XLSX.read(data, { type: 'array' });
      console.log('🔵 Workbook parsed. Sheet names:', workbook.SheetNames);
      
      const sheetName = workbook.SheetNames[0];
      console.log('🔵 Using sheet:', sheetName);
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log('🔵 Sheet converted to JSON. Rows:', jsonData.length);
      console.log('🔵 First 3 rows:', JSON.stringify(jsonData.slice(0, 3), null, 2));
      
      // Step 3: Process header
      const header = jsonData[0] || [];
      console.log('🔵 Header length:', header.length);
      console.log('🔵 Header content:', header);
      
      if (header.length < 5) {
        throw new Error(`Header zu kurz: ${header.length} Spalten (mindestens 5 erwartet)`);
      }
      
      // Log date columns
      console.log('🔵 Date columns (from E/index 4):');
      for (let i = 4; i < header.length; i++) {
        console.log(`  Column ${i}: "${header[i]}"`);
      }
      
      const rows: any[] = [];
      
      // Step 4: Process data rows
      for (let r = 1; r < jsonData.length; r++) {
        const row = jsonData[r] || [];
        console.log(`\n🔵 === Processing Row ${r} ===`);
        console.log('🔵 Row data:', row);
        
        const location_text = String(row[0] || '').trim();
        const postal_code = String(row[1] || '').trim();
        
        console.log(`🔵 Location: "${location_text}"`);
        console.log(`🔵 PLZ: "${postal_code}"`);
        
        if (!location_text || !postal_code) {
          console.log('🔵 ❌ Skipping - missing location or PLZ');
          continue;
        }
        
        const region = getRegionFromPLZ(postal_code);
        console.log(`🔵 Region (from PLZ): "${region}"`);
        
        let rowAssignmentCount = 0;
        
        // Check each date column
        for (let c = 4; c < header.length && c < row.length; c++) {
          const label = String(header[c] || '').trim();
          const cell = row[c];
          
          console.log(`\n  🔵 Column ${c}:`);
          console.log(`    Label: "${label}"`);
          console.log(`    Cell value: "${cell}" (type: ${typeof cell})`);
          
          if (!label) {
            console.log('    ❌ No label, skipping');
            continue;
          }
          
          // Parse value
          const val = typeof cell === 'number' ? cell : parseFloat(String(cell).replace(',', '.'));
          console.log(`    Parsed value: ${val}`);
          
          if (![1, 2, 0.75].includes(val)) {
            console.log(`    ❌ Value ${val} not in [1, 2, 0.75], skipping`);
            continue;
          }
          
          // Parse date
          const parts = label.split('.');
          console.log(`    Date parts: [${parts.join(', ')}]`);
          
          if (parts.length < 2) {
            console.log('    ❌ Not enough date parts');
            continue;
          }
          
          const day = parseInt(parts[0], 10);
          const monthName = parts[1];
          console.log(`    Day: ${day}, Month name: "${monthName}"`);
          
          const months: Record<string, number> = { 
            Jan:0, Feb:1, Mär:2, Mrz:2, Apr:3, Mai:4, Jun:5, Jul:6, Aug:7, Sep:8, Okt:9, Nov:10, Dez:11 
          };
          
          const month = months[monthName];
          console.log(`    Month number: ${month}`);
          
          if (month == null || isNaN(day)) {
            console.log(`    ❌ Invalid date - month: ${month}, day: ${day}`);
            continue;
          }
          
          // Create assignment
          const year = new Date().getFullYear();
          const start = new Date(Date.UTC(year, month, day, 9, 30));
          const end = new Date(start);
          
          if (val === 1 || val === 2) {
            end.setUTCHours(18, 30, 0, 0);
          } else if (val === 0.75) {
            end.setUTCHours(15, 30, 0, 0);
          }
          
          const assignment = {
            title: 'Promotion',
            location_text,
            postal_code,
            city: '',
            region,
            start_ts: start.toISOString(),
            end_ts: end.toISOString(),
            type: 'promotion' as const,
          };
          
          console.log('    ✅ Creating assignment:', assignment);
          rows.push(assignment);
          rowAssignmentCount++;
          
          if (val === 2) {
            console.log('    ✅ Value is 2, adding duplicate');
            rows.push({...assignment});
            rowAssignmentCount++;
          }
        }
        
        console.log(`🔵 Row ${r} total assignments: ${rowAssignmentCount}`);
      }
      
      console.log('\n🔵 ========== IMPORT SUMMARY ==========');
      console.log(`🔵 Total assignments created: ${rows.length}`);
      console.log('🔵 Sample assignments:', rows.slice(0, 3));
      
      return { success: true, rows, message: `${rows.length} assignments ready to import` };
      
    } catch (error: any) {
      console.error('🔴 ERROR in processRohExcel:', error);
      return { success: false, rows: [], message: error.message || 'Unknown error' };
    }
  };
  
  console.log('🔵 Starting file read...');
  reader.readAsArrayBuffer(file);
};
