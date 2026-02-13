import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
// LABSIGNAL ORCHESTRATOR™ — PRODUCTION BUILD
// NPI-Level Triggered Touchpoint Orchestration Engine
// ═══════════════════════════════════════════════════════════

const FONT_LINK = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

// ─── DESIGN TOKENS ───
const T = {
  bg: "#080b12", bgAlt: "#0a0e18",
  surface: "#0d1221", surfaceRaised: "#111829", surfaceHover: "#151d30",
  border: "#1a2440", borderLight: "#243356", borderFocus: "#3b5bdb",
  text: "#dce4f0", textSecondary: "#8899b4", textDim: "#556380", textInverse: "#080b12",
  accent: "#3b5bdb", accentLight: "#5b7bf5", accentBg: "rgba(59,91,219,0.1)", accentBorder: "rgba(59,91,219,0.3)",
  green: "#10b981", greenBg: "rgba(16,185,129,0.1)", greenBorder: "rgba(16,185,129,0.3)",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,0.1)", amberBorder: "rgba(245,158,11,0.3)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.1)", redBorder: "rgba(239,68,68,0.3)",
  cyan: "#06b6d4", cyanBg: "rgba(6,182,212,0.1)", cyanBorder: "rgba(6,182,212,0.3)",
  purple: "#8b5cf6", purpleBg: "rgba(139,92,246,0.1)", purpleBorder: "rgba(139,92,246,0.3)",
  pink: "#ec4899", pinkBg: "rgba(236,72,153,0.1)", pinkBorder: "rgba(236,72,153,0.3)",
  teal: "#14b8a6", tealBg: "rgba(20,184,166,0.1)", tealBorder: "rgba(20,184,166,0.3)",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
  radius: 8, radiusLg: 12, radiusSm: 4,
};

// ─── CHANNEL CONFIG ───
const CHANNELS = {
  "Programmatic Banner": { color: T.accent, bg: T.accentBg, border: T.accentBorder, icon: "🖥", abbr: "PB" },
  "Triggered Email":     { color: T.cyan, bg: T.cyanBg, border: T.cyanBorder, icon: "✉️", abbr: "TE" },
  "Endemic Banner":      { color: T.purple, bg: T.purpleBg, border: T.purpleBorder, icon: "📋", abbr: "EB" },
  "Rep Alert":           { color: T.amber, bg: T.amberBg, border: T.amberBorder, icon: "👤", abbr: "RA" },
  "Retarget Banner":     { color: T.pink, bg: T.pinkBg, border: T.pinkBorder, icon: "🔁", abbr: "RB" },
  "Follow-up Email":     { color: T.teal, bg: T.tealBg, border: T.tealBorder, icon: "📨", abbr: "FE" },
};

const CHANNEL_LIST = Object.keys(CHANNELS);

const BIOMARKERS = [
  { id: "hba1c", name: "HbA1c", unit: "%", defaultThreshold: "6.5", operator: "≥", conditions: ["Type 2 Diabetes", "Pre-diabetes", "Metabolic Syndrome"] },
  { id: "ldlc", name: "LDL-C", unit: "mg/dL", defaultThreshold: "190", operator: "≥", conditions: ["Severe Hyperlipidemia", "Familial Hypercholesterolemia", "ASCVD Risk"] },
  { id: "egfr", name: "eGFR", unit: "mL/min", defaultThreshold: "60", operator: "<", conditions: ["Chronic Kidney Disease", "Diabetic Nephropathy", "Renal Insufficiency"] },
  { id: "psa", name: "PSA", unit: "ng/mL", defaultThreshold: "4.0", operator: "≥", conditions: ["Prostate Cancer Screening", "BPH Monitoring"] },
  { id: "tsh", name: "TSH", unit: "mIU/L", defaultThreshold: "4.5", operator: ">", conditions: ["Hypothyroidism", "Thyroid Dysfunction"] },
  { id: "ntprobnp", name: "NT-proBNP", unit: "pg/mL", defaultThreshold: "300", operator: ">", conditions: ["Heart Failure", "Cardiac Risk Assessment"] },
  { id: "crp", name: "hs-CRP", unit: "mg/L", defaultThreshold: "3.0", operator: ">", conditions: ["Cardiovascular Inflammation", "Systemic Inflammation"] },
  { id: "ferritin", name: "Ferritin", unit: "ng/mL", defaultThreshold: "20", operator: "<", conditions: ["Iron Deficiency Anemia", "Chronic Fatigue"] },
];

const SPECIALTIES = ["Endocrinology", "Cardiology", "Nephrology", "Urology", "Internal Medicine", "Oncology", "Pulmonology", "Rheumatology", "Gastroenterology", "Neurology"];
const STATES = ["NY", "CA", "TX", "FL", "IL", "PA", "MA", "AZ", "OH", "GA", "NC", "WA"];

// ─── ASSET TYPES ───
const ASSET_TYPES = {
  banner:   { label: "Banner Creative", icon: "🖼", accept: "image/*", preview: "image", channels: ["Programmatic Banner", "Endemic Banner", "Retarget Banner"] },
  email:    { label: "Email Template", icon: "✉️", accept: ".html,.htm,text/html", preview: "html", channels: ["Triggered Email", "Follow-up Email"] },
  rep_doc:  { label: "Rep Talking Points", icon: "📋", accept: ".txt,.md,.html,text/plain", preview: "text", channels: ["Rep Alert"] },
  pdf:      { label: "Clinical Document", icon: "📄", accept: ".pdf,application/pdf", preview: "pdf", channels: [] },
  content:  { label: "Content Copy", icon: "📝", accept: ".txt,.md,text/plain", preview: "text", channels: [] },
};

