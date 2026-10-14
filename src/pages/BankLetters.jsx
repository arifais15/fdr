import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Plus,
  FileText,
  Printer,
  Trash2,
  Building2,
  Send,
  Download,
  Languages,
  CheckCircle2,
  Edit3,
  FileSpreadsheet,
  RotateCcw,
  Calendar,
  Search,
  Filter,
  CheckSquare,
  Square,
  Settings2,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Mail
} from 'lucide-react';
import Modal from '../components/Modal';
import PrintHeader from '../components/PrintHeader';
import { triggerPrint } from '../utils/printHelper';
import { formatCurrency, formatDate, numberToWords } from '../utils/formatters';
import { api } from '../utils/api';
import { exportTableToExcel } from '../utils/exportHelper';
import { exportBankLettersToDocx } from '../utils/docxExportHelper';

export const RENEWAL_OPTIONS = [
  {
    value: 'Renewal_Compound',
    labelBangla: 'মূলধন ও অর্জিত মুনাফাসহ নবায়ন (পুনবিনিয়োগ)',
    labelEnglish: 'Principal + Net Profit Reinvested (Compound Rollover)',
    descBangla: 'আসল এবং নীট মুনাফাসহ সমুদয় অর্থ পরবর্তী ১ বছর মেয়াদে নবায়ন/পুনবিনিয়োগ।'
  },
  {
    value: 'Renewal_Profit_To_Account',
    labelBangla: 'শুধু মূলধন নবায়ন, মুনাফা ব্যাংক হিসাবে স্থানান্তর',
    labelEnglish: 'Principal Only, Transfer Net Profit to Bank Account',
    descBangla: 'শুধু মূলধন নবায়ন হবে এবং অর্জিত নীট মুনাফা সমিতির ব্যাংক একাউন্টে জমা হবে।'
  },
  {
    value: 'Renewal_Profit_PayOrder',
    labelBangla: 'শুধু মূলধন নবায়ন, মুনাফার পে-অর্ডার ইস্যু',
    labelEnglish: 'Principal Only, Issue Pay Order for Net Profit',
    descBangla: 'শুধু মূলধন নবায়ন হবে এবং অর্জিত নীট মুনাফার জন্য পে-অর্ডার ইস্যু করা হবে।'
  },
  {
    value: 'Renewal_Standard',
    labelBangla: 'সাধারণ এফডিআর নবায়ন (Standard Renewal)',
    labelEnglish: 'Standard / General FDR Renewal',
    descBangla: 'বিদ্যমান সর্বোচ্চ সুদের হারে সাধারণ এফডিআর নবায়ন।'
  }
];

export const getDefaultLetterContent = ({ type, lang, fundName, matDate, orgName, branchAddress, taxRateBangla, taxRateEnglish }) => {
  let subject = '';
  let paragraphs = [];
  let enclosure = '';

  const isEnglish = lang === 'English';

  if (isEnglish) {
    if (type === 'Encashment') {
      subject = `Regarding Encashment & Settlement of Fixed Deposit Receipt (FDR) - [${fundName}].`;
      paragraphs = [
        `With reference to the subject cited above, this is to inform you that the Fixed Deposit Receipt (FDR) maintained with your bank branch under "${fundName}", as detailed in the table below, will mature on ${matDate}. In accordance with the decision of Samity Management, you are requested to encash the said FDR upon maturity and issue an Account Payee Cheque / Pay Order for the total maturity proceed (Principal amount plus net accrued interest after deducting ${taxRateEnglish}) in favor of "${orgName}".`,
        `Furthermore, a detailed interest calculation statement is attached herewith. You are requested to properly fill out the statement specifying the gross interest, tax deducted at source, and net payable amount, and return it to this Samity.`,
        `Please note that the total proceeds must be transferred on the exact date of maturity. Any delay in settlement will attract interest at the agreed FDR rate for the delayed period.`
      ];
      enclosure = `Enclosure: Original FDR Certificate / Advice as described above.`;
    } else if (type === 'Renewal' || type === 'Renewal_Compound') {
      subject = `Regarding Renewal of Fixed Deposit Receipt (FDR) with Principal & Net Accrued Profit - [${fundName}].`;
      paragraphs = [
        `With reference to the subject cited above, this is to inform you that the Fixed Deposit Receipt (FDR) maintained with your bank branch under "${fundName}", as detailed in the table below, will mature on ${matDate}. Samity Management has decided to renew the principal amount along with the net accrued interest (after deducting ${taxRateEnglish}) for a further period of 12 (twelve) months at the prevailing highest offered interest rate.`,
        `You are kindly requested to credit the net accrued interest to the principal for compounding renewal, issue a renewed FDR certificate in favor of "${orgName}", and deliver the original FDR certificate to our Finance Directorate at your earliest convenience.`,
        `Please ensure the renewed certificate is dispatched promptly on the exact date of maturity without any delay.`
      ];
      enclosure = `Enclosure: Original FDR Certificate / Renewal Advice.`;
    } else if (type === 'Renewal_Profit_To_Account') {
      subject = `Regarding Renewal of FDR Principal Only & Transfer of Net Profit to Bank Account - [${fundName}].`;
      paragraphs = [
        `With reference to the subject cited above, this is to inform you that the Fixed Deposit Receipt (FDR) maintained with your bank branch under "${fundName}", as detailed in the table below, will mature on ${matDate}. Samity Management has decided to renew ONLY the Principal Amount for a further period of 12 (twelve) months at the prevailing highest rate of interest.`,
        `You are requested to calculate the gross interest accrued upon maturity, deduct ${taxRateEnglish}, and credit the entire net profit proceeds to the Samity's nominated Bank Account without delay.`,
        `Please issue and deliver the renewed Principal FDR certificate along with a formal interest calculation and tax deduction statement to our Finance Directorate.`
      ];
      enclosure = `Enclosure: Original FDR Certificate & Bank Account Details.`;
    } else if (type === 'Renewal_Profit_PayOrder') {
      subject = `Regarding Renewal of FDR Principal Only & Issuance of Pay Order for Net Profit - [${fundName}].`;
      paragraphs = [
        `With reference to the subject cited above, the Fixed Deposit Receipt (FDR) maintained with your bank branch under "${fundName}", as detailed in the table below, will mature on ${matDate}. Samity Management has approved the renewal of the Principal Amount only for another term of 12 (twelve) months at the maximum offered rate.`,
        `Kindly deduct ${taxRateEnglish} from the total accrued interest upon maturity, and issue an Account Payee Pay Order / Cheque for the net profit proceed drawn in favor of "${orgName}".`,
        `Please dispatch the renewed FDR certificate along with the net profit Pay Order to our Finance Directorate promptly.`
      ];
      enclosure = `Enclosure: Original FDR Certificate as described above.`;
    } else if (type === 'Renewal_Standard') {
      subject = `Regarding Renewal of Fixed Deposit Receipt (FDR) - [${fundName}].`;
      paragraphs = [
        `With reference to the subject cited above, this is to inform you that the Fixed Deposit Receipt (FDR) maintained with your bank branch under "${fundName}", as detailed in the table below, will mature on ${matDate}. Samity Management has approved the renewal of the FDR for a further period of 12 (twelve) months at the prevailing maximum offered rate of interest.`,
        `You are requested to issue a renewed FDR certificate in favor of "${orgName}" and deliver the original certificate to our Finance Directorate.`,
        `Please ensure the renewed certificate is dispatched promptly following maturity.`
      ];
      enclosure = `Enclosure: Original FDR Certificate / Renewal Advice.`;
    } else if (type === 'Opening/Purchase') {
      subject = `Request for Opening a New Fixed Deposit Receipt (FDR) - [${fundName}].`;
      paragraphs = [
        `We are pleased to inform you that Samity Management has approved the investment of funds under "${fundName}" in a new Fixed Deposit Receipt (FDR) with your esteemed bank branch under the terms detailed below:`,
        `Kindly issue the FDR certificate in favor of "${orgName}" and deliver the original FDR certificate to our Finance Directorate at your earliest convenience.`,
        `The payment has been authorized via account transfer / pay order as per prescribed financial guidelines.`
      ];
      enclosure = `Enclosure: Bank Account Transfer Copy / Cheque Advice.`;
    } else if (type === 'Tax Certificate Request') {
      subject = `Request for Annual Income Tax & Interest Certificate.`;
      paragraphs = [
        `We request you to kindly issue an Income Tax Deduction at Source (AIT) and Interest Statement Certificate for all FDR accounts maintained by "${orgName}" with your branch for the current fiscal year.`,
        `This certificate is urgently required for our official statutory audit and tax compliance submission.`,
        `Your prompt cooperation in this regard will be highly appreciated.`
      ];
      enclosure = `Enclosure: List of active FDR account numbers.`;
    } else {
      subject = `Regarding ${type} of Fixed Deposit Receipt (FDR) - [${fundName}].`;
      paragraphs = [
        `With reference to the subject cited above, this is regarding the Fixed Deposit Receipt (FDR) maintained with your bank branch under "${fundName}" maturing on ${matDate}.`,
        `You are requested to take necessary action as per Samity Management instructions.`
      ];
      enclosure = `Enclosure: Original FDR Certificate / Advice.`;
    }
  } else {
    // Bengali
    if (type === 'Encashment') {
      subject = `স্থায়ী আমানত (FDR) নগদায়ন ও অর্থ স্থানান্তর প্রসঙ্গে [${fundName}]।`;
      paragraphs = [
        `উপরিউক্ত বিষয়ের প্রেক্ষিতে জানানো যাচ্ছে যে, আপনার ব্যাংক শাখায় অত্র সমিতির "${fundName}"-এর নামে রক্ষিত নিম্নবর্ণিত বিবরণী অনুযায়ী স্থায়ী আমানতটি পূর্ব নির্ধারিত তারিখে মেয়াদ উত্তীর্ণ হবে। অত্র সমিতির সিদ্ধান্ত মোতাবেক উক্ত স্থায়ী আমানতটি মেয়াদান্তে নগদায়ন পূর্বক অর্জিত মুনাফার উপর ${taxRateBangla} কর্তন পূর্বক নীট সুদসহ সমুদয় অর্থ "${orgName}"-এর অনুকূলে অ্যাকাউন্ট পেয়ী চেক/পে-অর্ডার ইস্যু করে প্রেরণের জন্য অনুরোধ করা হলো।`,
        `স্থায়ী আমানতের উপর অর্জিত সুদ ও আসলের হিসাব প্রদানের জন্য অত্র সাথে ০১টি ফরম প্রেরণ করা হলো। উক্ত ফরমটি যথাযথভাবে পূরণ করতঃ অত্র সমিতিতে ফেরত প্রদানের জন্য অনুরোধ করা হলো।`,
        `উল্লেখ্য যে, স্থায়ী আমানতের মেয়াদপূর্তির নির্দিষ্ট তারিখেই সুদে-আসলে প্রাপ্য সমুদয় অর্থ স্থানান্তর নিশ্চিত করার জন্য অনুরোধ করা হলো। অন্যথায় বিলম্বে স্থানান্তরের জন্য বিলম্বিত সময়ের সুদ স্থায়ী আমানতে উল্লেখিত সুদের হারে প্রদান করতে হবে।`
      ];
      enclosure = `সংযুক্ত: বর্ণনা অনুযায়ী স্থায়ী আমানত রশিদ।`;
    } else if (type === 'Renewal' || type === 'Renewal_Compound') {
      subject = `স্থায়ী আমানত (FDR) মূলধন ও অর্জিত নীট মুনাফাসহ নবায়ন প্রসঙ্গে [${fundName}]।`;
      paragraphs = [
        `উপরিউক্ত বিষয়ের প্রেক্ষিতে জানানো যাচ্ছে যে, আপনার ব্যাংক শাখায় অত্র সমিতির "${fundName}"-এর নামে রক্ষিত নিম্নবর্ণিত বিবরণী অনুযায়ী স্থায়ী আমানতটি আগামী ${matDate} তারিখে মেয়াদ উত্তীর্ণ হবে। অত্র সমিতির সিদ্ধান্ত মোতাবেক উক্ত স্থায়ী আমানতের আসল অর্থ এবং মেয়াদান্তে অর্জিত মুনাফার উপর ${taxRateBangla} কর্তন পূর্বক অবশিষ্ট নীট মুনাফাসহ সমুদয় অর্থ সর্বোচ্চ বিদ্যমান সুদের হারে পরবর্তী ১ বছর মেয়াদে পুনবিনিয়োগ/নবায়ন করার জন্য অনুরোধ করা হলো।`,
        `উক্ত আমানতটি যথাসময়ে নবায়ন করতঃ "${orgName}"-এর অনুকূলে নতুন নবায়নকৃত এফডিআর রশিদ ইস্যু পূর্বক অত্র সমিতির অর্থ শাখায় প্রেরণের প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য অনুরোধ করা হলো।`,
        `মেয়াদান্তে বিলম্ব ব্যতিরেকে নির্ধারিত তারিখে নবায়ন নিশ্চিত করার জন্য বিশেষ অনুরোধ জানানো যাচ্ছে।`
      ];
      enclosure = `সংযুক্ত: মূল স্থায়ী আমানত রশিদ।`;
    } else if (type === 'Renewal_Profit_To_Account') {
      subject = `স্থায়ী আমানত (FDR) কেবল মূলধন নবায়ন ও অর্জিত মুনাফা ব্যাংক হিসাবে স্থানান্তর প্রসঙ্গে [${fundName}]।`;
      paragraphs = [
        `উপরিউক্ত বিষয়ের প্রেক্ষিতে জানানো যাচ্ছে যে, আপনার ব্যাংক শাখায় অত্র সমিতির "${fundName}"-এর নামে রক্ষিত নিম্নবর্ণিত বিবরণী অনুযায়ী স্থায়ী আমানতটি আগামী ${matDate} তারিখে মেয়াদ উত্তীর্ণ হবে। অত্র সমিতির সিদ্ধান্ত মোতাবেক উক্ত স্থায়ী আমানতের কেবল মূলধন (Principal Amount) অর্থ সর্বোচ্চ বিদ্যমান সুদের হারে পরবর্তী ১ বছর মেয়াদে নবায়ন করার জন্য অনুরোধ করা হলো।`,
        `উক্ত স্থায়ী আমানতের মেয়াদান্তে অর্জিত মুনাফার উপর ${taxRateBangla} কর্তন পূর্বক অবশিষ্ট নীট মুনাফার অর্থ অত্র সমিতির ব্যাংক চলতি/সঞ্চয়ী হিসাবে অবিলম্বে স্থানান্তর/জমা করার জন্য অনুরোধ করা হলো।`,
        `মূলধন নবায়নকৃত নতুন এফডিআর রশিদ এবং মুনাফা কর্তন ও স্থানান্তরের বিবরণী অত্র সমিতির অর্থ শাখায় প্রেরণের অনুরোধ করা হলো।`
      ];
      enclosure = `সংযুক্ত: মূল স্থায়ী আমানত রশিদ ও ব্যাংক হিসাব বিবরণী।`;
    } else if (type === 'Renewal_Profit_PayOrder') {
      subject = `স্থায়ী আমানত (FDR) কেবল মূলধন নবায়ন এবং অর্জিত মুনাফার পে-অর্ডার ইস্যু প্রসঙ্গে [${fundName}]।`;
      paragraphs = [
        `উপরিউক্ত বিষয়ের প্রেক্ষিতে জানানো যাচ্ছে যে, আপনার ব্যাংক শাখায় অত্র সমিতির "${fundName}"-এর নামে রক্ষিত নিম্নবর্ণিত বিবরণী অনুযায়ী স্থায়ী আমানতটি আগামী ${matDate} তারিখে মেয়াদ উত্তীর্ণ হবে। অত্র সমিতির সিদ্ধান্ত মোতাবেক উক্ত স্থায়ী আমানতের মূলধন (Principal Amount) অর্থ বিদ্যমান সর্বোচ্চ সুদের হারে পরবর্তী ১ বছর মেয়াদে নবায়ন করার জন্য অনুরোধ করা হলো।`,
        `স্থায়ী আমানতের বিপরীতে অর্জিত মুনাফার উপর ${taxRateBangla} কর্তন পূর্বক অবশিষ্ট নীট মুনাফার সমপরিমাণ অর্থের একটি "অ্যাকাউন্ট পেয়ী" পে-অর্ডার/ডিডি "${orgName}"-এর অনুকূলে প্রস্তুত করতঃ অত্র কার্যালয়ে প্রেরণের জন্য অনুরোধ করা হলো।`,
        `নবায়নকৃত মূল এফডিআর রশিদ এবং মুনাফার পে-অর্ডার যথাসময়ে অত্র সমিতির অর্থ শাখায় প্রেরণের জন্য বিশেষভাবে অনুরোধ করা হলো।`
      ];
      enclosure = `সংযুক্ত: বর্ণনা অনুযায়ী মূল স্থায়ী আমানত রশিদ।`;
    } else if (type === 'Renewal_Standard') {
      subject = `স্থায়ী আমানত (FDR) নবায়ন প্রসঙ্গে [${fundName}]।`;
      paragraphs = [
        `উপরিউক্ত বিষয়ের প্রেক্ষিতে জানানো যাচ্ছে যে, আপনার ব্যাংক শাখায় অত্র সমিতির "${fundName}"-এর নামে রক্ষিত নিম্নবর্ণিত বিবরণী অনুযায়ী স্থায়ী আমানতটি মেয়াদ উত্তীর্ণ হতে যাচ্ছে। অত্র সমিতির সিদ্ধান্ত মোতাবেক অর্জিত মুনাফার উপর ${taxRateBangla} কর্তন পূর্বক নীট মুনাফাসহ আসল অর্থ সর্বোচ্চ বিদ্যমান সুদের হারে পরবর্তী ১ বছর মেয়াদে নবায়ন করার অনুরোধ করা হলো।`,
        `নবায়নকৃত স্থায়ী আমানতের মূল রশিদটি প্রস্তুত করতঃ অত্র কার্যালয়ে প্রেরণের প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য অনুরোধ করা হলো।`,
        `মেয়াদান্তে যথাযথ সময়সীমার মধ্যে নবায়ন কার্যক্রম সম্পন্ন করার জন্য অনুরোধ জানানো যাচ্ছে।`
      ];
      enclosure = `সংযুক্ত: মূল স্থায়ী আমানত রশিদ।`;
    } else if (type === 'Opening/Purchase') {
      subject = `নতুন স্থায়ী আমানত (FDR) খোলার আবেদন [${fundName}]।`;
      paragraphs = [
        `আপনার ব্যাংকে অত্র সমিতির "${fundName}"-এর অনুকূলে নিম্নবর্ণিত শর্তাদিতে একটি নতুন স্থায়ী আমানতের হিসাব খোলার সিদ্ধান্ত গৃহীত হয়েছে:`,
        `উক্ত আমানতের বিপরীতে "${orgName}"-এর নামে মূল এফডিআর রশিদ ইস্যু পূর্বক অত্র সমিতিতে প্রেরণ করার অনুরোধ করা হলো।`,
        `আমানতের অর্থ স্থানান্তরের সনদ অত্র পত্রের সাথে সংযুক্ত করা হলো।`
      ];
      enclosure = `সংযুক্ত: পে-অর্ডার / হিসাব স্থানান্তর এডভাইস।`;
    } else if (type === 'Tax Certificate Request') {
      subject = `বার্ষিক মুনাফা ও আয়কর কর্তন সনদ প্রদান প্রসঙ্গে।`;
      paragraphs = [
        `অত্র সমিতির অনুকূলে রক্ষিত স্থায়ী আমানতসমূহের চলতি অর্থবছরে অর্জিত সুদের পরিমাণ এবং উৎসে কর্তনকৃত আয়করের (AIT) সঠিক তথ্য সম্বলিত ব্যাংক সনদ প্রদানের জন্য অনুরোধ করা হলো।`,
        `উক্ত সনদটি অত্র সমিতির সংবিধিবদ্ধ অডিট এবং আয়কর দাখিলের কাজে প্রয়োজন।`,
        `দ্রুত সনদটি প্রদানের জন্য আপনার সহযোগিতা কামনা করছি।`
      ];
      enclosure = `সংযুক্ত: এফডিআর সমূহের তালিকা।`;
    } else {
      subject = `স্থায়ী আমানত (FDR) ${type} প্রসঙ্গে [${fundName}]।`;
      paragraphs = [
        `উপরিউক্ত বিষয়ের প্রেক্ষিতে জানানো যাচ্ছে যে, আপনার ব্যাংক শাখায় অত্র সমিতির "${fundName}"-এর নামে রক্ষিত নিম্নবর্ণিত বিবরণী অনুযায়ী স্থায়ী আমানতটি মেয়াদান্তে প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য অনুরোধ করা হলো।`,
        `প্রয়োজনীয় কাগজপত্র অত্র সাথে সংযুক্ত করা হলো।`
      ];
      enclosure = `সংযুক্ত: বর্ণনা অনুযায়ী প্রয়োজনীয় সনদ ও রশিদ।`;
    }
  }

  return { subject, paragraphs, enclosure };
};

