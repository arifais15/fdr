import * as XLSX from 'xlsx';

export const exportTableToExcel = (tableIds, filename = 'ExportData.xlsx') => {
  const ids = Array.isArray(tableIds) ? tableIds : [tableIds];
  const wb = XLSX.utils.book_new();

  let added = false;
  ids.forEach((id, index) => {
    const table = document.getElementById(id);
    if (table) {
      const ws = XLSX.utils.table_to_sheet(table);

      // ─── Auto-fit column widths ───────────────────────────────────────────────
      // Collect all cell values and find the max character length per column
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      const colWidths = [];

      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddr];
          if (!cell) continue;

          const text = cell.v != null ? String(cell.v) : '';
          // Add a small padding (2 chars) so content doesn't touch column edge
          const len = text.length + 2;
          if (!colWidths[C] || colWidths[C] < len) {
            colWidths[C] = len;
          }
        }
      }

      // Apply minimum (8) and maximum (60) width caps for readability
      ws['!cols'] = colWidths.map(w => ({ wch: Math.min(Math.max(w || 8, 8), 60) }));
      // ─────────────────────────────────────────────────────────────────────────

      XLSX.utils.book_append_sheet(wb, ws, `Sheet${index + 1}`);
      added = true;
    }
  });

  if (!added) {
    console.error('No valid tables found to export.');
    return;
  }

  // ─── Write to Blob and auto-open via hidden <a> click ────────────────────────
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Clean up — revoke URL after a short delay to allow the browser to open it
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 500);
  // ─────────────────────────────────────────────────────────────────────────────
};