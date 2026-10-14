import * as XLSX from 'xlsx';

/**
 * Downloads a pre-formatted sample Excel template for FDR / Investment bulk uploading.
 */
export const downloadFdrTemplate = () => {
  const sampleData = [
    {
      'FDR No': 'FDR-2026-101',
      'Account No': '1029384756',
      'Bank Name': 'Sonali Bank PLC',
      'Branch Name': 'Principal Branch, Dhaka',
      'Investment Type': 'FDR',
      'Account Code': '129.25.100',
      'Fund Name': 'প্রভিডেন্ট',
      'Principal Amount': 10000000,
      'Interest Rate %': 8.50,
      'Issue Date (YYYY-MM-DD)': '2026-01-15',
      'Tenure (Months)': 12,
      'Maturity Date (YYYY-MM-DD)': '2027-01-15',
      'Compounding Frequency': 'At Maturity',
      'TIN Provided (Yes/No)': 'Yes',
      'Sanction Ref': 'SAN-2026/001',
      'Remarks': 'Sample Provident Fund FDR'
    },
    {
      'FDR No': 'FDR-2026-102',
      'Account No': '9876543210',
      'Bank Name': 'Agrani Bank PLC',
      'Branch Name': 'Dhaka Corporate Branch',
      'Investment Type': 'FDR',
      'Account Code': '129.35.000',
      'Fund Name': 'গ্রাচ্যুইটি',
      'Principal Amount': 5000000,
      'Interest Rate %': 8.75,
      'Issue Date (YYYY-MM-DD)': '2026-02-01',
      'Tenure (Months)': 6,
      'Maturity Date (YYYY-MM-DD)': '2026-08-01',
      'Compounding Frequency': 'At Maturity',
      'TIN Provided (Yes/No)': 'Yes',
      'Sanction Ref': 'SAN-2026/002',
      'Remarks': 'Sample Gratuity Fund FDR'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  
  ws['!cols'] = [
    { wch: 16 }, // FDR No
    { wch: 16 }, // Account No
    { wch: 22 }, // Bank Name
    { wch: 24 }, // Branch Name
    { wch: 16 }, // Investment Type
    { wch: 14 }, // Account Code
    { wch: 16 }, // Fund Name
    { wch: 18 }, // Principal Amount
    { wch: 14 }, // Interest Rate %
    { wch: 24 }, // Issue Date
    { wch: 16 }, // Tenure
    { wch: 24 }, // Maturity Date
    { wch: 22 }, // Compounding Frequency
    { wch: 22 }, // TIN Provided
    { wch: 16 }, // Sanction Ref
    { wch: 24 }  // Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'FDR_Import_Template');
  XLSX.writeFile(wb, 'FDR_Bulk_Import_Template.xlsx');
};

/**
 * Downloads a pre-formatted sample Excel template for Bank List bulk uploading.
 */
export const downloadBankTemplate = () => {
  const sampleData = [
    {
      'Bank Name': 'Sonali Bank PLC',
      'Branch Name': 'Gazipur Branch',
      'Bank Type': 'Government Bank',
      'Routing No': '200270005',
      'Address': 'Gazipur Sadar, Gazipur',
      'Contact Person': 'Md. Rahim (Manager)',
      'Phone': '01711-123456',
      'Email': 'gazipur@sonalibank.com.bd'
    },
    {
      'Bank Name': 'Pubali Bank PLC',
      'Branch Name': 'Board Bazar Branch',
      'Bank Type': 'Private Bank',
      'Routing No': '170270008',
      'Address': 'Board Bazar, Gazipur',
      'Contact Person': 'Nusrat Jahan (AVP)',
      'Phone': '01819-654321',
      'Email': 'boardbazar@pubalibankbd.com'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 22 }, // Bank Name
    { wch: 22 }, // Branch Name
    { wch: 18 }, // Bank Type
    { wch: 16 }, // Routing No
    { wch: 28 }, // Address
    { wch: 24 }, // Contact Person
    { wch: 16 }, // Phone
    { wch: 26 }  // Email
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bank_Import_Template');
  XLSX.writeFile(wb, 'Bank_List_Import_Template.xlsx');
};

/**
 * Reads an uploaded Excel file (.xlsx, .xls, .csv) and returns JSON array of rows.
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
