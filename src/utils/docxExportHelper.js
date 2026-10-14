import { asBlob } from 'html-docx-js-typescript';

const safe = (value, fallback = '') => value == null ? fallback : String(value);
const esc = (value = '') => safe(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const normalizeDocumentHtml = (html = '') => {
  return `<html><head><meta charset="utf-8" /><style>
    @page { size: A4 portrait; margin: 12mm; }
    @font-face { font-family: 'Nikosh'; src: local('Nikosh'), local('Noto Sans Bengali'), local('SolaimanLipi'), local('Bangla'), local('Vrinda'); }
    body { margin: 0; padding: 0; background: #fff; font-family: 'Times New Roman', Times, serif; color: #000; font-size: 14px !important; }
    .printable-area { width: 820px; max-width: 820px; margin: 0 auto; background: #fff; padding: 0; box-sizing: border-box; }
    .bank-letter-page { page-break-after: always; background: #fff; color: #000; border: 1px solid #cbd5e1; padding: 20px 36px; margin: 0 auto; min-height: 760px; box-shadow: 0 1px 4px rgba(0,0,0,.08); box-sizing: border-box; }
    .no-print { display: none !important; }
    .printable-header { width: 100%; box-sizing: border-box; }
    .printable-header > div:first-child {
      display: grid !important;
      grid-template-columns: 80px 1fr 80px !important;
      align-items: center !important;
      justify-content: space-between !important;
      column-gap: 16px !important;
      width: 100% !important;
      min-height: 86px !important;
      border-bottom: 1px solid #000;
      padding-bottom: 8px;
    }
    .printable-header > div:first-child > div:nth-child(1),
    .printable-header > div:first-child > div:nth-child(3) {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 80px !important;
    }
    .printable-header > div:first-child > div:nth-child(1) img,
    .printable-header > div:first-child > div:nth-child(3) img { height: 70px !important; width: 70px !important; object-fit: contain !important; }
    .printable-header > div:first-child h1 { font-size: 20px !important; line-height: 1.2 !important; margin: 0 !important; letter-spacing: .01em !important; color: #000 !important; }
    .printable-header > div:first-child p { font-size: 12px !important; margin: 2px 0 0 0 !important; color: #000 !important; }
    .printable-header > div:nth-child(2) { border-top: 2px solid #000 !important; width: 100% !important; margin: 10px 0 8px 0 !important; }
    .printable-header > div:nth-child(3) {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      font-size: 12px !important;
      font-weight: bold !important;
      flex-wrap: nowrap !important;
      gap: 12px !important;
      padding-top: 4px !important;
    }
    .recipient, .body, .subject, .bank-letter-page > div:nth-child(4), table {
      font-family: 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif !important;
    }
    li, p { font-size: 14px !important; line-height: 1.55 !important; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 5px; font-size: 14px !important; }
    th { background: #f8fafc; font-weight: 700; }
    .sign-row { margin-top: 30px; }
    .sign-row .sign-left, .sign-row .sign-right { width: 45%; } 
  </style></head><body>${html}</body></html>`;
};

const makeDocxHtml = (letter, options = {}) => {
  const settings = options.settings || {};
  const orgName = esc(settings.org_name || 'Gazipur Palli Bidyut Samity-2');
  const address = esc(settings.org_address || 'Rajendrapur, Gazipur');
  const phone = esc(settings.org_phone || '01769402677');
  const email = esc(settings.org_email || 'gazipbs2@gmail.com');
  const refNo = esc(letter.ref_no || '');
  const date = esc(letter.letter_date || '');
  const recipient = esc(letter.recipient_designation || 'The Manager');
  const bankName = esc(letter.bank_name || 'Bank Branch');
  const branchName = esc(letter.branch_name || '');
  const bankAddress = esc(letter.bank_address || '');
  const subject = esc(letter.subject || '');
  const enclosure = esc(letter.enclosure || 'Enclosure: Original FDR Certificate / Advice as described above.');

  const paragraphs = Array.isArray(letter.paragraphs)
    ? letter.paragraphs
    : (typeof letter.body_content === 'string'
      ? letter.body_content.split('\n\n').map(p => p.trim()).filter(Boolean)
      : []);

  const leftLogo = esc(settings.org_secondary_logo_url || '');
  const rightLogo = esc(settings.org_logo_url || '');

  const tableRows = [];
  const inv = options.investments && options.investments.find(item => String(item.id) === String(letter.investment_id));
  if (inv) {
    tableRows.push(`<tr>
      <td style="border:1px solid #000;padding:4px;text-align:center;font-size:14px">1</td>
      <td style="border:1px solid #000;padding:4px;text-align:center;font-size:14px">${esc(inv.fund_name || inv.fundName || '')}</td>
      <td style="border:1px solid #000;padding:4px;text-align:center;font-size:14px">${esc(inv.fdr_no || '')}</td>
      <td style="border:1px solid #000;padding:4px;text-align:center;font-size:14px">${esc(inv.issue_date || inv.first_issue_date || '')}</td>
      <td style="border:1px solid #000;padding:4px;text-align:center;font-size:14px">${esc(inv.maturity_date || '')}</td>
      <td style="border:1px solid #000;padding:4px;text-align:right;font-size:14px">${esc(inv.principal_amount || inv.principal || '')}</td>
    </tr>`);
  }

  const paragraphHtml = paragraphs.map(p => `<p style="font-family: 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif; font-size: 14px; line-height: 1.65; margin: 0 0 12px; text-align: justify;">${esc(p)}</p>`).join('');

  return `<html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        body { font-family: 'Times New Roman', 'Nikosh', serif; color: #000; background: #fff; margin: 0; padding: 0; }
        .letter { width: 95%; margin: 0 auto; padding: 30px 40px; background: #fff; }
        .header-grid { width: 100%; min-height: 85px; overflow: hidden; margin-bottom: 8px; }
        .header-grid .logo-wrap-left { float: left; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
        .header-grid .logo-wrap-right { float: right; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
        .logo-wrap-left img, .logo-wrap-right img { max-height: 80px; max-width: 80px; object-fit: contain; }
        .org-block { margin: 0 auto; width: calc(100% - 160px); text-align: center; }
        .org-title { text-align: center; font-size: 22px; font-weight: 800; margin-bottom: 6px; }
        .org-details { text-align: center; font-size: 12px; margin: 2px 0; }
        .row-meta { display: flex; justify-content: space-between; align-items: center; font-size: 14px; margin: 10px 0 6px 0; }
        .row-meta .ref-date { font-size: 14px; }
        .recipient { margin: 16px 0 12px; font-size: 14px; line-height: 1.7; }
        .subject { font-family: 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif; font-weight: 700; font-size: 14px; margin: 14px 0; }
        .body { font-family: 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif; font-size: 14px; line-height: 1.65; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        th, td { border: 1px solid #000; padding: 5px; }
        th { background: #f8fafc; font-weight: 700; }
        .sign { width: 100%; display: flex; justify-content: space-between; align-items: flex-start; margin-top: 40px; font-size: 14px; }
        .sign-left { width: 45%; text-align: center; }
        .sign-right { width: 45%; text-align: center; }
      </style>
    </head>
    <body>
      <div class="letter">
        <div class="header-grid">
          <div class="logo-wrap-left">${leftLogo ? `<img src="${leftLogo}" alt="" />` : ''}</div>
          <div class="org-block">
            <div class="org-title">${orgName}</div>
            <div class="org-details">${address}</div>
            <div class="org-details">Phone: ${phone} • Email: ${email}</div>
          </div>
          <div class="logo-wrap-right">${rightLogo ? `<img src="${rightLogo}" alt="" />` : ''}</div>
        </div>

        <div class="row-meta">
          <div class="ref-date"><span style="font-weight:bold">Ref No:</span> ${refNo}</div>
          <div class="ref-date"><span style="font-weight:bold">Date:</span> ${date}</div>
        </div>

        <div class="recipient">
          <div>To,</div>
          <div style="font-weight:bold;">${recipient}</div>
          <div>${bankName}</div>
          <div>${branchName}${branchName && bankAddress ? ', ' : ''}${bankAddress}</div>
        </div>

        <div class="subject">Subject: ${subject}</div>

        <div class="body">
          ${paragraphHtml}
        </div>

        <table>
          <thead>
            <tr>
              <th>SL No</th>
              <th>Fund Name</th>
              <th>FDR No.</th>
              <th>Issue / Renewal Date</th>
              <th>Maturity Date</th>
              <th>Amount BDT</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows.join('')}
          </tbody>
        </table>

        <div class="body">Enclosure: ${enclosure}</div>

        <div class="sign">
          <div class="sign-left">
            <div style="height:40px"></div>
            <div style="border-top:1px solid #000;padding-top:4px;text-align:center;">
              <span>AGM Finance</span>
            </div>
          </div>
          <div class="sign-right">
            <div style="height:40px"></div>
            <div style="border-top:1px solid #000;padding-top:4px;text-align:center;">
              <span>General Manager</span>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

export const exportBankLettersToDocx = async (letters, options = {}) => {
  try {
    const pageHtml = options.sourceHtml || document.querySelector('.printable-area')?.outerHTML || '';
    const html = pageHtml ? normalizeDocumentHtml(pageHtml) : makeDocxHtml(Array.isArray(letters) ? letters[0] : letters, options);

    const blob = await asBlob(html, {
      orientation: 'portrait',
      margins: { top: 720, right: 720, bottom: 720, left: 720 },
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safe(options.filename, 'Bank_Letters.docx');
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (err) {
    console.error('DOCX export error:', err);
    if (options.onError) options.onError(err);
  }
};
