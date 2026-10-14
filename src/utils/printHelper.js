/**
 * Build a print-only HTML document from the visible .printable-area.
 * This avoids printing the whole app shell and removes the empty page
 * created by forcing a full-page scrollable document into the print window.
 */
export const triggerPrint = (orientation = 'portrait') => {
  const printable = document.querySelector('.printable-area');
  if (!printable) {
    window.print();
    return;
  }

  // Auto-detect wide tables: fy-fdr-register (22 cols) or any table with >= 8 columns
  const hasRegisterTable = !!printable.querySelector('#fy-fdr-register-table') || !!printable.querySelector('.fy-fdr-register-table');
  const hasWideTable = hasRegisterTable || 
    (printable.querySelector('table th') && printable.querySelectorAll('table thead tr:first-child > th, table tr:first-child > th').length >= 8);

  const isLandscape = orientation === 'landscape' || hasWideTable;
  const pageSize = isLandscape ? 'landscape' : 'portrait';
  const pageMargin = isLandscape ? '3mm 4mm 3mm 4mm' : '8mm 10mm 8mm 10mm';

  const printWindow = window.open('', '_blank', 'width=1020,height=800');

  if (!printWindow) {
    window.print();
    return;
  }

  const printableHtml = printable.outerHTML;
  const origin = window.location.origin || '';
  const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <base href="${origin}/">
        <title>Print Area</title>
        <style>
          @page {
            size: ${pageSize};
            margin: ${pageMargin};
          }

          @font-face {
            font-family: 'Nikosh';
            src: local('Nikosh'), local('NikoshBAN'), local('NikoshLight'), local('SolaimanLipi'), local('Noto Serif Bengali'), local('Kalpurush'), local('Vrinda');
          }

          /* Dual typography: Times New Roman for English/Latin, Nikosh for Bangla */
          @font-face {
            font-family: 'OfficialDocFont';
            src: local('Times New Roman'), local('TimesNewRoman'), local('Times'), serif;
          }

          @font-face {
            font-family: 'OfficialDocFont';
            src: local('Nikosh'), local('NikoshBAN'), local('NikoshLight'), local('SolaimanLipi'), local('Noto Serif Bengali'), local('Kalpurush');
            unicode-range: U+0980-09FF, U+200C-200D, U+25CC;
          }

          * {
            box-sizing: border-box;
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'OfficialDocFont', 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
            font-synthesis: none;
          }

          body {
            background: #ffffff !important;
            overflow: visible !important;
          }

          .printable-area {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            font-family: 'OfficialDocFont', 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif !important;
            font-size: 11px;
            line-height: 1.35;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
            transform: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            text-rendering: optimizeLegibility;
          }

          .printable-area,
          .printable-area * {
            font-family: 'OfficialDocFont', 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif !important;
          }

          .printable-area .english-text,
          .printable-area .english {
            font-family: 'Times New Roman', Times, serif !important;
          }

          .printable-area .bangla-text,
          .printable-area .bangla {
            font-family: 'Nikosh', 'NikoshBAN', 'SolaimanLipi', serif !important;
          }

          /* Ensure header horizontal divider line prints exactly */
          .header-horizontal-bar,
          .header-divider-bar,
          .header-divider-line {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            border-top: 2px solid #000000 !important;
            border-bottom: none !important;
            border-left: none !important;
            border-right: none !important;
            margin: 6px 0 10px 0 !important;
            height: 0 !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide browser scrollbars during print */
          ::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }

          /* Eradicate any horizontal scrollbars and ensure containers don't clip */
          .data-table-container,
          .printable-area .data-table-container,
          div[style*="overflow"],
          div[style*="overflow-x"],
          div[style*="overflow-y"] {
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Compact & Efficient Header */
          .printable-header {
            margin-bottom: 6px !important;
            width: 100% !important;
            background: transparent !important;
          }

          .printable-header h1 {
            font-size: 16px !important;
            font-weight: 900 !important;
            color: #000000 !important;
            margin: 0 !important;
            text-align: center !important;
            line-height: 1.2 !important;
          }

          .printable-header p {
            color: #000000 !important;
            text-align: center !important;
            margin: 1px 0 !important;
            font-size: 10.5px !important;
            line-height: 1.25 !important;
          }

          .printable-header img {
            height: 48px !important;
            width: 48px !important;
            object-fit: contain !important;
            background: transparent !important;
          }

          /* Efficient Full-Width Table Layout */
          .printable-area table,
          .printable-area .data-table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
            border: 1.2px solid #000000 !important;
            margin-top: 4px !important;
          }

          .printable-area th,
          .printable-area td {
            border: 1px solid #000000 !important;
            padding: 3px 4px !important;
            background: #ffffff;
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            font-weight: 600;
            font-size: 9px !important;
            line-height: 1.25 !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }

          .printable-area th {
            background-color: #f1f5f9 !important;
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            font-weight: 800 !important;
            border: 1px solid #000000 !important;
            text-transform: uppercase;
            letter-spacing: 0.01em;
            font-size: 8.5px !important;
            padding: 3px 2.5px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Fixed Deposit Register (Annexure A) 22-column Ledger Optimization */
          #fy-fdr-register-table,
          .fy-fdr-register-table,
          .printable-area #fy-fdr-register-table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
            border: 1.2px solid #000000 !important;
            margin: 0 !important;
          }

          #fy-fdr-register-table th,
          #fy-fdr-register-table td,
          .fy-fdr-register-table th,
          .fy-fdr-register-table td {
            min-width: 0 !important;
            width: auto !important;
            padding: 2px 2px !important;
            font-size: 7.5px !important;
            line-height: 1.15 !important;
            border: 1px solid #000000 !important;
            white-space: normal !important;
            word-break: normal !important;
            box-sizing: border-box !important;
          }

          #fy-fdr-register-table th,
          .fy-fdr-register-table th {
            font-size: 7px !important;
            padding: 2px 1.5px !important;
            font-weight: 800 !important;
            text-align: center !important;
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #fy-fdr-register-table th span,
          .fy-fdr-register-table th span {
            font-size: 6px !important;
            line-height: 1 !important;
          }

          #fy-fdr-register-table td strong,
          .fy-fdr-register-table td strong {
            font-size: 7.5px !important;
            font-weight: 800 !important;
          }

          .printable-area p,
          .printable-area div,
          .printable-area span,
          .printable-area td {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            text-shadow: none !important;
          }

          .printable-area strong,
          .printable-area b,
          .printable-area h1,
          .printable-area h2,
          .printable-area h3,
          .printable-area h4,
          .printable-area th {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            text-shadow: none !important;
            font-weight: 800 !important;
          }

          .printable-area img {
            max-width: 100%;
            height: auto;
            image-rendering: auto;
            background: transparent;
          }

          .bank-letter-page {
            page-break-after: auto;
            break-after: auto;
            page-break-inside: avoid;
            break-inside: avoid;
            box-sizing: border-box;
            font-size: 14.5px !important;
            line-height: 1.6 !important;
            color: #000000 !important;
            padding: 10px 14px !important;
          }

          .bank-letter-page .printable-header {
            margin-bottom: 12px !important;
            width: 100% !important;
          }

          .bank-letter-page .printable-header h1 {
            font-size: 20px !important;
            font-weight: 900 !important;
            color: #000000 !important;
            margin: 0 !important;
            text-align: center !important;
            line-height: 1.2 !important;
            letter-spacing: 0.03em !important;
          }

          .bank-letter-page .printable-header p {
            color: #000000 !important;
            text-align: center !important;
            margin: 2px 0 0 0 !important;
            font-size: 13.5px !important;
            line-height: 1.35 !important;
          }

          .bank-letter-page .printable-header img {
            height: 65px !important;
            width: 65px !important;
            object-fit: contain !important;
            background: transparent !important;
          }

          .bank-letter-page .header-horizontal-bar {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            border-top: 2px solid #000000 !important;
            border-bottom: none !important;
            border-left: none !important;
            border-right: none !important;
            margin: 6px 0 10px 0 !important;
            height: 0 !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .bank-letter-page table {
            font-size: 12px !important;
            border: 1.2px solid #000000 !important;
            margin: 10px 0 !important;
          }

          .bank-letter-page th,
          .bank-letter-page td {
            font-size: 11.5px !important;
            padding: 4px 6px !important;
            border: 1px solid #000000 !important;
            line-height: 1.3 !important;
          }

          .bank-letter-page:not(:last-child) {
            page-break-after: always;
            break-after: page;
            margin-bottom: 16px;
          }

          .print-only {
            display: block !important;
            visibility: visible !important;
          }

          /* Eradicate buttons, interactive controls, action/detail columns, and no-print elements */
          .no-print,
          .no-print *,
          .printable-area .no-print,
          .printable-area .no-print *,
          th.col-details,
          td.col-details,
          th.col-actions,
          td.col-actions,
          th:has(button),
          td:has(button),
          button,
          .btn,
          .btn-primary,
          .btn-secondary,
          .btn-success,
          .btn-danger {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
        </style>
      </head>
      <body>
        ${printableHtml}
      </body>
    </html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.focus();

  const executePrint = () => {
    try {
      printWindow.print();
    } catch (err) {
      printWindow.close();
      window.print();
    }
  };

  // Wait for images (e.g. logos) to finish loading before opening print dialog
  const printImages = printWindow.document.images;
  if (printImages && printImages.length > 0) {
    let loadedCount = 0;
    const totalCount = printImages.length;
    let printed = false;

    const onImageDone = () => {
      loadedCount++;
      if (loadedCount >= totalCount && !printed) {
        printed = true;
        setTimeout(executePrint, 150);
      }
    };

    for (let i = 0; i < totalCount; i++) {
      if (printImages[i].complete) {
        loadedCount++;
      } else {
        printImages[i].onload = onImageDone;
        printImages[i].onerror = onImageDone;
      }
    }

    if (loadedCount >= totalCount && !printed) {
      printed = true;
      setTimeout(executePrint, 250);
    } else {
      setTimeout(() => {
        if (!printed) {
          printed = true;
          executePrint();
        }
      }, 800);
    }
  } else {
    setTimeout(executePrint, 250);
  }
};