export const resolveFdrFinancials = (inv) => {
  const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
  const r = inv.latest_rollover;

  let principal = parseFloat(inv.principal_amount) || 0;
  let gross = parseFloat(inv.actual_gross_interest || 0);
  let tax = parseFloat(inv.actual_tax || 0);
  let duty = parseFloat(inv.actual_excise_duty || 0);
  let charge = parseFloat(inv.actual_bank_charge || 0);
  let net = parseFloat(inv.actual_net_interest || 0);

  if (isRollover) {
    gross = parseFloat(r.gross_interest || 0);
    tax = parseFloat(r.tax_amount || 0);
    duty = parseFloat(r.excise_duty || 0);
    charge = parseFloat(r.bank_charge || 0);
    net = parseFloat(r.net_interest || 0);

    const newPrinc = parseFloat(r.principal_amount || r.new_principal || 0);
    if (newPrinc > 0 && newPrinc > net) {
      principal = Math.round((newPrinc - net) * 100) / 100;
    } else {
      principal = parseFloat(inv.principal_amount) || 0;
    }
  } else {
    if (!net && gross > 0) {
      net = Math.max(0, gross - tax - duty - charge);
    }
  }

  const totalPayable = principal + net;

  return {
    principal,
    gross,
    tax,
    duty,
    charge,
    net,
    totalPayable
  };
};