const makeAssetSvg = (w, h, label, color, bgColor) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bgColor}"/><rect x="4" y="4" width="${w-8}" height="${h-8}" rx="8" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="6 3" opacity="0.4"/><text x="${w/2}" y="${h/2 - 8}" text-anchor="middle" fill="${color}" font-family="sans-serif" font-weight="700" font-size="14">${label}</text><text x="${w/2}" y="${h/2 + 12}" text-anchor="middle" fill="${color}" font-family="sans-serif" font-size="10" opacity="0.6">${w}×${h}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const makeSampleEmail = (brand, subject, body) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:'Helvetica Neue',sans-serif;background:#f4f4f7}
.wrap{max-width:600px;margin:0 auto;background:#fff}.hdr{background:linear-gradient(135deg,#1a365d,#2563eb);padding:32px 40px;color:#fff}
.hdr h1{margin:0;font-size:20px;font-weight:700}.hdr p{margin:8px 0 0;font-size:13px;opacity:0.85}
.body{padding:32px 40px}.body h2{color:#1a365d;font-size:17px;margin:0 0 12px}.body p{color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px}
.cta{display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px}
.foot{padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
</style></head><body><div class="wrap"><div class="hdr"><h1>${brand}</h1><p>${subject}</p></div><div class="body"><h2>For Healthcare Professional Use</h2>${body}<a href="#" class="cta">View Full Prescribing Information</a></div><div class="foot">This email is intended for US healthcare professionals only.<br/>Please see full Prescribing Information including Boxed Warning.<br/><a href="#" style="color:#6b7280">Unsubscribe</a> · <a href="#" style="color:#6b7280">Privacy Policy</a></div></div></body></html>`;

const makeSampleRepDoc = (brand, biomarker, points) => `═══ ${brand.toUpperCase()} — FIELD REP TALKING POINTS ═══
Generated by LabSignal Orchestrator™

TRIGGER CONTEXT
• Biomarker: ${biomarker}
• Signal detected via lab data feed
• HCP has been served initial touchpoints

KEY MESSAGES
${points.map((p, i) => `${i+1}. ${p}`).join("\n")}

OBJECTION HANDLING
• "My patients do well on current therapy"
  → Acknowledge, then share real-world evidence on incremental benefit
• "I need to see more data"
  → Offer to schedule MSL visit with latest clinical trial results
• "Insurance/formulary concerns"
  → Present patient savings program and prior authorization support

LEAVE-BEHIND MATERIALS
☐ Efficacy summary card
☐ Patient savings information
☐ Dosing quick-reference guide

COMPLIANCE REMINDER
All discussions must align with approved labeling.
Do not make off-label claims.
Report adverse events to Medical Affairs.
`;

const initAssets = () => [
  { id: "A-001", name: "HbA1c Awareness Banner", type: "banner", format: "image", channelHint: "Programmatic Banner", journeyId: "J-001", stepId: "s1", data: makeAssetSvg(728, 90, "HbA1c Awareness · Unbranded", "#3b5bdb", "#0d1221"), dimensions: { w: 728, h: 90 }, size: 2400, uploadedAt: "2026-02-10T09:30:00Z", tags: ["unbranded", "diabetes", "awareness"] },
  { id: "A-002", name: "Mounjaro Clinical Email", type: "email", format: "html", channelHint: "Triggered Email", journeyId: "J-001", stepId: "s2", data: makeSampleEmail("Mounjaro® (tirzepatide)", "Clinical Evidence for Your T2D Patients", "<p>New data demonstrates significant HbA1c reduction in patients with Type 2 Diabetes. The SURPASS clinical trial program showed consistent glycemic control across diverse patient populations.</p><p>Key findings from SURPASS-4:<br/>• Mean HbA1c reduction of up to 2.4% from baseline<br/>• 87% of patients achieved HbA1c &lt;7% at 52 weeks<br/>• Demonstrated cardiovascular safety profile</p><p>Consider Mounjaro for your patients who need additional glycemic control beyond current therapy.</p>"), dimensions: null, size: 3200, uploadedAt: "2026-02-10T10:15:00Z", tags: ["branded", "clinical", "diabetes"] },
  { id: "A-003", name: "Endemic Point-of-Care Banner", type: "banner", format: "image", channelHint: "Endemic Banner", journeyId: "J-001", stepId: "s3", data: makeAssetSvg(300, 250, "Mounjaro · Branded", "#8b5cf6", "#0d1221"), dimensions: { w: 300, h: 250 }, size: 1800, uploadedAt: "2026-02-10T11:00:00Z", tags: ["branded", "point-of-care"] },
  { id: "A-004", name: "HbA1c Rep Talking Points", type: "rep_doc", format: "text", channelHint: "Rep Alert", journeyId: "J-001", stepId: "s4", data: makeSampleRepDoc("Mounjaro", "HbA1c ≥ 6.5%", ["SURPASS trial data: up to 2.4% HbA1c reduction from baseline", "Once-weekly dosing improves patient adherence vs. daily alternatives", "Dual GIP/GLP-1 mechanism provides differentiated efficacy", "Weight reduction co-benefit: up to 12% body weight loss in trials", "Cardiovascular safety established in SURPASS-4 (insulin glargine comparator)"]), dimensions: null, size: 1200, uploadedAt: "2026-02-10T11:30:00Z", tags: ["rep", "talking-points", "diabetes"] },
  { id: "A-005", name: "Retarget Banner — Patient Case", type: "banner", format: "image", channelHint: "Retarget Banner", journeyId: "J-001", stepId: "s5", data: makeAssetSvg(728, 90, "Retarget · Patient Case Study", "#ec4899", "#0d1221"), dimensions: { w: 728, h: 90 }, size: 2100, uploadedAt: "2026-02-10T12:00:00Z", tags: ["branded", "retarget", "case-study"] },
  { id: "A-006", name: "Patient Savings Email", type: "email", format: "html", channelHint: "Follow-up Email", journeyId: "J-001", stepId: "s6", data: makeSampleEmail("Mounjaro® Patient Support", "Savings & Formulary Resources for Your Patients", "<p>Help your patients access Mounjaro with our comprehensive support program:</p><p><strong>Savings Card Program</strong><br/>Eligible commercially insured patients may pay as little as $25 per fill. No income requirements.</p><p><strong>Prior Authorization Support</strong><br/>Our dedicated team helps navigate the PA process with payer-specific templates and clinical justification letters.</p><p><strong>Patient Education Materials</strong><br/>Downloadable injection technique guides and treatment tracker tools available in English and Spanish.</p>"), dimensions: null, size: 2900, uploadedAt: "2026-02-10T13:00:00Z", tags: ["branded", "savings", "patient-support"] },
  { id: "A-007", name: "LDL-C CV Risk Banner", type: "banner", format: "image", channelHint: "Programmatic Banner", journeyId: "J-002", stepId: "s1", data: makeAssetSvg(728, 90, "CV Risk Education · Unbranded", "#3b5bdb", "#0d1221"), dimensions: { w: 728, h: 90 }, size: 2200, uploadedAt: "2026-02-10T14:00:00Z", tags: ["unbranded", "cardiovascular"] },
  { id: "A-008", name: "Repatha Clinical Email", type: "email", format: "html", channelHint: "Triggered Email", journeyId: "J-002", stepId: "s2", data: makeSampleEmail("Repatha® (evolocumab)", "PCSK9 Inhibitor Evidence for High-Risk Patients", "<p>For patients with LDL-C ≥190 mg/dL, PCSK9 inhibition provides significant additional LDL lowering when added to maximally tolerated statin therapy.</p><p>FOURIER trial outcomes:<br/>• 59% additional LDL-C reduction vs. placebo<br/>• 15% relative risk reduction in major cardiovascular events<br/>• Sustained efficacy through 48 months of treatment</p><p>Current AHA/ACC guidelines recommend PCSK9i for patients with clinical ASCVD and LDL-C ≥70 mg/dL on maximum statin.</p>"), dimensions: null, size: 3100, uploadedAt: "2026-02-10T14:30:00Z", tags: ["branded", "clinical", "lipids"] },
  { id: "A-009", name: "CKD Staging Email", type: "email", format: "html", channelHint: "Triggered Email", journeyId: "J-003", stepId: "s1", data: makeSampleEmail("CKD Awareness", "eGFR Decline Detected — KDIGO Staging Reference", "<p>A recent lab result indicates eGFR &lt;60 mL/min for your patient, suggesting CKD Stage 3 or beyond per KDIGO classification.</p><p><strong>Recommended Next Steps:</strong><br/>• Confirm with repeat testing in 3 months<br/>• Assess for albuminuria (UACR)<br/>• Evaluate cardiovascular risk factors<br/>• Consider SGLT2 inhibitor therapy per KDIGO 2024 guidelines</p><p>Early intervention with nephroprotective agents has shown significant reduction in CKD progression and cardiovascular events.</p>"), dimensions: null, size: 2800, uploadedAt: "2026-02-11T09:00:00Z", tags: ["unbranded", "CKD", "staging"] },
  { id: "A-010", name: "Farxiga Rep Insights", type: "rep_doc", format: "text", channelHint: "Rep Alert", journeyId: "J-003", stepId: "s3", data: makeSampleRepDoc("Farxiga", "eGFR < 60 mL/min", ["DAPA-CKD trial: 39% reduction in sustained decline in eGFR, ESKD, or renal death", "Cardio-renal benefit: 29% reduction in CV death or HF hospitalization", "Approved for CKD regardless of diabetes status — broad patient eligibility", "Once-daily oral dosing with no titration required", "KDIGO 2024 guidelines recommend SGLT2i as first-line for CKD with eGFR ≥20"]), dimensions: null, size: 1100, uploadedAt: "2026-02-11T10:00:00Z", tags: ["rep", "talking-points", "CKD", "renal"] },
];

// ─── INITIAL DATA ───
const initJourneys = () => [
  {
    id: "J-001", name: "HbA1c Elevated Protocol", biomarkerId: "hba1c", threshold: "6.5", operator: "≥",
    condition: "Type 2 Diabetes", brand: "Mounjaro", priority: "high", status: "live",
    npisEnrolled: 12840, signalsToday: 342,
    guardrails: { freqCap: 3, freqWindow: 7, channelSpacing: 48, suppressionDays: 30, accelThreshold: 70 },
    steps: [
      { id: "s1", day: 0, channel: "Programmatic Banner", action: "Awareness banner — unbranded disease education", reach: 8420, engagement: "2.8% CTR" },
      { id: "s2", day: 2, channel: "Triggered Email", action: "Clinical data summary + dosing guide", reach: 6210, engagement: "38% open" },
      { id: "s3", day: 5, channel: "Endemic Banner", action: "Branded banner on point-of-care platform", reach: 5890, engagement: "3.1% CTR" },
      { id: "s4", day: 7, channel: "Rep Alert", action: "Field rep notified with talking points + lab context", reach: 3240, engagement: "62% actioned" },
      { id: "s5", day: 14, channel: "Retarget Banner", action: "Retarget HCPs who engaged Steps 1-3", reach: 4120, engagement: "4.2% CTR" },
      { id: "s6", day: 21, channel: "Follow-up Email", action: "Patient savings card + formulary info", reach: 3890, engagement: "29% open" },
    ],
  },
  {
    id: "J-002", name: "LDL-C Critical Protocol", biomarkerId: "ldlc", threshold: "190", operator: "≥",
    condition: "Severe Hyperlipidemia", brand: "Repatha", priority: "high", status: "live",
    npisEnrolled: 8920, signalsToday: 187,
    guardrails: { freqCap: 3, freqWindow: 7, channelSpacing: 48, suppressionDays: 30, accelThreshold: 70 },
    steps: [
      { id: "s1", day: 0, channel: "Programmatic Banner", action: "Unbranded CV risk education", reach: 6340, engagement: "2.1% CTR" },
      { id: "s2", day: 1, channel: "Triggered Email", action: "PCSK9i clinical evidence + guidelines", reach: 5120, engagement: "41% open" },
      { id: "s3", day: 4, channel: "Endemic Banner", action: "Branded efficacy banner", reach: 4780, engagement: "2.9% CTR" },
      { id: "s4", day: 6, channel: "Rep Alert", action: "MSL visit request for high-decile targets", reach: 2190, engagement: "58% actioned" },
      { id: "s5", day: 10, channel: "Retarget Banner", action: "Retarget with patient case study", reach: 3100, engagement: "3.8% CTR" },
    ],
  },
  {
    id: "J-003", name: "eGFR Decline Protocol", biomarkerId: "egfr", threshold: "60", operator: "<",
    condition: "Chronic Kidney Disease", brand: "Farxiga", priority: "high", status: "live",
    npisEnrolled: 9760, signalsToday: 256,
    guardrails: { freqCap: 3, freqWindow: 7, channelSpacing: 48, suppressionDays: 30, accelThreshold: 70 },
    steps: [
      { id: "s1", day: 0, channel: "Triggered Email", action: "CKD staging awareness + KDIGO guidelines", reach: 7120, engagement: "36% open" },
      { id: "s2", day: 3, channel: "Programmatic Banner", action: "SGLT2i renal outcomes data", reach: 6890, engagement: "2.5% CTR" },
      { id: "s3", day: 5, channel: "Rep Alert", action: "Field alert with eGFR trend + prescribing history", reach: 4210, engagement: "71% actioned" },
      { id: "s4", day: 10, channel: "Endemic Banner", action: "Point-of-care branded reminder", reach: 5340, engagement: "3.4% CTR" },
      { id: "s5", day: 15, channel: "Follow-up Email", action: "Patient support program enrollment kit", reach: 4560, engagement: "32% open" },
    ],
  },
];

const initNPIs = () => [
  { npi: "1234567890", name: "Dr. Sarah Chen", specialty: "Endocrinology", state: "NY", decile: 9, journeyId: "J-001", currentStep: 3, nextTouch: "Rep Alert in 2d", status: "active", engScore: 87, lastSignal: "HbA1c = 7.8%", signalTime: "14:32" },
  { npi: "2345678901", name: "Dr. Michael Torres", specialty: "Cardiology", state: "CA", decile: 8, journeyId: "J-002", currentStep: 2, nextTouch: "Endemic Banner in 1d", status: "active", engScore: 72, lastSignal: "LDL-C = 212", signalTime: "14:28" },
  { npi: "3456789012", name: "Dr. Aisha Patel", specialty: "Nephrology", state: "TX", decile: 10, journeyId: "J-003", currentStep: 4, nextTouch: "Follow-up Email in 5d", status: "active", engScore: 94, lastSignal: "eGFR = 48", signalTime: "14:26" },
  { npi: "4567890123", name: "Dr. James Wilson", specialty: "Urology", state: "FL", decile: 7, journeyId: "J-001", currentStep: 1, nextTouch: "Triggered Email today", status: "active", engScore: 45, lastSignal: "HbA1c = 6.9%", signalTime: "13:42" },
  { npi: "5678901234", name: "Dr. Lisa Nakamura", specialty: "Internal Medicine", state: "IL", decile: 6, journeyId: "J-001", currentStep: 0, nextTouch: "Suppressed — freq cap", status: "suppressed", engScore: 31, lastSignal: "HbA1c = 6.7%", signalTime: "13:30" },
  { npi: "6789012345", name: "Dr. Robert Kim", specialty: "Cardiology", state: "MA", decile: 9, journeyId: "J-002", currentStep: 3, nextTouch: "Rep Alert tomorrow", status: "active", engScore: 81, lastSignal: "LDL-C = 198", signalTime: "14:12" },
  { npi: "7890123456", name: "Dr. Emily Brooks", specialty: "Endocrinology", state: "PA", decile: 8, journeyId: "J-003", currentStep: 2, nextTouch: "Rep Alert in 3d", status: "active", engScore: 68, lastSignal: "eGFR = 55", signalTime: "12:45" },
  { npi: "8901234567", name: "Dr. David Martinez", specialty: "Nephrology", state: "AZ", decile: 7, journeyId: "J-003", currentStep: 1, nextTouch: "Banner today", status: "active", engScore: 52, lastSignal: "eGFR = 51", signalTime: "11:20" },
  { npi: "9012345678", name: "Dr. Rachel Goldstein", specialty: "Internal Medicine", state: "NY", decile: 8, journeyId: "J-001", currentStep: 5, nextTouch: "Journey complete", status: "completed", engScore: 91, lastSignal: "HbA1c = 7.1%", signalTime: "10:08" },
  { npi: "0123456789", name: "Dr. Kevin Okafor", specialty: "Cardiology", state: "GA", decile: 9, journeyId: "J-002", currentStep: 0, nextTouch: "Prog. Banner today", status: "active", engScore: 0, lastSignal: "LDL-C = 205", signalTime: "14:31" },
];

// ─── UTILITY ───
let _id = 100;
const uid = () => `id-${++_id}`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── SHARED COMPONENTS ───
const inputStyle = {
  background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "8px 12px",
  color: T.text, fontSize: 13, fontFamily: T.sans, width: "100%", outline: "none", transition: "border-color 0.2s",
};
const labelStyle = { fontSize: 11, color: T.textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, display: "block" };
const btnBase = { border: "none", cursor: "pointer", fontFamily: T.sans, fontWeight: 600, borderRadius: T.radiusSm, transition: "all 0.15s", fontSize: 12 };

function Btn({ children, variant = "primary", onClick, style: s, disabled }) {
  const variants = {
    primary: { background: T.accent, color: "#fff", padding: "8px 18px" },
    secondary: { background: T.surfaceRaised, color: T.text, padding: "8px 18px", border: `1px solid ${T.border}` },
    danger: { background: T.redBg, color: T.red, padding: "8px 18px", border: `1px solid ${T.redBorder}` },
    ghost: { background: "transparent", color: T.textSecondary, padding: "6px 12px" },
    small: { background: T.accentBg, color: T.accentLight, padding: "4px 10px", fontSize: 11 },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...btnBase, ...variants[variant], opacity: disabled ? 0.4 : 1, ...s }}>
      {children}
    </button>
  );
}

function Badge({ color, bg, border, children }) {
  return (
    <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: bg, color, border: `1px solid ${border}`, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function StatusDot({ status }) {
  const m = { live: T.green, active: T.green, draft: T.textDim, paused: T.amber, suppressed: T.textDim, completed: T.accent };
  const c = m[status] || T.textDim;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, boxShadow: status === "live" || status === "active" ? `0 0 8px ${c}60` : "none" }} />
      <span style={{ fontSize: 11, color: c, fontWeight: 500, textTransform: "capitalize" }}>{status}</span>
    </span>
  );
}

function ChannelTag({ channel, compact }) {
  const ch = CHANNELS[channel] || { color: T.textSecondary, bg: T.surfaceRaised, border: T.border, abbr: "?" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: compact ? "1px 6px" : "2px 8px", borderRadius: T.radiusSm, fontSize: compact ? 9 : 10, fontWeight: 600, background: ch.bg, color: ch.color, border: `1px solid ${ch.border}`, whiteSpace: "nowrap" }}>
      {!compact && <span style={{ fontSize: 11 }}>{ch.icon}</span>}
      {compact ? ch.abbr : channel}
    </span>
  );
}

function PriorityBadge({ level }) {
  const m = { high: { c: T.red, bg: T.redBg, b: T.redBorder }, medium: { c: T.amber, bg: T.amberBg, b: T.amberBorder }, low: { c: T.green, bg: T.greenBg, b: T.greenBorder } };
  const p = m[level] || m.low;
  return <Badge color={p.c} bg={p.bg} border={p.b}>{level}</Badge>;
}

function MetricCard({ label, value, delta, up, icon, delay = 0 }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: "16px 18px", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: T.textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ fontSize: 15 }}>{icon}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{value}</span>
        {delta && <span style={{ fontSize: 10, fontWeight: 600, color: up ? T.green : T.red, background: up ? T.greenBg : T.redBg, padding: "1px 6px", borderRadius: 10 }}>{delta}</span>}
      </div>
    </div>
  );
}

function Modal({ children, onClose, width = 640, title }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.15s ease" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 0, width, maxHeight: "88vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>
        {title && (
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{title}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 16, padding: 4, lineHeight: 1 }}>✕</button>
          </div>
        )}
        <div style={{ overflow: "auto", flex: 1, padding: "20px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Tabs({ items, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 1, borderBottom: `1px solid ${T.border}` }}>
      {items.map(item => (
        <button key={item.key} onClick={() => onChange(item.key)} style={{
          padding: "11px 18px", fontSize: 12, fontWeight: 500, cursor: "pointer",
          background: "none", border: "none", fontFamily: T.sans,
          color: active === item.key ? T.accentLight : T.textSecondary,
          borderBottom: `2px solid ${active === item.key ? T.accent : "transparent"}`,
          transition: "all 0.15s",
        }}>{item.label}{item.count != null && <span style={{ marginLeft: 6, fontSize: 10, color: T.textDim, fontFamily: T.mono }}>({item.count})</span>}</button>
      ))}
    </div>
  );
}

function Select({ value, onChange, options, style: s }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: "pointer", appearance: "none", paddingRight: 28, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23556380' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", ...s }}>
      {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
    </select>
  );
}

// ─── JOURNEY FLOW VISUALIZATION ───
function JourneyFlow({ steps, compact, assets, journeyId, onPreviewAsset }) {
  return (
    <div style={{ overflowX: "auto", padding: compact ? "8px 0" : "14px 0" }}>
      <div style={{ display: "flex", alignItems: "stretch", minWidth: steps.length * (compact ? 120 : 155) }}>
        {steps.map((step, i) => {
          const ch = CHANNELS[step.channel] || { color: T.textSecondary, bg: T.surfaceRaised, border: T.border, icon: "·" };
          const next = steps[i + 1];
          const nextCh = next ? (CHANNELS[next.channel] || { color: T.textSecondary }) : null;
          const stepAsset = assets?.find(a => a.journeyId === journeyId && a.stepId === step.id);
          return (
            <div key={step.id || i} style={{ display: "flex", alignItems: "stretch", flex: "0 0 auto" }}>
              <div style={{ width: compact ? 110 : 148, padding: compact ? 10 : 13, borderRadius: T.radius, background: ch.bg, border: `1px solid ${ch.border}`, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: compact ? 11 : 13 }}>{ch.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: ch.color, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: T.mono }}>Day {step.day}</span>
                </div>
                <div style={{ fontSize: compact ? 10 : 11, fontWeight: 600, color: T.text }}>{step.channel}</div>
                {!compact && <div style={{ fontSize: 10, color: T.textSecondary, lineHeight: 1.45, flex: 1 }}>{step.action}</div>}
                {!compact && step.reach > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.textDim, marginTop: 2, fontFamily: T.mono }}>
                    <span>{step.reach?.toLocaleString()}</span>
                    <span style={{ color: ch.color }}>{step.engagement}</span>
                  </div>
                )}
                {!compact && stepAsset && (
                  <div onClick={e => { e.stopPropagation(); onPreviewAsset?.(stepAsset); }} style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, cursor: "pointer" }}>
                    <AssetThumb asset={stepAsset} size={20} onClick={() => onPreviewAsset?.(stepAsset)} />
                    <span style={{ fontSize: 8, color: T.green, fontWeight: 600 }}>Asset</span>
                  </div>
                )}
              </div>
              {i < steps.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", padding: "0 3px" }}>
                  <svg width="24" height="12" viewBox="0 0 24 12">
                    <line x1="0" y1="6" x2="18" y2="6" stroke={ch.color} strokeWidth="1" strokeOpacity="0.4" />
                    <polygon points="18,3 24,6 18,9" fill={nextCh ? nextCh.color : T.textDim} opacity="0.5" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── JOURNEY BUILDER MODAL ───
function JourneyBuilder({ journey, onSave, onClose, assets, onAddAsset, onPreviewAsset }) {
  const isEdit = !!journey;
  const [form, setForm] = useState(() => journey ? { ...journey, steps: journey.steps.map(s => ({ ...s })), guardrails: { ...journey.guardrails } } : {
    id: `J-${String(Date.now()).slice(-3)}`, name: "", biomarkerId: "hba1c", threshold: "6.5", operator: "≥",
    condition: "", brand: "", priority: "high", status: "draft",
    npisEnrolled: 0, signalsToday: 0,
    guardrails: { freqCap: 3, freqWindow: 7, channelSpacing: 48, suppressionDays: 30, accelThreshold: 70 },
    steps: [{ id: uid(), day: 0, channel: "Programmatic Banner", action: "", reach: 0, engagement: "—" }],
  });

  const biomarker = BIOMARKERS.find(b => b.id === form.biomarkerId);

  const updateField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const updateGuardrail = (key, val) => setForm(f => ({ ...f, guardrails: { ...f.guardrails, [key]: val } }));
  const updateStep = (idx, key, val) => setForm(f => {
    const steps = [...f.steps];
    steps[idx] = { ...steps[idx], [key]: val };
    return { ...f, steps };
  });
  const addStep = () => {
    const lastDay = form.steps.length > 0 ? form.steps[form.steps.length - 1].day : 0;
    setForm(f => ({ ...f, steps: [...f.steps, { id: uid(), day: lastDay + 3, channel: CHANNEL_LIST[0], action: "", reach: 0, engagement: "—" }] }));
  };
  const removeStep = (idx) => setForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }));

  const canSave = form.name.trim() && form.brand.trim() && form.condition && form.steps.length > 0 && form.steps.every(s => s.action.trim());

  return (
    <Modal onClose={onClose} width={760} title={isEdit ? `Edit: ${journey.name}` : "New Orchestration Journey"}>
      <div style={{ display: "grid", gap: 20 }}>
        {/* Basic Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Journey Name</label>
            <input value={form.name} onChange={e => updateField("name", e.target.value)} placeholder="e.g. HbA1c Elevated Protocol" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Biomarker</label>
            <Select value={form.biomarkerId} onChange={v => { updateField("biomarkerId", v); const bm = BIOMARKERS.find(b => b.id === v); if (bm) { updateField("threshold", bm.defaultThreshold); updateField("operator", bm.operator); updateField("condition", bm.conditions[0]); } }} options={BIOMARKERS.map(b => ({ value: b.id, label: `${b.name} (${b.unit})` }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 8 }}>
            <div>
              <label style={labelStyle}>Op</label>
              <Select value={form.operator} onChange={v => updateField("operator", v)} options={["≥", ">", "<", "≤", "="]} />
            </div>
            <div>
              <label style={labelStyle}>Threshold ({biomarker?.unit})</label>
              <input value={form.threshold} onChange={e => updateField("threshold", e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Condition</label>
            <Select value={form.condition} onChange={v => updateField("condition", v)} options={biomarker?.conditions || ["Select biomarker first"]} />
          </div>
          <div>
            <label style={labelStyle}>Brand</label>
            <input value={form.brand} onChange={e => updateField("brand", e.target.value)} placeholder="e.g. Mounjaro" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <Select value={form.priority} onChange={v => updateField("priority", v)} options={["high", "medium", "low"]} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <Select value={form.status} onChange={v => updateField("status", v)} options={["draft", "live", "paused"]} />
          </div>
        </div>

        {/* Guardrails */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🔒</span> Orchestration Guardrails
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, background: T.surfaceRaised, padding: 14, borderRadius: T.radius, border: `1px solid ${T.border}` }}>
            {[
              { key: "freqCap", label: "Freq Cap", suffix: "touches" },
              { key: "freqWindow", label: "Per Window", suffix: "days" },
              { key: "channelSpacing", label: "Ch. Spacing", suffix: "hrs" },
              { key: "suppressionDays", label: "Suppression", suffix: "days" },
              { key: "accelThreshold", label: "Accel. Score", suffix: "pts" },
            ].map(g => (
              <div key={g.key}>
                <label style={{ ...labelStyle, fontSize: 9 }}>{g.label}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="number" value={form.guardrails[g.key]} onChange={e => updateGuardrail(g.key, parseInt(e.target.value) || 0)} style={{ ...inputStyle, width: 60, textAlign: "center", fontFamily: T.mono, fontSize: 13 }} />
                  <span style={{ fontSize: 9, color: T.textDim }}>{g.suffix}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps Sequencer */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>📡 Touchpoint Sequence ({form.steps.length} steps)</span>
            <Btn variant="small" onClick={addStep}>+ Add Step</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {form.steps.map((step, i) => {
              const ch = CHANNELS[step.channel] || { color: T.textSecondary, bg: T.surfaceRaised, border: T.border, icon: "·" };
              const stepAsset = assets?.find(a => a.journeyId === form.id && a.stepId === step.id);
              return (
                <div key={step.id} style={{ borderRadius: T.radius, background: T.surfaceRaised, border: `1px solid ${ch.border}`, borderLeft: `3px solid ${ch.color}`, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "36px 60px 180px 1fr 32px", gap: 8, alignItems: "center", padding: "10px 12px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.textDim, textAlign: "center", fontFamily: T.mono }}>#{i + 1}</span>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 8 }}>Day</label>
                      <input type="number" min="0" value={step.day} onChange={e => updateStep(i, "day", parseInt(e.target.value) || 0)} style={{ ...inputStyle, textAlign: "center", fontFamily: T.mono, padding: "5px 4px" }} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 8 }}>Channel</label>
                      <Select value={step.channel} onChange={v => updateStep(i, "channel", v)} options={CHANNEL_LIST} style={{ fontSize: 11, padding: "5px 8px" }} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 8 }}>Action / Content</label>
                      <input value={step.action} onChange={e => updateStep(i, "action", e.target.value)} placeholder="Describe the touchpoint content..." style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} />
                    </div>
                    <button onClick={() => removeStep(i)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 14, padding: 2, opacity: form.steps.length <= 1 ? 0.2 : 0.6 }} disabled={form.steps.length <= 1}>×</button>
                  </div>
                  {/* Asset attachment row */}
                  <div style={{ padding: "4px 12px 8px", paddingLeft: 56, display: "flex", alignItems: "center", gap: 8 }}>
                    {stepAsset ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                        <AssetThumb asset={stepAsset} size={32} onClick={() => onPreviewAsset?.(stepAsset)} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stepAsset.name}</div>
                          <div style={{ fontSize: 9, color: T.textDim }}>{ASSET_TYPES[stepAsset.type]?.label || stepAsset.type} · Click to preview</div>
                        </div>
                        <Btn variant="ghost" onClick={() => onPreviewAsset?.(stepAsset)} style={{ fontSize: 10, padding: "3px 8px" }}>👁 Preview</Btn>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                        <AssetUploadZone compact channelHint={step.channel} onUpload={(asset) => {
                          const linked = { ...asset, journeyId: form.id, stepId: step.id };
                          onAddAsset?.(linked);
                        }} />
                        {/* Pick from existing unassigned assets */}
                        {assets && assets.filter(a => !a.stepId || (a.journeyId === form.id && a.stepId === step.id)).length > 0 && (
                          <select onChange={e => { if (!e.target.value) return; const a = assets.find(x => x.id === e.target.value); if (a && onAddAsset) { onAddAsset({ ...a, journeyId: form.id, stepId: step.id }); } e.target.value = ""; }} defaultValue="" style={{ ...inputStyle, width: "auto", fontSize: 10, padding: "4px 8px", minWidth: 100 }}>
                            <option value="">Link existing…</option>
                            {assets.filter(a => !a.stepId).map(a => <option key={a.id} value={a.id}>{ASSET_TYPES[a.type]?.icon} {a.name}</option>)}
                          </select>
                        )}
                        <span style={{ fontSize: 9, color: T.textDim }}>No asset attached</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        {form.steps.length > 0 && (
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, marginBottom: 6, display: "block" }}>Journey Preview</span>
            <JourneyFlow steps={form.steps} compact assets={assets} journeyId={form.id} onPreviewAsset={onPreviewAsset} />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <div style={{ display: "flex", gap: 8 }}>
            {isEdit && <Btn variant="danger" onClick={() => { onSave(null, journey.id); onClose(); }}>Delete Journey</Btn>}
            <Btn variant="primary" onClick={() => { onSave(form); onClose(); }} disabled={!canSave}>{isEdit ? "Save Changes" : "Create Journey"}</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── NPI DETAIL MODAL ───
function NPIDetailModal({ record, journeys, onClose, onUpdate }) {
  const journey = journeys.find(j => j.id === record.journeyId);
  const sc = record.engScore > 70 ? T.green : record.engScore > 40 ? T.amber : T.red;

  return (
    <Modal onClose={onClose} width={620} title={record.name}>
      <div style={{ display: "grid", gap: 16 }}>
        {/* Header Info */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { l: "NPI", v: record.npi },
            { l: "Specialty", v: record.specialty },
            { l: "State", v: record.state },
            { l: "Decile", v: record.decile },
            { l: "Last Signal", v: record.lastSignal },
          ].map(d => (
            <div key={d.l} style={{ minWidth: 80 }}>
              <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>{d.l}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.mono, marginTop: 2 }}>{d.v}</div>
            </div>
          ))}
          <div><div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</div><div style={{ marginTop: 4 }}><StatusDot status={record.status} /></div></div>
        </div>

        {/* Engagement Score */}
        <div style={{ background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 14, display: "flex", gap: 16, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Engagement</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: sc, fontFamily: T.mono }}>{record.engScore}</div>
          </div>
          <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${record.engScore}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${sc}, ${sc}bb)`, transition: "width 0.6s ease" }} />
          </div>
        </div>

        {/* Journey Progress */}
        {journey && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8 }}>
              Journey: {journey.name} <span style={{ color: T.textDim, fontWeight: 400 }}>· {journey.brand}</span>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {journey.steps.map((step, i) => {
                const done = i < record.currentStep;
                const cur = i === record.currentStep;
                const ch = CHANNELS[step.channel] || { color: T.textSecondary, bg: T.surfaceRaised, border: T.border, icon: "·" };
                return (
                  <div key={i} style={{ flex: "1 1 0", minWidth: 70, padding: "8px 6px", borderRadius: 6, textAlign: "center", background: done ? ch.bg : cur ? `${ch.color}08` : T.surfaceRaised, border: `1px solid ${done ? ch.border : cur ? ch.color + "40" : T.border}`, opacity: (!done && !cur) ? 0.35 : 1, transition: "all 0.2s" }}>
                    <div style={{ fontSize: 11, marginBottom: 3 }}>{done ? "✓" : cur ? "▸" : ch.icon}</div>
                    <div style={{ fontSize: 8, color: done ? ch.color : T.textDim, fontWeight: 700, fontFamily: T.mono }}>D{step.day}</div>
                    <div style={{ fontSize: 8, color: T.textDim, marginTop: 1 }}>{ch.abbr || step.channel.split(" ")[0]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
          {record.status === "active" && <Btn variant="secondary" onClick={() => { onUpdate(record.npi, { status: "suppressed" }); }}>Suppress</Btn>}
          {record.status === "suppressed" && <Btn variant="secondary" onClick={() => { onUpdate(record.npi, { status: "active" }); }}>Reactivate</Btn>}
          <Btn variant="ghost" onClick={onClose} style={{ marginLeft: "auto" }}>Close</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── ASSET PREVIEW MODAL ───
function AssetPreviewModal({ asset, onClose }) {
  if (!asset) return null;
  const at = ASSET_TYPES[asset.type] || {};
  return (
    <Modal onClose={onClose} width={at.preview === "html" ? 720 : at.preview === "image" ? 820 : 640} title={`${at.icon || "📎"} ${asset.name}`}>
      <div style={{ display: "grid", gap: 14 }}>
        {/* Meta */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { l: "Type", v: at.label }, { l: "Format", v: asset.format?.toUpperCase() },
            asset.dimensions ? { l: "Size", v: `${asset.dimensions.w}×${asset.dimensions.h}` } : null,
            asset.journeyId ? { l: "Journey", v: asset.journeyId } : null,
          ].filter(Boolean).map(d => (
            <div key={d.l} style={{ padding: "4px 10px", background: T.surfaceRaised, borderRadius: T.radiusSm, border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase" }}>{d.l}: </span>
              <span style={{ fontSize: 11, color: T.text, fontWeight: 600 }}>{d.v}</span>
            </div>
          ))}
          {asset.tags?.map(t => <Badge key={t} color={T.accentLight} bg={T.accentBg} border={T.accentBorder}>{t}</Badge>)}
        </div>

        {/* Preview area */}
        <div style={{ background: "#fff", borderRadius: T.radius, overflow: "hidden", border: `1px solid ${T.borderLight}` }}>
          {at.preview === "image" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 20, background: "#f0f0f3", minHeight: 120 }}>
              <img src={asset.data} alt={asset.name} style={{ maxWidth: "100%", maxHeight: 400, display: "block", borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }} />
            </div>
          )}
          {at.preview === "html" && (
            <iframe srcDoc={asset.data} title={asset.name} style={{ width: "100%", height: 460, border: "none", display: "block" }} sandbox="allow-same-origin" />
          )}
          {at.preview === "text" && (
            <pre style={{ padding: 18, margin: 0, fontSize: 12, fontFamily: T.mono, lineHeight: 1.65, color: "#1a1a2e", background: "#f8f9fc", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 400, overflow: "auto" }}>{asset.data}</pre>
          )}
          {at.preview === "pdf" && (
            <div style={{ padding: 40, textAlign: "center", color: T.textDim }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 12 }}>PDF preview — {(asset.size / 1024).toFixed(1)} KB</div>
            </div>
          )}
        </div>

        {/* Source toggle for HTML */}
        {at.preview === "html" && (
          <details style={{ background: T.surfaceRaised, borderRadius: T.radius, border: `1px solid ${T.border}` }}>
            <summary style={{ padding: "8px 14px", fontSize: 11, fontWeight: 600, color: T.textSecondary, cursor: "pointer" }}>View HTML Source</summary>
            <pre style={{ padding: "12px 14px", margin: 0, fontSize: 10, fontFamily: T.mono, color: T.textDim, lineHeight: 1.5, maxHeight: 200, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", borderTop: `1px solid ${T.border}` }}>{asset.data}</pre>
          </details>
        )}
      </div>
    </Modal>
  );
}

// ─── ASSET UPLOAD (inline drop zone) ───
function AssetUploadZone({ onUpload, channelHint, compact }) {
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef(null);
  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    const isImage = file.type.startsWith("image/");
    const isHtml = file.name.endsWith(".html") || file.name.endsWith(".htm") || file.type === "text/html";
    const isPdf = file.type === "application/pdf";
    const format = isImage ? "image" : isHtml ? "html" : isPdf ? "pdf" : "text";
    let type = "content";
    if (isImage) type = "banner";
    else if (isHtml) type = "email";
    else type = "rep_doc";
    // Guess from channel hint
    if (channelHint) {
      if (channelHint.includes("Banner")) type = "banner";
      else if (channelHint.includes("Email")) type = "email";
      else if (channelHint.includes("Rep")) type = "rep_doc";
    }
    reader.onload = (e) => {
      const data = e.target.result;
      const asset = { id: `A-${Date.now()}`, name: file.name, type, format, channelHint: channelHint || "", data, dimensions: null, size: file.size, uploadedAt: new Date().toISOString(), tags: [], journeyId: null, stepId: null };
      if (isImage) {
        const img = new Image();
        img.onload = () => { asset.dimensions = { w: img.width, h: img.height }; onUpload(asset); };
        img.src = data;
      } else { onUpload(asset); }
    };
    if (isImage || isPdf) reader.readAsDataURL(file); else reader.readAsText(file);
  };
  return (
    <div
      onDrop={e => { e.preventDefault(); e.stopPropagation(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
      onDragLeave={e => { e.stopPropagation(); setDragOver(false); }}
      onClick={() => ref.current?.click()}
      style={{ border: `1px dashed ${dragOver ? T.accent : T.borderLight}`, borderRadius: T.radiusSm, padding: compact ? "6px 8px" : "12px", textAlign: "center", cursor: "pointer", background: dragOver ? T.accentBg : "transparent", transition: "all 0.15s" }}
    >
      <input ref={ref} type="file" accept="image/*,.html,.htm,.txt,.md,.pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
      <div style={{ fontSize: compact ? 10 : 11, color: T.textDim }}>{compact ? "+ Upload" : "Drop file or click to upload"}</div>
    </div>
  );
}

// ─── ASSET THUMBNAIL (small inline preview) ───
function AssetThumb({ asset, size = 36, onClick }) {
  if (!asset) return null;
  const at = ASSET_TYPES[asset.type] || {};
  const borderColor = asset.type === "banner" ? T.accent : asset.type === "email" ? T.cyan : asset.type === "rep_doc" ? T.amber : T.border;
  return (
    <div onClick={onClick} title={`${asset.name} — click to preview`} style={{ width: size, height: size, borderRadius: T.radiusSm, overflow: "hidden", cursor: "pointer", border: `2px solid ${borderColor}`, background: T.surfaceRaised, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color 0.15s" }}>
      {at.preview === "image" ? (
        <img src={asset.data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: size * 0.45 }}>{at.icon || "📎"}</span>
      )}
    </div>
  );
}

// ─── ASSET LIBRARY TAB ───
function AssetLibrary({ assets, onAdd, onDelete, onPreview, journeys }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = assets.filter(a => {
    if (filter !== "all" && a.type !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });
  const grouped = {};
  filtered.forEach(a => { const k = a.journeyId || "unassigned"; if (!grouped[k]) grouped[k] = []; grouped[k].push(a); });

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." style={{ ...inputStyle, width: 240 }} />
        <Select value={filter} onChange={setFilter} options={[{ value: "all", label: "All Types" }, ...Object.entries(ASSET_TYPES).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }))]} style={{ width: 180 }} />
        <span style={{ fontSize: 11, color: T.textDim, fontFamily: T.mono, marginLeft: "auto" }}>{filtered.length} assets</span>
      </div>

      {/* Upload zone */}
      <div style={{ marginBottom: 16 }}>
        <AssetUploadZone onUpload={onAdd} />
      </div>

      {/* Grouped by journey */}
      {Object.entries(grouped).map(([jId, items]) => {
        const journey = journeys.find(j => j.id === jId);
        return (
          <div key={jId} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              {journey ? (<><span style={{ color: T.accentLight }}>{journey.name}</span><span style={{ color: T.textDim }}>· {journey.brand}</span></>) : <span>Unassigned</span>}
              <Badge color={T.textDim} bg={T.surfaceRaised} border={T.border}>{items.length}</Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {items.map(asset => {
                const at = ASSET_TYPES[asset.type] || {};
                const borderColor = asset.type === "banner" ? T.accentBorder : asset.type === "email" ? T.cyanBorder : asset.type === "rep_doc" ? T.amberBorder : T.border;
                return (
                  <div key={asset.id} style={{ background: T.surface, border: `1px solid ${borderColor}`, borderRadius: T.radius, overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }} onClick={() => onPreview(asset)}>
                    {/* Thumbnail */}
                    <div style={{ height: 100, background: T.bgAlt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {at.preview === "image" ? (
                        <img src={asset.data} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : at.preview === "html" ? (
                        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
                          <iframe srcDoc={asset.data} title="" style={{ width: 600, height: 460, border: "none", transform: "scale(0.42)", transformOrigin: "top left", pointerEvents: "none" }} sandbox="allow-same-origin" />
                        </div>
                      ) : (
                        <pre style={{ padding: 10, margin: 0, fontSize: 7, fontFamily: T.mono, color: T.textDim, lineHeight: 1.3, overflow: "hidden", maxHeight: "100%", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{(asset.data || "").slice(0, 400)}</pre>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{asset.name}</div>
                        <button onClick={e => { e.stopPropagation(); onDelete(asset.id); }} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 12, padding: "0 2px", opacity: 0.5 }} title="Delete">×</button>
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: at.preview === "image" ? T.accentBg : at.preview === "html" ? T.cyanBg : T.amberBg, color: at.preview === "image" ? T.accentLight : at.preview === "html" ? T.cyan : T.amber, fontWeight: 600 }}>{at.label}</span>
                        {asset.channelHint && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: T.surfaceRaised, color: T.textDim }}>{asset.channelHint}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: T.textDim }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>No assets yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Upload banners, emails, and rep documents above, or attach them to journey steps in the builder.</div>
        </div>
      )}
    </div>
  );
}

// ─── CSV IMPORT MODAL ───
const CSV_FIELDS = [
  { key: "npi", label: "NPI Number", required: true, hint: "10-digit NPI" },
  { key: "name", label: "HCP Name", required: true, hint: "Dr. First Last" },
  { key: "specialty", label: "Specialty", required: false, hint: "e.g. Cardiology" },
  { key: "state", label: "State", required: false, hint: "2-letter code" },
  { key: "decile", label: "Decile", required: false, hint: "1-10" },
  { key: "journeyId", label: "Journey ID", required: false, hint: "e.g. J-001" },
];

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const sep = lines[0].includes("\t") ? "\t" : ",";
  const parseRow = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === sep && !inQuotes) { result.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    result.push(current.trim());
    return result;
  };
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(l => parseRow(l));
  return { headers, rows };
}

function autoMapColumns(csvHeaders) {
  const mapping = {};
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases = {
    npi: ["npi", "npinumber", "npiid", "nationalprovideridentifier", "providerid"],
    name: ["name", "hcpname", "physicianname", "providername", "drname", "fullname", "doctor"],
    specialty: ["specialty", "speciality", "spec", "medicalspecialty", "practicearea"],
    state: ["state", "st", "statecode", "region", "location"],
    decile: ["decile", "dec", "tier", "rank", "ranking", "targetdecile"],
    journeyId: ["journeyid", "journey", "campaignid", "campaign", "protocol"],
  };
  csvHeaders.forEach((header, idx) => {
    const norm = normalize(header);
    for (const [field, alts] of Object.entries(aliases)) {
      if (alts.some(a => norm.includes(a) || a.includes(norm))) {
        if (!mapping[field]) mapping[field] = idx;
      }
    }
  });
  return mapping;
}

function CSVImportModal({ existingNPIs, journeys, onImport, onClose }) {
  const [step, setStep] = useState("upload"); // upload | map | preview | done
  const [rawCSV, setRawCSV] = useState(null);
  const [parsed, setParsed] = useState({ headers: [], rows: [] });
  const [mapping, setMapping] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [validatedRows, setValidatedRows] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [previewPage, setPreviewPage] = useState(0);
  const fileRef = useRef(null);
  const PREVIEW_PAGE_SIZE = 8;

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setRawCSV(text);
      const p = parseCSV(text);
      setParsed(p);
      const autoMap = autoMapColumns(p.headers);
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const updateMapping = (field, colIdx) => {
    setMapping(m => {
      const next = { ...m };
      if (colIdx === -1) { delete next[field]; } else { next[field] = colIdx; }
      return next;
    });
  };

  const validate = () => {
    const existingSet = new Set(existingNPIs.map(n => n.npi));
    const seenNPIs = new Set();
    const results = parsed.rows.map((row, idx) => {
      const record = {};
      const errors = [];
      const warnings = [];

      // Extract mapped fields
      CSV_FIELDS.forEach(f => {
        const colIdx = mapping[f.key];
        record[f.key] = colIdx != null && colIdx >= 0 ? (row[colIdx] || "").trim() : "";
      });

      // Validation
      if (!record.npi) { errors.push("Missing NPI"); }
      else if (!/^\d{10}$/.test(record.npi)) { errors.push("NPI must be 10 digits"); }
      if (!record.name) { errors.push("Missing name"); }
      if (record.decile) {
        const d = parseInt(record.decile);
        if (isNaN(d) || d < 1 || d > 10) { errors.push("Decile must be 1-10"); }
        else { record.decile = d; }
      }
      if (record.state && !/^[A-Z]{2}$/i.test(record.state)) { warnings.push("State should be 2-letter code"); }
      if (record.npi && existingSet.has(record.npi)) { warnings.push("Existing NPI — will update"); }
      if (record.npi && seenNPIs.has(record.npi)) { errors.push("Duplicate NPI in file"); }
      if (record.npi) seenNPIs.add(record.npi);
      if (record.journeyId && !journeys.find(j => j.id === record.journeyId)) { warnings.push(`Journey ${record.journeyId} not found — will skip assignment`); }

      return { row: idx + 1, record, errors, warnings, valid: errors.length === 0 };
    });
    setValidatedRows(results);
    setPreviewPage(0);
    setStep("preview");
  };

  const executeImport = () => {
    const toImport = validatedRows.filter(v => v.valid).map(v => ({
      npi: v.record.npi,
      name: v.record.name,
      specialty: v.record.specialty || "Internal Medicine",
      state: (v.record.state || "NY").toUpperCase(),
      decile: typeof v.record.decile === "number" ? v.record.decile : 5,
      journeyId: v.record.journeyId && journeys.find(j => j.id === v.record.journeyId) ? v.record.journeyId : "",
      currentStep: 0,
      nextTouch: v.record.journeyId ? "Awaiting signal" : "Unassigned",
      status: "active",
      engScore: 0,
      lastSignal: "—",
      signalTime: "—",
    }));
    const existingSet = new Set(existingNPIs.map(n => n.npi));
    const newCount = toImport.filter(r => !existingSet.has(r.npi)).length;
    const updateCount = toImport.filter(r => existingSet.has(r.npi)).length;
    onImport(toImport);
    setImportResult({ total: toImport.length, new: newCount, updated: updateCount, skipped: validatedRows.filter(v => !v.valid).length });
    setStep("done");
  };

  const validCount = validatedRows.filter(v => v.valid).length;
  const errorCount = validatedRows.filter(v => !v.valid).length;
  const warnCount = validatedRows.filter(v => v.warnings.length > 0).length;
  const pagedRows = validatedRows.slice(previewPage * PREVIEW_PAGE_SIZE, (previewPage + 1) * PREVIEW_PAGE_SIZE);
  const totalPages = Math.ceil(validatedRows.length / PREVIEW_PAGE_SIZE);

  return (
    <Modal onClose={onClose} width={step === "upload" ? 520 : 780} title="Import NPIs from CSV">
      {/* ─── STEP 1: UPLOAD ─── */}
      {step === "upload" && (
        <div>
          {/* Drop zone */}
          <div
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? T.accent : T.borderLight}`,
              borderRadius: T.radiusLg, padding: "50px 30px", textAlign: "center", cursor: "pointer",
              background: dragOver ? T.accentBg : T.surfaceRaised, transition: "all 0.2s",
            }}
          >
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Drop CSV file here or click to browse</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>Supports .csv and .tsv — comma or tab delimited</div>
          </div>

          {/* Template download */}
          <div style={{ marginTop: 16, background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8 }}>Expected Columns</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CSV_FIELDS.map(f => (
                <span key={f.key} style={{ padding: "3px 8px", borderRadius: T.radiusSm, fontSize: 10, fontWeight: 600, fontFamily: T.mono, background: f.required ? T.accentBg : T.bgAlt, color: f.required ? T.accentLight : T.textSecondary, border: `1px solid ${f.required ? T.accentBorder : T.border}` }}>
                  {f.label}{f.required && " *"}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 10, color: T.textDim, marginTop: 8 }}>
              * = required. Columns are auto-detected by header name. You can adjust mapping in the next step.
            </div>
            <button onClick={() => {
              const csv = "npi,name,specialty,state,decile,journey_id\n1122334455,Dr. Jane Smith,Cardiology,NY,8,J-001\n2233445566,Dr. John Doe,Endocrinology,CA,7,J-003\n";
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "npi_import_template.csv"; a.click();
              URL.revokeObjectURL(url);
            }} style={{ ...btnBase, marginTop: 10, padding: "6px 14px", background: T.bgAlt, color: T.accentLight, border: `1px solid ${T.accentBorder}`, fontSize: 11 }}>
              ⬇ Download Template CSV
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: COLUMN MAPPING ─── */}
      {step === "map" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Map CSV Columns</div>
              <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>
                {parsed.headers.length} columns detected · {parsed.rows.length} rows · Auto-mapped where possible
              </div>
            </div>
            <Badge color={T.green} bg={T.greenBg} border={T.greenBorder}>{parsed.rows.length} rows</Badge>
          </div>

          {/* Mapping grid */}
          <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
            {CSV_FIELDS.map(field => {
              const currentCol = mapping[field.key];
              const isMapped = currentCol != null && currentCol >= 0;
              const sampleVal = isMapped && parsed.rows[0] ? parsed.rows[0][currentCol] : null;
              return (
                <div key={field.key} style={{ display: "grid", gridTemplateColumns: "140px 1fr 160px", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: T.radius, background: isMapped ? T.surfaceRaised : T.bgAlt, border: `1px solid ${isMapped ? T.greenBorder : field.required ? T.redBorder : T.border}` }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>
                      {field.label} {field.required && <span style={{ color: T.red }}>*</span>}
                    </div>
                    <div style={{ fontSize: 9, color: T.textDim }}>{field.hint}</div>
                  </div>
                  <Select
                    value={currentCol != null ? String(currentCol) : "-1"}
                    onChange={v => updateMapping(field.key, parseInt(v))}
                    options={[
                      { value: "-1", label: "— Not mapped —" },
                      ...parsed.headers.map((h, i) => ({ value: String(i), label: h })),
                    ]}
                    style={{ fontSize: 11, padding: "6px 10px" }}
                  />
                  <div style={{ fontSize: 10, color: sampleVal ? T.textSecondary : T.textDim, fontFamily: T.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sampleVal ? `Preview: ${sampleVal}` : "No data"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Raw data preview */}
          <div style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: "auto", maxHeight: 140 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: T.mono }}>
              <thead>
                <tr>{parsed.headers.map((h, i) => <th key={i} style={{ padding: "6px 8px", borderBottom: `1px solid ${T.border}`, textAlign: "left", color: T.textSecondary, fontWeight: 600, whiteSpace: "nowrap", position: "sticky", top: 0, background: T.bgAlt }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 4).map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ padding: "4px 8px", borderBottom: `1px solid ${T.border}`, color: T.textDim, whiteSpace: "nowrap" }}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, marginTop: 14, borderTop: `1px solid ${T.border}` }}>
            <Btn variant="ghost" onClick={() => setStep("upload")}>← Back</Btn>
            <Btn variant="primary" onClick={validate} disabled={mapping.npi == null || mapping.name == null}>
              Validate & Preview →
            </Btn>
          </div>
        </div>
      )}

      {/* ─── STEP 3: PREVIEW & VALIDATE ─── */}
      {step === "preview" && (
        <div>
          {/* Summary badges */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <Badge color={T.green} bg={T.greenBg} border={T.greenBorder}>✓ {validCount} valid</Badge>
            {errorCount > 0 && <Badge color={T.red} bg={T.redBg} border={T.redBorder}>✕ {errorCount} errors</Badge>}
            {warnCount > 0 && <Badge color={T.amber} bg={T.amberBg} border={T.amberBorder}>⚠ {warnCount} warnings</Badge>}
            <span style={{ fontSize: 10, color: T.textDim, marginLeft: "auto", fontFamily: T.mono }}>
              Page {previewPage + 1} of {totalPages}
            </span>
          </div>

          {/* Validated rows table */}
          <div style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "32px 90px 140px 90px 44px 44px 1fr", gap: 4, padding: "7px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>#</span><span>NPI</span><span>Name</span><span>Specialty</span><span>State</span><span>Dec.</span><span>Status</span>
            </div>
            {pagedRows.map((v, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "32px 90px 140px 90px 44px 44px 1fr", gap: 4, padding: "7px 12px",
                borderBottom: `1px solid ${T.border}`, fontSize: 11,
                background: !v.valid ? T.redBg : v.warnings.length > 0 ? T.amberBg : "transparent",
                borderLeft: `3px solid ${!v.valid ? T.red : v.warnings.length > 0 ? T.amber : "transparent"}`,
              }}>
                <span style={{ color: T.textDim, fontFamily: T.mono, fontSize: 9 }}>{v.row}</span>
                <span style={{ color: T.text, fontFamily: T.mono, fontSize: 10 }}>{v.record.npi || "—"}</span>
                <span style={{ color: T.text, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.record.name || "—"}</span>
                <span style={{ color: T.textSecondary, fontSize: 10 }}>{v.record.specialty || "—"}</span>
                <span style={{ color: T.textSecondary, fontSize: 10 }}>{v.record.state || "—"}</span>
                <span style={{ color: T.textSecondary, fontSize: 10, fontFamily: T.mono }}>{v.record.decile || "—"}</span>
                <div>
                  {v.errors.map((e, ei) => <span key={ei} style={{ fontSize: 9, color: T.red, display: "block" }}>✕ {e}</span>)}
                  {v.warnings.map((w, wi) => <span key={wi} style={{ fontSize: 9, color: T.amber, display: "block" }}>⚠ {w}</span>)}
                  {v.valid && v.warnings.length === 0 && <span style={{ fontSize: 9, color: T.green }}>✓ Ready</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
              <Btn variant="ghost" onClick={() => setPreviewPage(p => Math.max(0, p - 1))} disabled={previewPage === 0}>← Prev</Btn>
              <Btn variant="ghost" onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))} disabled={previewPage >= totalPages - 1}>Next →</Btn>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, marginTop: 14, borderTop: `1px solid ${T.border}` }}>
            <Btn variant="ghost" onClick={() => setStep("map")}>← Remap Columns</Btn>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {errorCount > 0 && <span style={{ fontSize: 10, color: T.amber }}>({errorCount} rows will be skipped)</span>}
              <Btn variant="primary" onClick={executeImport} disabled={validCount === 0}>
                Import {validCount} NPI{validCount !== 1 ? "s" : ""} →
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 4: DONE ─── */}
      {step === "done" && importResult && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 6 }}>Import Complete</div>
          <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 20 }}>{importResult.total} NPI records processed successfully</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, maxWidth: 400, margin: "0 auto 24px" }}>
            <div style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: T.radius, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.green, fontFamily: T.mono }}>{importResult.new}</div>
              <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", marginTop: 2 }}>New NPIs</div>
            </div>
            <div style={{ background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: T.radius, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.accentLight, fontFamily: T.mono }}>{importResult.updated}</div>
              <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", marginTop: 2 }}>Updated</div>
            </div>
            <div style={{ background: importResult.skipped > 0 ? T.redBg : T.surfaceRaised, border: `1px solid ${importResult.skipped > 0 ? T.redBorder : T.border}`, borderRadius: T.radius, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: importResult.skipped > 0 ? T.red : T.textDim, fontFamily: T.mono }}>{importResult.skipped}</div>
              <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", marginTop: 2 }}>Skipped</div>
            </div>
          </div>

          <Btn variant="primary" onClick={onClose}>Done</Btn>
        </div>
      )}
    </Modal>
  );
}

// ─── SIGNAL FIELDS FOR BATCH CSV ───
const SIGNAL_CSV_FIELDS = [
  { key: "npi", label: "NPI Number", required: true, hint: "10-digit NPI" },
  { key: "name", label: "HCP Name", required: false, hint: "Auto-filled if NPI exists" },
  { key: "biomarker", label: "Biomarker", required: true, hint: "HbA1c, LDL-C, eGFR, etc." },
  { key: "value", label: "Lab Value", required: true, hint: "Numeric result" },
  { key: "specialty", label: "Specialty", required: false, hint: "e.g. Cardiology" },
  { key: "state", label: "State", required: false, hint: "2-letter code" },
];

function autoMapSignalColumns(csvHeaders) {
  const mapping = {};
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases = {
    npi: ["npi", "npinumber", "npiid", "providerid", "physicianid"],
    name: ["name", "hcpname", "physicianname", "providername", "doctor"],
    biomarker: ["biomarker", "marker", "test", "testname", "labtest", "analyte", "assay", "testcode", "labname"],
    value: ["value", "result", "labvalue", "labresult", "testresult", "resultvalue", "reading", "measurement", "level"],
    specialty: ["specialty", "speciality", "spec"],
    state: ["state", "st", "statecode"],
  };
  csvHeaders.forEach((header, idx) => {
    const norm = normalize(header);
    for (const [field, alts] of Object.entries(aliases)) {
      if (alts.some(a => norm.includes(a) || a.includes(norm))) {
        if (!mapping[field]) mapping[field] = idx;
      }
    }
  });
  return mapping;
}

function resolveBiomarkerId(rawName) {
  if (!rawName) return null;
  const n = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const map = {
    hba1c: "hba1c", a1c: "hba1c", hemoglobina1c: "hba1c", glycatedhemoglobin: "hba1c",
    ldlc: "ldlc", ldl: "ldlc", lowdensitylipoprotein: "ldlc",
    egfr: "egfr", glomerularfiltration: "egfr", gfr: "egfr",
    psa: "psa", prostatespecificantigen: "psa",
    tsh: "tsh", thyroidstimulatinghormone: "tsh",
    ntprobnp: "ntprobnp", probnp: "ntprobnp", bnp: "ntprobnp",
    hscrp: "crp", crp: "crp", creactiveprotein: "crp",
    ferritin: "ferritin",
  };
  for (const [pattern, id] of Object.entries(map)) {
    if (n.includes(pattern) || pattern.includes(n)) return id;
  }
  return null;
}

// ─── SIGNAL TRIGGER PANEL (with Manual + Batch modes) ───
function SignalTriggerPanel({ npis, journeys, biomarkers, onFire, history }) {
  const [mode, setMode] = useState("manual"); // manual | batch
  const [npiInput, setNpiInput] = useState("");
  const [hcpName, setHcpName] = useState("");
  const [specialty, setSpecialty] = useState("Internal Medicine");
  const [hcpState, setHcpState] = useState("NY");
  const [biomarkerId, setBiomarkerId] = useState("hba1c");
  const [labValue, setLabValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cascade, setCascade] = useState(null);
  const [cascadeStep, setCascadeStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Batch state
  const [batchStep, setBatchStep] = useState("upload"); // upload | map | validate | processing | done
  const [batchParsed, setBatchParsed] = useState({ headers: [], rows: [] });
  const [batchMapping, setBatchMapping] = useState({});
  const [batchValidated, setBatchValidated] = useState([]);
  const [batchResults, setBatchResults] = useState([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchSummary, setBatchSummary] = useState(null);
  const [batchDragOver, setBatchDragOver] = useState(false);
  const [batchPreviewPage, setBatchPreviewPage] = useState(0);
  const batchFileRef = useRef(null);
  const processingRef = useRef(false);
  const BATCH_PAGE = 10;

  const bm = biomarkers.find(b => b.id === biomarkerId);
  const matchingNPIs = npis.filter(n => n.npi.includes(npiInput) || n.name.toLowerCase().includes(npiInput.toLowerCase())).slice(0, 5);
  const existingNPI = npis.find(n => n.npi === npiInput);

  const previewMatches = useMemo(() => {
    if (!labValue || isNaN(parseFloat(labValue))) return [];
    return journeys.filter(j => {
      if (j.status !== "live" || j.biomarkerId !== biomarkerId) return false;
      const thresh = parseFloat(j.threshold);
      const val = parseFloat(labValue);
      switch (j.operator) {
        case "≥": return val >= thresh; case ">": return val > thresh;
        case "<": return val < thresh; case "≤": return val <= thresh;
        case "=": return val === thresh; default: return false;
      }
    });
  }, [journeys, biomarkerId, labValue]);

  const handleFire = () => {
    if (!npiInput || !labValue) return;
    const result = onFire({ npiId: npiInput, hcpName: hcpName || existingNPI?.name || "", specialty, state: hcpState, biomarkerId, labValue });
    if (result) {
      setCascade(result); setCascadeStep(0); setIsAnimating(true);
      result.cascade.forEach((_, i) => { setTimeout(() => setCascadeStep(i + 1), (i + 1) * 600); });
      setTimeout(() => setIsAnimating(false), result.cascade.length * 600 + 300);
    }
  };

  const selectNPI = (n) => { setNpiInput(n.npi); setHcpName(n.name); setSpecialty(n.specialty); setHcpState(n.state); setShowSuggestions(false); };

  // ─── Batch handlers ───
  const handleBatchFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const p = parseCSV(e.target.result);
      setBatchParsed(p);
      setBatchMapping(autoMapSignalColumns(p.headers));
      setBatchStep("map");
    };
    reader.readAsText(file);
  };

  const validateBatch = () => {
    const results = batchParsed.rows.map((row, idx) => {
      const rec = {};
      SIGNAL_CSV_FIELDS.forEach(f => {
        const ci = batchMapping[f.key];
        rec[f.key] = ci != null && ci >= 0 ? (row[ci] || "").trim() : "";
      });
      const errors = [];
      const warnings = [];

      if (!rec.npi) errors.push("Missing NPI");
      else if (!/^\d{10}$/.test(rec.npi)) errors.push("NPI must be 10 digits");

      const bmId = resolveBiomarkerId(rec.biomarker);
      if (!rec.biomarker) errors.push("Missing biomarker");
      else if (!bmId) errors.push(`Unknown biomarker: "${rec.biomarker}"`);

      if (!rec.value) errors.push("Missing lab value");
      else if (isNaN(parseFloat(rec.value))) errors.push("Lab value must be numeric");

      const existNPI = npis.find(n => n.npi === rec.npi);
      if (!existNPI && !rec.name) warnings.push("Unknown NPI — will create with generic name");
      if (existNPI) rec.name = rec.name || existNPI.name;

      return { row: idx + 1, record: rec, biomarkerId: bmId, errors, warnings, valid: errors.length === 0, result: null };
    });
    setBatchValidated(results);
    setBatchPreviewPage(0);
    setBatchStep("validate");
  };

  const executeBatch = async () => {
    setBatchStep("processing");
    processingRef.current = true;
    const valid = batchValidated.filter(v => v.valid);
    const results = [];
    let matched = 0, enrolled = 0, noMatch = 0, blocked = 0;

    for (let i = 0; i < valid.length; i++) {
      if (!processingRef.current) break;
      const v = valid[i];
      const existNPI = npis.find(n => n.npi === v.record.npi);
      const fireResult = onFire({
        npiId: v.record.npi,
        hcpName: v.record.name || existNPI?.name || `Dr. NPI-${v.record.npi.slice(-4)}`,
        specialty: v.record.specialty || existNPI?.specialty || "Internal Medicine",
        state: v.record.state || existNPI?.state || "NY",
        biomarkerId: v.biomarkerId,
        labValue: v.record.value,
      });
      const rowResult = {
        row: v.row, npi: v.record.npi, name: v.record.name || existNPI?.name || v.record.npi,
        biomarker: v.record.biomarker, value: v.record.value,
        enrolled: fireResult?.enrolled || false,
        journeys: fireResult?.matchedJourneys || [],
        touchpoints: fireResult?.cascade?.filter(c => c.status === "fired").length || 0,
        blocked: fireResult?.cascade?.some(c => c.status === "blocked") || false,
      };
      results.push(rowResult);
      if (rowResult.enrolled) { enrolled++; matched += rowResult.journeys.length; }
      else { noMatch++; }
      if (rowResult.blocked) blocked++;

      setBatchResults([...results]);
      setBatchProgress(Math.round(((i + 1) / valid.length) * 100));
      // Small delay between signals for visual feedback and to avoid state batching issues
      await new Promise(r => setTimeout(r, 120));
    }

    processingRef.current = false;
    setBatchSummary({
      total: valid.length, enrolled, noMatch, blocked,
      matchedJourneys: matched,
      touchpointsFired: results.reduce((s, r) => s + r.touchpoints, 0),
      skipped: batchValidated.filter(v => !v.valid).length,
    });
    setBatchStep("done");
  };

  const resetBatch = () => {
    setBatchStep("upload"); setBatchParsed({ headers: [], rows: [] }); setBatchMapping({});
    setBatchValidated([]); setBatchResults([]); setBatchProgress(0); setBatchSummary(null);
    processingRef.current = false;
  };

  const phaseColors = {
    complete: { c: T.green, bg: T.greenBg, border: T.greenBorder },
    fired: { c: T.accent, bg: T.accentBg, border: T.accentBorder },
    blocked: { c: T.red, bg: T.redBg, border: T.redBorder },
    skipped: { c: T.textDim, bg: T.surfaceRaised, border: T.border },
    staged: { c: T.amber, bg: T.amberBg, border: T.amberBorder },
  };

  const bValidCount = batchValidated.filter(v => v.valid).length;
  const bErrorCount = batchValidated.filter(v => !v.valid).length;
  const bPagedRows = batchValidated.slice(batchPreviewPage * BATCH_PAGE, (batchPreviewPage + 1) * BATCH_PAGE);
  const bTotalPages = Math.ceil(batchValidated.length / BATCH_PAGE);

  // ──────────────────── RENDER ────────────────────
  return (
    <div>
      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
        {[{ key: "manual", label: "⚡ Single Signal", desc: "Fire one lab result" }, { key: "batch", label: "📄 Batch CSV", desc: "Import signals from file" }].map(m => (
          <button key={m.key} onClick={() => setMode(m.key)} style={{
            flex: 1, padding: "12px 16px", borderRadius: m.key === "manual" ? `${T.radius}px 0 0 ${T.radius}px` : `0 ${T.radius}px ${T.radius}px 0`,
            background: mode === m.key ? T.accentBg : T.surface, border: `1px solid ${mode === m.key ? T.accentBorder : T.border}`,
            cursor: "pointer", fontFamily: T.sans, textAlign: "left", transition: "all 0.15s",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: mode === m.key ? T.accentLight : T.textSecondary }}>{m.label}</div>
            <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* ═══════ MANUAL MODE ═══════ */}
      {mode === "manual" && (
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, alignItems: "start" }}>
          {/* LEFT: Input Form */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20, position: "sticky", top: 80 }}>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ position: "relative" }}>
                <label style={labelStyle}>NPI Number</label>
                <input value={npiInput} onChange={e => { setNpiInput(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} placeholder="Enter NPI or search by name..." style={inputStyle} />
                {showSuggestions && npiInput && matchingNPIs.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.surfaceRaised, border: `1px solid ${T.borderLight}`, borderRadius: T.radiusSm, marginTop: 2, zIndex: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", maxHeight: 180, overflow: "auto" }}>
                    {matchingNPIs.map(n => (
                      <div key={n.npi} onClick={() => selectNPI(n)} style={{ padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{n.name}</div>
                        <div style={{ fontSize: 10, color: T.textDim, fontFamily: T.mono }}>{n.npi} · {n.specialty} · {n.state}</div>
                      </div>
                    ))}
                    <div onClick={() => setShowSuggestions(false)} style={{ padding: "6px 12px", fontSize: 10, color: T.accent, cursor: "pointer", textAlign: "center" }}>Use "{npiInput}" as new NPI ↵</div>
                  </div>
                )}
              </div>
              {npiInput && !existingNPI && (
                <div style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 12, display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 9, color: T.amber, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>New NPI — Enter HCP Details</div>
                  <div><label style={{ ...labelStyle, fontSize: 9 }}>HCP Name</label><input value={hcpName} onChange={e => setHcpName(e.target.value)} placeholder="Dr. Jane Smith" style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><label style={{ ...labelStyle, fontSize: 9 }}>Specialty</label><Select value={specialty} onChange={setSpecialty} options={SPECIALTIES} style={{ padding: "6px 10px", fontSize: 11 }} /></div>
                    <div><label style={{ ...labelStyle, fontSize: 9 }}>State</label><Select value={hcpState} onChange={setHcpState} options={STATES} style={{ padding: "6px 10px", fontSize: 11 }} /></div>
                  </div>
                </div>
              )}
              {existingNPI && (
                <div style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: T.radius, padding: 10 }}>
                  <div style={{ fontSize: 10, color: T.green, fontWeight: 600, marginBottom: 4 }}>NPI Recognized</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{existingNPI.name}</div>
                  <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 2 }}>{existingNPI.specialty} · {existingNPI.state} · Decile {existingNPI.decile} · Eng: {existingNPI.engScore}</div>
                </div>
              )}
              <div><label style={labelStyle}>Biomarker</label><Select value={biomarkerId} onChange={setBiomarkerId} options={biomarkers.map(b => ({ value: b.id, label: `${b.name} (${b.unit})` }))} /></div>
              <div><label style={labelStyle}>Lab Result Value ({bm?.unit})</label><input type="number" step="0.1" value={labValue} onChange={e => setLabValue(e.target.value)} placeholder={`e.g. ${bm?.defaultThreshold || "0"}`} style={{ ...inputStyle, fontFamily: T.mono, fontSize: 16, fontWeight: 700, padding: "10px 14px" }} /></div>
              {labValue && (
                <div style={{ background: previewMatches.length > 0 ? T.accentBg : T.surfaceRaised, border: `1px solid ${previewMatches.length > 0 ? T.accentBorder : T.border}`, borderRadius: T.radius, padding: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: previewMatches.length > 0 ? T.accentLight : T.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{previewMatches.length > 0 ? `${previewMatches.length} Journey${previewMatches.length > 1 ? "s" : ""} Will Match` : "No Journey Match"}</div>
                  {previewMatches.map(j => (<div key={j.id} style={{ fontSize: 11, color: T.text, padding: "3px 0" }}>{j.name} <span style={{ color: T.textDim }}>({j.operator} {j.threshold})</span> → <span style={{ color: T.accentLight }}>{j.steps[0]?.channel}</span></div>))}
                  {previewMatches.length === 0 && <div style={{ fontSize: 10, color: T.textDim }}>{bm?.name} = {labValue} does not trigger any active journey</div>}
                </div>
              )}
              <button onClick={handleFire} disabled={!npiInput || !labValue || isAnimating} style={{ ...btnBase, width: "100%", padding: "14px 20px", fontSize: 14, fontWeight: 700, fontFamily: T.sans, background: (!npiInput || !labValue || isAnimating) ? T.surfaceRaised : `linear-gradient(135deg, ${T.accent}, ${T.purple})`, color: (!npiInput || !labValue || isAnimating) ? T.textDim : "#fff", border: "none", borderRadius: T.radius, cursor: (!npiInput || !labValue || isAnimating) ? "not-allowed" : "pointer", boxShadow: (!npiInput || !labValue || isAnimating) ? "none" : `0 4px 20px ${T.accent}40`, transition: "all 0.2s" }}>
                {isAnimating ? "⏳ Processing Signal..." : "⚡ Fire Lab Signal"}
              </button>
            </div>
          </div>

          {/* RIGHT: Cascade + History */}
          <div style={{ display: "grid", gap: 16 }}>
            {cascade && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Signal Cascade</div>
                    <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 2, fontFamily: T.mono }}>{cascade.signalId} · {cascade.biomarker} = {cascade.labValue} {cascade.unit} · NPI {cascade.npiId}</div>
                  </div>
                  <Badge color={cascade.enrolled ? T.green : T.textDim} bg={cascade.enrolled ? T.greenBg : T.surfaceRaised} border={cascade.enrolled ? T.greenBorder : T.border}>{cascade.enrolled ? "Enrolled" : "No Match"}</Badge>
                </div>
                <div style={{ position: "relative", paddingLeft: 24 }}>
                  <div style={{ position: "absolute", left: 8, top: 4, bottom: 4, width: 2, background: T.border, borderRadius: 1 }} />
                  {cascade.cascade.map((step, i) => {
                    const visible = i < cascadeStep;
                    const pc = phaseColors[step.status] || phaseColors.complete;
                    const isFired = step.status === "fired";
                    return (
                      <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", position: "relative", opacity: visible ? 1 : 0.15, transform: visible ? "translateX(0)" : "translateX(-8px)", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
                        <div style={{ position: "absolute", left: -20, top: 14, width: 14, height: 14, borderRadius: "50%", background: visible ? pc.bg : T.surfaceRaised, border: `2px solid ${visible ? pc.c : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, zIndex: 1, boxShadow: visible && isFired ? `0 0 12px ${pc.c}50` : "none", transition: "all 0.3s" }}>
                          {visible && <span style={{ fontSize: 8 }}>{step.icon}</span>}
                        </div>
                        <div style={{ flex: 1, padding: "10px 14px", borderRadius: T.radius, background: isFired && visible ? pc.bg : T.surfaceRaised, border: `1px solid ${visible ? pc.border : T.border}`, borderLeft: `3px solid ${visible ? pc.c : T.border}`, transition: "all 0.3s" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: visible ? pc.c : T.textDim }}>{step.label}</span>
                            {step.channel && visible && <ChannelTag channel={step.channel} />}
                          </div>
                          <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 4, lineHeight: 1.5 }}>{step.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {!cascade && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🧪</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary }}>Fire a Lab Signal to See the Cascade</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 6, maxWidth: 360, margin: "6px auto 0" }}>Enter an NPI and lab result on the left. The cascade will animate step by step.</div>
              </div>
            )}
            {history.length > 0 && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Signal History ({history.length})</div>
                {history.map((h) => (
                  <div key={h.signalId} onClick={() => { setCascade(h); setCascadeStep(h.cascade.length); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: T.radiusSm, marginBottom: 3, cursor: "pointer", border: `1px solid ${T.border}`, background: cascade?.signalId === h.signalId ? T.accentBg : T.bgAlt }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontFamily: T.mono, color: T.textDim }}>{h.ts}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{h.hcpName || `NPI ${h.npiId}`}</span>
                      <span style={{ fontSize: 11, color: T.textSecondary }}>{h.biomarker} = {h.labValue} {h.unit}</span>
                    </div>
                    <div>{h.enrolled ? <Badge color={T.green} bg={T.greenBg} border={T.greenBorder}>{h.matchedJourneys.length} matched</Badge> : <Badge color={T.textDim} bg={T.surfaceRaised} border={T.border}>no match</Badge>}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ BATCH CSV MODE ═══════ */}
      {mode === "batch" && (
        <div>
          {/* ── UPLOAD ── */}
          {batchStep === "upload" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>
              {/* Drop zone */}
              <div
                onDrop={e => { e.preventDefault(); setBatchDragOver(false); handleBatchFile(e.dataTransfer.files[0]); }}
                onDragOver={e => { e.preventDefault(); setBatchDragOver(true); }}
                onDragLeave={() => setBatchDragOver(false)}
                onClick={() => batchFileRef.current?.click()}
                style={{ border: `2px dashed ${batchDragOver ? T.accent : T.borderLight}`, borderRadius: T.radiusLg, padding: "60px 30px", textAlign: "center", cursor: "pointer", background: batchDragOver ? T.accentBg : T.surface, transition: "all 0.2s" }}
              >
                <input ref={batchFileRef} type="file" accept=".csv,.tsv,.txt" style={{ display: "none" }} onChange={e => handleBatchFile(e.target.files[0])} />
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Drop Lab Signal CSV Here</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>Upload a file with NPI, Biomarker, and Lab Value columns</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>Each row becomes a signal fired through the orchestration engine</div>
              </div>

              {/* Info panel */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Signal CSV Format</div>
                <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
                  {SIGNAL_CSV_FIELDS.map(f => (
                    <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", borderRadius: T.radiusSm, background: f.required ? T.accentBg : T.bgAlt, border: `1px solid ${f.required ? T.accentBorder : T.border}` }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{f.label} {f.required && <span style={{ color: T.red }}>*</span>}</span>
                      <span style={{ fontSize: 9, color: T.textDim }}>{f.hint}</span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 10, color: T.textSecondary, marginBottom: 10, lineHeight: 1.6 }}>
                  Biomarker names are fuzzy-matched: "HbA1c", "A1C", "Hemoglobin A1c" all resolve correctly. Works with lab feeds from Quest, LabCorp, or custom EMR exports.
                </div>

                <button onClick={() => {
                  const csv = "npi,name,biomarker,value,specialty,state\n1234567890,Dr. Sarah Chen,HbA1c,7.8,Endocrinology,NY\n2345678901,Dr. Michael Torres,LDL-C,215,Cardiology,CA\n3456789012,Dr. Aisha Patel,eGFR,48,Nephrology,TX\n4567890123,Dr. James Wilson,PSA,5.2,Urology,FL\n6789012345,Dr. Robert Kim,NT-proBNP,420,Cardiology,MA\n1122334455,Dr. New Provider,HbA1c,6.9,Internal Medicine,OH\n";
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "lab_signals_template.csv"; a.click();
                  URL.revokeObjectURL(url);
                }} style={{ ...btnBase, width: "100%", padding: "8px 14px", background: T.bgAlt, color: T.accentLight, border: `1px solid ${T.accentBorder}`, fontSize: 11 }}>
                  ⬇ Download Sample Signal CSV
                </button>
              </div>
            </div>
          )}

          {/* ── COLUMN MAPPING ── */}
          {batchStep === "map" && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Map Signal Columns</div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{batchParsed.headers.length} columns · {batchParsed.rows.length} signal rows · Auto-mapped where possible</div>
                </div>
                <Badge color={T.accentLight} bg={T.accentBg} border={T.accentBorder}>{batchParsed.rows.length} signals</Badge>
              </div>

              <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                {SIGNAL_CSV_FIELDS.map(field => {
                  const ci = batchMapping[field.key];
                  const isMapped = ci != null && ci >= 0;
                  const sample = isMapped && batchParsed.rows[0] ? batchParsed.rows[0][ci] : null;
                  const bmResolved = field.key === "biomarker" && sample ? resolveBiomarkerId(sample) : null;
                  const bmObj = bmResolved ? BIOMARKERS.find(b => b.id === bmResolved) : null;
                  return (
                    <div key={field.key} style={{ display: "grid", gridTemplateColumns: "140px 1fr 200px", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: T.radius, background: isMapped ? T.surfaceRaised : T.bgAlt, border: `1px solid ${isMapped ? T.greenBorder : field.required ? T.redBorder : T.border}` }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{field.label} {field.required && <span style={{ color: T.red }}>*</span>}</div>
                        <div style={{ fontSize: 9, color: T.textDim }}>{field.hint}</div>
                      </div>
                      <Select value={ci != null ? String(ci) : "-1"} onChange={v => setBatchMapping(m => { const n = { ...m }; parseInt(v) === -1 ? delete n[field.key] : n[field.key] = parseInt(v); return n; })} options={[{ value: "-1", label: "— Not mapped —" }, ...batchParsed.headers.map((h, i) => ({ value: String(i), label: h }))]} style={{ fontSize: 11, padding: "6px 10px" }} />
                      <div style={{ fontSize: 10, color: sample ? T.textSecondary : T.textDim, fontFamily: T.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sample ? (<>{sample}{bmObj && <span style={{ color: T.green, marginLeft: 6 }}>→ {bmObj.name}</span>}</>) : "No data"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Raw preview */}
              <div style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: "auto", maxHeight: 120, marginBottom: 14 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: T.mono }}>
                  <thead><tr>{batchParsed.headers.map((h, i) => <th key={i} style={{ padding: "5px 8px", borderBottom: `1px solid ${T.border}`, textAlign: "left", color: T.textSecondary, fontWeight: 600, whiteSpace: "nowrap", position: "sticky", top: 0, background: T.bgAlt }}>{h}</th>)}</tr></thead>
                  <tbody>{batchParsed.rows.slice(0, 3).map((row, ri) => (<tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ padding: "3px 8px", borderBottom: `1px solid ${T.border}`, color: T.textDim, whiteSpace: "nowrap" }}>{cell}</td>)}</tr>))}</tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Btn variant="ghost" onClick={resetBatch}>← Back</Btn>
                <Btn variant="primary" onClick={validateBatch} disabled={batchMapping.npi == null || batchMapping.biomarker == null || batchMapping.value == null}>Validate Signals →</Btn>
              </div>
            </div>
          )}

          {/* ── VALIDATE ── */}
          {batchStep === "validate" && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
                <Badge color={T.green} bg={T.greenBg} border={T.greenBorder}>✓ {bValidCount} valid</Badge>
                {bErrorCount > 0 && <Badge color={T.red} bg={T.redBg} border={T.redBorder}>✕ {bErrorCount} errors</Badge>}
                <span style={{ fontSize: 10, color: T.textDim, marginLeft: "auto", fontFamily: T.mono }}>Page {batchPreviewPage + 1}/{bTotalPages}</span>
              </div>

              <div style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "30px 90px 120px 80px 60px 1fr", gap: 4, padding: "7px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: "uppercase" }}>
                  <span>#</span><span>NPI</span><span>Name</span><span>Biomarker</span><span>Value</span><span>Status</span>
                </div>
                {bPagedRows.map((v, i) => {
                  const bmObj = v.biomarkerId ? BIOMARKERS.find(b => b.id === v.biomarkerId) : null;
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "30px 90px 120px 80px 60px 1fr", gap: 4, padding: "7px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 11, background: !v.valid ? T.redBg : "transparent", borderLeft: `3px solid ${!v.valid ? T.red : v.warnings.length > 0 ? T.amber : "transparent"}` }}>
                      <span style={{ color: T.textDim, fontFamily: T.mono, fontSize: 9 }}>{v.row}</span>
                      <span style={{ color: T.text, fontFamily: T.mono, fontSize: 10 }}>{v.record.npi || "—"}</span>
                      <span style={{ color: T.text, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.record.name || "—"}</span>
                      <span style={{ fontSize: 10 }}>{bmObj ? <span style={{ color: bmObj ? T.accentLight : T.textDim }}>{bmObj.name}</span> : <span style={{ color: T.red }}>{v.record.biomarker || "?"}</span>}</span>
                      <span style={{ color: T.text, fontFamily: T.mono, fontSize: 11, fontWeight: 600 }}>{v.record.value || "—"}</span>
                      <div>
                        {v.errors.map((e, ei) => <span key={ei} style={{ fontSize: 9, color: T.red, display: "block" }}>✕ {e}</span>)}
                        {v.warnings.map((w, wi) => <span key={wi} style={{ fontSize: 9, color: T.amber, display: "block" }}>⚠ {w}</span>)}
                        {v.valid && v.warnings.length === 0 && <span style={{ fontSize: 9, color: T.green }}>✓ Ready to fire</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {bTotalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                  <Btn variant="ghost" onClick={() => setBatchPreviewPage(p => Math.max(0, p - 1))} disabled={batchPreviewPage === 0}>← Prev</Btn>
                  <Btn variant="ghost" onClick={() => setBatchPreviewPage(p => Math.min(bTotalPages - 1, p + 1))} disabled={batchPreviewPage >= bTotalPages - 1}>Next →</Btn>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                <Btn variant="ghost" onClick={() => setBatchStep("map")}>← Remap</Btn>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {bErrorCount > 0 && <span style={{ fontSize: 10, color: T.amber }}>({bErrorCount} skipped)</span>}
                  <Btn variant="primary" onClick={executeBatch} disabled={bValidCount === 0} style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, boxShadow: `0 4px 20px ${T.accent}40` }}>
                    ⚡ Fire {bValidCount} Signal{bValidCount !== 1 ? "s" : ""}
                  </Btn>
                </div>
              </div>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {batchStep === "processing" && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>⚡ Firing Signals...</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{batchResults.length} of {bValidCount} processed</div>
                </div>
                <Btn variant="danger" onClick={() => { processingRef.current = false; }}>⏹ Stop</Btn>
              </div>

              {/* Progress bar */}
              <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ width: `${batchProgress}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${T.accent}, ${T.purple})`, transition: "width 0.2s ease", boxShadow: `0 0 12px ${T.accent}40` }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accentLight, textAlign: "center", fontFamily: T.mono, marginBottom: 16 }}>{batchProgress}%</div>

              {/* Live results scroll */}
              <div style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: T.radius, maxHeight: 320, overflow: "auto" }}>
                {batchResults.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${T.border}`, alignItems: "center", animation: "fadeIn 0.2s ease", borderLeft: `3px solid ${r.enrolled ? T.green : r.blocked ? T.red : T.textDim}` }}>
                    <span style={{ fontSize: 10, fontFamily: T.mono, color: T.textDim, minWidth: 24 }}>#{r.row}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text, minWidth: 120 }}>{r.name}</span>
                    <span style={{ fontSize: 10, color: T.textSecondary, minWidth: 70 }}>{r.biomarker}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: T.mono, minWidth: 50 }}>{r.value}</span>
                    <div style={{ flex: 1, display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {r.enrolled ? r.journeys.map((j, ji) => <Badge key={ji} color={T.green} bg={T.greenBg} border={T.greenBorder}>{j}</Badge>) : r.blocked ? <Badge color={T.red} bg={T.redBg} border={T.redBorder}>Blocked</Badge> : <Badge color={T.textDim} bg={T.surfaceRaised} border={T.border}>No match</Badge>}
                    </div>
                    {r.touchpoints > 0 && <span style={{ fontSize: 9, color: T.accentLight, fontFamily: T.mono }}>{r.touchpoints} touch</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {batchStep === "done" && batchSummary && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 24 }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Batch Signal Processing Complete</div>
                <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>{batchSummary.total} signals processed through the orchestration engine</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, maxWidth: 500, margin: "0 auto 20px" }}>
                {[
                  { label: "Signals Enrolled", value: batchSummary.enrolled, color: T.green, bg: T.greenBg, border: T.greenBorder },
                  { label: "Journeys Matched", value: batchSummary.matchedJourneys, color: T.accentLight, bg: T.accentBg, border: T.accentBorder },
                  { label: "Touchpoints Fired", value: batchSummary.touchpointsFired, color: T.purple, bg: T.purpleBg, border: T.purpleBorder },
                ].map((m, i) => (
                  <div key={i} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: T.radius, padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: m.color, fontFamily: T.mono }}>{m.value}</div>
                    <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", marginTop: 4 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {(batchSummary.noMatch > 0 || batchSummary.blocked > 0 || batchSummary.skipped > 0) && (
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
                  {batchSummary.noMatch > 0 && <Badge color={T.textDim} bg={T.surfaceRaised} border={T.border}>{batchSummary.noMatch} no match</Badge>}
                  {batchSummary.blocked > 0 && <Badge color={T.amber} bg={T.amberBg} border={T.amberBorder}>{batchSummary.blocked} blocked</Badge>}
                  {batchSummary.skipped > 0 && <Badge color={T.red} bg={T.redBg} border={T.redBorder}>{batchSummary.skipped} skipped (errors)</Badge>}
                </div>
              )}

              {/* Per-row results */}
              <div style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: T.radius, maxHeight: 240, overflow: "auto", marginBottom: 16 }}>
                {batchResults.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "6px 12px", borderBottom: `1px solid ${T.border}`, alignItems: "center", fontSize: 10, borderLeft: `3px solid ${r.enrolled ? T.green : r.blocked ? T.red : T.textDim}` }}>
                    <span style={{ fontFamily: T.mono, color: T.textDim, minWidth: 22 }}>#{r.row}</span>
                    <span style={{ fontWeight: 600, color: T.text, minWidth: 110 }}>{r.name}</span>
                    <span style={{ color: T.textSecondary }}>{r.biomarker} = {r.value}</span>
                    <span style={{ marginLeft: "auto", color: r.enrolled ? T.green : T.textDim, fontWeight: 600 }}>
                      {r.enrolled ? `✓ ${r.journeys.length} journey${r.journeys.length > 1 ? "s" : ""} · ${r.touchpoints} touch` : r.blocked ? "🚫 Blocked" : "⊘ No match"}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                <Btn variant="secondary" onClick={resetBatch}>↻ Import Another File</Btn>
                <Btn variant="primary" onClick={() => setMode("manual")}>← Back to Manual</Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════
export default function LabSignalOrchestrator() {
  const [tab, setTab] = useState("dashboard");
  const [journeys, setJourneys] = useState(initJourneys);
  const [npis, setNpis] = useState(initNPIs);
  const [showBuilder, setShowBuilder] = useState(null); // null | "new" | journey obj
  const [selectedNPI, setSelectedNPI] = useState(null);
  const [npiSearch, setNpiSearch] = useState("");
  const [npiFilterStatus, setNpiFilterStatus] = useState("all");
  const [npiFilterJourney, setNpiFilterJourney] = useState("all");
  const [pulse, setPulse] = useState(0);
  const [triggerHistory, setTriggerHistory] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [assets, setAssets] = useState(initAssets);
  const [assetPreview, setAssetPreview] = useState(null);

  // Live feed simulation
  const feedRef = useRef(LIVE_FEED.map((f, i) => ({ ...f, _id: i })));
  const [feed, setFeed] = useState(feedRef.current);

  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p + 1) % feed.length), 2800);
    return () => clearInterval(iv);
  }, [feed.length]);

  // Generate new feed items periodically
  useEffect(() => {
    const events = ["SIGNAL", "DELIVERED", "ENGAGED", "SUPPRESSED", "REP_ALERT"];
    const iv = setInterval(() => {
      const npi = npis[Math.floor(Math.random() * npis.length)];
      const j = journeys.find(jj => jj.id === npi.journeyId);
      if (!j) return;
      const bm = BIOMARKERS.find(b => b.id === j.biomarkerId);
      const ev = events[Math.floor(Math.random() * events.length)];
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      const details = {
        SIGNAL: `${bm?.name || "Lab"} ${j.operator} ${(parseFloat(j.threshold) * (0.9 + Math.random() * 0.3)).toFixed(1)} detected`,
        DELIVERED: `${j.steps[Math.min(npi.currentStep, j.steps.length - 1)]?.channel || "Touchpoint"} served`,
        ENGAGED: "Email opened + CTA clicked",
        SUPPRESSED: `Freq cap reached (${j.guardrails.freqCap}/${j.guardrails.freqWindow}d)`,
        REP_ALERT: "Field notification dispatched",
      };
      const newItem = { ts, event: ev, detail: details[ev], npi: npi.npi, hcp: npi.name.split(" ").pop(), action: `${j.id} → ${j.steps[Math.min(npi.currentStep, j.steps.length - 1)]?.channel || "next"}`, _id: Date.now() };
      feedRef.current = [newItem, ...feedRef.current].slice(0, 30);
      setFeed([...feedRef.current]);
    }, 5000);
    return () => clearInterval(iv);
  }, [npis, journeys]);

  // Journey CRUD
  const saveJourney = useCallback((data, deleteId) => {
    if (deleteId) {
      setJourneys(js => js.filter(j => j.id !== deleteId));
    } else if (data) {
      setJourneys(js => {
        const idx = js.findIndex(j => j.id === data.id);
        if (idx >= 0) { const updated = [...js]; updated[idx] = data; return updated; }
        return [...js, data];
      });
    }
  }, []);

  // NPI update
  const updateNPI = useCallback((npi, updates) => {
    setNpis(ns => ns.map(n => n.npi === npi ? { ...n, ...updates } : n));
  }, []);

  // Bulk import NPIs
  const importNPIs = useCallback((newRecords) => {
    setNpis(prev => {
      const existingIds = new Set(prev.map(n => n.npi));
      const toAdd = [];
      const toUpdate = [];
      newRecords.forEach(r => {
        if (existingIds.has(r.npi)) { toUpdate.push(r); } else { toAdd.push(r); }
      });
      let updated = prev.map(n => {
        const upd = toUpdate.find(u => u.npi === n.npi);
        return upd ? { ...n, ...upd } : n;
      });
      return [...updated, ...toAdd];
    });
  }, []);

  // Asset CRUD
  const addAsset = useCallback((asset) => setAssets(a => [...a, asset]), []);
  const deleteAsset = useCallback((id) => setAssets(a => a.filter(x => x.id !== id)), []);
  const updateAsset = useCallback((id, updates) => setAssets(a => a.map(x => x.id === id ? { ...x, ...updates } : x)), []);

  // ─── FIRE SIGNAL: the core trigger engine ───
  const fireSignal = useCallback(({ npiId, hcpName, specialty, state: hcpState, biomarkerId, labValue }) => {
    const bm = BIOMARKERS.find(b => b.id === biomarkerId);
    if (!bm) return null;

    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
    const signalId = `SIG-${Date.now()}`;
    const cascade = [];
    const feedEvents = [];

    // Step 1: Signal received
    cascade.push({ phase: "signal_received", ts, label: "Lab Signal Received", detail: `${bm.name} = ${labValue} ${bm.unit} for NPI ${npiId}`, status: "complete", icon: "📥" });
    feedEvents.push({ ts, event: "SIGNAL", detail: `${bm.name} = ${labValue} ${bm.unit} detected`, npi: npiId, hcp: hcpName, action: "Signal ingested — evaluating journeys", _id: Date.now() });

    // Step 2: Evaluate threshold against all live journeys
    const matchedJourneys = journeys.filter(j => {
      if (j.status !== "live" || j.biomarkerId !== biomarkerId) return false;
      const thresh = parseFloat(j.threshold);
      const val = parseFloat(labValue);
      if (isNaN(thresh) || isNaN(val)) return false;
      switch (j.operator) {
        case "≥": return val >= thresh;
        case ">": return val > thresh;
        case "<": return val < thresh;
        case "≤": return val <= thresh;
        case "=": return val === thresh;
        default: return false;
      }
    });

    if (matchedJourneys.length === 0) {
      cascade.push({ phase: "no_match", ts, label: "No Journey Match", detail: `${bm.name} = ${labValue} does not meet any active journey threshold`, status: "skipped", icon: "⊘" });
      const result = { signalId, ts, npiId, hcpName, biomarker: bm.name, labValue, unit: bm.unit, cascade, matchedJourneys: [], enrolled: false };
      setTriggerHistory(h => [result, ...h].slice(0, 20));
      feedRef.current = [...feedEvents, ...feedRef.current].slice(0, 30);
      setFeed([...feedRef.current]);
      return result;
    }

    cascade.push({ phase: "journey_match", ts, label: `${matchedJourneys.length} Journey${matchedJourneys.length > 1 ? "s" : ""} Matched`, detail: matchedJourneys.map(j => `${j.name} (${j.operator} ${j.threshold})`).join(", "), status: "complete", icon: "🎯" });

    // Step 3: Check if NPI exists or create
    const existingNPI = npis.find(n => n.npi === npiId);
    let npiRecord = existingNPI;

    if (!existingNPI) {
      npiRecord = {
        npi: npiId, name: hcpName || `Dr. NPI-${npiId.slice(-4)}`, specialty: specialty || "Internal Medicine",
        state: hcpState || "NY", decile: Math.floor(Math.random() * 4) + 6, journeyId: matchedJourneys[0].id,
        currentStep: 0, nextTouch: `${matchedJourneys[0].steps[0]?.channel || "Touchpoint"} today`,
        status: "active", engScore: 0, lastSignal: `${bm.name} = ${labValue}`, signalTime: ts,
      };
      setNpis(ns => [...ns, npiRecord]);
      cascade.push({ phase: "npi_created", ts, label: "New NPI Enrolled", detail: `${npiRecord.name} (${npiId}) added to system and enrolled in ${matchedJourneys[0].name}`, status: "complete", icon: "➕" });
    } else {
      cascade.push({ phase: "npi_found", ts, label: "NPI Recognized", detail: `${existingNPI.name} — Decile ${existingNPI.decile}, Engagement ${existingNPI.engScore}`, status: "complete", icon: "👤" });
    }

    // Step 4: Guardrail evaluation per journey
    matchedJourneys.forEach(j => {
      const isSupp = existingNPI?.status === "suppressed";
      if (isSupp) {
        cascade.push({ phase: "guardrail_block", ts, label: `Guardrail: Suppressed`, detail: `${j.name} — NPI is in suppression window (${j.guardrails.suppressionDays}d). Signal logged but journey paused.`, status: "blocked", icon: "🚫" });
        feedEvents.push({ ts, event: "SUPPRESSED", detail: `Suppression active for ${j.name}`, npi: npiId, hcp: (npiRecord?.name || hcpName || "").split(" ").pop(), action: `${j.id} — suppression window active`, _id: Date.now() + Math.random() });
        return;
      }

      const accel = existingNPI && existingNPI.engScore >= j.guardrails.accelThreshold;
      cascade.push({ phase: "guardrail_pass", ts, label: `Guardrails Passed — ${j.name}`, detail: `Freq: OK (${j.guardrails.freqCap}/${j.guardrails.freqWindow}d) · Spacing: OK (${j.guardrails.channelSpacing}h)${accel ? " · ⚡ ACCELERATED (high engagement)" : ""}`, status: "complete", icon: accel ? "⚡" : "✅" });

      // Step 5: Determine which step to trigger
      const currentStepIdx = existingNPI ? existingNPI.currentStep : 0;
      const step = j.steps[Math.min(currentStepIdx, j.steps.length - 1)];
      const ch = CHANNELS[step?.channel] || {};

      cascade.push({ phase: "touchpoint_queued", ts, label: `${step?.channel || "Touchpoint"} Queued`, detail: `${step?.action || "Touchpoint content"} — Day ${step?.day || 0} of journey${accel ? " (timeline compressed)" : ""}`, status: "fired", icon: ch.icon || "📡", channel: step?.channel });

      // Generate feed event for the first touchpoint
      feedEvents.push({ ts, event: "DELIVERED", detail: `${step?.channel} queued for delivery`, npi: npiId, hcp: (npiRecord?.name || hcpName || "").split(" ").pop(), action: `${j.id} Step ${currentStepIdx + 1} → ${step?.channel}${accel ? " (accelerated)" : ""}`, _id: Date.now() + Math.random() });

      // Step 6: If Rep Alert is in the next 2 steps, pre-notify
      const upcoming = j.steps.slice(currentStepIdx + 1, currentStepIdx + 3);
      const repStep = upcoming.find(s => s.channel === "Rep Alert");
      if (repStep) {
        cascade.push({ phase: "rep_prealert", ts, label: "Rep Pre-Alert Staged", detail: `Field rep will be notified on Day ${repStep.day} with ${bm.name} context + prescribing history`, status: "staged", icon: "👤" });
      }

      // Update the NPI record
      const newStep = Math.min(currentStepIdx + 1, j.steps.length - 1);
      const nextStepData = j.steps[Math.min(newStep, j.steps.length - 1)];
      setNpis(ns => ns.map(n => n.npi === npiId ? {
        ...n, journeyId: j.id, currentStep: newStep,
        nextTouch: newStep >= j.steps.length - 1 ? "Journey complete" : `${nextStepData?.channel || "Next"} in ${nextStepData?.day - (step?.day || 0)}d`,
        status: "active", lastSignal: `${bm.name} = ${labValue}`, signalTime: ts,
        engScore: Math.min(100, (n.engScore || 0) + 5),
      } : n));

      // Update journey signal count
      setJourneys(js => js.map(jj => jj.id === j.id ? { ...jj, signalsToday: jj.signalsToday + 1 } : jj));
    });

    // Step 7: Cascade complete
    cascade.push({ phase: "complete", ts, label: "Orchestration Complete", detail: `${matchedJourneys.length} journey(s) activated · ${cascade.filter(c => c.status === "fired").length} touchpoint(s) queued`, status: "complete", icon: "✅" });

    const result = { signalId, ts, npiId, hcpName: npiRecord?.name || hcpName, biomarker: bm.name, labValue, unit: bm.unit, cascade, matchedJourneys: matchedJourneys.map(j => j.name), enrolled: true };
    setTriggerHistory(h => [result, ...h].slice(0, 20));
    feedRef.current = [...feedEvents, ...feedRef.current].slice(0, 30);
    setFeed([...feedRef.current]);
    return result;
  }, [journeys, npis]);

  // Filtered NPIs
  const filteredNPIs = useMemo(() => {
    return npis.filter(n => {
      if (npiSearch && !n.name.toLowerCase().includes(npiSearch.toLowerCase()) && !n.npi.includes(npiSearch) && !n.specialty.toLowerCase().includes(npiSearch.toLowerCase())) return false;
      if (npiFilterStatus !== "all" && n.status !== npiFilterStatus) return false;
      if (npiFilterJourney !== "all" && n.journeyId !== npiFilterJourney) return false;
      return true;
    });
  }, [npis, npiSearch, npiFilterStatus, npiFilterJourney]);

  // Aggregated metrics
  const metrics = useMemo(() => ({
    signals: journeys.reduce((s, j) => s + j.signalsToday, 0),
    activeJourneys: journeys.filter(j => j.status === "live").length,
    totalNPIs: npis.filter(n => n.status === "active").length,
    touchpoints: journeys.reduce((s, j) => s + j.steps.reduce((ss, st) => ss + (st.reach || 0), 0), 0),
  }), [journeys, npis]);

  const channelPerf = useMemo(() => {
    const agg = {};
    journeys.forEach(j => j.steps.forEach(s => {
      if (!agg[s.channel]) agg[s.channel] = { reach: 0, count: 0 };
      agg[s.channel].reach += s.reach || 0;
      agg[s.channel].count += 1;
    }));
    return Object.entries(agg).map(([ch, d]) => ({ channel: ch, reach: d.reach, count: d.count }));
  }, [journeys]);

  const liveJourneys = journeys.filter(j => j.status === "live");

  return (
    <div style={{ fontFamily: T.sans, background: T.bg, color: T.text, minHeight: "100vh" }}>
      <style>{`@import url('${FONT_LINK}');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.borderLight}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.textDim}; }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        input:focus, select:focus { border-color: ${T.borderFocus} !important; outline: none; }
        input::placeholder { color: ${T.textDim}; }
      `}</style>

      {/* ─── HEADER ─── */}
      <header style={{ borderBottom: `1px solid ${T.border}`, padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: `${T.bg}f0`, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>⚡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>LabSignal Orchestrator™</div>
            <div style={{ fontSize: 9, color: T.textDim, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>NPI-Level Triggered Touchpoint Orchestration</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Btn variant="primary" onClick={() => setShowBuilder("new")}>+ New Journey</Btn>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}`, animation: "pulseGlow 2s ease infinite" }} />
            <span style={{ fontSize: 10, color: T.green, fontWeight: 600, fontFamily: T.mono }}>LIVE</span>
          </span>
        </div>
      </header>

      {/* ─── TABS ─── */}
      <div style={{ padding: "0 24px", background: T.bg }}>
        <Tabs active={tab} onChange={setTab} items={[
          { key: "dashboard", label: "Command Center" },
          { key: "trigger", label: "⚡ Trigger Signal" },
          { key: "journeys", label: "Journeys", count: journeys.length },
          { key: "assets", label: "🎨 Assets", count: assets.length },
          { key: "npis", label: "NPI Targeting", count: npis.length },
          { key: "livefeed", label: "Live Feed" },
        ]} />
      </div>

      {/* ─── CONTENT ─── */}
      <main style={{ padding: "18px 24px 40px", maxWidth: 1440, margin: "0 auto" }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
              <MetricCard label="Lab Signals Today" value={metrics.signals.toLocaleString()} delta="+14.2%" up icon="⚡" delay={0} />
              <MetricCard label="Live Journeys" value={String(metrics.activeJourneys)} delta="+2" up icon="🔄" delay={80} />
              <MetricCard label="Touchpoints Delivered" value={metrics.touchpoints.toLocaleString()} delta="+18.7%" up icon="📡" delay={160} />
              <MetricCard label="NPIs Active" value={metrics.totalNPIs.toLocaleString()} delta="+11.5%" up icon="🎯" delay={240} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Active Journeys */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Active Journeys</span>
                  <Btn variant="ghost" onClick={() => setTab("journeys")}>View all →</Btn>
                </div>
                {liveJourneys.map(j => {
                  const bm = BIOMARKERS.find(b => b.id === j.biomarkerId);
                  return (
                    <div key={j.id} onClick={() => { setShowBuilder(j); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: T.radius, marginBottom: 5, cursor: "pointer", border: `1px solid ${T.border}`, background: T.bgAlt, transition: "border-color 0.15s" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{j.name}</div>
                        <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 2 }}>
                          {bm?.name} {j.operator} {j.threshold} · {j.steps.length} steps · <span style={{ color: T.accentLight }}>{j.brand}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: T.mono, color: T.accentLight }}>{j.npisEnrolled.toLocaleString()}</div>
                        <div style={{ fontSize: 8, color: T.textDim, textTransform: "uppercase" }}>NPIs</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Feed Mini */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Signal Feed</span>
                  <Btn variant="ghost" onClick={() => setTab("livefeed")}>Full feed →</Btn>
                </div>
                {feed.slice(0, 6).map((item, i) => {
                  const ec = EV[item.event] || { c: T.textDim, bg: "transparent" };
                  return (
                    <div key={item._id} style={{ display: "flex", gap: 8, padding: "6px 0", alignItems: "flex-start", borderBottom: i < 5 ? `1px solid ${T.border}` : "none", opacity: i === pulse % 6 ? 1 : 0.65, transition: "opacity 0.4s" }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: ec.c, background: ec.bg, padding: "2px 5px", borderRadius: 3, fontFamily: T.mono, whiteSpace: "nowrap", marginTop: 1 }}>{item.event}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: T.text }}>{item.hcp} — {item.detail}</div>
                        <div style={{ fontSize: 9, color: T.textDim, marginTop: 1 }}>{item.action}</div>
                      </div>
                      <span style={{ fontSize: 9, color: T.textDim, fontFamily: T.mono }}>{item.ts}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Channel Performance */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 18, marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Channel Performance</div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${channelPerf.length}, 1fr)`, gap: 8 }}>
                {channelPerf.map(cp => {
                  const ch = CHANNELS[cp.channel];
                  return (
                    <div key={cp.channel} style={{ background: ch.bg, border: `1px solid ${ch.border}`, borderRadius: T.radius, padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 16, marginBottom: 4 }}>{ch.icon}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: ch.color, marginBottom: 3 }}>{cp.channel}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{cp.reach.toLocaleString()}</div>
                      <div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>reached · {cp.count} active</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TRIGGER SIGNAL ═══ */}
        {tab === "trigger" && (
          <SignalTriggerPanel
            npis={npis}
            journeys={journeys}
            biomarkers={BIOMARKERS}
            onFire={fireSignal}
            history={triggerHistory}
          />
        )}

        {/* ═══ JOURNEYS ═══ */}
        {tab === "journeys" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Orchestration Journeys</span>
              <Btn variant="primary" onClick={() => setShowBuilder("new")}>+ New Journey</Btn>
            </div>
            {journeys.map(j => {
              const bm = BIOMARKERS.find(b => b.id === j.biomarkerId);
              return (
                <div key={j.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 18, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{j.name}</span>
                        <PriorityBadge level={j.priority} />
                        <StatusDot status={j.status} />
                      </div>
                      <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 4 }}>
                        {bm?.name} {j.operator} {j.threshold}{bm?.unit ? ` ${bm.unit}` : ""} · {j.condition} · <span style={{ color: T.accentLight }}>{j.brand}</span>
                      </div>
                      <div style={{ fontSize: 10, color: T.textDim, marginTop: 3, fontFamily: T.mono }}>
                        Guardrails: {j.guardrails.freqCap}/{j.guardrails.freqWindow}d cap · {j.guardrails.channelSpacing}h spacing · {j.guardrails.suppressionDays}d suppress · accel@{j.guardrails.accelThreshold}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 17, fontWeight: 700, fontFamily: T.mono }}>{j.npisEnrolled.toLocaleString()}</div>
                        <div style={{ fontSize: 8, color: T.textDim, textTransform: "uppercase" }}>NPIs</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 17, fontWeight: 700, fontFamily: T.mono, color: T.accentLight }}>{j.signalsToday}</div>
                        <div style={{ fontSize: 8, color: T.textDim, textTransform: "uppercase" }}>Today</div>
                      </div>
                      <Btn variant="secondary" onClick={() => setShowBuilder(j)} style={{ alignSelf: "center" }}>Edit</Btn>
                    </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 12, paddingTop: 2 }}>
                    <JourneyFlow steps={j.steps} assets={assets} journeyId={j.id} onPreviewAsset={setAssetPreview} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ ASSETS ═══ */}
        {tab === "assets" && (
          <AssetLibrary
            assets={assets}
            onAdd={addAsset}
            onDelete={deleteAsset}
            onPreview={setAssetPreview}
            journeys={journeys}
          />
        )}

        {/* ═══ NPI TARGETING ═══ */}
        {tab === "npis" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
              <input value={npiSearch} onChange={e => setNpiSearch(e.target.value)} placeholder="Search by name, NPI, or specialty..." style={{ ...inputStyle, width: 280 }} />
              <Select value={npiFilterStatus} onChange={setNpiFilterStatus} options={[{ value: "all", label: "All Statuses" }, "active", "suppressed", "completed"]} style={{ width: 150 }} />
              <Select value={npiFilterJourney} onChange={setNpiFilterJourney} options={[{ value: "all", label: "All Journeys" }, ...journeys.map(j => ({ value: j.id, label: j.name }))]} style={{ width: 220 }} />
              <Btn variant="secondary" onClick={() => setShowImport(true)} style={{ marginLeft: 4 }}>📤 Import CSV</Btn>
              <span style={{ fontSize: 11, color: T.textDim, fontFamily: T.mono, marginLeft: "auto" }}>
                {filteredNPIs.length} of {npis.length} NPIs
              </span>
            </div>

            {/* Table */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.5fr 0.5fr 0.8fr 1.4fr 0.9fr 0.6fr", gap: 6, padding: "9px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>HCP</span><span>Specialty</span><span>State</span><span>Decile</span>
                <span>Journey</span><span>Next Touch</span><span>Engagement</span><span>Status</span>
              </div>
              {filteredNPIs.map((r, i) => {
                const bc = r.engScore > 70 ? T.green : r.engScore > 40 ? T.amber : T.red;
                return (
                  <div key={r.npi} onClick={() => setSelectedNPI(r)} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.5fr 0.5fr 0.8fr 1.4fr 0.9fr 0.6fr", gap: 6, padding: "10px 16px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", transition: "background 0.1s", background: i % 2 === 0 ? "transparent" : T.bgAlt }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{r.name}</div>
                      <div style={{ fontSize: 9, color: T.textDim, fontFamily: T.mono }}>{r.npi}</div>
                    </div>
                    <span style={{ fontSize: 11, color: T.textSecondary, alignSelf: "center" }}>{r.specialty}</span>
                    <span style={{ fontSize: 11, color: T.textSecondary, alignSelf: "center" }}>{r.state}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.accentLight, alignSelf: "center", fontFamily: T.mono }}>{r.decile}</span>
                    <span style={{ fontSize: 10, color: T.textSecondary, alignSelf: "center" }}>{r.journeyId}</span>
                    <span style={{ fontSize: 11, color: r.nextTouch.includes("Suppressed") || r.nextTouch.includes("complete") ? T.textDim : T.accentLight, alignSelf: "center" }}>{r.nextTouch}</span>
                    <div style={{ alignSelf: "center", display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 44, height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${r.engScore}%`, height: "100%", borderRadius: 2, background: bc }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, fontFamily: T.mono, color: T.textSecondary }}>{r.engScore}</span>
                    </div>
                    <div style={{ alignSelf: "center" }}><StatusDot status={r.status} /></div>
                  </div>
                );
              })}
              {filteredNPIs.length === 0 && (
                <div style={{ padding: 30, textAlign: "center", color: T.textDim, fontSize: 12 }}>No NPIs match your filters</div>
              )}
            </div>
          </div>
        )}

        {/* ═══ LIVE FEED ═══ */}
        {tab === "livefeed" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Real-Time Orchestration Feed</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.green, background: T.greenBg, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.greenBorder}` }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, animation: "pulseGlow 1.5s ease infinite" }} />
                STREAMING
              </span>
              <span style={{ fontSize: 10, color: T.textDim, fontFamily: T.mono, marginLeft: "auto" }}>{feed.length} events</span>
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: "hidden" }}>
              {feed.slice(0, 20).map((item, i) => {
                const ec = EV[item.event] || { c: T.textDim, bg: "transparent" };
                const isHl = i === pulse % Math.min(20, feed.length);
                return (
                  <div key={item._id} style={{ display: "flex", gap: 12, padding: "12px 18px", alignItems: "flex-start", borderBottom: `1px solid ${T.border}`, background: isHl ? `${ec.c}06` : "transparent", borderLeft: `3px solid ${isHl ? ec.c : "transparent"}`, transition: "all 0.3s" }}>
                    <span style={{ fontSize: 10, color: T.textDim, fontFamily: T.mono, whiteSpace: "nowrap", marginTop: 2, minWidth: 58 }}>{item.ts}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: ec.c, background: ec.bg, padding: "2px 7px", borderRadius: 3, fontFamily: T.mono, minWidth: 76, textAlign: "center", border: `1px solid ${ec.c}25`, whiteSpace: "nowrap" }}>{item.event}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: T.text }}>
                        <span style={{ color: T.accentLight, fontWeight: 600 }}>{item.hcp}</span>
                        <span style={{ color: T.textDim }}> — </span>{item.detail}
                      </div>
                      <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>↳ {item.action}</div>
                    </div>
                    <span style={{ fontSize: 8, color: T.textDim, fontFamily: T.mono, whiteSpace: "nowrap" }}>NPI:{item.npi?.slice(-4)}</span>
                  </div>
                );
              })}
            </div>

            {/* Guardrails Summary */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 18, marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Active Guardrail Configurations</div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${liveJourneys.length}, 1fr)`, gap: 10 }}>
                {liveJourneys.map(j => (
                  <div key={j.id} style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8 }}>{j.name}</div>
                    {[
                      { l: "Freq Cap", v: `${j.guardrails.freqCap} / ${j.guardrails.freqWindow}d` },
                      { l: "Ch. Spacing", v: `${j.guardrails.channelSpacing}h` },
                      { l: "Suppress", v: `${j.guardrails.suppressionDays}d` },
                      { l: "Accel @", v: `score ≥ ${j.guardrails.accelThreshold}` },
                    ].map(r => (
                      <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10 }}>
                        <span style={{ color: T.textDim }}>{r.l}</span>
                        <span style={{ color: T.textSecondary, fontFamily: T.mono, fontWeight: 500 }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── MODALS ─── */}
      {showBuilder && (
        <JourneyBuilder
          journey={showBuilder === "new" ? null : showBuilder}
          onSave={saveJourney}
          onClose={() => setShowBuilder(null)}
          assets={assets}
          onAddAsset={(asset) => {
            setAssets(a => {
              const exists = a.find(x => x.id === asset.id);
              if (exists) return a.map(x => x.id === asset.id ? { ...x, ...asset } : x);
              return [...a, asset];
            });
          }}
          onPreviewAsset={setAssetPreview}
        />
      )}
      {selectedNPI && (
        <NPIDetailModal
          record={selectedNPI}
          journeys={journeys}
          onClose={() => setSelectedNPI(null)}
          onUpdate={(npi, updates) => { updateNPI(npi, updates); setSelectedNPI(prev => prev ? { ...prev, ...updates } : null); }}
        />
      )}
      {showImport && (
        <CSVImportModal
          existingNPIs={npis}
          journeys={journeys}
          onImport={(records) => { importNPIs(records); setShowImport(false); }}
          onClose={() => setShowImport(false)}
        />
      )}
      {assetPreview && (
        <AssetPreviewModal asset={assetPreview} onClose={() => setAssetPreview(null)} />
      )}
    </div>
  );
}

