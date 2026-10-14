// Currency Formatter in Bangladeshi Taka (BDT)
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
  
  const isNegative = amount < 0;
  const absNum = Math.abs(Math.round(amount));
  const numStr = absNum.toString();
  let lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = (isNegative ? '-' : '') + (otherNumbers !== '' ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") : '') + lastThree;
  return formatted;
}

// Date Formatter (DD-MMM-YYYY)
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Number to Words Converter (in Taka & Poisha)
export function numberToWords(num) {
  if (num === 0) return 'Zero Taka Only';
  
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const rounded = Math.floor(num);
  return `${inWords(rounded)} Taka Only`;
}

// Clean Remarks (strips internal technical __SNAPSHOT__ JSON blobs & verbose log dumps)
export function cleanRemarks(remarks) {
  if (!remarks) return '';
  let str = String(remarks);
  if (str.includes('| __SNAPSHOT__:')) {
    str = str.split('| __SNAPSHOT__:')[0].trim();
  } else if (str.includes('__SNAPSHOT__:')) {
    str = str.split('__SNAPSHOT__:')[0].trim();
  }
  if (str.startsWith('In-Place Rollover') || str.includes('Rollover')) {
    return 'Renew';
  }
  return str.replace(/\|\s*$/, '').trim();
}

