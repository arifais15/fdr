// Financial Calculations Utility

export function calculateExciseDuty(amount, settings = {}) {
  const t1 = parseFloat(settings.excise_tier1_limit) || 400000;
  const f1 = parseFloat(settings.excise_tier1_fee) || 0;
  
  const t2 = parseFloat(settings.excise_tier2_limit) || 500000;
  const f2 = parseFloat(settings.excise_tier2_fee) || 150;
  
  const t3 = parseFloat(settings.excise_tier3_limit) || 1000000;
  const f3 = parseFloat(settings.excise_tier3_fee) || 500;
  
  const t4 = parseFloat(settings.excise_tier4_limit) || 5000000;
  const f4 = parseFloat(settings.excise_tier4_fee) || 3000;
  
  const t5 = parseFloat(settings.excise_tier5_limit) || 10000000;
  const f5 = parseFloat(settings.excise_tier5_fee) || 5000;
  
  const t6 = parseFloat(settings.excise_tier6_limit) || 20000000;
  const f6 = parseFloat(settings.excise_tier6_fee) || 10000;
  
  const t7 = parseFloat(settings.excise_tier7_limit) || 50000000;
  const f7 = parseFloat(settings.excise_tier7_fee) || 20000;
  
  const f8 = parseFloat(settings.excise_tier8_fee) || 50000;

  const p = parseFloat(amount) || 0;
  if (p <= t1) return f1;
  if (p <= t2) return f2;
  if (p <= t3) return f3;
  if (p <= t4) return f4;
  if (p <= t5) return f5;
  if (p <= t6) return f6;
  if (p <= t7) return f7;
  return f8;
}

export function calculateMaturityDate(issueDateStr, tenureMonths) {
  if (!issueDateStr || !tenureMonths) return '';
  const d = new Date(issueDateStr);
  d.setMonth(d.getMonth() + parseInt(tenureMonths));
  return d.toISOString().split('T')[0];
}

export function getTaxRate(tinProvided, fundName = '', accCode = '', settings = {}) {
  const lowerName = (fundName || '').toLowerCase();
  const lowerCode = (accCode || '').toLowerCase();

  const isCpfOrGpf = lowerName.includes('cpf') ||
                     lowerName.includes('gpf') ||
                     lowerName.includes('provident') ||
                     lowerName.includes('gratuity') ||
                     lowerName.includes('প্রভিডেন্ট') ||
                     lowerName.includes('গ্রাচ্যুইটি') ||
                     lowerCode.includes('cpf') ||
                     lowerCode.includes('gpf');

  if (isCpfOrGpf) {
    return parseFloat(settings.tax_rate_cpf) || 10;
  }

  const isTin = tinProvided === true || tinProvided === 1 || tinProvided === '1' || tinProvided === 'true';
  if (isTin) {
    return parseFloat(settings.tax_rate_tin) || 20;
  }

  return parseFloat(settings.tax_rate_no_tin) || 30;
}

// Date helper to add days to a date string YYYY-MM-DD without UTC/local timezone shifts
export function addDaysToStr(dateStr, days) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

// Requirement 2: Prevent Period Overlapping (Offsetting)
// Automatically check previous provision date ranges for the same FDR.
// If the requested periodStart falls inside an existing covered range, offset the effective start date to (previous periodEnd + 1 day).
export function adjustPeriodStart(periodStartStr, periodEndStr, existingProvisions = [], currentProvisionId = null) {
  if (!periodStartStr) return periodStartStr;
  let effectiveStart = periodStartStr;
  let maxLoop = 50;

  while (maxLoop-- > 0) {
    let adjusted = false;
    for (const p of existingProvisions) {
      if (currentProvisionId && (p.id === currentProvisionId || String(p.id) === String(currentProvisionId))) continue;
      if (!p.period_start || !p.period_end) continue;
      
      // If effectiveStart falls inside existing covered range [p.period_start, p.period_end]
      if (effectiveStart >= p.period_start && effectiveStart <= p.period_end) {
        const nextStart = addDaysToStr(p.period_end, 1);
        if (nextStart > effectiveStart) {
          effectiveStart = nextStart;
          adjusted = true;
        }
      }
    }
    if (!adjusted) break;
  }
  return effectiveStart;
}