export default function BankLetters({ showToast, initialData }) {
  const [letters, setLetters] = useState([]);
  const [banks, setBanks] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [customTypes, setCustomTypes] = useState([]);
  const [letterBodyTemplates, setLetterBodyTemplates] = useState({}); // { 'Encashment_English': [...paras], ... }
  const [letterSubjectTemplates, setLetterSubjectTemplates] = useState({});
  const [letterEnclosureTemplates, setLetterEnclosureTemplates] = useState({});

  // Tabs: 'matured_fdr_letters' | 'saved_letters'
  const [activeTab, setActiveTab] = useState('matured_fdr_letters');

  // Matured FDRs Filter & Letter Generation State
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedLetterType, setSelectedLetterType] = useState('Renewal_Compound');
  const [selectedLanguage, setSelectedLanguage] = useState('Bengali');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvIds, setSelectedInvIds] = useState([]);
  const [printLettersList, setPrintLettersList] = useState([]);
  const [rowLetterTypes, setRowLetterTypes] = useState({});
  const [rowLanguages, setRowLanguages] = useState({});
  const [selectedSavedLetterIds, setSelectedSavedLetterIds] = useState([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Template Manager Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateEditorType, setTemplateEditorType] = useState('Renewal_Compound');
  const [templateEditorLang, setTemplateEditorLang] = useState('Bengali');
  const [templateEditorSubject, setTemplateEditorSubject] = useState('');
  const [templateEditorParas, setTemplateEditorParas] = useState(['', '', '']);
  const [templateEditorEnclosure, setTemplateEditorEnclosure] = useState('');
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    language: 'English', // English or Bengali
    letter_type: 'Renewal_Compound', // Encashment, Renewal_Compound, etc.
    ref_no: (() => {
      const prefix = '27.12.6400.506.04.044'; // overridden after settings load
      return `${prefix}.${new Date().getFullYear().toString().slice(2)}.${Math.floor(10 + Math.random() * 90)}`;
    })(),
    letter_date: new Date().toISOString().split('T')[0],
    bank_id: '',
    investment_id: '',
    recipient_designation: 'The Manager',
    recipient_bank_name: '',
    recipient_branch_address: '',
    subject: '',
    paragraphs: ['', '', ''],
    enclosure: 'Enclosure: Original FDR Certificate / Advice as described above.',
    prepared_by: '',
    approved_by: 'Md. Rabiul Haque',
    fiscal_year: (() => {
      const d = new Date();
      const y = d.getFullYear();
      return (d.getMonth() >= 6) ? `${y}-${y + 1}` : `${y - 1}-${y}`;
    })()
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [letData, bankData, invData, settingsData] = await Promise.all([
        api.getLetters(),
        api.getBanks(),
        api.getInvestments(),
        api.getSettings()
      ]);
      setLetters(letData);
      setBanks(bankData);
      setInvestments(invData);
      setSettings(settingsData || {});

      // Update initial ref_no using saved prefix
      const prefix = (settingsData && settingsData.memo_ref_prefix) || '27.12.6400.506.04.044';
      setFormData(prev => ({
        ...prev,
        ref_no: `${prefix}.${new Date().getFullYear().toString().slice(2)}.${Math.floor(10 + Math.random() * 90)}`
      }));

      let parsedCustom = [];
      try {
        if (settingsData && settingsData.custom_letter_types) {
          parsedCustom = JSON.parse(settingsData.custom_letter_types);
        }
      } catch (e) { }
      setCustomTypes(parsedCustom);

      // Load saved paragraph, subject, and enclosure templates
      let savedBody = {};
      let savedSubjects = {};
      let savedEnclosures = {};
      try {
        if (settingsData && settingsData.letter_body_templates) {
          savedBody = JSON.parse(settingsData.letter_body_templates);
        }
        if (settingsData && settingsData.letter_subject_templates) {
          savedSubjects = JSON.parse(settingsData.letter_subject_templates);
        }
        if (settingsData && settingsData.letter_enclosure_templates) {
          savedEnclosures = JSON.parse(settingsData.letter_enclosure_templates);
        }
      } catch (e) { }
      setLetterBodyTemplates(savedBody);
      setLetterSubjectTemplates(savedSubjects);
      setLetterEnclosureTemplates(savedEnclosures);

      const defaultBank = bankData.length > 0 ? bankData[0] : null;
      const defaultInv = invData.length > 0 ? invData[0] : null;

      let initBankId = defaultBank ? defaultBank.id : '';
      let initInvId = defaultInv ? defaultInv.id : '';

      if (initialData && initialData.newForInv) {
        initInvId = initialData.newForInv.id;
        initBankId = initialData.newForInv.bank_id;
      }

      applyTemplate('Encashment', 'English', initInvId, initBankId, invData, bankData, settingsData);
      if (initialData && initialData.newForInv) {
        setIsModalOpen(true);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomType = async () => {
    const { value: typeName } = await Swal.fire({
      title: 'Add Custom Letter Type',
      input: 'text',
      inputLabel: 'Letter Purpose / Type Name',
      inputPlaceholder: 'Enter letter type name...',
      showCancelButton: true,
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#475569',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Please enter a valid letter type name!';
        }
      }
    });

    if (!typeName) return;

    if (customTypes.includes(typeName.trim()) || ['Encashment', 'Renewal', 'Opening/Purchase', 'Tax Certificate Request'].includes(typeName.trim())) {
      showToast('This letter type already exists.', 'error');
      return;
    }

    const updatedTypes = [...customTypes, typeName.trim()];
    try {
      await api.updateSettings({ custom_letter_types: JSON.stringify(updatedTypes) });
      setCustomTypes(updatedTypes);
      showToast('Custom letter type added successfully', 'success');
      handleTypeChange(typeName.trim());
    } catch (err) {
      showToast('Failed to add custom type: ' + err.message, 'error');
    }
  };

  const handleDeleteCustomType = async () => {
    if (!customTypes.includes(formData.letter_type)) {
      showToast('Cannot delete default system letter types.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Custom Letter Type?',
      text: `Are you sure you want to delete "${formData.letter_type}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      background: '#0f172a',
      color: '#f8fafc'
    });

    if (!result.isConfirmed) return;

    const updatedTypes = customTypes.filter(t => t !== formData.letter_type);
    try {
      await api.updateSettings({ custom_letter_types: JSON.stringify(updatedTypes) });
      setCustomTypes(updatedTypes);
      showToast('Custom letter type deleted successfully', 'success');
      handleTypeChange('Encashment');
    } catch (err) {
      showToast('Failed to delete custom type: ' + err.message, 'error');
    }
  };

  const saveTemplatesToDb = async (
    newBody = letterBodyTemplates,
    newSubjects = letterSubjectTemplates,
    newEnclosures = letterEnclosureTemplates
  ) => {
    try {
      await api.updateSettings({
        letter_body_templates: JSON.stringify(newBody),
        letter_subject_templates: JSON.stringify(newSubjects),
        letter_enclosure_templates: JSON.stringify(newEnclosures)
      });
    } catch (err) {
      console.error('Failed to save letter templates to settings DB:', err);
    }
  };

  const applyTemplate = (
    type,
    lang,
    invId,
    bankId,
    invList = investments,
    bankList = banks,
    sysSettings = settings,
    savedBody = letterBodyTemplates,
    savedSubjects = letterSubjectTemplates,
    savedEnclosures = letterEnclosureTemplates
  ) => {
    const inv = invList.find(i => i.id === parseInt(invId));
    const bank = bankList.find(b => b.id === parseInt(bankId));

    const orgName = sysSettings.org_name || 'Gazipur Palli Bidyut Samity-2';
    const bankName = bank ? bank.name : '[Bank Name]';
    const branchAddress = bank ? `${bank.branch_name}, ${bank.address || ''}` : '[Branch & Address]';
    const matDate = inv ? formatDate(inv.maturity_date) : '[MATURITY-DATE]';
    const fundName = inv ? (inv.fund_name || 'কর্মচারী প্রভিডেন্ট ফান্ড (CPF)') : 'কর্মচারী প্রভিডেন্ট ফান্ড (CPF)';

    const isFundNameEnglish = /[a-zA-Z]/.test(fundName) && !/[\u0980-\u09FF]/.test(fundName);
    const selectedLang = lang || (isFundNameEnglish ? 'English' : 'Bengali');

    const lowerFund = (fundName || '').toLowerCase();
    const isCpfOrGratuity = lowerFund.includes('cpf') || lowerFund.includes('gpf') || fundName.includes('প্রভিডেন্ট') || lowerFund.includes('gratuity') || fundName.includes('গ্রাচ্যুইটি');
    const isTin = inv ? (inv.tin_provided === 1 || inv.tin_provided === true || inv.tin_provided === '1') : true;

    const taxRateBangla = isCpfOrGratuity
      ? 'আয়কর আইন অনুযায়ী ১০% উৎসে কর (AIT)'
      : isTin
        ? 'আয়কর আইন অনুযায়ী ২০% উৎসে কর (AIT)'
        : 'আয়কর আইন অনুযায়ী ৩০% উৎসে কর (AIT)';

    const taxRateEnglish = isCpfOrGratuity
      ? 'applicable Income Tax (AIT) at 10%'
      : isTin
        ? 'applicable Income Tax (AIT) at 20%'
        : 'applicable Income Tax (AIT) at 30%';

    const defaultContent = getDefaultLetterContent({
      type,
      lang: selectedLang,
      fundName,
      matDate,
      orgName,
      branchAddress,
      taxRateBangla,
      taxRateEnglish
    });

    let subject = defaultContent.subject;
    let paragraphs = defaultContent.paragraphs;
    let enclosure = defaultContent.enclosure;

    const templateKey = `${type}_${selectedLang}`;
    if (savedBody && savedBody[templateKey] && Array.isArray(savedBody[templateKey]) && savedBody[templateKey].length > 0) {
      paragraphs = savedBody[templateKey];
    }
    if (savedSubjects && savedSubjects[templateKey]) {
      subject = savedSubjects[templateKey];
    }
    if (savedEnclosures && savedEnclosures[templateKey]) {
      enclosure = savedEnclosures[templateKey];
    }

    if (type === 'Tax Certificate Request') {
      subject = subject.replace(/\s*-\s*\[.*?\]/g, '').replace(/\s*\[.*?\]/g, '');
      paragraphs = paragraphs.map(p => p.replace(/\s*under\s*"[^"]*"/gi, '').replace(/"[^"]*"-এর\s*/gi, ''));
    }

    setFormData(prev => ({
      id: prev.investment_id === (invId || '') ? prev.id : undefined,
      language: selectedLang,
      letter_type: type,
      ref_no: (prev.investment_id === (invId || '') && prev.ref_no)
        ? prev.ref_no
        : (() => {
          const prefix = (sysSettings && sysSettings.memo_ref_prefix) || '27.12.6400.506.04.044';
          return `${prefix}.${new Date().getFullYear().toString().slice(2)}.${Math.floor(10 + Math.random() * 90)}`;
        })(),
      letter_date: prev.letter_date || new Date().toISOString().split('T')[0],
      bank_id: bankId || '',
      investment_id: invId || '',
      recipient_designation: selectedLang === 'English' ? 'The Manager' : 'ব্যবস্থাপক',
      recipient_bank_name: bankName,
      recipient_branch_address: branchAddress,
      subject,
      paragraphs,
      enclosure,
      prepared_by: (sysSettings && sysSettings.signatory_agm_name !== undefined) ? sysSettings.signatory_agm_name : 'Md. Ariful Islam',
      approved_by: (sysSettings && sysSettings.signatory_gm_name) ? sysSettings.signatory_gm_name : 'Md. Rabiul Haque'
    }));
  };

  const handleSubjectChange = (val) => {
    setFormData(prev => ({ ...prev, subject: val }));
    const templateKey = `${formData.letter_type}_${formData.language}`;
    const updatedSubjects = { ...letterSubjectTemplates, [templateKey]: val };
    setLetterSubjectTemplates(updatedSubjects);
    saveTemplatesToDb(letterBodyTemplates, updatedSubjects, letterEnclosureTemplates);
  };

  const handleParagraphChange = (idx, val) => {
    const newParas = [...formData.paragraphs];
    newParas[idx] = val;
    setFormData(prev => ({ ...prev, paragraphs: newParas }));

    const templateKey = `${formData.letter_type}_${formData.language}`;
    const updatedBody = { ...letterBodyTemplates, [templateKey]: newParas };
    setLetterBodyTemplates(updatedBody);
    saveTemplatesToDb(updatedBody, letterSubjectTemplates, letterEnclosureTemplates);
  };

  const handleAddParagraph = () => {
    const newParas = [...formData.paragraphs, ''];
    setFormData(prev => ({ ...prev, paragraphs: newParas }));

    const templateKey = `${formData.letter_type}_${formData.language}`;
    const updatedBody = { ...letterBodyTemplates, [templateKey]: newParas };
    setLetterBodyTemplates(updatedBody);
    saveTemplatesToDb(updatedBody, letterSubjectTemplates, letterEnclosureTemplates);
  };

  const handleRemoveParagraph = (idx) => {
    if (formData.paragraphs.length <= 1) return;
    const newParas = formData.paragraphs.filter((_, i) => i !== idx);
    setFormData(prev => ({ ...prev, paragraphs: newParas }));

    const templateKey = `${formData.letter_type}_${formData.language}`;
    const updatedBody = { ...letterBodyTemplates, [templateKey]: newParas };
    setLetterBodyTemplates(updatedBody);
    saveTemplatesToDb(updatedBody, letterSubjectTemplates, letterEnclosureTemplates);
  };

  const handleEnclosureChange = (val) => {
    setFormData(prev => ({ ...prev, enclosure: val }));
    const templateKey = `${formData.letter_type}_${formData.language}`;
    const updatedEnclosures = { ...letterEnclosureTemplates, [templateKey]: val };
    setLetterEnclosureTemplates(updatedEnclosures);
    saveTemplatesToDb(letterBodyTemplates, letterSubjectTemplates, updatedEnclosures);
  };

  const handleResetTemplate = () => {
    const templateKey = `${formData.letter_type}_${formData.language}`;
    const updatedBody = { ...letterBodyTemplates };
    const updatedSubjects = { ...letterSubjectTemplates };
    const updatedEnclosures = { ...letterEnclosureTemplates };

    delete updatedBody[templateKey];
    delete updatedSubjects[templateKey];
    delete updatedEnclosures[templateKey];

    setLetterBodyTemplates(updatedBody);
    setLetterSubjectTemplates(updatedSubjects);
    setLetterEnclosureTemplates(updatedEnclosures);
    saveTemplatesToDb(updatedBody, updatedSubjects, updatedEnclosures);

    applyTemplate(
      formData.letter_type, 
      formData.language, 
      formData.investment_id, 
      formData.bank_id, 
      investments, 
      banks, 
      settings, 
      updatedBody, 
      updatedSubjects, 
      updatedEnclosures
    );
    showToast(`Reset letter template for ${formData.letter_type} (${formData.language}) to default`, 'info');
  };

  const loadTemplateIntoEditor = (type = selectedLetterType, lang = selectedLanguage) => {
    setTemplateEditorType(type);
    setTemplateEditorLang(lang);
    const templateKey = `${type}_${lang}`;

    const defaultContent = getDefaultLetterContent({
      type,
      lang,
      fundName: '[ফান্ডের নাম / Fund Name]',
      matDate: '[মেয়াদ তারিখ / Maturity Date]',
      orgName: settings.org_name || 'Gazipur Palli Bidyut Samity-2',
      branchAddress: '[শাখা ও ঠিকানা / Branch Address]',
      taxRateBangla: 'আয়কর আইন অনুযায়ী ১০% উৎসে কর (AIT)',
      taxRateEnglish: 'applicable Income Tax (AIT) at 10%'
    });

    const subject = (letterSubjectTemplates && letterSubjectTemplates[templateKey]) || defaultContent.subject;
    const paragraphs = (letterBodyTemplates && letterBodyTemplates[templateKey] && letterBodyTemplates[templateKey].length > 0)
      ? [...letterBodyTemplates[templateKey]]
      : [...defaultContent.paragraphs];
    const enclosure = (letterEnclosureTemplates && letterEnclosureTemplates[templateKey]) || defaultContent.enclosure;

    setTemplateEditorSubject(subject);
    setTemplateEditorParas(paragraphs);
    setTemplateEditorEnclosure(enclosure);
  };

  const handleOpenTemplateManager = (type = selectedLetterType, lang = selectedLanguage) => {
    loadTemplateIntoEditor(type, lang);
    setIsTemplateModalOpen(true);
  };

  const handleEditorTypeChange = (newType) => {
    loadTemplateIntoEditor(newType, templateEditorLang);
  };

  const handleEditorLangChange = (newLang) => {
    loadTemplateIntoEditor(templateEditorType, newLang);
  };

  const handleEditorParaChange = (idx, val) => {
    const updated = [...templateEditorParas];
    updated[idx] = val;
    setTemplateEditorParas(updated);
  };

  const handleAddEditorPara = () => {
    setTemplateEditorParas([...templateEditorParas, '']);
  };

  const handleRemoveEditorPara = (idx) => {
    if (templateEditorParas.length <= 1) return;
    setTemplateEditorParas(templateEditorParas.filter((_, i) => i !== idx));
  };

  const handleSaveEditorTemplate = async () => {
    const templateKey = `${templateEditorType}_${templateEditorLang}`;
    const cleanedParas = templateEditorParas.filter(p => p.trim() !== '');
    if (cleanedParas.length === 0) {
      showToast('Please enter at least one paragraph for the letter body.', 'warning');
      return;
    }
    const updatedBody = { ...letterBodyTemplates, [templateKey]: cleanedParas };
    const updatedSubjects = { ...letterSubjectTemplates, [templateKey]: templateEditorSubject };
    const updatedEnclosures = { ...letterEnclosureTemplates, [templateKey]: templateEditorEnclosure };

    setLetterBodyTemplates(updatedBody);
    setLetterSubjectTemplates(updatedSubjects);
    setLetterEnclosureTemplates(updatedEnclosures);

    try {
      await saveTemplatesToDb(updatedBody, updatedSubjects, updatedEnclosures);
      showToast(`Saved draft template for ${templateEditorType} (${templateEditorLang}) successfully!`, 'success');
      setIsTemplateModalOpen(false);
    } catch (err) {
      showToast('Failed to save template: ' + err.message, 'error');
    }
  };

  const handleResetEditorTemplate = async () => {
    const result = await Swal.fire({
      title: 'Reset Template to Default?',
      text: `Are you sure you want to reset "${templateEditorType}" (${templateEditorLang}) back to the system standard template?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reset to Default',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#64748b'
    });

    if (!result.isConfirmed) return;

    const templateKey = `${templateEditorType}_${templateEditorLang}`;
    const updatedBody = { ...letterBodyTemplates };
    const updatedSubjects = { ...letterSubjectTemplates };
    const updatedEnclosures = { ...letterEnclosureTemplates };

    delete updatedBody[templateKey];
    delete updatedSubjects[templateKey];
    delete updatedEnclosures[templateKey];

    setLetterBodyTemplates(updatedBody);
    setLetterSubjectTemplates(updatedSubjects);
    setLetterEnclosureTemplates(updatedEnclosures);

    try {
      await saveTemplatesToDb(updatedBody, updatedSubjects, updatedEnclosures);
      loadTemplateIntoEditor(templateEditorType, templateEditorLang);
      showToast(`Template for ${templateEditorType} (${templateEditorLang}) reset to system default!`, 'info');
    } catch (err) {
      showToast('Failed to reset template: ' + err.message, 'error');
    }
  };

  const getActivePreviewContent = () => {
    const sampleInv = (selectedInvIds.length > 0 ? filteredMaturedInvs.find(i => i.id === selectedInvIds[0]) : null) || filteredMaturedInvs[0] || (investments.length > 0 ? investments[0] : null);
    const activeType = sampleInv ? getInvLetterType(sampleInv.id) : (selectedLetterType || 'Renewal_Compound');
    const activeLang = sampleInv ? getInvLanguage(sampleInv.id) : selectedLanguage;

    const orgName = settings.org_name || 'Gazipur Palli Bidyut Samity-2';
    const fundName = sampleInv ? (sampleInv.fund_name || 'কর্মচারী প্রভিডেন্ট ফান্ড (CPF)') : 'কর্মচারী প্রভিডেন্ট ফান্ড (CPF)';
    const matDate = sampleInv ? formatDate(sampleInv.maturity_date) : '[Maturity Date / মেয়াদ তারিখ]';
    const branchAddress = sampleInv ? `${sampleInv.branch_name || sampleInv.bank_branch || ''}` : '[Branch / শাখা]';

    const lowerFund = (fundName || '').toLowerCase();
    const isCpfOrGratuity = lowerFund.includes('cpf') || lowerFund.includes('gpf') || fundName.includes('প্রভিডেন্ট') || lowerFund.includes('gratuity') || fundName.includes('গ্রাচ্যুইটি');
    const isTin = sampleInv ? (sampleInv.tin_provided === 1 || sampleInv.tin_provided === true || sampleInv.tin_provided === '1') : true;

    const taxRateBangla = isCpfOrGratuity ? 'আয়কর আইন অনুযায়ী ১০% উৎসে কর (AIT)' : isTin ? 'আয়কর আইন অনুযায়ী ২০% উৎসে কর (AIT)' : 'আয়কর আইন অনুযায়ী ৩০% উৎসে কর (AIT)';
    const taxRateEnglish = isCpfOrGratuity ? 'applicable Income Tax (AIT) at 10%' : isTin ? 'applicable Income Tax (AIT) at 20%' : 'applicable Income Tax (AIT) at 30%';

    const defaultContent = getDefaultLetterContent({
      type: activeType,
      lang: activeLang,
      fundName,
      matDate,
      orgName,
      branchAddress,
      taxRateBangla,
      taxRateEnglish
    });

    const templateKey = `${activeType}_${activeLang}`;
    const subject = (letterSubjectTemplates && letterSubjectTemplates[templateKey]) || defaultContent.subject;
    const paragraphs = (letterBodyTemplates && letterBodyTemplates[templateKey] && letterBodyTemplates[templateKey].length > 0)
      ? letterBodyTemplates[templateKey]
      : defaultContent.paragraphs;
    const enclosure = (letterEnclosureTemplates && letterEnclosureTemplates[templateKey]) || defaultContent.enclosure;

    return { subject, paragraphs, enclosure, activeType, activeLang };
  };

  const handleLanguageToggle = (lang) => {
    applyTemplate(formData.letter_type, lang, formData.investment_id, formData.bank_id, investments, banks, settings, letterBodyTemplates, letterSubjectTemplates, letterEnclosureTemplates);
  };

  const handleTypeChange = (type) => {
    applyTemplate(type, formData.language, formData.investment_id, formData.bank_id, investments, banks, settings, letterBodyTemplates, letterSubjectTemplates, letterEnclosureTemplates);
  };

  const handleInvestmentSelect = (invId) => {
    const inv = investments.find(i => i.id === parseInt(invId));
    const bankId = inv ? inv.bank_id : formData.bank_id;

    const currentDateStr = formData.letter_date || new Date().toISOString().split('T')[0];
    const existingSameDateLetter = letters.find(l =>
      l.investment_id === parseInt(invId) &&
      (l.letter_date ? l.letter_date.split('T')[0] : '') === currentDateStr
    );
    const existingLetter = existingSameDateLetter || letters.find(l => l.investment_id === parseInt(invId));

    if (existingLetter) {
      handleEditLetter(existingLetter);
      showToast(`Found existing letter for FDR #${inv?.fdr_no}. Changing purpose or details will overwrite this letter.`, 'info');
      return;
    }

    const isFundEnglish = inv ? (/[a-zA-Z]/.test(inv.fund_name || '') && !/[\u0980-\u09FF]/.test(inv.fund_name || '')) : false;
    const targetLang = isFundEnglish ? 'English' : 'Bengali';
    applyTemplate(formData.letter_type, targetLang, invId, bankId, investments, banks, settings, letterBodyTemplates, letterSubjectTemplates, letterEnclosureTemplates);
  };

  const handleEditLetter = (letItem) => {
    let parsedSpecs = {};
    try {
      if (letItem.special_instructions) {
        parsedSpecs = JSON.parse(letItem.special_instructions);
      }
    } catch (e) {
      parsedSpecs = {};
    }

    const bodyParts = (letItem.body_content || '').split('\n\n');

    setFormData({
      id: letItem.id,
      language: parsedSpecs.language || 'Bengali',
      letter_type: letItem.letter_type,
      ref_no: letItem.ref_no,
      letter_date: letItem.letter_date ? letItem.letter_date.split('T')[0] : new Date().toISOString().split('T')[0],
      bank_id: letItem.bank_id || '',
      investment_id: letItem.investment_id || '',
      recipient_designation: letItem.recipient_designation || 'ব্যবস্থাপক',
      recipient_bank_name: parsedSpecs.recipient_bank_name || letItem.bank_name || '',
      recipient_branch_address: parsedSpecs.recipient_branch_address || letItem.branch_name || '',
      subject: letItem.subject,
      paragraphs: parsedSpecs.paragraphs || bodyParts,
      enclosure: parsedSpecs.enclosure || 'সংযুক্ত: বর্ণনা অনুযায়ী স্থায়ী আমানত রশিদ।',
      prepared_by: parsedSpecs.prepared_by !== undefined ? parsedSpecs.prepared_by : (settings.signatory_agm_name ? settings.signatory_agm_name : 'Md. Ariful Islam'),
      approved_by: parsedSpecs.approved_by !== undefined ? parsedSpecs.approved_by : (settings.signatory_gm_name ? settings.signatory_gm_name : 'Md. Rabiul Haque'),
      fiscal_year: parsedSpecs.fiscal_year || (() => {
        const d = new Date();
        const y = d.getFullYear();
        return (d.getMonth() >= 6) ? `${y}-${y + 1}` : `${y - 1}-${y}`;
      })()
    });

    setIsModalOpen(true);
  };

  const handleBankSelect = (bankId) => {
    applyTemplate(formData.letter_type, formData.language, formData.investment_id, bankId, investments, banks, settings, letterBodyTemplates, letterSubjectTemplates, letterEnclosureTemplates);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const templateKey = `${formData.letter_type}_${formData.language}`;
      const updatedBody = { ...letterBodyTemplates, [templateKey]: formData.paragraphs };
      const updatedSubjects = { ...letterSubjectTemplates, [templateKey]: formData.subject };
      const updatedEnclosures = { ...letterEnclosureTemplates, [templateKey]: formData.enclosure };
      setLetterBodyTemplates(updatedBody);
      setLetterSubjectTemplates(updatedSubjects);
      setLetterEnclosureTemplates(updatedEnclosures);
      await saveTemplatesToDb(updatedBody, updatedSubjects, updatedEnclosures);

      const fullBody = formData.paragraphs.join('\n\n');
      const res = await api.createLetter({
        ...formData,
        body_content: fullBody,
        special_instructions: JSON.stringify({
          language: formData.language,
          paragraphs: formData.paragraphs,
          enclosure: formData.enclosure,
          recipient_bank_name: formData.recipient_bank_name,
          recipient_branch_address: formData.recipient_branch_address,
          prepared_by: formData.prepared_by,
          approved_by: formData.approved_by,
          fiscal_year: formData.fiscal_year
        })
      });
      showToast(res.message || 'Official bank letter saved/overwritten successfully!', 'success');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteLetter = async (letItem) => {
    const result = await Swal.fire({
      title: 'Delete Bank Letter?',
      html: `Are you sure you want to delete bank letter <b>"${letItem.ref_no}"</b>?<br/><span style="font-size:12px;color:#ef4444">This action cannot be undone.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b'
    });

    if (!result.isConfirmed) return;

    try {
      setDeleting(true);
      await api.deleteLetter(letItem.id);
      showToast('Bank letter deleted successfully', 'info');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSendLetterEmail = async (letItem) => {
    if (!letItem) return;
    const associatedBank = banks.find(b => b.id === letItem.bank_id) || {};
    const bankName = letItem.bank_name || associatedBank.name || 'Bank';
    const branchName = letItem.branch_name || associatedBank.branch_name || '';
    const bankEmail = letItem.bank_email || associatedBank.email || '';
    const userEmail = settings.alert_email_address || settings.smtp_sender_email || 'gazi2agmfin@gmail.com';

    const result = await Swal.fire({
      title: 'Email Official Bank Letter',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <div style="margin-bottom: 12px; padding: 12px; background: rgba(56, 189, 248, 0.1); border-left: 4px solid #0284c7; border-radius: 6px;">
            <strong>Ref No:</strong> <code style="font-size: 13px; font-weight: bold; color: #0284c7;">${letItem.ref_no || 'N/A'}</code><br/>
            <strong>Subject:</strong> ${letItem.subject || 'Bank Letter'}<br/>
            <strong>Bank:</strong> ${bankName} (${branchName})
          </div>

          <div style="margin-bottom: 12px;">
            <label style="font-weight: 700; display: block; margin-bottom: 4px; color: var(--text-main);">
              Destination Bank Branch Email:
            </label>
            <input 
              id="swal-letter-bank-email" 
              class="swal2-input" 
              style="margin: 0; width: 100%; box-sizing: border-box; font-size: 13px;" 
              placeholder="e.g. branch@bank.org.bd" 
              value="${bankEmail}" 
            />
            ${!bankEmail ? '<div style="color: #f59e0b; font-size: 11px; margin-top: 3px;">⚠️ No email found in Bank Directory for this branch. Please enter an email.</div>' : ''}
          </div>

          <div>
            <label style="font-weight: 700; display: block; margin-bottom: 4px; color: var(--text-main);">
              Carbon Copy (CC) to PBS User:
            </label>
            <input 
              id="swal-letter-user-email" 
              class="swal2-input" 
              style="margin: 0; width: 100%; box-sizing: border-box; font-size: 13px;" 
              value="${userEmail}" 
            />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '📧 Send Letter via Email',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
      focusConfirm: false,
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const destBankEmail = (document.getElementById('swal-letter-bank-email')?.value || '').trim();
        const destUserEmail = (document.getElementById('swal-letter-user-email')?.value || '').trim();
        if (!destBankEmail && !destUserEmail) {
          Swal.showValidationMessage('Please provide at least one recipient email.');
          return false;
        }
        try {
          const res = await api.sendBankLetterEmail(letItem.id, {
            custom_to: destBankEmail,
            custom_cc: destUserEmail
          });
          return res;
        } catch (err) {
          Swal.showValidationMessage(err.message || 'Failed to dispatch letter email.');
          return false;
        }
      }
    });

    if (result.isConfirmed && result.value) {
      Swal.fire({
        icon: 'success',
        title: 'Letter Dispatched via Email!',
        text: result.value.message || 'Official letter successfully sent to Bank and CC to User.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handlePrint = (letter) => {
    setSelectedLetter(letter);
    setPrintLettersList([letter]);
    setIsPrintModalOpen(true);
  };

  const buildLetterObject = (inv, type = selectedLetterType, lang = selectedLanguage) => {
    const bank = banks.find(b => b.id === inv.bank_id) || {
      name: inv.bank_name || 'Bank',
      branch_name: inv.branch_name || inv.bank_branch || '',
      address: ''
    };

    const orgName = settings.org_name || 'Gazipur Palli Bidyut Samity-2';
    const bankName = bank.name;
    const branchAddress = `${bank.branch_name || ''}${bank.address ? `, ${bank.address}` : ''}`;
    const matDate = formatDate(inv.maturity_date);
    const fundName = inv.fund_name || 'কর্মচারী প্রভিডেন্ট ফান্ড (CPF)';

    const lowerFund = (fundName || '').toLowerCase();
    const isCpfOrGratuity = lowerFund.includes('cpf') || lowerFund.includes('gpf') || fundName.includes('প্রভিডেন্ট') || lowerFund.includes('gratuity') || fundName.includes('গ্রাচ্যুইটি');
    const isTin = inv ? (inv.tin_provided === 1 || inv.tin_provided === true || inv.tin_provided === '1') : true;

    const taxRateBangla = isCpfOrGratuity
      ? 'আয়কর আইন অনুযায়ী ১০% উৎসে কর (AIT)'
      : isTin
        ? 'আয়কর আইন অনুযায়ী ২০% উৎসে কর (AIT)'
        : 'আয়কর আইন অনুযায়ী ৩০% উৎসে কর (AIT)';

    const taxRateEnglish = isCpfOrGratuity
      ? 'applicable Income Tax (AIT) at 10%'
      : isTin
        ? 'applicable Income Tax (AIT) at 20%'
        : 'applicable Income Tax (AIT) at 30%';

    const defaultContent = getDefaultLetterContent({
      type,
      lang,
      fundName,
      matDate,
      orgName,
      branchAddress,
      taxRateBangla,
      taxRateEnglish
    });

    let subject = defaultContent.subject;
    let paragraphs = defaultContent.paragraphs;
    let enclosure = defaultContent.enclosure;

    const templateKey = `${type}_${lang}`;
    if (letterBodyTemplates && letterBodyTemplates[templateKey] && Array.isArray(letterBodyTemplates[templateKey]) && letterBodyTemplates[templateKey].length > 0) {
      paragraphs = letterBodyTemplates[templateKey];
    }
    if (letterSubjectTemplates && letterSubjectTemplates[templateKey]) {
      subject = letterSubjectTemplates[templateKey];
    }
    if (letterEnclosureTemplates && letterEnclosureTemplates[templateKey]) {
      enclosure = letterEnclosureTemplates[templateKey];
    }

    const prefix = settings.memo_ref_prefix || '27.12.6400.506.04.044';
    const yearSuffix = new Date().getFullYear().toString().slice(2);
    const numPart = (inv.fdr_no || '').replace(/\D/g, '').slice(-3) || '01';
    const ref_no = `${prefix}.${yearSuffix}.${numPart}`;

    return {
      id: `temp_${inv.id}`,
      investment_id: inv.id,
      bank_id: inv.bank_id,
      bank_name: bank.name,
      branch_name: bank.branch_name,
      bank_address: bank.address,
      ref_no,
      letter_date: new Date().toISOString().split('T')[0],
      letter_type: type,
      recipient_designation: lang === 'English' ? 'The Manager' : 'ব্যবস্থাপক',
      subject,
      body_content: paragraphs.join('\n\n'),
      language: lang,
      special_instructions: JSON.stringify({
        language: lang,
        paragraphs,
        enclosure,
        recipient_bank_name: bank.name,
        recipient_branch_address: branchAddress,
        prepared_by: settings.signatory_agm_name !== undefined ? settings.signatory_agm_name : 'Md. Ariful Islam',
        approved_by: settings.signatory_gm_name !== undefined ? settings.signatory_gm_name : 'Md. Rabiul Haque'
      }),
      associated_inv: inv
    };
  };

  const availableYears = Array.from(new Set(investments.map(i => i.maturity_date ? i.maturity_date.slice(0, 4) : '').filter(Boolean)));
  const curYear = String(new Date().getFullYear());
  if (!availableYears.includes(curYear)) availableYears.push(curYear);
  const nextYear = String(new Date().getFullYear() + 1);
  if (!availableYears.includes(nextYear)) availableYears.push(nextYear);
  availableYears.sort();

  const months = [
    { value: 'ALL', label: 'All Months (সকল মাস)' },
    { value: '01', label: '01 - January (জানুয়ারি)' },
    { value: '02', label: '02 - February (ফেব্রুয়ারি)' },
    { value: '03', label: '03 - March (মার্চ)' },
    { value: '04', label: '04 - April (এপ্রিল)' },
    { value: '05', label: '05 - May (মে)' },
    { value: '06', label: '06 - June (জুন)' },
    { value: '07', label: '07 - July (জুলাই)' },
    { value: '08', label: '08 - August (আগস্ট)' },
    { value: '09', label: '09 - September (সেপ্টেম্বর)' },
    { value: '10', label: '10 - October (অক্টোবর)' },
    { value: '11', label: '11 - November (নভেম্বর)' },
    { value: '12', label: '12 - December (ডিসেম্বর)' }
  ];

  const defaultLetterTypes = [
    { value: 'Renewal_Compound', label: 'Renewal: Compound (মূলধন ও অর্জিত মুনাফাসহ পুনবিনিয়োগ)', group: 'FDR Renewal Variants (নবায়ন ধরণসমূহ)' },
    { value: 'Renewal_Profit_To_Account', label: 'Renewal: Profit to Bank Account (শুধু মূলধন নবায়ন, মুনাফা ব্যাংক হিসাবে)', group: 'FDR Renewal Variants (নবায়ন ধরণসমূহ)' },
    { value: 'Renewal_Profit_PayOrder', label: 'Renewal: Profit Pay Order (শুধু মূলধন নবায়ন, মুনাফার পে-অর্ডার ইস্যু)', group: 'FDR Renewal Variants (নবায়ন ধরণসমূহ)' },
    { value: 'Renewal_Standard', label: 'Renewal: Standard (সাধারণ এফডিআর নবায়ন)', group: 'FDR Renewal Variants (নবায়ন ধরণসমূহ)' },
    { value: 'Renewal', label: 'Renewal: General (পূর্ববর্তী সাধারণ নবায়ন)', group: 'FDR Renewal Variants (নবায়ন ধরণসমূহ)' },
    { value: 'Encashment', label: 'FDR Encashment (স্থায়ী আমানত নগদায়ন)', group: 'FDR Encashment (নগদায়ন)' },
    { value: 'Opening/Purchase', label: 'New FDR Opening (নতুন আমানত খোলা)', group: 'Other Letter Types (অন্যান্য পত্র)' },
    { value: 'Tax Certificate Request', label: 'Tax Certificate Request (আয়কর ও মুনাফা সনদ)', group: 'Other Letter Types (অন্যান্য পত্র)' }
  ];
  const allLetterTypeOptions = [
    ...defaultLetterTypes,
    ...customTypes.filter(t => !defaultLetterTypes.some(d => d.value === t)).map(t => ({
      value: t,
      label: t,
      group: 'Custom Letter Types (কাস্টম পত্র ধরণ)'
    }))
  ];

  const filteredMaturedInvs = investments.filter(inv => {
    // 1. Maturity date filter
    if (inv.maturity_date) {
      const parts = inv.maturity_date.split('-');
      const invYear = parts[0];
      const invMonth = parts[1];
      if (selectedYear !== 'ALL' && invYear !== selectedYear) {
        return false;
      }
      if (selectedMonth !== 'ALL' && invMonth !== selectedMonth) {
        return false;
      }
    } else {
      if (selectedYear !== 'ALL' || selectedMonth !== 'ALL') return false;
    }

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFdr = (inv.fdr_no || '').toLowerCase().includes(q);
      const matchBank = (inv.bank_name || '').toLowerCase().includes(q);
      const matchBranch = (inv.branch_name || inv.bank_branch || '').toLowerCase().includes(q);
      const matchFund = (inv.fund_name || '').toLowerCase().includes(q);
      const matchAcc = (inv.account_no || '').toLowerCase().includes(q);
      if (!matchFdr && !matchBank && !matchBranch && !matchFund && !matchAcc) {
        return false;
      }
    }

    return true;
  });

  const totalPrincipalAmount = filteredMaturedInvs.reduce((sum, inv) => sum + (parseFloat(inv.principal_amount) || 0), 0);

  const allSelected = filteredMaturedInvs.length > 0 && filteredMaturedInvs.every(i => selectedInvIds.includes(i.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedInvIds([]);
    } else {
      setSelectedInvIds(filteredMaturedInvs.map(i => i.id));
    }
  };

  const toggleSelectInv = (id) => {
    setSelectedInvIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getInvLetterType = (invId) => {
    if (rowLetterTypes[invId]) return rowLetterTypes[invId];
    const saved = letters.find(l => l.investment_id === parseInt(invId));
    if (saved && saved.letter_type) return saved.letter_type;
    return selectedLetterType;
  };

  const getInvLanguage = (invId) => {
    if (rowLanguages[invId]) return rowLanguages[invId];
    const saved = letters.find(l => l.investment_id === parseInt(invId));
    if (saved && saved.special_instructions) {
      try {
        const specs = typeof saved.special_instructions === 'string' ? JSON.parse(saved.special_instructions) : saved.special_instructions;
        if (specs && specs.language) return specs.language;
      } catch (e) { }
    }
    return selectedLanguage;
  };

  const handleRowLetterTypeChange = (invId, newType) => {
    setRowLetterTypes(prev => ({
      ...prev,
      [invId]: newType
    }));
  };

  const handleApplyTypeToAllRows = () => {
    const updated = {};
    filteredMaturedInvs.forEach(inv => {
      updated[inv.id] = selectedLetterType;
    });
    setRowLetterTypes(prev => ({ ...prev, ...updated }));
    showToast(`Applied "${selectedLetterType}" to all listed FDR rows`, 'info');
  };

  const resolveLetterForInv = (inv, preferredType, preferredLang) => {
    const targetType = preferredType || getInvLetterType(inv.id);
    const targetLang = preferredLang || getInvLanguage(inv.id);

    // Look for existing saved letter in archive for this investment and matching type
    const savedLetter = letters.find(l =>
      l.investment_id === inv.id &&
      (l.letter_type === targetType ||
        (targetType.startsWith('Renewal') && (l.letter_type || '').startsWith('Renewal')))
    );

    const bank = banks.find(b => b.id === inv.bank_id) || {
      name: inv.bank_name || 'Bank',
      branch_name: inv.branch_name || inv.bank_branch || '',
      address: ''
    };
    const branchAddress = `${bank.branch_name || ''}${bank.address ? `, ${bank.address}` : ''}`;

    if (savedLetter) {
      let parsedSpecs = {};
      try {
        if (savedLetter.special_instructions) {
          parsedSpecs = typeof savedLetter.special_instructions === 'string'
            ? JSON.parse(savedLetter.special_instructions)
            : savedLetter.special_instructions;
        }
      } catch (e) { }

      const bodyParts = (savedLetter.body_content || '').split('\n\n').filter(p => p.trim());
      const letterLang = parsedSpecs.language || savedLetter.language || targetLang;

      // If user explicitly switched type away from what was saved (e.g. from Renewal to Encashment),
      // build fresh letter object for targetType so the correct body text is used!
      if (savedLetter.letter_type !== targetType && !(savedLetter.letter_type.startsWith('Renewal') && targetType.startsWith('Renewal'))) {
        return buildLetterObject(inv, targetType, targetLang);
      }

      return {
        ...savedLetter,
        investment_id: inv.id,
        bank_id: inv.bank_id,
        bank_name: bank.name,
        branch_name: bank.branch_name,
        bank_address: bank.address,
        letter_type: targetType,
        recipient_designation: letterLang === 'English' ? 'The Manager' : 'ব্যবস্থাপক',
        language: letterLang,
        subject: savedLetter.subject,
        body_content: savedLetter.body_content,
        special_instructions: JSON.stringify({
          language: letterLang,
          paragraphs: parsedSpecs.paragraphs || bodyParts,
          enclosure: parsedSpecs.enclosure || (letterLang === 'English' ? 'Enclosure: Original FDR Certificate / Advice as described above.' : 'সংযুক্ত: বর্ণনা অনুযায়ী মূল স্থায়ী আমানত রশিদ।'),
          recipient_bank_name: bank.name,
          recipient_branch_address: branchAddress,
          prepared_by: parsedSpecs.prepared_by !== undefined ? parsedSpecs.prepared_by : (settings.signatory_agm_name !== undefined ? settings.signatory_agm_name : 'Md. Ariful Islam'),
          approved_by: parsedSpecs.approved_by !== undefined ? parsedSpecs.approved_by : (settings.signatory_gm_name !== undefined ? settings.signatory_gm_name : 'Md. Rabiul Haque'),
          fiscal_year: parsedSpecs.fiscal_year
        }),
        associated_inv: inv
      };
    }

    return buildLetterObject(inv, targetType, targetLang);
  };

  const handlePrintSelected = () => {
    const targetInvs = filteredMaturedInvs.filter(i => selectedInvIds.includes(i.id));
    if (targetInvs.length === 0) {
      showToast('Please select at least one FDR from the table using checkboxes.', 'warning');
      return;
    }
    const lettersToPrint = targetInvs.map(inv => resolveLetterForInv(inv));
    setPrintLettersList(lettersToPrint);
    setSelectedLetter(lettersToPrint[0]);
    setIsPrintModalOpen(true);
  };

  const handlePrintAll = () => {
    if (filteredMaturedInvs.length === 0) {
      showToast('No FDRs listed for the selected month/filters.', 'info');
      return;
    }
    const lettersToPrint = filteredMaturedInvs.map(inv => resolveLetterForInv(inv));
    setPrintLettersList(lettersToPrint);
    setSelectedLetter(lettersToPrint[0]);
    setIsPrintModalOpen(true);
  };

  const handlePrintSingleInv = (inv) => {
    const letter = resolveLetterForInv(inv);
    setPrintLettersList([letter]);
    setSelectedLetter(letter);
    setIsPrintModalOpen(true);
  };

  const handleCustomizeInvLetter = (inv) => {
    const targetType = getInvLetterType(inv.id);
    const targetLang = getInvLanguage(inv.id);

    const existing = letters.find(l =>
      l.investment_id === inv.id &&
      (l.letter_type === targetType ||
        (targetType.startsWith('Renewal') && (l.letter_type || '').startsWith('Renewal')))
    );

    if (existing) {
      handleEditLetter(existing);
      return;
    }

    applyTemplate(
      targetType,
      targetLang,
      inv.id,
      inv.bank_id,
      investments,
      banks,
      settings,
      letterBodyTemplates,
      letterSubjectTemplates,
      letterEnclosureTemplates
    );
    setIsModalOpen(true);
  };

  const toggleSelectSavedLetter = (id) => {
    setSelectedSavedLetterIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAllSavedLetters = () => {
    if (letters.length > 0 && letters.every(l => selectedSavedLetterIds.includes(l.id))) {
      setSelectedSavedLetterIds([]);
    } else {
      setSelectedSavedLetterIds(letters.map(l => l.id));
    }
  };

  const handlePrintSelectedSavedLetters = () => {
    const targetLetters = letters.filter(l => selectedSavedLetterIds.includes(l.id));
    if (targetLetters.length === 0) {
      showToast('Please select at least one letter from the archive using checkboxes.', 'warning');
      return;
    }
    const activeList = targetLetters.map(l => ({
      ...l,
      associated_inv: l.investment_id ? investments.find(i => i.id === l.investment_id) : null
    }));
    setPrintLettersList(activeList);
    setSelectedLetter(activeList[0]);
    setIsPrintModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* TOP HEADER WITH TABS */}
      <div className="glass-panel" style={{ padding: '6px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Official Bank Letters &amp; Correspondence
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              (Batch Print &amp; Drafts)
            </span>
          </div>

          {/* TAB BUTTONS */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('matured_fdr_letters')}
              className={activeTab === 'matured_fdr_letters' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={14} />
              <span>Matured FDR Letters</span>
              <span className="badge" style={{
                background: activeTab === 'matured_fdr_letters' ? 'rgba(255,255,255,0.25)' : 'var(--primary)',
                color: '#fff',
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '8px'
              }}>
                {filteredMaturedInvs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('saved_letters')}
              className={activeTab === 'saved_letters' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Building2 size={14} />
              <span>Saved Archive</span>
              <span className="badge" style={{
                background: activeTab === 'saved_letters' ? 'rgba(255,255,255,0.25)' : 'var(--primary)',
                color: '#fff',
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '8px'
              }}>
                {letters.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'matured_fdr_letters' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* CONTROLS CARD: MONTH, YEAR, LETTER TYPE, LANGUAGE & SEARCH */}
          <div className="glass-panel" style={{ padding: '8px 12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', alignItems: 'flex-end' }}>
              
              {/* 1. SELECT MONTH */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Calendar size={14} color="var(--primary)" />
                  <span>Select Month</span>
                </label>
                <select
                  className="form-select"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setSelectedInvIds([]);
                  }}
                  style={{ fontWeight: '600' }}
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* 2. SELECT YEAR */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Calendar size={14} color="var(--primary)" />
                  <span>Select Year</span>
                </label>
                <select
                  className="form-select"
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setSelectedInvIds([]);
                  }}
                  style={{ fontWeight: '600' }}
                >
                  <option value="ALL">All Years (সকল বছর)</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              {/* 3. LANGUAGE SELECTOR */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Languages size={14} color="var(--primary)" />
                  <span>Letter Language (ভাষা)</span>
                </label>
                <select
                  className="form-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  style={{ fontWeight: '600' }}
                >
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="English">English</option>
                </select>
              </div>

              {/* 4. SEARCH INPUT */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Search size={14} color="var(--primary)" />
                  <span>Search Filter</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="FDR No, Bank, Fund..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

            </div>

            {/* ACTION COMMAND BAR */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '700' }}>
                  Found: <span style={{ color: 'var(--primary)' }}>{filteredMaturedInvs.length} FDR(s)</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>|</span>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>
                  Total: ৳ {formatCurrency(totalPrincipalAmount)}
                </span>
                {selectedInvIds.length > 0 && (
                  <>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>|</span>
                    <span style={{
                      fontSize: '11px',
                      background: 'rgba(2, 132, 199, 0.15)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(2, 132, 199, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: '700'
                    }}>
                      {selectedInvIds.length} Selected
                    </span>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePrintSelected}
                  className="btn-primary"
                  disabled={selectedInvIds.length === 0}
                  title={selectedInvIds.length === 0 ? 'Select at least one FDR from table' : `Print official letters for ${selectedInvIds.length} selected FDRs`}
                  style={{ opacity: selectedInvIds.length === 0 ? 0.6 : 1, padding: '4px 10px', fontSize: '11.5px' }}
                >
                  <Printer size={14} />
                  <span>Print Selected ({selectedInvIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintAll}
                  className="btn-secondary"
                  disabled={filteredMaturedInvs.length === 0}
                  title="Print official letters for all listed FDRs"
                  style={{ opacity: filteredMaturedInvs.length === 0 ? 0.6 : 1, padding: '4px 10px', fontSize: '11.5px' }}
                >
                  <Printer size={14} />
                  <span>Print All ({filteredMaturedInvs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportTableToExcel('matured-fdr-letters-table', 'Matured_FDR_Letter_List.xlsx')}
                  className="btn-success"
                  disabled={filteredMaturedInvs.length === 0}
                  style={{ padding: '4px 10px', fontSize: '11.5px' }}
                >
                  <FileSpreadsheet size={14} />
                  <span>Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const activeInv = (selectedInvIds.length > 0 ? filteredMaturedInvs.find(i => i.id === selectedInvIds[0]) : null) || filteredMaturedInvs[0];
                    const targetType = activeInv ? getInvLetterType(activeInv.id) : selectedLetterType;
                    handleOpenTemplateManager(targetType, selectedLanguage);
                  }}
                  className="btn-secondary"
                  title="Configure and customize default draft letter body & subject templates"
                  style={{ padding: '4px 10px', fontSize: '11.5px' }}
                >
                  <Settings2 size={14} />
                  <span>Templates</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11.5px' }}
                >
                  <Plus size={14} />
                  <span>Manual Letter</span>
                </button>
              </div>
            </div>
          </div>

          {/* LIVE SELECTED LETTER BODY & ATTACHED FDR TABLE PREVIEW CARD */}
          <div className="glass-panel" style={{
            padding: '8px 12px',
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.7) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            {/* Preview Card Header */}
            {(() => {
              const activePreviewInv = (selectedInvIds.length > 0 ? filteredMaturedInvs.find(i => i.id === selectedInvIds[0]) : null) || filteredMaturedInvs[0] || (investments.length > 0 ? investments[0] : null);
              const activePreviewType = activePreviewInv ? getInvLetterType(activePreviewInv.id) : (selectedLetterType || 'Renewal_Compound');
              const activePreviewLang = activePreviewInv ? getInvLanguage(activePreviewInv.id) : selectedLanguage;
              const typeOption = allLetterTypeOptions.find(d => d.value === activePreviewType);
              const typeLabel = typeOption ? typeOption.label : activePreviewType;
              const templateKey = `${activePreviewType}_${activePreviewLang}`;
              const hasSaved = !!(
                (letterBodyTemplates && letterBodyTemplates[templateKey]) ||
                (letterSubjectTemplates && letterSubjectTemplates[templateKey]) ||
                (letterEnclosureTemplates && letterEnclosureTemplates[templateKey])
              );

              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      <FileText size={15} />
                      <span>Selected Letter Body &amp; FDR Attachment Preview</span>
                    </div>

                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: '700', padding: '4px 10px', borderRadius: '8px' }}>
                      {typeLabel}
                    </span>

                    <span className="badge" style={{
                      background: activePreviewLang === 'English' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: activePreviewLang === 'English' ? '#34d399' : '#fbbf24',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      {activePreviewLang === 'English' ? 'English Letter' : 'বাংলা পত্র'}
                    </span>

                    {!hasSaved && (
                      <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(148, 163, 184, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                        Standard System Draft
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenTemplateManager(activePreviewType, activePreviewLang)}
                      className="btn-primary"
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)'
                      }}
                      title="Change or customize default subject line, paragraphs and enclosure"
                    >
                      <Settings2 size={14} />
                      <span>Set / Edit Letter Body</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isPreviewExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>{isPreviewExpanded ? 'Collapse' : 'Preview'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Collapsible Content */}
            {isPreviewExpanded && (() => {
              const previewContent = getActivePreviewContent();
              return (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  {/* Subject Line */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    borderLeft: '4px solid var(--primary)',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {selectedLanguage === 'English' ? 'Official Subject Line' : 'পত্রের বিষয়:'}
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                      {previewContent.subject}
                    </div>
                  </div>

                  {/* Dynamic Body Paragraphs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {previewContent.paragraphs.map((p, idx) => (
                      <div key={idx} style={{
                        fontSize: '12.5px',
                        lineHeight: '1.65',
                        color: 'var(--text-main)',
                        background: 'rgba(0, 0, 0, 0.2)',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', marginRight: '6px' }}>¶{idx + 1}:</span>
                        {p}
                      </div>
                    ))}
                  </div>

                  {/* Attached FDR Data Table Notice */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px dashed rgba(16, 185, 129, 0.4)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#34d399'
                  }}>
                    <Info size={16} style={{ flexShrink: 0 }} />
                    <span>
                      {selectedLanguage === 'English'
                        ? 'Attached with FDR: The official data table (SL No, Fund Name, FDR No, Maturity Date, Amount BDT) from the table below will be automatically appended directly under this letter body when printing or generating letters.'
                        : 'এফডিআর এর সাথে সংযুক্ত: পত্র প্রিন্ট বা প্রস্তুত করার সময় নিচের টেবিল থেকে নির্বাচিত প্রতিটি এফডিআর-এর বিস্তারিত সারণি (ক্রমিক নং, ফান্ডের নাম, এফডিআর নং, মেয়াদ তারিখ, পরিমাণ টাকা) স্বয়ংক্রিয়ভাবে এই পত্রের বডির নিচে সংযুক্ত থাকবে।'}
                    </span>
                  </div>

                  {/* Enclosure Note */}
                  {previewContent.enclosure && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {previewContent.enclosure}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* MATURED FDR LIST TABLE */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading investments register...</div>
            ) : filteredMaturedInvs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-muted)' }}>
                  No FDRs found maturing in {selectedMonth === 'ALL' ? 'selected period' : months.find(m => m.value === selectedMonth)?.label} {selectedYear !== 'ALL' ? selectedYear : ''}.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { setSelectedMonth('ALL'); setSelectedYear('ALL'); setSearchQuery(''); }}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    View All Upcoming Matured FDRs
                  </button>
                </div>
              </div>
            ) : (
              <div className="data-table-container">
                <table id="matured-fdr-letters-table" className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          title={allSelected ? 'Deselect All' : 'Select All'}
                          style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                        />
                      </th>
                      <th style={{ width: '50px', textAlign: 'center' }}>SL</th>
                      <th>FDR / Cert No.</th>
                      <th>Bank &amp; Branch</th>
                      <th>Fund Name</th>
                      <th style={{ minWidth: '220px' }}>Letter Type (পত্রের ধরণ)</th>
                      <th style={{ textAlign: 'right' }}>Principal (BDT)</th>
                      <th style={{ textAlign: 'center' }}>Rate (%)</th>
                      <th>Issue Date</th>
                      <th>Maturity Date</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'right', minWidth: '180px' }}>Print Command</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaturedInvs.map((inv, idx) => {
                      const isChecked = selectedInvIds.includes(inv.id);
                      const currentType = getInvLetterType(inv.id);
                      const savedLetter = letters.find(l => l.investment_id === inv.id);
                      const isSavedMatch = savedLetter && (savedLetter.letter_type === currentType || (currentType.startsWith('Renewal') && (savedLetter.letter_type || '').startsWith('Renewal')));

                      return (
                        <tr
                          key={inv.id}
                          style={{ background: isChecked ? 'rgba(2, 132, 199, 0.08)' : undefined }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectInv(inv.id)}
                              style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '600' }}>{idx + 1}</td>
                          <td>
                            <strong style={{ color: 'var(--primary)' }}>{inv.fdr_no}</strong>
                            {inv.account_no && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>A/C: {inv.account_no}</div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{inv.bank_name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{inv.branch_name || inv.bank_branch}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{inv.fund_name || 'General Fund'}</div>
                            {inv.acc_code && (
                              <div style={{ fontSize: '11px', color: '#38bdf8' }}>Code: {inv.acc_code}</div>
                            )}
                          </td>

                          {/* PER-ROW LETTER TYPE SELECTOR */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <select
                                className="form-select"
                                value={currentType}
                                onChange={(e) => handleRowLetterTypeChange(inv.id, e.target.value)}
                                style={{
                                  fontSize: '12px',
                                  padding: '5px 8px',
                                  fontWeight: '700',
                                  color: currentType.startsWith('Renewal') ? '#38bdf8' : currentType === 'Encashment' ? '#f59e0b' : '#10b981',
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '6px'
                                }}
                              >
                                <optgroup label="FDR Renewal Variants (নবায়ন ধরণসমূহ)">
                                  <option value="Renewal_Compound">Renewal: Compound (মূলধন+মুনাফা)</option>
                                  <option value="Renewal_Profit_To_Account">Renewal: Profit to Bank A/C (মুনাফা ব্যাংকে)</option>
                                  <option value="Renewal_Profit_PayOrder">Renewal: Profit Pay Order (মুনাফার পে-অর্ডার)</option>
                                  <option value="Renewal_Standard">Renewal: Standard (সাধারণ নবায়ন)</option>
                                </optgroup>
                                <optgroup label="FDR Encashment (নগদায়ন)">
                                  <option value="Encashment">FDR Encashment (নগদায়ন ও উত্তোলন)</option>
                                </optgroup>
                                <optgroup label="Other Letter Types (অন্যান্য পত্র)">
                                  <option value="Opening/Purchase">New FDR Opening (নতুন আমানত)</option>
                                  <option value="Tax Certificate Request">Tax Certificate Request (আয়কর সনদ)</option>
                                </optgroup>
                                {customTypes.length > 0 && (
                                  <optgroup label="Custom Types">
                                    {customTypes.map(ct => (
                                      <option key={ct} value={ct}>{ct}</option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                              {savedLetter && (
                                <span style={{
                                  fontSize: '10px',
                                  color: isSavedMatch ? '#10b981' : '#f59e0b',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <CheckCircle2 size={11} /> {isSavedMatch ? `Saved in DB (${savedLetter.letter_type})` : `Saved as ${savedLetter.letter_type}`}
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <strong style={{ color: '#10b981', fontSize: '14px' }}>
                              {formatCurrency(inv.principal_amount)}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: '700', color: '#60a5fa' }}>{inv.interest_rate}%</span>
                          </td>
                          <td>{formatDate(inv.issue_date)}</td>
                          <td>
                            <span className="badge badge-matured" style={{ fontWeight: '700' }}>
                              {formatDate(inv.maturity_date)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge badge-${(inv.status || 'Active').toLowerCase()}`}>
                              {inv.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => handlePrintSingleInv(inv)}
                                className="btn-primary"
                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                title={`Generate & print ${currentType} letter for FDR #${inv.fdr_no}`}
                              >
                                <Printer size={14} />
                                <span>Print Letter</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCustomizeInvLetter(inv)}
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                title="Open in Letter Builder to customize text or signatories"
                              >
                                <Edit3 size={14} />
                                <span>Customize</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg-card)', fontWeight: 'bold' }}>
                      <td colSpan={6} style={{ padding: '10px', textAlign: 'right' }}>
                        Total for {filteredMaturedInvs.length} Listed FDR(s):
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#10b981', fontSize: '15px' }}>
                        ৳ {formatCurrency(totalPrincipalAmount)}
                      </td>
                      <td colSpan={4}></td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>
                        {selectedInvIds.length > 0 && (
                          <span style={{ color: 'var(--primary)', fontSize: '12px' }}>
                            {selectedInvIds.length} Selected
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* TAB 2: SAVED LETTERS ARCHIVE TABLE */
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                Saved Official Letters Archive
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Historical log of customized official bank letters saved to system database.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handlePrintSelectedSavedLetters}
                className="btn-primary"
                disabled={selectedSavedLetterIds.length === 0}
                style={{ opacity: selectedSavedLetterIds.length === 0 ? 0.6 : 1 }}
              >
                <Printer size={16} />
                <span>Print Selected ({selectedSavedLetterIds.length})</span>
              </button>
              <button onClick={() => setIsModalOpen(true)} className="btn-secondary">
                <Plus size={16} />
                <span>New Official Letter</span>
              </button>
              <button onClick={() => exportTableToExcel('bank-letters-table', 'Bank_Letters_Archive.xlsx')} className="btn-success">
                <FileSpreadsheet size={16} />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading letter archive...</div>
          ) : letters.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No bank letters generated yet. Switch to "Matured FDR Letters" to generate letters from your investment register.
            </div>
          ) : (
            <div className="data-table-container">
              <table id="bank-letters-table" className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={letters.length > 0 && letters.every(l => selectedSavedLetterIds.includes(l.id))}
                        onChange={toggleSelectAllSavedLetters}
                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                      />
                    </th>
                    <th>Memo / Ref Number</th>
                    <th>Letter Type</th>
                    <th>Bank Institution</th>
                    <th>Subject</th>
                    <th>Letter Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {letters.map(letItem => {
                    const isSelected = selectedSavedLetterIds.includes(letItem.id);
                    return (
                      <tr key={letItem.id} style={{ background: isSelected ? 'rgba(2, 132, 199, 0.08)' : undefined }}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectSavedLetter(letItem.id)}
                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                          />
                        </td>
                        <td><strong style={{ color: 'var(--primary, #0284c7)' }}>{letItem.ref_no}</strong></td>
                        <td>
                          <span className={`badge ${letItem.letter_type === 'Opening/Purchase' ? 'badge-active' : letItem.letter_type.startsWith('Renewal') ? 'badge-renewed' : 'badge-matured'}`}>
                            {letItem.letter_type}
                          </span>
                        </td>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{letItem.bank_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{letItem.branch_name}</div>
                      </td>
                      <td><span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{letItem.subject}</span></td>
                      <td style={{ color: 'var(--text-main)', fontWeight: '500' }}>{formatDate(letItem.letter_date)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEditLetter(letItem)}
                            className="btn-amber"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title="Edit & Overwrite Bank Letter"
                          >
                            <Edit3 size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handlePrint(letItem)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title="Print Formal Bank Letter Document"
                          >
                            <Printer size={14} />
                            <span>Print</span>
                          </button>
                          <button
                            onClick={() => handleSendLetterEmail(letItem)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px', background: '#ecfdf5', color: '#059669', border: '1.5px solid #a7f3d0' }}
                            title="Send Official Letter directly to Bank Email & CC User"
                          >
                            <Mail size={14} />
                            <span>Email</span>
                          </button>
                          <button
                            onClick={() => handleDeleteLetter(letItem)}
                            className="btn-danger"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title="Delete Bank Letter"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE NEW OFFICIAL LETTER */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Prepare Official Bank Letter (English / Bengali)"
        maxWidth="850px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* STICKY SAVE BAR — always visible at top */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.97) 100%)',
            borderBottom: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '10px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Letter:</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#60a5fa' }}>{formData.letter_type}</span>
              <span style={{ fontSize: '11px', background: formData.language === 'English' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)', color: formData.language === 'English' ? '#60a5fa' : '#34d399', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                {formData.language}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '7px 20px', fontSize: '13px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                <CheckCircle2 size={15} style={{ marginRight: '6px' }} />
                Generate &amp; Save Letter
              </button>
            </div>
          </div>

          {/* LANGUAGE SELECTOR & LETTER TYPE & TEMPLATE BADGE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Languages size={18} color="#60a5fa" />
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>Select Letter Language:</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {(() => {
                const currentKey = `${formData.letter_type}_${formData.language}`;
                const hasSavedTemplate = !!(
                  (letterBodyTemplates && letterBodyTemplates[currentKey]) ||
                  (letterSubjectTemplates && letterSubjectTemplates[currentKey]) ||
                  (letterEnclosureTemplates && letterEnclosureTemplates[currentKey])
                );
                return (
                  <>
                    {hasSavedTemplate && (
                      <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                        Saved Template Active
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleResetTemplate}
                      title="Reset letter subject, paragraphs & enclosure to default template"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RotateCcw size={13} /> Reset Default
                    </button>
                  </>
                );
              })()}

              <button
                type="button"
                onClick={() => handleLanguageToggle('English')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: formData.language === 'English' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                  background: formData.language === 'English' ? '#3b82f6' : 'var(--bg-card-hover)',
                  color: formData.language === 'English' ? '#ffffff' : 'var(--text-main)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                English Mode
              </button>
              <button
                type="button"
                onClick={() => handleLanguageToggle('Bengali')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: formData.language === 'Bengali' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                  background: formData.language === 'Bengali' ? '#3b82f6' : 'var(--bg-card-hover)',
                  color: formData.language === 'Bengali' ? '#ffffff' : 'var(--text-main)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Bengali Mode (বাংলা)
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Letter Purpose / Type *</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={handleAddCustomType} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0 }} title="Add Custom Type">
                    <Plus size={14} />
                  </button>
                  <button type="button" onClick={handleDeleteCustomType} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }} title="Delete Custom Type">
                    <Trash2 size={14} />
                  </button>
                </div>
              </label>
              <select
                className="form-select"
                value={formData.letter_type}
                onChange={(e) => handleTypeChange(e.target.value)}
                required
              >
                <optgroup label="FDR Renewal Variants (নবায়ন ধরণসমূহ)">
                  <option value="Renewal_Compound">Renewal: Compound (মূলধন ও অর্জিত মুনাফাসহ পুনবিনিয়োগ)</option>
                  <option value="Renewal_Profit_To_Account">Renewal: Profit to Bank Account (শুধু মূলধন নবায়ন, মুনাফা ব্যাংক হিসাবে)</option>
                  <option value="Renewal_Profit_PayOrder">Renewal: Profit Pay Order (শুধু মূলধন নবায়ন, মুনাফার পে-অর্ডার)</option>
                  <option value="Renewal_Standard">Renewal: Standard (সাধারণ এফডিআর নবায়ন)</option>
                  <option value="Renewal">Renewal: General (সাধারণ নবায়ন)</option>
                </optgroup>
                <optgroup label="FDR Encashment (নগদায়ন)">
                  <option value="Encashment">FDR Encashment / Settlement Letter</option>
                </optgroup>
                <optgroup label="Other Letter Types (অন্যান্য পত্র)">
                  <option value="Opening/Purchase">New FDR Opening / Purchase</option>
                  <option value="Tax Certificate Request">Interest &amp; Tax Certificate Request</option>
                </optgroup>
                {customTypes.length > 0 && (
                  <optgroup label="Custom Letter Types (কাস্টম পত্র ধরণ)">
                    {customTypes.map((type, idx) => (
                      <option key={idx} value={type}>{type}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Office Memo / Ref No *</label>
              <input
                type="text"
                className="form-input"
                value={formData.ref_no}
                onChange={(e) => setFormData({ ...formData, ref_no: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Letter Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.letter_date}
                onChange={(e) => setFormData({ ...formData, letter_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Target Bank Institution *</label>
              <select
                className="form-select"
                value={formData.bank_id}
                onChange={(e) => handleBankSelect(e.target.value)}
                required
              >
                <option value="">Select Bank</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.branch_name})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Associated FDR Investment</label>
              <select
                className="form-select"
                value={formData.investment_id}
                onChange={(e) => handleInvestmentSelect(e.target.value)}
                disabled={formData.letter_type === 'Tax Certificate Request'}
              >
                <option value="">None / Multiple / New</option>
                {investments
                  .filter(inv => inv.status === 'Active' || (formData.investment_id && inv.id === parseInt(formData.investment_id)))
                  .map(inv => (
                    <option key={inv.id} value={inv.id}>
                      #{inv.fdr_no} - {inv.bank_name} ({formatCurrency(inv.principal_amount)}) - Maturing: {formatDate(inv.maturity_date)}
                    </option>
                  ))}
              </select>
            </div>

            {formData.letter_type === 'Tax Certificate Request' && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Fiscal Year (FY) for Certificate Request *</label>
                <select
                  className="form-select"
                  value={formData.fiscal_year}
                  onChange={(e) => setFormData({ ...formData, fiscal_year: e.target.value })}
                  required
                >
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Letter Subject Line *</label>
            <input
              type="text"
              className="form-input"
              value={formData.subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Dynamic Letter Body Paragraphs *</label>
              <button
                type="button"
                onClick={handleAddParagraph}
                className="btn-success"
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                <Plus size={14} /> Add Paragraph
              </button>
            </div>
            {formData.paragraphs.map((para, idx) => (
              <div key={idx} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }}>Paragraph {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveParagraph(idx)}
                    className="btn-danger"
                    style={{ padding: '3px 8px', fontSize: '11px', height: 'fit-content' }}
                    title="Remove Paragraph"
                    disabled={formData.paragraphs.length <= 1}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  rows={4}
                  style={{ width: '100%', resize: 'vertical' }}
                  value={para}
                  onChange={(e) => handleParagraphChange(idx, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Enclosure / Attachment Note *</label>
            <input
              type="text"
              className="form-input"
              value={formData.enclosure}
              onChange={(e) => handleEnclosureChange(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">AGM (Finance) Signatory Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.prepared_by}
                onChange={(e) => setFormData({ ...formData, prepared_by: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">General Manager Signatory Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Required by default"
                value={formData.approved_by}
                onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Generate & Save Letter
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: PRINT OFFICIAL BANK LETTER */}
      {isPrintModalOpen && (printLettersList.length > 0 || selectedLetter) && (() => {
        const activeLetters = printLettersList.length > 0 ? printLettersList : (selectedLetter ? [selectedLetter] : []);
        const isBatch = activeLetters.length > 1;

        return (
          <Modal
            isOpen={isPrintModalOpen}
            onClose={() => {
              setIsPrintModalOpen(false);
              setPrintLettersList([]);
            }}
            title={isBatch ? `Batch Print Bank Letters (${activeLetters.length} Letters)` : "Formal Official Bank Letter Print Preview"}
            maxWidth="920px"
          >
            <div>
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  color: isBatch ? 'var(--primary)' : '#10b981',
                  background: isBatch ? 'rgba(2, 132, 199, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: isBatch ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 'bold'
                }}>
                  {isBatch ? `Batch Print Mode (${activeLetters.length} Letters - 1 Per Page)` : 'Single Copy Mode (1 Page)'}
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => triggerPrint('portrait')} className="btn-primary">
                    <Printer size={16} />
                    <span>Print Portrait {isBatch ? `(${activeLetters.length} Pages)` : '(1 Copy)'}</span>
                  </button>
                  <button onClick={() => triggerPrint('landscape')} className="btn-secondary">
                    <Printer size={16} />
                    <span>Print Landscape</span>
                  </button>
                  <button
                    onClick={() => exportBankLettersToDocx(activeLetters, {
                      filename: `${isBatch ? 'Bank_Letters_Batch' : 'Bank_Letter'}.docx`,
                      settings,
                      investments,
                      sourceHtml: document.querySelector('.printable-area')?.outerHTML || '',
                      onError: (err) => console.error(err)
                    })}
                    className="btn-success"
                  >
                    <Download size={16} />
                    <span>Export DOCX</span>
                  </button>
                  <button
                    onClick={() => handleSendLetterEmail(activeLetters[0])}
                    className="btn-secondary"
                    style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#ffffff', border: 'none', gap: '6px' }}
                    title="Send this official letter directly to Bank's Email with CC to User"
                  >
                    <Mail size={16} />
                    <span>Email to Bank</span>
                  </button>
                </div>
              </div>

              {/* PRINTABLE AREA: RENDERS EACH LETTER ON A SEPARATE PAGE */}
              <div className="printable-area" style={{ fontFamily: "'OfficialDocFont', 'Times New Roman', 'Nikosh', 'SolaimanLipi', serif", fontSize: '18px' }}>
                {activeLetters.map((letItem, letIdx) => {
                  let parsedInstructions = {};
                  try {
                    if (letItem.special_instructions) {
                      parsedInstructions = typeof letItem.special_instructions === 'string'
                        ? JSON.parse(letItem.special_instructions)
                        : letItem.special_instructions;
                    }
                  } catch (e) { }

                  const isEnglish = (parsedInstructions && parsedInstructions.language)
                    ? parsedInstructions.language === 'English'
                    : (letItem.language === 'English' || !/[\u0980-\u09FF]/.test(letItem.subject || ''));
                  const associatedInv = letItem.associated_inv || investments.find(i => i.id === letItem.investment_id);

                  const paras = parsedInstructions.paragraphs || (letItem.body_content || '').split('\n\n').filter(p => p.trim());
                  const enclosureText = parsedInstructions.enclosure || (isEnglish ? 'Enclosure: Original FDR Certificate / Advice as described above.' : 'সংযুক্ত: বর্ণনা অনুযায়ী স্থায়ী আমানত রশিদ।');

                  const agmDisplayName = (parsedInstructions.prepared_by !== undefined && parsedInstructions.prepared_by !== '')
                    ? parsedInstructions.prepared_by
                    : (settings.signatory_agm_name || (isEnglish ? 'Md. Ariful Islam' : 'মো: আরিফুল ইসলাম'));
                  const gmDisplayName = (parsedInstructions.approved_by !== undefined && parsedInstructions.approved_by !== '')
                    ? parsedInstructions.approved_by
                    : (settings.signatory_gm_name || (isEnglish ? 'Md. Rabiul Haque' : 'মো: রবিউল হক'));

                  return (
                    <div
                      key={letItem.id || letIdx}
                      className="bank-letter-page"
                      style={{
                        background: '#fff',
                        color: '#000',
                        padding: '20px 24px',
                        marginBottom: isBatch && letIdx < activeLetters.length - 1 ? '36px' : '0',
                        borderBottom: isBatch && letIdx < activeLetters.length - 1 ? '2px dashed #cbd5e1' : 'none',
                        borderRadius: '8px',
                        fontSize: '14.5px',
                        lineHeight: '1.6'
                      }}
                    >
                      {/* HEADER WITH LOGO & REF/DATE */}
                      <PrintHeader isBankLetter={true} docRef={letItem.ref_no} date={formatDate(letItem.letter_date)} />

                      {/* RECIPIENT BLOCK */}
                      <div style={{ margin: '16px 0', lineHeight: '1.6', fontSize: '14.5px' }}>
                        {isEnglish ? 'To,' : ''}{isEnglish ? <br /> : ''}
                        <strong>{letItem.recipient_designation || (isEnglish ? 'The Manager' : 'ব্যবস্থাপক')}</strong><br />
                        {letItem.bank_name || parsedInstructions.recipient_bank_name}<br />
                        {letItem.branch_name || parsedInstructions.recipient_branch_address}{letItem.bank_address ? `, ${letItem.bank_address}` : ''}
                      </div>

                      {/* SUBJECT LINE */}
                      <div style={{ margin: '16px 0', fontSize: '16px', fontWeight: 'bold' }}>
                        {isEnglish ? 'Subject: ' : 'বিষয়: '}
                        <span style={{ textDecoration: 'underline' }}>{letItem.subject}</span>
                      </div>

                      {/* DYNAMIC PARAGRAPHS */}
                      {paras.map((pText, i) => (
                        <p key={i} style={{ textAlign: 'justify', marginBottom: '14px', fontSize: '16px', lineHeight: '1.65' }}>
                          {pText}
                        </p>
                      ))}

                      {/* FDR TABLE */}
                      {letItem.letter_type === 'Tax Certificate Request' ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0', fontSize: '12.5px' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', width: '25px' }}>{isEnglish ? 'SL' : 'ক্রমিক'}</th>
                              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{isEnglish ? 'FDR Cert No.' : 'রশিদ নং'}</th>
                              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{isEnglish ? 'Issue / Renewal Date' : 'ইস্যু / নবায়ন তারিখ'}</th>
                              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{isEnglish ? 'Maturity Date' : 'মেয়াদ তারিখ'}</th>
                              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{isEnglish ? 'Principal' : 'মূলধন'}</th>
                              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{isEnglish ? 'Gross Interest' : 'মোট মুনাফা'}</th>
                              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{isEnglish ? 'Tax (AIT)' : 'আয়কর'}</th>
                              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{isEnglish ? 'Excise Duty' : 'আবগারি শুল্ক'}</th>
                              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{isEnglish ? 'Bank Charge' : 'ব্যাংক চার্জ'}</th>
                              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{isEnglish ? 'Net Interest' : 'নীট মুনাফা'}</th>
                              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>{isEnglish ? 'Total Payable (Principal+Net)' : 'সর্বমোট প্রদেয় (মূলধন+নীট)'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const filteredInvs = investments.filter(i => {
                                if (!letItem.bank_id || parseInt(i.bank_id) !== parseInt(letItem.bank_id)) return false;
                                if (parsedInstructions.fiscal_year) {
                                  const [fyStartYear, fyEndYear] = parsedInstructions.fiscal_year.split('-');
                                  const fyStartDate = new Date(`${fyStartYear}-07-01`);
                                  const fyEndDate = new Date(`${fyEndYear}-06-30`);

                                  const isRollover = i.is_inplace_rollover && i.latest_rollover;
                                  const r = i.latest_rollover;

                                  const issueD = i.issue_date ? new Date(i.issue_date) : (i.first_issue_date ? new Date(i.first_issue_date) : null);
                                  const matD = i.maturity_date ? new Date(i.maturity_date) : null;
                                  const rolloverD = isRollover && r && r.event_date ? new Date(r.event_date) : null;
                                  const encashD = i.encash_date ? new Date(i.encash_date) : null;

                                  const inRollover = rolloverD && (rolloverD >= fyStartDate && rolloverD <= fyEndDate);
                                  const inEncash = encashD && (encashD >= fyStartDate && encashD <= fyEndDate);
                                  const inActivePeriod = issueD && matD && (issueD <= fyEndDate && matD >= fyStartDate);

                                  return inRollover || inEncash || inActivePeriod;
                                }
                                return true;
                              });

                              if (filteredInvs.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={11} style={{ border: '1px solid #000', padding: '12px', textAlign: 'center', color: '#64748b' }}>
                                      {isEnglish ? 'No FDR investments found for this bank branch in selected Fiscal Year.' : 'নির্বাচিত অর্থবছরে উক্ত ব্যাংক শাখার কোনো এফডিআর পাওয়া যায়নি।'}
                                    </td>
                                  </tr>
                                );
                              }

                              return filteredInvs.map((inv, idx) => {
                                const fin = resolveFdrFinancials(inv);
                                const isRollover = inv.is_inplace_rollover && inv.latest_rollover;
                                const r = inv.latest_rollover;

                                const issueDateDisplay = isRollover && r && r.event_date ? r.event_date : (inv.issue_date || inv.first_issue_date);
                                const maturityDateDisplay = isRollover && r && r.new_maturity_date ? r.new_maturity_date : inv.maturity_date;

                                return (
                                  <tr key={inv.id}>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>{inv.fdr_no}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{formatDate(issueDateDisplay)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{formatDate(maturityDateDisplay)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{formatCurrency(fin.principal)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{formatCurrency(fin.gross)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{formatCurrency(fin.tax)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{formatCurrency(fin.duty)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{formatCurrency(fin.charge)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(fin.net)}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(fin.totalPayable)}</td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                          {(() => {
                            const filteredInvs = investments.filter(i => {
                              if (!letItem.bank_id || parseInt(i.bank_id) !== parseInt(letItem.bank_id)) return false;
                              if (parsedInstructions.fiscal_year) {
                                const [fyStartYear, fyEndYear] = parsedInstructions.fiscal_year.split('-');
                                const fyStartDate = new Date(`${fyStartYear}-07-01`);
                                const fyEndDate = new Date(`${fyEndYear}-06-30`);

                                const isRollover = i.is_inplace_rollover && i.latest_rollover;
                                const r = i.latest_rollover;

                                const issueD = i.issue_date ? new Date(i.issue_date) : (i.first_issue_date ? new Date(i.first_issue_date) : null);
                                const matD = i.maturity_date ? new Date(i.maturity_date) : null;
                                const rolloverD = isRollover && r && r.event_date ? new Date(r.event_date) : null;
                                const encashD = i.encash_date ? new Date(i.encash_date) : null;

                                const inRollover = rolloverD && (rolloverD >= fyStartDate && rolloverD <= fyEndDate);
                                const inEncash = encashD && (encashD >= fyStartDate && encashD <= fyEndDate);
                                const inActivePeriod = issueD && matD && (issueD <= fyEndDate && matD >= fyStartDate);

                                return inRollover || inEncash || inActivePeriod;
                              }
                              return true;
                            });

                            if (filteredInvs.length === 0) return null;

                            let totPrincipal = 0;
                            let totGross = 0;
                            let totTax = 0;
                            let totDuty = 0;
                            let totCharge = 0;
                            let totNet = 0;
                            let totTotalPayable = 0;

                            filteredInvs.forEach(inv => {
                              const fin = resolveFdrFinancials(inv);
                              totPrincipal += fin.principal;
                              totGross += fin.gross;
                              totTax += fin.tax;
                              totDuty += fin.duty;
                              totCharge += fin.charge;
                              totNet += fin.net;
                              totTotalPayable += fin.totalPayable;
                            });

                            return (
                              <tfoot>
                                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                  <td colSpan={4} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                                    {isEnglish ? 'Total' : 'সর্বমোট'} ({filteredInvs.length} {isEnglish ? 'FDRs' : 'টি এফডিআর'})
                                  </td>
                                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(totPrincipal)}</td>
                                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(totGross)}</td>
                                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(totTax)}</td>
                                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(totDuty)}</td>
                                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(totCharge)}</td>
                                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(totNet)}</td>
                                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(totTotalPayable)}</td>
                                </tr>
                              </tfoot>
                            );
                          })()}
                        </table>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0', fontSize: '14px', border: '1.5px solid #000' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                              <th style={{ border: '1.5px solid #000', padding: '7px 6px', textAlign: 'center', width: '50px', color: '#000', fontSize: '14px' }}>
                                {isEnglish ? 'SL No.' : 'ক্রমিক নং'}
                              </th>
                              <th style={{ border: '1.5px solid #000', padding: '7px 6px', textAlign: 'left', color: '#000', fontSize: '14px' }}>
                                {isEnglish ? 'Fund Name / Category' : 'ফান্ডের নাম'}
                              </th>
                              <th style={{ border: '1.5px solid #000', padding: '7px 6px', textAlign: 'center', color: '#000', fontSize: '14px' }}>
                                {isEnglish ? 'Fixed Deposit Account / Cert No.' : 'স্থায়ী আমানত হিসাব / রশিদ নং'}
                              </th>
                              <th style={{ border: '1.5px solid #000', padding: '7px 6px', textAlign: 'center', color: '#000', fontSize: '14px' }}>
                                {isEnglish ? 'Maturity Date' : 'মেয়াদ উত্তীর্ণের তারিখ'}
                              </th>
                              <th style={{ border: '1.5px solid #000', padding: '7px 6px', textAlign: 'right', color: '#000', fontSize: '14px' }}>
                                {isEnglish ? 'Amount (BDT)' : 'মূলধন পরিমাণ (টাকা)'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {associatedInv ? (
                              <tr>
                                <td style={{ border: '1.5px solid #000', padding: '9px 8px', textAlign: 'center', color: '#000', fontWeight: '600', fontSize: '14px' }}>1</td>
                                <td style={{ border: '1.5px solid #000', padding: '9px 8px', textAlign: 'left', fontWeight: 'bold', color: '#000', fontSize: '14px' }}>
                                  {associatedInv.fund_name || 'কর্মচারী প্রভিডেন্ট ফান্ড (CPF)'}
                                </td>
                                <td style={{ border: '1.5px solid #000', padding: '9px 8px', textAlign: 'center', fontWeight: 'bold', color: '#000', fontSize: '14px' }}>
                                  {associatedInv.fdr_no}
                                </td>
                                <td style={{ border: '1.5px solid #000', padding: '9px 8px', textAlign: 'center', color: '#000', fontWeight: '600', fontSize: '14px' }}>
                                  {formatDate(associatedInv.maturity_date)}
                                </td>
                                <td style={{ border: '1.5px solid #000', padding: '9px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000', fontSize: '14px' }}>
                                  {formatCurrency(associatedInv.principal_amount)}
                                </td>
                              </tr>
                            ) : (() => {
                              const branchInvs = investments.filter(i => letItem.bank_id && parseInt(i.bank_id) === parseInt(letItem.bank_id));
                              if (branchInvs.length > 0) {
                                return branchInvs.map((inv, idx) => (
                                  <tr key={inv.id}>
                                    <td style={{ border: '1.5px solid #000', padding: '9px 8px', textAlign: 'center', color: '#000', fontWeight: '600', fontSize: '14px' }}>{idx + 1}</td>
                                    <td style={{ border: '1.5px solid #000', padding: '9px 8px', textAlign: 'left', fontWeight: 'bold', color: '#000', fontSize: '14px' }}>
                                      {inv.fund_name || 'কর্মচারী প্রভিডেন্ট ফান্ড (CPF)'}
                                    </td>
                                    <td style={{ border: '1.5px solid #000', padding: '9px 8px', textAlign: 'center', fontWeight: 'bold', color: '#000', fontSize: '14px' }}>
                                      {inv.fdr_no}
                                    </td>
                                    <td style={{ border: '1.5px solid #000', padding: '9px 8px', textAlign: 'center', color: '#000', fontWeight: '600', fontSize: '14px' }}>
                                      {formatDate(inv.maturity_date)}
                                    </td>
                                    <td style={{ border: '1.5px solid #000', padding: '9px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000', fontSize: '14px' }}>
                                      {formatCurrency(inv.principal_amount)}
                                    </td>
                                  </tr>
                                ));
                              }
                              return (
                                <tr>
                                  <td colSpan={5} style={{ border: '1.5px solid #000', padding: '14px', textAlign: 'center', color: '#000', fontWeight: 'bold', fontSize: '14px' }}>
                                    {isEnglish ? 'No FDR investment linked to this letter.' : 'এই পত্রের সাথে কোনো নির্দিষ্ট FDR সংযুক্ত করা হয়নি।'}
                                  </td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      )}

                      {/* ENCLOSURE NOTE */}
                      <div style={{ margin: '16px 0', fontSize: '13.5px', fontWeight: 'bold', color: '#000' }}>
                        {enclosureText}
                      </div>

                      {/* DUAL AUTHORIZED SIGNATORIES (ALWAYS PRESENT: AGM FINANCE ON LEFT, GM ON RIGHT) */}
                      <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', textAlign: 'center', fontSize: '14px' }}>
                        {/* LEFT: AGM (FINANCE & ACCOUNTS) */}
                        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 'auto' }}>
                          {settings.signatory_agm_signature ? (
                            <img src={settings.signatory_agm_signature} alt="AGM Signature" style={{ maxHeight: '48px', maxWidth: '160px', objectFit: 'contain', marginBottom: '4px', background: 'transparent', mixBlendMode: 'multiply' }} />
                          ) : (
                            <div style={{ height: '42px' }} />
                          )}
                          <div style={{ borderTop: '1.5px solid #000000', width: '100%', paddingTop: '4px', color: '#000000' }}>
                            <strong style={{ fontSize: '14.5px', color: '#000000' }}>( {agmDisplayName} )</strong><br />
                            <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#000000' }}>{settings.signatory_agm_finance || (isEnglish ? 'AGM (Finance & Accounts)' : 'সহকারী জেনারেল ম্যানেজার (অর্থ)')}</span>
                          </div>
                        </div>

                        {/* RIGHT: GENERAL MANAGER */}
                        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 'auto' }}>
                          {settings.signatory_gm_signature ? (
                            <img src={settings.signatory_gm_signature} alt="GM Signature" style={{ maxHeight: '48px', maxWidth: '160px', objectFit: 'contain', marginBottom: '4px', background: 'transparent', mixBlendMode: 'multiply' }} />
                          ) : (
                            <div style={{ height: '42px' }} />
                          )}
                          <div style={{ borderTop: '1.5px solid #000000', width: '100%', paddingTop: '4px', color: '#000000' }}>
                            <strong style={{ fontSize: '14.5px', color: '#000000' }}>( {gmDisplayName} )</strong><br />
                            <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#000000' }}>{settings.signatory_gm || (isEnglish ? 'General Manager' : 'জেনারেল ম্যানেজার')}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* MODAL: TEMPLATE MANAGER (SET / EDIT DEFAULT LETTER BODY & SUBJECT) */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Set / Customize Letter Body & Draft Templates (পত্রের বডি ও ড্রাফট ব্যবস্থাপনা)"
        maxWidth="850px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Top selection bar: Type & Language */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr auto',
            gap: '12px',
            alignItems: 'flex-end',
            background: 'var(--bg-card)',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <label className="form-label" style={{ marginBottom: '6px' }}>Letter Type / Renewal Purpose</label>
              <select
                className="form-select"
                value={templateEditorType}
                onChange={(e) => handleEditorTypeChange(e.target.value)}
                style={{ fontWeight: '700', color: 'var(--primary)' }}
              >
                <optgroup label="FDR Renewal Variants (নবায়ন ধরণসমূহ)">
                  <option value="Renewal_Compound">Renewal: Compound (মূলধন ও অর্জিত মুনাফাসহ পুনবিনিয়োগ)</option>
                  <option value="Renewal_Profit_To_Account">Renewal: Profit to Bank Account (শুধু মূলধন নবায়ন, মুনাফা ব্যাংক হিসাবে)</option>
                  <option value="Renewal_Profit_PayOrder">Renewal: Profit Pay Order (শুধু মূলধন নবায়ন, মুনাফার পে-অর্ডার)</option>
                  <option value="Renewal_Standard">Renewal: Standard (সাধারণ এফডিআর নবায়ন)</option>
                  <option value="Renewal">Renewal: General (সাধারণ নবায়ন)</option>
                </optgroup>
                <optgroup label="FDR Encashment (নগদায়ন)">
                  <option value="Encashment">FDR Encashment (স্থায়ী আমানত নগদায়ন)</option>
                </optgroup>
                <optgroup label="Other Letter Types (অন্যান্য পত্র)">
                  <option value="Opening/Purchase">New FDR Opening (নতুন আমানত খোলা)</option>
                  <option value="Tax Certificate Request">Tax Certificate Request (আয়কর ও মুনাফা সনদ)</option>
                </optgroup>
                {customTypes.length > 0 && (
                  <optgroup label="Custom Letter Types (কাস্টম পত্র ধরণ)">
                    {customTypes.map(ct => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: '6px' }}>Template Language (ভাষা)</label>
              <select
                className="form-select"
                value={templateEditorLang}
                onChange={(e) => handleEditorLangChange(e.target.value)}
                style={{ fontWeight: '600' }}
              >
                <option value="Bengali">Bengali (বাংলা ড্রাফট)</option>
                <option value="English">English (English Draft)</option>
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={handleAddCustomType}
                className="btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                title="Add new custom letter type"
              >
                <Plus size={14} /> Add Type
              </button>
            </div>
          </div>

          {/* Status Banner */}
          {(() => {
            const key = `${templateEditorType}_${templateEditorLang}`;
            const hasCustomSaved = !!(
              (letterBodyTemplates && letterBodyTemplates[key]) ||
              (letterSubjectTemplates && letterSubjectTemplates[key]) ||
              (letterEnclosureTemplates && letterEnclosureTemplates[key])
            );
            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: hasCustomSaved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.1)',
                border: `1px solid ${hasCustomSaved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color={hasCustomSaved ? '#10b981' : '#60a5fa'} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: hasCustomSaved ? '#34d399' : '#60a5fa' }}>
                    {hasCustomSaved ? 'User Customized Saved Template Active' : 'System Standard Default Template Active'}
                  </span>
                </div>
                {hasCustomSaved && (
                  <button
                    type="button"
                    onClick={handleResetEditorTemplate}
                    className="btn-amber"
                    style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RotateCcw size={12} />
                    <span>Reset to System Default</span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* Subject Line Editor */}
          <div className="form-group">
            <label className="form-label">Subject Line (পত্রের বিষয়) *</label>
            <input
              type="text"
              className="form-input"
              value={templateEditorSubject}
              onChange={(e) => setTemplateEditorSubject(e.target.value)}
              placeholder="Enter official letter subject line..."
              required
            />
          </div>

          {/* Dynamic Body Paragraphs Editor */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Letter Body Paragraphs (পত্রের মূল বডি প্যারাগ্রাফসমূহ) *
              </label>
              <button
                type="button"
                onClick={handleAddEditorPara}
                className="btn-success"
                style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Paragraph
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {templateEditorParas.map((para, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-card)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>
                      Paragraph {idx + 1} {idx === 0 ? '(Opening Paragraph)' : idx === templateEditorParas.length - 1 ? '(Closing Paragraph)' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEditorPara(idx)}
                      className="btn-danger"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      disabled={templateEditorParas.length <= 1}
                      title="Delete this paragraph"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    style={{ width: '100%', resize: 'vertical', lineHeight: '1.6' }}
                    value={para}
                    onChange={(e) => handleEditorParaChange(idx, e.target.value)}
                    placeholder="Enter paragraph text..."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Enclosure Note */}
          <div className="form-group">
            <label className="form-label">Enclosure / Attachment Line (সংযুক্তি) *</label>
            <input
              type="text"
              className="form-input"
              value={templateEditorEnclosure}
              onChange={(e) => setTemplateEditorEnclosure(e.target.value)}
              placeholder="e.g. সংযুক্ত: মূল স্থায়ী আমানত রশিদ।"
            />
          </div>

          {/* FDR Attachment Notice */}
          <div style={{
            background: 'rgba(2, 132, 199, 0.08)',
            border: '1px dashed rgba(2, 132, 199, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={15} />
              <span>FDR Table Automatic Attachment (এফডিআর সারণি সংযুক্তি):</span>
            </div>
            <div>
              When printing or generating letters, the formal FDR Details Table (SL No, Fund Name, Account / Cert No, Maturity Date, Amount BDT) is <strong>always automatically appended</strong> directly below the letter body paragraphs, followed by the Enclosure note and authorized Signatories.
            </div>
          </div>

          {/* Dynamic Placeholders Guide */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '11.5px',
            color: 'var(--text-muted)'
          }}>
            <strong style={{ color: 'var(--text-main)' }}>Available Template Placeholders:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              <code>[FUND_NAME]</code>
              <code>[MATURITY-DATE]</code>
              <code>[BANK_NAME]</code>
              <code>[Branch &amp; Address]</code>
              <code>[ORG_NAME]</code>
              <code>[TAX_RATE]</code>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '10px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={handleResetEditorTemplate}
              className="btn-secondary"
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} />
              <span>Reset to System Default</span>
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditorTemplate}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={16} />
                <span>Save as Default Template</span>
              </button>
            </div>
          </div>

        </div>
      </Modal>

    </div>
  );
}