const LIVE_FEED = [
  { ts: "14:32:18", event: "SIGNAL", detail: "HbA1c = 7.8% detected", npi: "1234567890", hcp: "Dr. Chen", action: "J-001 Step 4 → Rep Alert" },
  { ts: "14:31:42", event: "DELIVERED", detail: "Endemic Banner served", npi: "2345678901", hcp: "Dr. Torres", action: "J-002 Step 3 complete → Rep Alert in 2d" },
  { ts: "14:30:55", event: "ENGAGED", detail: "Email opened + CTA clicked", npi: "3456789012", hcp: "Dr. Patel", action: "Engagement 94 → accelerate journey" },
  { ts: "14:29:03", event: "SUPPRESSED", detail: "Freq cap reached (3/7d)", npi: "5678901234", hcp: "Dr. Nakamura", action: "J-001 paused → resume in 4d" },
  { ts: "14:28:17", event: "SIGNAL", detail: "LDL-C = 212 mg/dL detected", npi: "6789012345", hcp: "Dr. Kim", action: "J-002 Step 4 → Rep Alert" },
  { ts: "14:27:30", event: "DELIVERED", detail: "Triggered Email sent", npi: "4567890123", hcp: "Dr. Wilson", action: "J-001 Step 2 done → Endemic Banner in 3d" },
  { ts: "14:26:05", event: "REP_ALERT", detail: "Field notification sent", npi: "3456789012", hcp: "Dr. Patel", action: "Rep alerted with eGFR trend packet" },
  { ts: "14:24:48", event: "SIGNAL", detail: "eGFR = 48 mL/min detected", npi: "8901234567", hcp: "Dr. Martinez", action: "J-003 initiated → Email queued" },
];

const EV = {
  SIGNAL:     { c: "#3b5bdb", bg: "rgba(59,91,219,0.1)" },
  DELIVERED:  { c: "#10b981", bg: "rgba(16,185,129,0.1)" },
  ENGAGED:    { c: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  SUPPRESSED: { c: "#64748b", bg: "rgba(100,116,139,0.1)" },
  REP_ALERT:  { c: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
};