// Requirement 1: Single Excise Duty Per Calendar Year
// Charge excise duty only ONCE per FDR within the same calendar year (Jan 1 – Dec 31).
// If an excise duty provision (> 0) already exists for the same FDR in that calendar year, set excise duty to 0 for subsequent provisions.
export function hasExciseDutyInCalendarYear(periodStartStr, existingProvisions = [], currentProvisionId = null) {
  if (!periodStartStr) return false;
  const targetYear = periodStartStr.substring(0, 4);
  if (!targetYear || targetYear.length !== 4) return false;

  return existingProvisions.some(p => {
    if (currentProvisionId && (p.id === currentProvisionId || String(p.id) === String(currentProvisionId))) return false;
    const exciseVal = parseFloat(p.excise_duty || 0);
    if (exciseVal <= 0) return false;

    const pStartYear = p.period_start ? p.period_start.substring(0, 4) : '';
    const pEndYear = p.period_end ? p.period_end.substring(0, 4) : '';
    const pProvYear = p.provision_date ? p.provision_date.substring(0, 4) : '';

    return pStartYear === targetYear || pEndYear === targetYear || pProvYear === targetYear;
  });
}

export function calculateInterestDetails(
  principal,
  rate,
  periodStartStr,
  periodEndStr,
  tinProvided = true,
  fdrIssueDateStr = null,
  settings = {},
  fundName = '',
  accCode = '',
  existingProvisions = [],
  currentProvisionId = null
) {
  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;
  
  // Tax rate rule: 10% for CPF/GPF/Gratuity, 20% for TIN provided, 30% for TIN not provided
  const taxRate = getTaxRate(tinProvided, fundName, accCode, settings);

  if (!periodStartStr || !periodEndStr || p <= 0 || r <= 0) {
    return {
      days: 0,
      grossInterest: 0,
      taxRate: taxRate,
      taxAmount: 0,
      exciseDuty: 0,
      netInterest: 0,
      netMaturityAmount: p,
      effectivePeriodStart: periodStartStr,
      isOffsetted: false,
      exciseAlreadyCharged: false
    };
  }

  // Requirement 2: Period Overlapping Offsetting
  let effectiveStart = adjustPeriodStart(periodStartStr, periodEndStr, existingProvisions, currentProvisionId);
  const originalStart = periodStartStr;

  let d1 = new Date(effectiveStart + 'T00:00:00Z');
  const d2 = new Date(periodEndStr + 'T00:00:00Z');

  if (fdrIssueDateStr) {
    const fdrIssueDate = new Date(fdrIssueDateStr + 'T00:00:00Z');
    if (fdrIssueDate > d1) {
      d1 = fdrIssueDate;
      effectiveStart = fdrIssueDateStr;
    }
  }

  if (d1 > d2) {
    return {
      days: 0,
      grossInterest: 0,
      taxRate,
      taxAmount: 0,
      exciseDuty: 0,
      netInterest: 0,
      netMaturityAmount: p,
      effectivePeriodStart: effectiveStart,
      isOffsetted: effectiveStart !== originalStart,
      exciseAlreadyCharged: false
    };
  }

  const diffTime = Math.max(0, d2 - d1);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const grossInterest = Math.round((p * (r / 100) * diffDays) / 365);
  const taxAmount = Math.round(grossInterest * (taxRate / 100));
  
  // Requirement 1: Single Excise Duty Per Calendar Year
  const exciseAlreadyCharged = hasExciseDutyInCalendarYear(effectiveStart, existingProvisions, currentProvisionId);
  const exciseDuty = exciseAlreadyCharged ? 0 : calculateExciseDuty(p, settings);

  const netInterest = Math.max(0, grossInterest - taxAmount - exciseDuty);

  return {
    days: diffDays,
    grossInterest,
    taxRate,
    taxAmount,
    exciseDuty,
    exciseAlreadyCharged,
    netInterest,
    netMaturityAmount: p + netInterest,
    effectivePeriodStart: effectiveStart,
    isOffsetted: effectiveStart !== originalStart
  };
}
