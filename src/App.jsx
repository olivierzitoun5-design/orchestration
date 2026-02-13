import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── RESPONSIVE HOOK ───
function useIsMobile(breakpoint = 768) {
  const [mob, setMob] = useState(typeof window !== "undefined" ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const h = () => setMob(window.innerWidth < breakpoint);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [breakpoint]);
  return mob;
}

// ═══════════════════════════════════════════════════════════
// ORCHÉSTRA™ — PRODUCTION BUILD
// Signal-to-Script™ HCP Orchestration Platform
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

// ─── MLR CONFIG ───
const MLR_STATUSES = {
  draft:      { label: "Draft", color: T.textDim, bg: T.surfaceRaised, border: T.border, icon: "📝", next: "mlr_review" },
  mlr_review: { label: "MLR Review", color: T.amber, bg: T.amberBg, border: T.amberBorder, icon: "⏳", next: "approved" },
  approved:   { label: "Approved", color: T.green, bg: T.greenBg, border: T.greenBorder, icon: "✅", next: null },
  revision:   { label: "Revision Needed", color: T.red, bg: T.redBg, border: T.redBorder, icon: "🔄", next: "mlr_review" },
  expired:    { label: "Expired", color: T.pink, bg: T.pinkBg, border: T.pinkBorder, icon: "⛔", next: "draft" },
};

// ─── SEGMENT RULE CONFIG ───
const SEGMENT_RULES = {
  decile:     { label: "Decile", type: "range", min: 1, max: 10 },
  specialty:  { label: "Specialty", type: "select", options: SPECIALTIES },
  state:      { label: "State", type: "multi", options: STATES },
  engScore:   { label: "Engagement Score", type: "range", min: 0, max: 100 },
  status:     { label: "NPI Status", type: "select", options: ["active", "suppressed", "completed"] },
  journeyId:  { label: "Journey", type: "select", options: [] },
  behavior:   { label: "Behavior", type: "select", options: ["brand-loyal", "switch-prone", "naive-to-category", "lapsed"] },
};

// ─── US STATE GEO (simplified centroids for SVG heatmap) ───
const US_GEO = {
  AL:{x:615,y:395,n:"Alabama"},AK:{x:135,y:490,n:"Alaska"},AZ:{x:205,y:385,n:"Arizona"},AR:{x:530,y:375,n:"Arkansas"},
  CA:{x:105,y:315,n:"California"},CO:{x:295,y:300,n:"Colorado"},CT:{x:755,y:205,n:"Connecticut"},DE:{x:735,y:265,n:"Delaware"},
  FL:{x:670,y:455,n:"Florida"},GA:{x:650,y:390,n:"Georgia"},HI:{x:255,y:490,n:"Hawaii"},ID:{x:195,y:190,n:"Idaho"},
  IL:{x:555,y:275,n:"Illinois"},IN:{x:590,y:270,n:"Indiana"},IA:{x:500,y:240,n:"Iowa"},KS:{x:420,y:310,n:"Kansas"},
  KY:{x:620,y:310,n:"Kentucky"},LA:{x:530,y:430,n:"Louisiana"},ME:{x:780,y:120,n:"Maine"},MD:{x:720,y:265,n:"Maryland"},
  MA:{x:770,y:190,n:"Massachusetts"},MI:{x:590,y:210,n:"Michigan"},MN:{x:470,y:165,n:"Minnesota"},MS:{x:560,y:400,n:"Mississippi"},
  MO:{x:510,y:310,n:"Missouri"},MT:{x:270,y:140,n:"Montana"},NE:{x:410,y:260,n:"Nebraska"},NV:{x:155,y:280,n:"Nevada"},
  NH:{x:765,y:160,n:"New Hampshire"},NJ:{x:740,y:245,n:"New Jersey"},NM:{x:265,y:380,n:"New Mexico"},NY:{x:725,y:195,n:"New York"},
  NC:{x:690,y:335,n:"N. Carolina"},ND:{x:405,y:150,n:"N. Dakota"},OH:{x:625,y:265,n:"Ohio"},OK:{x:430,y:360,n:"Oklahoma"},
  OR:{x:130,y:175,n:"Oregon"},PA:{x:700,y:235,n:"Pennsylvania"},RI:{x:770,y:200,n:"Rhode Island"},SC:{x:680,y:365,n:"S. Carolina"},
  SD:{x:405,y:200,n:"S. Dakota"},TN:{x:610,y:345,n:"Tennessee"},TX:{x:385,y:420,n:"Texas"},UT:{x:225,y:290,n:"Utah"},
  VT:{x:750,y:150,n:"Vermont"},VA:{x:695,y:300,n:"Virginia"},WA:{x:145,y:120,n:"Washington"},WV:{x:665,y:290,n:"W. Virginia"},
  WI:{x:520,y:190,n:"Wisconsin"},WY:{x:280,y:225,n:"Wyoming"},DC:{x:725,y:275,n:"DC"},
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
Generated by Orchéstra™

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
  { id: "A-001", name: "HbA1c Awareness Banner", type: "banner", format: "image", channelHint: "Programmatic Banner", journeyId: "J-001", stepId: "s1", data: makeAssetSvg(728, 90, "HbA1c Awareness · Unbranded", "#3b5bdb", "#0d1221"), dimensions: { w: 728, h: 90 }, size: 2400, uploadedAt: "2026-02-10T09:30:00Z", tags: ["unbranded", "diabetes", "awareness"], mlrStatus: "approved", version: 2, expiresAt: "2026-08-10", mlrHistory: [{ status: "draft", by: "J. Park", at: "2026-02-08", note: "Initial upload" }, { status: "mlr_review", by: "J. Park", at: "2026-02-09", note: "Submitted for review" }, { status: "revision", by: "Dr. K. Mehta (MLR)", at: "2026-02-09", note: "Needs disclaimer font ≥8pt" }, { status: "mlr_review", by: "J. Park", at: "2026-02-10", note: "Font corrected, resubmitted" }, { status: "approved", by: "Dr. K. Mehta (MLR)", at: "2026-02-10", note: "Approved — valid 6 months", jobCode: "US-MNJ-24-00142" }] },
  { id: "A-002", name: "Mounjaro Clinical Email", type: "email", format: "html", channelHint: "Triggered Email", journeyId: "J-001", stepId: "s2", data: makeSampleEmail("Mounjaro® (tirzepatide)", "Clinical Evidence for Your T2D Patients", "<p>New data demonstrates significant HbA1c reduction in patients with Type 2 Diabetes. The SURPASS clinical trial program showed consistent glycemic control across diverse patient populations.</p><p>Key findings from SURPASS-4:<br/>• Mean HbA1c reduction of up to 2.4% from baseline<br/>• 87% of patients achieved HbA1c &lt;7% at 52 weeks<br/>• Demonstrated cardiovascular safety profile</p><p>Consider Mounjaro for your patients who need additional glycemic control beyond current therapy.</p>"), dimensions: null, size: 3200, uploadedAt: "2026-02-10T10:15:00Z", tags: ["branded", "clinical", "diabetes"], mlrStatus: "approved", version: 3, expiresAt: "2026-07-15", mlrHistory: [{ status: "draft", by: "M. Chen", at: "2026-02-07", note: "Draft from medical writing" }, { status: "mlr_review", by: "M. Chen", at: "2026-02-08", note: "Submitted" }, { status: "approved", by: "Dr. R. Singh (MLR)", at: "2026-02-10", note: "Approved with ISI requirement", jobCode: "US-MNJ-24-00143" }] },
  { id: "A-003", name: "Endemic Point-of-Care Banner", type: "banner", format: "image", channelHint: "Endemic Banner", journeyId: "J-001", stepId: "s3", data: makeAssetSvg(300, 250, "Mounjaro · Branded", "#8b5cf6", "#0d1221"), dimensions: { w: 300, h: 250 }, size: 1800, uploadedAt: "2026-02-10T11:00:00Z", tags: ["branded", "point-of-care"], mlrStatus: "mlr_review", version: 1, expiresAt: null, mlrHistory: [{ status: "draft", by: "L. Ortiz", at: "2026-02-09", note: "New banner concept" }, { status: "mlr_review", by: "L. Ortiz", at: "2026-02-10", note: "Pending MLR review" }] },
  { id: "A-004", name: "HbA1c Rep Talking Points", type: "rep_doc", format: "text", channelHint: "Rep Alert", journeyId: "J-001", stepId: "s4", data: makeSampleRepDoc("Mounjaro", "HbA1c ≥ 6.5%", ["SURPASS trial data: up to 2.4% HbA1c reduction from baseline", "Once-weekly dosing improves patient adherence vs. daily alternatives", "Dual GIP/GLP-1 mechanism provides differentiated efficacy", "Weight reduction co-benefit: up to 12% body weight loss in trials", "Cardiovascular safety established in SURPASS-4 (insulin glargine comparator)"]), dimensions: null, size: 1200, uploadedAt: "2026-02-10T11:30:00Z", tags: ["rep", "talking-points", "diabetes"], mlrStatus: "approved", version: 1, expiresAt: "2026-06-30", mlrHistory: [{ status: "draft", by: "T. Adams", at: "2026-02-08", note: "Initial draft" }, { status: "approved", by: "Dr. K. Mehta (MLR)", at: "2026-02-10", note: "Approved", jobCode: "US-MNJ-24-00144" }] },
  { id: "A-005", name: "Retarget Banner — Patient Case", type: "banner", format: "image", channelHint: "Retarget Banner", journeyId: "J-001", stepId: "s5", data: makeAssetSvg(728, 90, "Retarget · Patient Case Study", "#ec4899", "#0d1221"), dimensions: { w: 728, h: 90 }, size: 2100, uploadedAt: "2026-02-10T12:00:00Z", tags: ["branded", "retarget", "case-study"], mlrStatus: "revision", version: 1, expiresAt: null, mlrHistory: [{ status: "draft", by: "L. Ortiz", at: "2026-02-09", note: "New creative" }, { status: "mlr_review", by: "L. Ortiz", at: "2026-02-10", note: "Submitted" }, { status: "revision", by: "Dr. R. Singh (MLR)", at: "2026-02-11", note: "Patient scenario too specific — risk of off-label implication. Generalize language." }] },
  { id: "A-006", name: "Patient Savings Email", type: "email", format: "html", channelHint: "Follow-up Email", journeyId: "J-001", stepId: "s6", data: makeSampleEmail("Mounjaro® Patient Support", "Savings & Formulary Resources for Your Patients", "<p>Help your patients access Mounjaro with our comprehensive support program:</p><p><strong>Savings Card Program</strong><br/>Eligible commercially insured patients may pay as little as $25 per fill. No income requirements.</p><p><strong>Prior Authorization Support</strong><br/>Our dedicated team helps navigate the PA process with payer-specific templates and clinical justification letters.</p><p><strong>Patient Education Materials</strong><br/>Downloadable injection technique guides and treatment tracker tools available in English and Spanish.</p>"), dimensions: null, size: 2900, uploadedAt: "2026-02-10T13:00:00Z", tags: ["branded", "savings", "patient-support"], mlrStatus: "approved", version: 2, expiresAt: "2026-09-01", mlrHistory: [{ status: "draft", by: "M. Chen", at: "2026-02-07", note: "Draft" }, { status: "approved", by: "Dr. K. Mehta (MLR)", at: "2026-02-09", note: "Approved", jobCode: "US-MNJ-24-00145" }] },
  { id: "A-007", name: "LDL-C CV Risk Banner", type: "banner", format: "image", channelHint: "Programmatic Banner", journeyId: "J-002", stepId: "s1", data: makeAssetSvg(728, 90, "CV Risk Education · Unbranded", "#3b5bdb", "#0d1221"), dimensions: { w: 728, h: 90 }, size: 2200, uploadedAt: "2026-02-10T14:00:00Z", tags: ["unbranded", "cardiovascular"], mlrStatus: "approved", version: 1, expiresAt: "2026-08-10", mlrHistory: [{ status: "draft", by: "J. Park", at: "2026-02-08", note: "Initial" }, { status: "approved", by: "Dr. R. Singh (MLR)", at: "2026-02-10", note: "Approved", jobCode: "US-RPT-24-00051" }] },
  { id: "A-008", name: "Repatha Clinical Email", type: "email", format: "html", channelHint: "Triggered Email", journeyId: "J-002", stepId: "s2", data: makeSampleEmail("Repatha® (evolocumab)", "PCSK9 Inhibitor Evidence for High-Risk Patients", "<p>For patients with LDL-C ≥190 mg/dL, PCSK9 inhibition provides significant additional LDL lowering when added to maximally tolerated statin therapy.</p><p>FOURIER trial outcomes:<br/>• 59% additional LDL-C reduction vs. placebo<br/>• 15% relative risk reduction in major cardiovascular events<br/>• Sustained efficacy through 48 months of treatment</p><p>Current AHA/ACC guidelines recommend PCSK9i for patients with clinical ASCVD and LDL-C ≥70 mg/dL on maximum statin.</p>"), dimensions: null, size: 3100, uploadedAt: "2026-02-10T14:30:00Z", tags: ["branded", "clinical", "lipids"], mlrStatus: "draft", version: 1, expiresAt: null, mlrHistory: [{ status: "draft", by: "A. Reeves", at: "2026-02-10", note: "Awaiting medical review sign-off before MLR" }] },
  { id: "A-009", name: "CKD Staging Email", type: "email", format: "html", channelHint: "Triggered Email", journeyId: "J-003", stepId: "s1", data: makeSampleEmail("CKD Awareness", "eGFR Decline Detected — KDIGO Staging Reference", "<p>A recent lab result indicates eGFR &lt;60 mL/min for your patient, suggesting CKD Stage 3 or beyond per KDIGO classification.</p><p><strong>Recommended Next Steps:</strong><br/>• Confirm with repeat testing in 3 months<br/>• Assess for albuminuria (UACR)<br/>• Evaluate cardiovascular risk factors<br/>• Consider SGLT2 inhibitor therapy per KDIGO 2024 guidelines</p><p>Early intervention with nephroprotective agents has shown significant reduction in CKD progression and cardiovascular events.</p>"), dimensions: null, size: 2800, uploadedAt: "2026-02-11T09:00:00Z", tags: ["unbranded", "CKD", "staging"], mlrStatus: "approved", version: 1, expiresAt: "2026-11-01", mlrHistory: [{ status: "draft", by: "S. Vasquez", at: "2026-02-08", note: "Initial" }, { status: "approved", by: "Dr. K. Mehta (MLR)", at: "2026-02-11", note: "Unbranded — expedited approval", jobCode: "US-FRX-24-00033" }] },
  { id: "A-010", name: "Farxiga Rep Insights", type: "rep_doc", format: "text", channelHint: "Rep Alert", journeyId: "J-003", stepId: "s3", data: makeSampleRepDoc("Farxiga", "eGFR < 60 mL/min", ["DAPA-CKD trial: 39% reduction in sustained decline in eGFR, ESKD, or renal death", "Cardio-renal benefit: 29% reduction in CV death or HF hospitalization", "Approved for CKD regardless of diabetes status — broad patient eligibility", "Once-daily oral dosing with no titration required", "KDIGO 2024 guidelines recommend SGLT2i as first-line for CKD with eGFR ≥20"]), dimensions: null, size: 1100, uploadedAt: "2026-02-11T10:00:00Z", tags: ["rep", "talking-points", "CKD", "renal"], mlrStatus: "expired", version: 1, expiresAt: "2026-02-01", mlrHistory: [{ status: "draft", by: "T. Adams", at: "2025-12-01", note: "Q4 version" }, { status: "approved", by: "Dr. R. Singh (MLR)", at: "2025-12-05", note: "Approved 60-day window", jobCode: "US-FRX-24-00034" }, { status: "expired", by: "System", at: "2026-02-01", note: "Auto-expired — approval window elapsed" }] },
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
  const mob = useIsMobile();
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: mob ? "flex-end" : "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.15s ease" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: mob ? "14px 14px 0 0" : 14, padding: 0, width: mob ? "100%" : width, maxHeight: mob ? "92vh" : "88vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>
        {title && (
          <div style={{ padding: mob ? "14px 16px" : "16px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: mob ? 14 : 15, fontWeight: 700, color: T.text }}>{title}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 16, padding: 4, lineHeight: 1 }}>✕</button>
          </div>
        )}
        <div style={{ overflow: "auto", flex: 1, padding: mob ? "14px 16px" : "20px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Tabs({ groups, active, onChange }) {
  const [openGroup, setOpenGroup] = useState(null);
  const activeGroup = groups.find(g => g.items.some(i => i.key === active));
  const activeItem = activeGroup?.items.find(i => i.key === active);
  return (
    <div style={{ display: "flex", gap: 4, padding: "6px 0", flexWrap: "wrap", position: "relative" }}>
      {groups.map((group) => {
        const isOpen = openGroup === group.label;
        const hasActive = group.items.some(i => i.key === active);
        const groupActive = group.items.find(i => i.key === active);
        return (
          <div key={group.label} style={{ position: "relative" }}>
            <button
              onClick={() => setOpenGroup(isOpen ? null : group.label)}
              style={{
                ...btnBase, display: "flex", alignItems: "center", gap: 6,
                padding: "7px 12px", fontSize: 11, fontWeight: 600, fontFamily: T.sans,
                background: hasActive ? T.accentBg : isOpen ? T.surfaceHover : T.surfaceRaised,
                border: `1px solid ${hasActive ? T.accentBorder : isOpen ? T.borderLight : T.border}`,
                color: hasActive ? T.accentLight : T.textSecondary,
                borderRadius: T.radius, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{group.label}</span>
              {groupActive && <span style={{ fontSize: 10, color: T.accentLight }}>· {groupActive.label}</span>}
              <span style={{ fontSize: 8, color: T.textDim, marginLeft: 2, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
            </button>
            {isOpen && (
              <>
                <div onClick={() => setOpenGroup(null)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200, minWidth: 180, background: T.surface, border: `1px solid ${T.borderLight}`, borderRadius: T.radius, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", overflow: "hidden" }}>
                  <div style={{ padding: "6px 10px", fontSize: 8, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${T.border}` }}>{group.label}</div>
                  {group.items.map(item => (
                    <button key={item.key} onClick={() => { onChange(item.key); setOpenGroup(null); }} style={{
                      ...btnBase, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%",
                      padding: "9px 12px", fontSize: 12, fontWeight: active === item.key ? 700 : 500,
                      fontFamily: T.sans, cursor: "pointer", textAlign: "left",
                      background: active === item.key ? T.accentBg : "transparent",
                      color: active === item.key ? T.accentLight : T.text,
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      <span>{item.label}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {item.count != null && <span style={{ fontSize: 9, color: T.textDim, fontFamily: T.mono, background: T.bgAlt, padding: "1px 5px", borderRadius: 3 }}>{item.count}</span>}
                        {active === item.key && <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent }} />}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
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
  const mob = useIsMobile();
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
  const mob = useIsMobile();
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
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 10 : 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Journey Name</label>
            <input value={form.name} onChange={e => updateField("name", e.target.value)} placeholder="e.g. HbA1c Elevated Protocol" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Biomarker</label>
            <Select value={form.biomarkerId} onChange={v => { updateField("biomarkerId", v); const bm = BIOMARKERS.find(b => b.id === v); if (bm) { updateField("threshold", bm.defaultThreshold); updateField("operator", bm.operator); updateField("condition", bm.conditions[0]); } }} options={BIOMARKERS.map(b => ({ value: b.id, label: `${b.name} (${b.unit})` }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "50px 1fr" : "60px 1fr", gap: 8 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(3, 1fr)" : "repeat(5, 1fr)", gap: mob ? 6 : 10, background: T.surfaceRaised, padding: 14, borderRadius: T.radius, border: `1px solid ${T.border}` }}>
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
                  <div style={{ display: "grid", gridTemplateColumns: mob ? "36px 50px 1fr 28px" : "36px 60px 180px 1fr 32px", gap: 8, alignItems: "center", padding: "10px 12px" }}>
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
  const mob = useIsMobile();
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
  const mob = useIsMobile();
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
  const mob = useIsMobile();
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
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
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
                          <iframe srcDoc={asset.data} title="" style={{ width: "100%", height: mob ? 320 : 460, maxWidth: 600, border: "none", transform: "scale(0.42)", transformOrigin: "top left", pointerEvents: "none" }} sandbox="allow-same-origin" />
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

// ═══════════════════════════════════════════
// FEATURE 1: MLR COMPLIANCE WORKFLOW
// ═══════════════════════════════════════════
function MLRPanel({ assets, onUpdate, onPreview }) {
  const mob = useIsMobile();
  const [filter, setFilter] = useState("all");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewJobCode, setReviewJobCode] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [expDays, setExpDays] = useState(180);

  const filtered = filter === "all" ? assets : assets.filter(a => a.mlrStatus === filter);
  const counts = {};
  Object.keys(MLR_STATUSES).forEach(k => { counts[k] = assets.filter(a => a.mlrStatus === k).length; });

  const advanceStatus = (asset, newStatus, note, jobCode) => {
    const entry = { status: newStatus, by: newStatus === "approved" ? "Dr. K. Mehta (MLR)" : newStatus === "revision" ? "Dr. R. Singh (MLR)" : "You", at: new Date().toISOString().split("T")[0], note: note || `Status changed to ${MLR_STATUSES[newStatus]?.label}` };
    if (jobCode) entry.jobCode = jobCode;
    const updates = { mlrStatus: newStatus, mlrHistory: [...(asset.mlrHistory || []), entry] };
    if (newStatus === "approved") { updates.expiresAt = new Date(Date.now() + expDays * 86400000).toISOString().split("T")[0]; updates.version = (asset.version || 1) + 0; }
    if (newStatus === "draft") { updates.version = (asset.version || 1) + 1; }
    onUpdate(asset.id, updates);
    setReviewNote(""); setReviewJobCode("");
  };

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setFilter("all")} style={{ ...btnBase, padding: "6px 14px", fontSize: 11, background: filter === "all" ? T.accentBg : T.surfaceRaised, border: `1px solid ${filter === "all" ? T.accentBorder : T.border}`, color: filter === "all" ? T.accentLight : T.textSecondary }}>All ({assets.length})</button>
        {Object.entries(MLR_STATUSES).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ ...btnBase, padding: "6px 14px", fontSize: 11, background: filter === k ? v.bg : T.surfaceRaised, border: `1px solid ${filter === k ? v.border : T.border}`, color: filter === k ? v.color : T.textSecondary }}>
            {v.icon} {v.label} ({counts[k] || 0})
          </button>
        ))}
      </div>

      {/* Pipeline summary */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(3, 1fr)" : "repeat(5, 1fr)", gap: mob ? 6 : 10, marginBottom: 16 }}>
        {Object.entries(MLR_STATUSES).map(([k, v]) => (
          <div key={k} style={{ background: v.bg, border: `1px solid ${v.border}`, borderRadius: T.radius, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: v.color, fontFamily: T.mono }}>{counts[k] || 0}</div>
            <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", marginTop: 2 }}>{v.label}</div>
          </div>
        ))}
      </div>

      {/* Asset cards */}
      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map(asset => {
          const at = ASSET_TYPES[asset.type] || {};
          const mlr = MLR_STATUSES[asset.mlrStatus] || MLR_STATUSES.draft;
          const expanded = expandedId === asset.id;
          const daysUntilExpiry = asset.expiresAt ? Math.ceil((new Date(asset.expiresAt) - Date.now()) / 86400000) : null;
          const nearExpiry = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
          return (
            <div key={asset.id} style={{ background: T.surface, border: `1px solid ${mlr.border}`, borderRadius: T.radius, borderLeft: `4px solid ${mlr.color}`, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : asset.id)}>
                <AssetThumb asset={asset} size={36} onClick={e => { e.stopPropagation(); onPreview(asset); }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{asset.name}</div>
                  <div style={{ fontSize: 10, color: T.textDim }}>{at.label} · v{asset.version || 1} · {asset.journeyId || "Unassigned"}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {nearExpiry && <Badge color={T.amber} bg={T.amberBg} border={T.amberBorder}>⚠ {daysUntilExpiry}d left</Badge>}
                  {asset.expiresAt && asset.mlrStatus === "approved" && <span style={{ fontSize: 9, color: T.textDim }}>Exp: {asset.expiresAt}</span>}
                  <Badge color={mlr.color} bg={mlr.bg} border={mlr.border}>{mlr.icon} {mlr.label}</Badge>
                  <span style={{ fontSize: 14, color: T.textDim, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                </div>
              </div>

              {expanded && (
                <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.border}` }}>
                  {/* History timeline */}
                  <div style={{ marginTop: 12, marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginBottom: 8 }}>REVIEW HISTORY</div>
                    <div style={{ position: "relative", paddingLeft: 18 }}>
                      <div style={{ position: "absolute", left: 5, top: 4, bottom: 4, width: 1.5, background: T.border }} />
                      {(asset.mlrHistory || []).map((h, i) => {
                        const hs = MLR_STATUSES[h.status] || MLR_STATUSES.draft;
                        return (
                          <div key={i} style={{ display: "flex", gap: 10, padding: "5px 0", position: "relative" }}>
                            <div style={{ position: "absolute", left: -15, top: 8, width: 10, height: 10, borderRadius: "50%", background: hs.bg, border: `2px solid ${hs.color}`, zIndex: 1 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: hs.color }}>{hs.label}</span>
                                <span style={{ fontSize: 9, color: T.textDim }}>{h.at}</span>
                                <span style={{ fontSize: 9, color: T.textSecondary }}>by {h.by}</span>
                                {h.jobCode && <Badge color={T.green} bg={T.greenBg} border={T.greenBorder}>{h.jobCode}</Badge>}
                              </div>
                              <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 2, lineHeight: 1.5 }}>{h.note}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ background: T.bgAlt, borderRadius: T.radiusSm, padding: 12, display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary }}>ACTIONS</div>
                    <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Add review note..." rows={2} style={{ ...inputStyle, resize: "vertical", fontSize: 11 }} />
                    {asset.mlrStatus === "mlr_review" && (
                      <input value={reviewJobCode} onChange={e => setReviewJobCode(e.target.value)} placeholder="Job Code (e.g. US-MNJ-24-00150)" style={{ ...inputStyle, fontSize: 11 }} />
                    )}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {asset.mlrStatus === "draft" && <Btn variant="primary" onClick={() => advanceStatus(asset, "mlr_review", reviewNote || "Submitted for MLR review")} style={{ fontSize: 10 }}>⏳ Submit for MLR Review</Btn>}
                      {asset.mlrStatus === "mlr_review" && (
                        <>
                          <Btn variant="primary" onClick={() => advanceStatus(asset, "approved", reviewNote || "Approved", reviewJobCode)} style={{ fontSize: 10, background: T.green }}>✅ Approve</Btn>
                          <Btn variant="danger" onClick={() => advanceStatus(asset, "revision", reviewNote || "Revision needed")} style={{ fontSize: 10 }}>🔄 Request Revision</Btn>
                        </>
                      )}
                      {asset.mlrStatus === "revision" && <Btn variant="primary" onClick={() => advanceStatus(asset, "mlr_review", reviewNote || "Revised and resubmitted")} style={{ fontSize: 10 }}>⏳ Resubmit to MLR</Btn>}
                      {asset.mlrStatus === "approved" && <Btn variant="ghost" onClick={() => advanceStatus(asset, "expired", reviewNote || "Manually expired")} style={{ fontSize: 10 }}>⛔ Expire Now</Btn>}
                      {asset.mlrStatus === "expired" && <Btn variant="primary" onClick={() => advanceStatus(asset, "draft", reviewNote || "Renewed — new version")} style={{ fontSize: 10 }}>📝 Create New Version</Btn>}
                      <Btn variant="ghost" onClick={() => onPreview(asset)} style={{ fontSize: 10 }}>👁 Preview Asset</Btn>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// FEATURE 2: NL JOURNEY BUILDER (Client-Side)
// ═══════════════════════════════════════════
const NL_BIOMARKER_PATTERNS = [
  { id: "hba1c", patterns: ["hba1c", "a1c", "hemoglobin a1c", "glycated"], defaultThreshold: "6.5", defaultOp: "≥", condition: "Type 2 Diabetes" },
  { id: "ldlc", patterns: ["ldl", "ldl-c", "cholesterol", "lipid", "hyperlipid"], defaultThreshold: "190", defaultOp: "≥", condition: "Severe Hyperlipidemia" },
  { id: "egfr", patterns: ["egfr", "gfr", "kidney", "renal", "ckd", "nephro"], defaultThreshold: "60", defaultOp: "<", condition: "Chronic Kidney Disease" },
  { id: "psa", patterns: ["psa", "prostate"], defaultThreshold: "4.0", defaultOp: "≥", condition: "Prostate Cancer Screening" },
  { id: "tsh", patterns: ["tsh", "thyroid"], defaultThreshold: "4.5", defaultOp: ">", condition: "Hypothyroidism" },
  { id: "ntprobnp", patterns: ["bnp", "probnp", "heart failure", "cardiac"], defaultThreshold: "300", defaultOp: ">", condition: "Heart Failure" },
  { id: "crp", patterns: ["crp", "c-reactive", "inflammation"], defaultThreshold: "3.0", defaultOp: ">", condition: "Cardiovascular Inflammation" },
  { id: "ferritin", patterns: ["ferritin", "iron", "anemia"], defaultThreshold: "20", defaultOp: "<", condition: "Iron Deficiency Anemia" },
];

const NL_CHANNEL_PATTERNS = [
  { channel: "Programmatic Banner", patterns: ["programmatic", "prog banner", "awareness banner", "display ad", "unbranded banner"], actionTemplate: (branded) => branded ? "Branded awareness banner" : "Unbranded disease education banner" },
  { channel: "Triggered Email", patterns: ["email", "clinical email", "triggered email", "data email", "evidence email"], actionTemplate: (branded) => branded ? "Clinical evidence email with efficacy data" : "Disease awareness and guidelines email" },
  { channel: "Endemic Banner", patterns: ["endemic", "point-of-care", "poc banner", "branded banner"], actionTemplate: () => "Branded banner on point-of-care platform" },
  { channel: "Rep Alert", patterns: ["rep", "field rep", "sales rep", "msl", "field alert", "detail", "visit"], actionTemplate: () => "Field rep notified with talking points + lab context" },
  { channel: "Retarget Banner", patterns: ["retarget", "re-target", "remarketing", "follow-up banner"], actionTemplate: () => "Retarget engaged HCPs with outcome-focused creative" },
  { channel: "Follow-up Email", patterns: ["follow-up email", "followup email", "savings", "patient support", "formulary", "enrollment"], actionTemplate: () => "Patient savings card + formulary access info" },
];

function parseNLJourney(prompt, journeyCount) {
  const lower = prompt.toLowerCase();
  // Detect biomarker
  let biomarker = NL_BIOMARKER_PATTERNS.find(b => b.patterns.some(p => lower.includes(p)));
  if (!biomarker) biomarker = NL_BIOMARKER_PATTERNS[0]; // default hba1c

  // Extract threshold
  let threshold = biomarker.defaultThreshold;
  let operator = biomarker.defaultOp;
  const threshMatch = lower.match(/(above|over|exceeds?|greater than|≥|>=)\s*([\d.]+)/);
  const threshMatchBelow = lower.match(/(below|under|less than|<|≤|<=)\s*([\d.]+)/);
  if (threshMatch) { threshold = threshMatch[2]; operator = "≥"; }
  else if (threshMatchBelow) { threshold = threshMatchBelow[2]; operator = "<"; }

  // Detect brand
  const brandPatterns = [
    { brand: "Mounjaro", patterns: ["mounjaro", "tirzepatide"] },
    { brand: "Repatha", patterns: ["repatha", "evolocumab", "pcsk9"] },
    { brand: "Farxiga", patterns: ["farxiga", "dapagliflozin", "sglt2"] },
    { brand: "Ozempic", patterns: ["ozempic", "semaglutide"] },
    { brand: "Jardiance", patterns: ["jardiance", "empagliflozin"] },
    { brand: "Keytruda", patterns: ["keytruda", "pembrolizumab"] },
    { brand: "Entresto", patterns: ["entresto", "sacubitril"] },
  ];
  const detectedBrand = brandPatterns.find(b => b.patterns.some(p => lower.includes(p)));
  const brand = detectedBrand?.brand || "Brand TBD";

  // Detect priority
  let priority = "medium";
  if (lower.includes("high priority") || lower.includes("urgent") || lower.includes("critical")) priority = "high";
  if (lower.includes("low priority")) priority = "low";

  // Detect step count
  const stepMatch = lower.match(/(\d+)[\s-]*(step|touch|stage)/);
  let targetSteps = stepMatch ? parseInt(stepMatch[1]) : 0;

  // Detect channels explicitly mentioned
  const mentionedChannels = [];
  NL_CHANNEL_PATTERNS.forEach(cp => {
    if (cp.patterns.some(p => lower.includes(p))) mentionedChannels.push(cp);
  });

  // Build steps from mentioned channels or generate default sequence
  let steps = [];
  if (mentionedChannels.length > 0) {
    steps = mentionedChannels.map((cp, i) => ({
      id: `s${i + 1}`, day: i === 0 ? 0 : i * 3, channel: cp.channel,
      action: cp.actionTemplate(brand !== "Brand TBD"), reach: 0, engagement: "—",
    }));
  }

  // Fill to target count if needed
  const defaultSequence = ["Programmatic Banner", "Triggered Email", "Endemic Banner", "Rep Alert", "Retarget Banner", "Follow-up Email"];
  if (targetSteps > steps.length) {
    const existing = new Set(steps.map(s => s.channel));
    for (const ch of defaultSequence) {
      if (steps.length >= targetSteps) break;
      if (!existing.has(ch)) {
        const cp = NL_CHANNEL_PATTERNS.find(p => p.channel === ch);
        steps.push({ id: `s${steps.length + 1}`, day: steps.length === 0 ? 0 : (steps[steps.length - 1]?.day || 0) + 3, channel: ch, action: cp?.actionTemplate(brand !== "Brand TBD") || ch, reach: 0, engagement: "—" });
        existing.add(ch);
      }
    }
  }

  // If no channels detected and no target, default 4-step
  if (steps.length === 0) {
    const count = targetSteps || 4;
    for (let i = 0; i < Math.min(count, 6); i++) {
      const ch = defaultSequence[i];
      const cp = NL_CHANNEL_PATTERNS.find(p => p.channel === ch);
      steps.push({ id: `s${i + 1}`, day: i === 0 ? 0 : i * 3, channel: ch, action: cp?.actionTemplate(brand !== "Brand TBD") || ch, reach: 0, engagement: "—" });
    }
  }

  // Enrich actions with contextual detail from prompt
  const conditionName = biomarker.condition;
  if (lower.includes("clinical") || lower.includes("trial") || lower.includes("data") || lower.includes("evidence")) {
    const emailStep = steps.find(s => s.channel === "Triggered Email");
    if (emailStep) emailStep.action = `Clinical trial evidence for ${conditionName} management`;
  }
  if (lower.includes("savings") || lower.includes("copay") || lower.includes("patient support")) {
    const fuStep = steps.find(s => s.channel === "Follow-up Email");
    if (fuStep) fuStep.action = "Patient savings card + copay assistance program";
  }

  return {
    id: `J-${String(journeyCount + 1).padStart(3, "0")}`,
    name: `${BIOMARKERS.find(b => b.id === biomarker.id)?.name || biomarker.id} ${brand} Protocol`,
    biomarkerId: biomarker.id, threshold, operator,
    condition: conditionName, brand, priority, status: "draft",
    npisEnrolled: 0, signalsToday: 0,
    guardrails: { freqCap: 3, freqWindow: 7, channelSpacing: 48, suppressionDays: 30, accelThreshold: 70 },
    steps,
  };
}

function NLJourneyBuilder({ onCreateJourney, journeys }) {
  const mob = useIsMobile();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const examplePrompts = [
    "Build a 5-touch journey for endocrinologists with HbA1c above 7.0. Lead with unbranded disease education, follow with clinical data email, then branded banner, rep alert, and close with patient savings email. Brand: Mounjaro.",
    "Create a 4-step protocol for cardiologists when LDL-C exceeds 200 mg/dL. Start with email citing FOURIER trial data, add programmatic banner, then rep visit, then retarget banner. Brand: Repatha. High priority.",
    "Design a nephrologist journey triggered by eGFR below 45. Begin with KDIGO guidelines email, then endemic point-of-care banner, followed by field rep alert with DAPA-CKD data, and a follow-up enrollment email. Brand: Farxiga.",
  ];

  const generateJourney = () => {
    if (!prompt.trim()) return;
    setLoading(true);
    // Simulate brief processing delay
    setTimeout(() => {
      const parsed = parseNLJourney(prompt, journeys.length);
      setResult(parsed);
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 16, alignItems: "start" }}>
      {/* Left: Input */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>🧠</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>AI Journey Builder</div>
            <div style={{ fontSize: 10, color: T.textDim }}>Describe your journey in plain English — AI generates the full configuration</div>
          </div>
        </div>

        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., Build a 4-touch journey for endocrinologists when HbA1c exceeds 7.0. Lead with clinical email, then branded banner..." rows={6} style={{ ...inputStyle, resize: "vertical", fontSize: 12, lineHeight: 1.6, marginBottom: 12 }} />

        <button onClick={generateJourney} disabled={loading || !prompt.trim()} style={{ ...btnBase, width: "100%", padding: "12px 20px", fontSize: 13, fontWeight: 700, fontFamily: T.sans, background: loading || !prompt.trim() ? T.surfaceRaised : `linear-gradient(135deg, ${T.purple}, ${T.accent})`, color: loading || !prompt.trim() ? T.textDim : "#fff", border: "none", borderRadius: T.radius, cursor: loading || !prompt.trim() ? "not-allowed" : "pointer", boxShadow: loading ? "none" : `0 4px 20px ${T.purple}40` }}>
          {loading ? "⏳ Generating..." : "🧠 Generate Journey"}
        </button>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: "uppercase", marginBottom: 8 }}>Try an example</div>
          {examplePrompts.map((ex, i) => (
            <div key={i} onClick={() => setPrompt(ex)} style={{ padding: "8px 10px", borderRadius: T.radiusSm, marginBottom: 4, cursor: "pointer", background: T.bgAlt, border: `1px solid ${T.border}`, fontSize: 10, color: T.textSecondary, lineHeight: 1.5, transition: "border-color 0.15s" }}>
              {ex.slice(0, 120)}...
            </div>
          ))}
        </div>
      </div>

      {/* Right: Generated result */}
      <div>
        {result && (
          <div style={{ background: T.surface, border: `1px solid ${T.greenBorder}`, borderRadius: T.radiusLg, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>✅ Journey Generated</div>
              <Badge color={T.amber} bg={T.amberBg} border={T.amberBorder}>Draft</Badge>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[{ l: "Name", v: result.name }, { l: "Brand", v: result.brand }, { l: "Biomarker", v: `${BIOMARKERS.find(b => b.id === result.biomarkerId)?.name || result.biomarkerId} ${result.operator} ${result.threshold}` }, { l: "Condition", v: result.condition }, { l: "Priority", v: result.priority }, { l: "Steps", v: result.steps?.length }].map(d => (
                <div key={d.l} style={{ padding: "6px 10px", background: T.surfaceRaised, borderRadius: T.radiusSm }}>
                  <div style={{ fontSize: 8, color: T.textDim, textTransform: "uppercase" }}>{d.l}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{d.v}</div>
                </div>
              ))}
            </div>

            {/* Steps preview */}
            <div style={{ marginBottom: 14 }}>
              {result.steps?.map((s, i) => {
                const ch = CHANNELS[s.channel] || { color: T.textDim, bg: T.surfaceRaised, border: T.border };
                return (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: T.radiusSm, marginBottom: 4, background: ch.bg, borderLeft: `3px solid ${ch.color}` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.textDim, fontFamily: T.mono, minWidth: 36 }}>Day {s.day}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: ch.color, minWidth: 120 }}>{s.channel}</span>
                    <span style={{ fontSize: 10, color: T.textSecondary, flex: 1 }}>{s.action}</span>
                  </div>
                );
              })}
            </div>

            {/* Guardrails */}
            {result.guardrails && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {Object.entries(result.guardrails).map(([k, v]) => (
                  <span key={k} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: T.bgAlt, color: T.textSecondary, fontFamily: T.mono }}>{k}: {v}</span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="primary" onClick={() => { onCreateJourney(result); setResult(null); setPrompt(""); }}>🚀 Create Journey (Draft)</Btn>
              <Btn variant="ghost" onClick={() => setResult(null)}>Discard</Btn>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🧠</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary }}>Describe Your Journey</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 6, maxWidth: 320, margin: "6px auto 0" }}>
              Tell the AI what you want — biomarker, specialty, channel mix, messaging strategy — and it generates the full journey config ready to launch.
            </div>
          </div>
        )}
        {loading && (
          <div style={{ background: T.surface, border: `1px solid ${T.purpleBorder}`, borderRadius: T.radiusLg, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10, animation: "pulseGlow 1.5s ease infinite" }}>🧠</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.purple }}>Generating Journey Configuration...</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>Analyzing your brief, selecting biomarker thresholds, sequencing touchpoints...</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// FEATURE 3: AUDIENCE SEGMENTATION ENGINE
// ═══════════════════════════════════════════
const initSegments = () => [
  { id: "SEG-001", name: "High-Value Endo Targets", rules: [{ field: "decile", op: "≥", value: 8 }, { field: "specialty", op: "=", value: "Endocrinology" }], color: T.accent },
  { id: "SEG-002", name: "Lapsed Cardiology — Low Eng.", rules: [{ field: "specialty", op: "=", value: "Cardiology" }, { field: "engScore", op: "<", value: 40 }], color: T.amber },
  { id: "SEG-003", name: "NY/CA High-Decile", rules: [{ field: "state", op: "in", value: ["NY", "CA"] }, { field: "decile", op: "≥", value: 7 }], color: T.green },
];

function evaluateSegment(npi, rules) {
  return rules.every(r => {
    const v = npi[r.field];
    switch (r.op) {
      case "≥": return typeof v === "number" && v >= r.value;
      case ">": return typeof v === "number" && v > r.value;
      case "<": return typeof v === "number" && v < r.value;
      case "≤": return typeof v === "number" && v <= r.value;
      case "=": return String(v) === String(r.value);
      case "!=": return String(v) !== String(r.value);
      case "in": return Array.isArray(r.value) && r.value.includes(v);
      default: return false;
    }
  });
}

function SegmentBuilder({ npis, segments, onSave, onDelete, journeys }) {
  const mob = useIsMobile();
  const [editing, setEditing] = useState(null); // null | segment obj | "new"
  const [form, setForm] = useState({ name: "", rules: [{ field: "decile", op: "≥", value: 5 }], color: T.accent });

  const startEdit = (seg) => { setForm({ name: seg.name, rules: [...seg.rules], color: seg.color }); setEditing(seg); };
  const startNew = () => { setForm({ name: "", rules: [{ field: "decile", op: "≥", value: 5 }], color: T.accent }); setEditing("new"); };

  const addRule = () => setForm(f => ({ ...f, rules: [...f.rules, { field: "decile", op: "≥", value: 5 }] }));
  const removeRule = (i) => setForm(f => ({ ...f, rules: f.rules.filter((_, idx) => idx !== i) }));
  const updateRule = (i, key, val) => setForm(f => {
    const rules = [...f.rules]; rules[i] = { ...rules[i], [key]: val };
    // Auto-adjust defaults
    if (key === "field") {
      const rType = SEGMENT_RULES[val]?.type;
      if (rType === "range") { rules[i].op = "≥"; rules[i].value = SEGMENT_RULES[val]?.min || 0; }
      else if (rType === "select") { rules[i].op = "="; rules[i].value = SEGMENT_RULES[val]?.options?.[0] || ""; }
      else if (rType === "multi") { rules[i].op = "in"; rules[i].value = []; }
    }
    return { ...f, rules };
  });

  const previewCount = useMemo(() => npis.filter(n => evaluateSegment(n, form.rules)).length, [npis, form.rules]);

  const handleSave = () => {
    const seg = { id: editing === "new" ? `SEG-${Date.now()}` : editing.id, name: form.name, rules: form.rules, color: form.color };
    onSave(seg);
    setEditing(null);
  };

  const fieldOps = { range: ["≥", ">", "<", "≤", "="], select: ["=", "!="], multi: ["in"] };
  const segColors = [T.accent, T.green, T.amber, T.cyan, T.purple, T.pink, T.teal, T.red];

  return (
    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : editing ? "1fr 1fr" : "1fr", gap: 16 }}>
      {/* Left: Segment list */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Audience Segments</div>
          <Btn variant="primary" onClick={startNew}>+ New Segment</Btn>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {segments.map(seg => {
            const count = npis.filter(n => evaluateSegment(n, seg.rules)).length;
            const pct = npis.length > 0 ? Math.round((count / npis.length) * 100) : 0;
            return (
              <div key={seg.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, borderLeft: `4px solid ${seg.color}`, padding: 14, cursor: "pointer" }} onClick={() => startEdit(seg)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{seg.name}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: seg.color, fontFamily: T.mono }}>{count}</span>
                    <span style={{ fontSize: 10, color: T.textDim }}>NPIs ({pct}%)</span>
                  </div>
                </div>
                {/* Rule chips */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {seg.rules.map((r, i) => (
                    <span key={i} style={{ padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 600, background: `${seg.color}18`, color: seg.color, border: `1px solid ${seg.color}30` }}>
                      {SEGMENT_RULES[r.field]?.label} {r.op} {Array.isArray(r.value) ? r.value.join(", ") : r.value}
                    </span>
                  ))}
                </div>
                {/* Mini bar */}
                <div style={{ marginTop: 8, height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: seg.color, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}

          {segments.length === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: T.textDim }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
              <div style={{ fontSize: 12 }}>No segments yet — create one to target specific NPI populations</div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Editor */}
      {editing && (
        <div style={{ background: T.surface, border: `1px solid ${T.borderLight}`, borderRadius: T.radiusLg, padding: 20, position: "sticky", top: 80 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{editing === "new" ? "New Segment" : "Edit Segment"}</div>
            <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={labelStyle}>Segment Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., High-Value Endo Targets" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Color</label>
              <div style={{ display: "flex", gap: 4 }}>
                {segColors.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", border: `2px solid ${form.color === c ? "#fff" : "transparent"}`, opacity: form.color === c ? 1 : 0.5, transition: "all 0.15s" }} />
                ))}
              </div>
            </div>

            {/* Rules */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={labelStyle}>Rules (all must match)</label>
                <Btn variant="small" onClick={addRule}>+ Rule</Btn>
              </div>
              {form.rules.map((rule, i) => {
                const rDef = SEGMENT_RULES[rule.field] || {};
                const ops = fieldOps[rDef.type] || ["="];
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: mob ? "1fr 50px 1fr 24px" : "120px 60px 1fr 24px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <Select value={rule.field} onChange={v => updateRule(i, "field", v)} options={Object.entries(SEGMENT_RULES).map(([k, v]) => ({ value: k, label: v.label }))} style={{ fontSize: 10, padding: "5px 6px" }} />
                    <Select value={rule.op} onChange={v => updateRule(i, "op", v)} options={ops} style={{ fontSize: 10, padding: "5px 4px" }} />
                    {rDef.type === "range" ? (
                      <input type="number" value={rule.value} onChange={e => updateRule(i, "value", parseFloat(e.target.value) || 0)} style={{ ...inputStyle, fontSize: 10, padding: "5px 6px" }} />
                    ) : rDef.type === "select" ? (
                      <Select value={rule.value} onChange={v => updateRule(i, "value", v)} options={rule.field === "journeyId" ? journeys.map(j => ({ value: j.id, label: j.name })) : (rDef.options || [])} style={{ fontSize: 10, padding: "5px 6px" }} />
                    ) : rDef.type === "multi" ? (
                      <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        {(rDef.options || []).map(o => (
                          <span key={o} onClick={() => updateRule(i, "value", Array.isArray(rule.value) && rule.value.includes(o) ? rule.value.filter(x => x !== o) : [...(Array.isArray(rule.value) ? rule.value : []), o])} style={{ fontSize: 8, padding: "2px 5px", borderRadius: 3, cursor: "pointer", background: Array.isArray(rule.value) && rule.value.includes(o) ? form.color : T.bgAlt, color: Array.isArray(rule.value) && rule.value.includes(o) ? "#fff" : T.textDim, border: `1px solid ${T.border}`, fontWeight: 600 }}>{o}</span>
                        ))}
                      </div>
                    ) : <input value={rule.value} onChange={e => updateRule(i, "value", e.target.value)} style={{ ...inputStyle, fontSize: 10, padding: "5px 6px" }} />}
                    <button onClick={() => removeRule(i)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 12, opacity: form.rules.length <= 1 ? 0.3 : 0.7 }} disabled={form.rules.length <= 1}>×</button>
                  </div>
                );
              })}
            </div>

            {/* Preview */}
            <div style={{ background: `${form.color}12`, border: `1px solid ${form.color}30`, borderRadius: T.radius, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: form.color, fontFamily: T.mono }}>{previewCount}</div>
              <div style={{ fontSize: 10, color: T.textSecondary }}>NPIs match · {npis.length > 0 ? Math.round((previewCount / npis.length) * 100) : 0}% of universe</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="primary" onClick={handleSave} disabled={!form.name.trim()}>💾 {editing === "new" ? "Create" : "Update"} Segment</Btn>
              {editing !== "new" && <Btn variant="danger" onClick={() => { onDelete(editing.id); setEditing(null); }}>Delete</Btn>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// FEATURE 4: GEO SIGNAL HEATMAP
// ═══════════════════════════════════════════
function GeoHeatmap({ npis, journeys }) {
  const mob = useIsMobile();
  const [metric, setMetric] = useState("signals"); // signals | npis | engagement
  const [selectedState, setSelectedState] = useState(null);
  const [selectedJourney, setSelectedJourney] = useState("all");

  const filteredNPIs = selectedJourney === "all" ? npis : npis.filter(n => n.journeyId === selectedJourney);

  const stateData = useMemo(() => {
    const data = {};
    Object.keys(US_GEO).forEach(st => { data[st] = { npis: 0, signals: 0, engagement: 0, engTotal: 0, names: [] }; });
    filteredNPIs.forEach(n => {
      const st = n.state;
      if (data[st]) {
        data[st].npis++;
        data[st].signals += Math.floor(Math.random() * 5) + 1; // simulated signals
        data[st].engTotal += n.engScore || 0;
        data[st].engagement = data[st].npis > 0 ? Math.round(data[st].engTotal / data[st].npis) : 0;
        data[st].names.push(n.name);
      }
    });
    return data;
  }, [filteredNPIs]);

  const maxVal = useMemo(() => {
    let max = 1;
    Object.values(stateData).forEach(d => {
      const v = metric === "npis" ? d.npis : metric === "signals" ? d.signals : d.engagement;
      if (v > max) max = v;
    });
    return max;
  }, [stateData, metric]);

  const getColor = (val) => {
    if (val === 0) return T.surfaceRaised;
    const intensity = Math.min(val / maxVal, 1);
    const r = Math.round(59 + intensity * 80);
    const g = Math.round(91 - intensity * 50);
    const b = Math.round(219 + intensity * 20);
    return `rgba(${r}, ${g}, ${b}, ${0.2 + intensity * 0.8})`;
  };

  const stateDetail = selectedState ? stateData[selectedState] : null;
  const stateNPIs = selectedState ? filteredNPIs.filter(n => n.state === selectedState) : [];

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <Select value={metric} onChange={setMetric} options={[{ value: "signals", label: "📡 Signal Density" }, { value: "npis", label: "👤 NPI Count" }, { value: "engagement", label: "📊 Avg Engagement" }]} style={{ width: 180 }} />
        <Select value={selectedJourney} onChange={setSelectedJourney} options={[{ value: "all", label: "All Journeys" }, ...journeys.map(j => ({ value: j.id, label: j.name }))]} style={{ width: 240 }} />
        {selectedState && (
          <Btn variant="ghost" onClick={() => setSelectedState(null)} style={{ fontSize: 10 }}>✕ Clear selection</Btn>
        )}
        <span style={{ fontSize: 10, color: T.textDim, marginLeft: "auto", fontFamily: T.mono }}>
          {filteredNPIs.length} NPIs across {Object.values(stateData).filter(d => d.npis > 0).length} states
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : selectedState ? "1fr 320px" : "1fr", gap: 16 }}>
        {/* Map */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
          <svg viewBox="50 80 780 440" style={{ width: "100%", height: "auto" }}>
            {Object.entries(US_GEO).map(([st, geo]) => {
              const d = stateData[st] || { npis: 0, signals: 0, engagement: 0 };
              const val = metric === "npis" ? d.npis : metric === "signals" ? d.signals : d.engagement;
              const isSelected = selectedState === st;
              const hasData = val > 0;
              const radius = hasData ? Math.max(10, Math.min(28, 10 + (val / maxVal) * 18)) : 6;
              return (
                <g key={st} onClick={() => setSelectedState(st === selectedState ? null : st)} style={{ cursor: "pointer" }}>
                  <circle cx={geo.x} cy={geo.y} r={radius} fill={getColor(val)} stroke={isSelected ? "#fff" : hasData ? T.accentLight : T.border} strokeWidth={isSelected ? 2.5 : hasData ? 1 : 0.5} opacity={hasData ? 1 : 0.3} />
                  {hasData && val > 0 && (
                    <text x={geo.x} y={geo.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={radius > 14 ? 9 : 7} fontWeight="700" fontFamily="IBM Plex Mono, monospace" style={{ pointerEvents: "none" }}>{val}</text>
                  )}
                  <text x={geo.x} y={geo.y + radius + 9} textAnchor="middle" fill={T.textDim} fontSize="7" fontFamily="IBM Plex Sans, sans-serif" style={{ pointerEvents: "none" }}>{st}</text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: getColor(0) }} /><span style={{ fontSize: 9, color: T.textDim }}>No data</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: getColor(maxVal * 0.3) }} /><span style={{ fontSize: 9, color: T.textDim }}>Low</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 14, height: 14, borderRadius: "50%", background: getColor(maxVal * 0.7) }} /><span style={{ fontSize: 9, color: T.textDim }}>Medium</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 18, height: 18, borderRadius: "50%", background: getColor(maxVal) }} /><span style={{ fontSize: 9, color: T.textDim }}>High</span></div>
          </div>
        </div>

        {/* State detail panel */}
        {selectedState && stateDetail && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{US_GEO[selectedState]?.n || selectedState}</div>
            <div style={{ fontSize: 10, color: T.textDim, marginBottom: 14 }}>{selectedState} · {stateNPIs.length} active NPIs</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[{ l: "NPIs", v: stateDetail.npis, c: T.accent }, { l: "Signals", v: stateDetail.signals, c: T.green }, { l: "Avg Eng.", v: stateDetail.engagement, c: T.amber }].map(m => (
                <div key={m.l} style={{ background: `${m.c}12`, border: `1px solid ${m.c}30`, borderRadius: T.radius, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: m.c, fontFamily: T.mono }}>{m.v}</div>
                  <div style={{ fontSize: 8, color: T.textDim, textTransform: "uppercase" }}>{m.l}</div>
                </div>
              ))}
            </div>

            {/* NPI list for state */}
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginBottom: 6 }}>HCPs in {selectedState}</div>
            <div style={{ maxHeight: 220, overflow: "auto" }}>
              {stateNPIs.map(n => {
                const bc = n.engScore > 70 ? T.green : n.engScore > 40 ? T.amber : T.red;
                return (
                  <div key={n.npi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{n.name}</div>
                      <div style={{ fontSize: 9, color: T.textDim }}>{n.specialty} · D{n.decile}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 30, height: 3, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${n.engScore}%`, height: "100%", borderRadius: 2, background: bc }} />
                      </div>
                      <span style={{ fontSize: 9, color: bc, fontFamily: T.mono, fontWeight: 600, minWidth: 18, textAlign: "right" }}>{n.engScore}</span>
                    </div>
                  </div>
                );
              })}
              {stateNPIs.length === 0 && <div style={{ padding: 12, textAlign: "center", fontSize: 10, color: T.textDim }}>No NPIs in this state</div>}
            </div>
          </div>
        )}
      </div>

      {/* Top states ranking */}
      <div style={{ marginTop: 16, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Top States by {metric === "npis" ? "NPI Count" : metric === "signals" ? "Signal Volume" : "Engagement"}</div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fill, minmax(140px, 1fr))", gap: 6 }}>
          {Object.entries(stateData).filter(([_, d]) => d.npis > 0).sort((a, b) => {
            const va = metric === "npis" ? a[1].npis : metric === "signals" ? a[1].signals : a[1].engagement;
            const vb = metric === "npis" ? b[1].npis : metric === "signals" ? b[1].signals : b[1].engagement;
            return vb - va;
          }).slice(0, 12).map(([st, d], i) => {
            const val = metric === "npis" ? d.npis : metric === "signals" ? d.signals : d.engagement;
            return (
              <div key={st} onClick={() => setSelectedState(st)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: T.radiusSm, cursor: "pointer", background: selectedState === st ? T.accentBg : T.bgAlt, border: `1px solid ${selectedState === st ? T.accentBorder : T.border}` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.textDim, fontFamily: T.mono, minWidth: 16 }}>#{i + 1}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{US_GEO[st]?.n || st}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.accentLight, fontFamily: T.mono, marginLeft: "auto" }}>{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════
// FEATURE 5: MULTI-BRAND CONFLICT RESOLUTION
// ═══════════════════════════════════════════
const initConflictRules = () => [
  { id: "CR-001", name: "Diabetes vs. CKD Overlap", brands: ["Mounjaro", "Farxiga"], rule: "priority", priorityOrder: ["Mounjaro", "Farxiga"], cooldownDays: 14, sovCap: { "Mounjaro": 60, "Farxiga": 40 }, status: "active" },
  { id: "CR-002", name: "Cardio-Renal Deconflict", brands: ["Repatha", "Farxiga"], rule: "round-robin", priorityOrder: [], cooldownDays: 7, sovCap: { "Repatha": 50, "Farxiga": 50 }, status: "active" },
];

function ConflictResolutionPanel({ npis, journeys, rules, onSaveRule, onDeleteRule }) {
  const mob = useIsMobile();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", brands: [], rule: "priority", priorityOrder: [], cooldownDays: 14, sovCap: {}, status: "active" });

  const allBrands = [...new Set(journeys.map(j => j.brand).filter(Boolean))];

  const conflicts = useMemo(() => {
    const npiJourneyMap = {};
    npis.forEach(n => {
      const j = journeys.find(jj => jj.id === n.journeyId);
      if (!j) return;
      if (!npiJourneyMap[n.npi]) npiJourneyMap[n.npi] = { npi: n, journeys: [] };
      npiJourneyMap[n.npi].journeys.push(j);
    });
    // Simulate: detect NPIs that could qualify for multiple journeys based on specialty overlap
    const multiQualified = [];
    npis.forEach(n => {
      const eligible = journeys.filter(j => j.status === "live");
      if (eligible.length > 1) {
        const brands = [...new Set(eligible.map(j => j.brand))];
        if (brands.length > 1) {
          multiQualified.push({ npi: n, eligibleJourneys: eligible, brands, currentJourney: journeys.find(j => j.id === n.journeyId) });
        }
      }
    });
    return multiQualified;
  }, [npis, journeys]);

  const startNew = () => { setForm({ name: "", brands: [], rule: "priority", priorityOrder: [], cooldownDays: 14, sovCap: {}, status: "active" }); setEditing("new"); };
  const startEdit = (r) => { setForm({ ...r }); setEditing(r); };

  const handleSave = () => {
    const r = { id: editing === "new" ? `CR-${Date.now()}` : editing.id, ...form };
    onSaveRule(r);
    setEditing(null);
  };

  const toggleBrand = (brand) => {
    setForm(f => {
      const brands = f.brands.includes(brand) ? f.brands.filter(b => b !== brand) : [...f.brands, brand];
      const sovCap = { ...f.sovCap };
      brands.forEach(b => { if (!sovCap[b]) sovCap[b] = Math.round(100 / brands.length); });
      Object.keys(sovCap).forEach(b => { if (!brands.includes(b)) delete sovCap[b]; });
      return { ...f, brands, priorityOrder: brands, sovCap };
    });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : editing ? "1fr 380px" : "1fr", gap: 16 }}>
      <div>
        {/* Conflict Detection Summary */}
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap: mob ? 6 : 10, marginBottom: 16 }}>
          <div style={{ background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: T.radius, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.red, fontFamily: T.mono }}>{conflicts.length}</div>
            <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase" }}>Multi-Brand Eligible NPIs</div>
          </div>
          <div style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: T.radius, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.green, fontFamily: T.mono }}>{rules.filter(r => r.status === "active").length}</div>
            <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase" }}>Active Conflict Rules</div>
          </div>
          <div style={{ background: T.amberBg, border: `1px solid ${T.amberBorder}`, borderRadius: T.radius, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.amber, fontFamily: T.mono }}>{allBrands.length}</div>
            <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase" }}>Active Brands</div>
          </div>
        </div>

        {/* Rules List */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Conflict Arbitration Rules</div>
          <Btn variant="primary" onClick={startNew}>+ New Rule</Btn>
        </div>

        {rules.map(r => (
          <div key={r.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 14, marginBottom: 8, cursor: "pointer" }} onClick={() => startEdit(r)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{r.name}</div>
              <Badge color={r.status === "active" ? T.green : T.textDim} bg={r.status === "active" ? T.greenBg : T.surfaceRaised} border={r.status === "active" ? T.greenBorder : T.border}>{r.status}</Badge>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              {r.brands.map(b => <Badge key={b} color={T.accentLight} bg={T.accentBg} border={T.accentBorder}>{b}</Badge>)}
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 10, color: T.textSecondary }}>
              <span>Strategy: <strong style={{ color: T.text }}>{r.rule === "priority" ? "Priority-Based" : r.rule === "round-robin" ? "Round-Robin" : "SOV Split"}</strong></span>
              <span>Cooldown: <strong style={{ color: T.text }}>{r.cooldownDays}d</strong></span>
              {r.rule === "priority" && r.priorityOrder.length > 0 && (
                <span>Order: {r.priorityOrder.map((b, i) => <span key={b} style={{ color: i === 0 ? T.green : T.textDim }}>{i > 0 ? " → " : ""}{b}</span>)}</span>
              )}
            </div>
            {/* SOV bar */}
            {Object.keys(r.sovCap).length > 0 && (
              <div style={{ display: "flex", marginTop: 8, height: 6, borderRadius: 3, overflow: "hidden", background: T.border }}>
                {Object.entries(r.sovCap).map(([brand, pct], i) => {
                  const colors = [T.accent, T.green, T.amber, T.purple, T.pink];
                  return <div key={brand} style={{ width: `${pct}%`, height: "100%", background: colors[i % colors.length] }} title={`${brand}: ${pct}%`} />;
                })}
              </div>
            )}
          </div>
        ))}

        {/* Conflict Matrix */}
        <div style={{ marginTop: 16, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Brand Overlap Matrix</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr><th style={{ padding: "6px 10px", textAlign: "left", color: T.textDim, fontSize: 9, borderBottom: `1px solid ${T.border}` }}></th>
                  {allBrands.map(b => <th key={b} style={{ padding: "6px 10px", textAlign: "center", color: T.textSecondary, fontSize: 9, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{b}</th>)}</tr>
              </thead>
              <tbody>
                {allBrands.map(b1 => (
                  <tr key={b1}>
                    <td style={{ padding: "6px 10px", fontWeight: 600, color: T.text, borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>{b1}</td>
                    {allBrands.map(b2 => {
                      if (b1 === b2) return <td key={b2} style={{ padding: "6px 10px", textAlign: "center", background: T.surfaceRaised, borderBottom: `1px solid ${T.border}`, color: T.textDim, fontSize: 10 }}>—</td>;
                      const overlap = npis.filter(n => { const j = journeys.find(jj => jj.id === n.journeyId); return j && (j.brand === b1 || j.brand === b2); }).length;
                      const hasRule = rules.some(r => r.brands.includes(b1) && r.brands.includes(b2));
                      return <td key={b2} style={{ padding: "6px 10px", textAlign: "center", borderBottom: `1px solid ${T.border}`, fontFamily: T.mono, fontWeight: 600, color: hasRule ? T.green : overlap > 0 ? T.amber : T.textDim, fontSize: 11 }}>
                        {overlap}{hasRule && <span style={{ fontSize: 8, marginLeft: 2 }}>✓</span>}
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Editor */}
      {editing && (
        <div style={{ background: T.surface, border: `1px solid ${T.borderLight}`, borderRadius: T.radiusLg, padding: 20, position: "sticky", top: 80 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{editing === "new" ? "New Rule" : "Edit Rule"}</div>
            <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div><label style={labelStyle}>Rule Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Diabetes vs. CKD Overlap" style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Brands in Conflict</label>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {allBrands.map(b => (
                  <span key={b} onClick={() => toggleBrand(b)} style={{ padding: "4px 10px", borderRadius: 10, cursor: "pointer", fontSize: 11, fontWeight: 600, background: form.brands.includes(b) ? T.accentBg : T.bgAlt, color: form.brands.includes(b) ? T.accentLight : T.textDim, border: `1px solid ${form.brands.includes(b) ? T.accentBorder : T.border}` }}>{b}</span>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Arbitration Strategy</label>
              <Select value={form.rule} onChange={v => setForm(f => ({ ...f, rule: v }))} options={[{ value: "priority", label: "Priority-Based (1st brand wins)" }, { value: "round-robin", label: "Round-Robin (alternate)" }, { value: "sov", label: "SOV Split (% allocation)" }]} />
            </div>
            {form.rule === "priority" && form.brands.length > 1 && (
              <div>
                <label style={labelStyle}>Priority Order (drag to reorder)</label>
                {form.priorityOrder.map((b, i) => (
                  <div key={b} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 8px", marginBottom: 2, background: i === 0 ? T.greenBg : T.bgAlt, borderRadius: T.radiusSm, border: `1px solid ${i === 0 ? T.greenBorder : T.border}` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? T.green : T.textDim, fontFamily: T.mono }}>#{i + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{b}</span>
                    {i > 0 && <button onClick={() => { const o = [...form.priorityOrder]; [o[i-1], o[i]] = [o[i], o[i-1]]; setForm(f => ({ ...f, priorityOrder: o })); }} style={{ marginLeft: "auto", background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 10 }}>▲</button>}
                  </div>
                ))}
              </div>
            )}
            {form.rule === "sov" && form.brands.length > 0 && (
              <div>
                <label style={labelStyle}>Share-of-Voice Caps</label>
                {form.brands.map(b => (
                  <div key={b} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text, minWidth: 80 }}>{b}</span>
                    <input type="range" min="0" max="100" value={form.sovCap[b] || 50} onChange={e => setForm(f => ({ ...f, sovCap: { ...f.sovCap, [b]: parseInt(e.target.value) } }))} style={{ flex: 1 }} />
                    <span style={{ fontSize: 11, fontFamily: T.mono, color: T.accentLight, minWidth: 32, textAlign: "right" }}>{form.sovCap[b] || 50}%</span>
                  </div>
                ))}
              </div>
            )}
            <div><label style={labelStyle}>Cooldown (days between brand switches)</label><input type="number" min="0" value={form.cooldownDays} onChange={e => setForm(f => ({ ...f, cooldownDays: parseInt(e.target.value) || 0 }))} style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Status</label>
              <Select value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={["active", "paused", "draft"]} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="primary" onClick={handleSave} disabled={!form.name.trim() || form.brands.length < 2}>💾 {editing === "new" ? "Create" : "Update"} Rule</Btn>
              {editing !== "new" && <Btn variant="danger" onClick={() => { onDeleteRule(editing.id); setEditing(null); }}>Delete</Btn>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// FEATURE 6: A/B JOURNEY EXPERIMENTATION
// ═══════════════════════════════════════════
const initExperiments = () => [
  {
    id: "EXP-001", name: "HbA1c — Email-First vs Banner-First", journeyId: "J-001", status: "running", createdAt: "2026-02-08",
    variants: [
      { id: "A", label: "Control (Banner-First)", split: 50, journeyOverride: null, results: { npis: 64, signals: 171, engRate: 68, openRate: 38, ctr: 2.8, repActioned: 62 }},
      { id: "B", label: "Email-First Variant", split: 50, journeyOverride: { steps: [
        { id: "s1", day: 0, channel: "Triggered Email", action: "Clinical data summary — lead with email" },
        { id: "s2", day: 2, channel: "Programmatic Banner", action: "Awareness banner follow-up" },
        { id: "s3", day: 5, channel: "Endemic Banner", action: "Branded point-of-care" },
        { id: "s4", day: 7, channel: "Rep Alert", action: "Field rep talking points" },
      ]}, results: { npis: 64, signals: 165, engRate: 74, openRate: 44, ctr: 2.3, repActioned: 58 }},
    ],
    durationDays: 30, daysSoFar: 18,
  },
];

function zScore(p1, n1, p2, n2) {
  const p = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
  return se > 0 ? (p1 - p2) / se : 0;
}

function ABExperimentPanel({ experiments, journeys, npis, onSave, onDelete }) {
  const mob = useIsMobile();
  const [expandedId, setExpandedId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", journeyId: "", durationDays: 30 });

  const createExperiment = () => {
    const j = journeys.find(jj => jj.id === newForm.journeyId);
    if (!j || !newForm.name.trim()) return;
    const exp = {
      id: `EXP-${Date.now()}`, name: newForm.name, journeyId: j.id, status: "draft", createdAt: new Date().toISOString().split("T")[0],
      variants: [
        { id: "A", label: "Control", split: 50, journeyOverride: null, results: { npis: 0, signals: 0, engRate: 0, openRate: 0, ctr: 0, repActioned: 0 }},
        { id: "B", label: "Variant B", split: 50, journeyOverride: { steps: [...j.steps.map(s => ({ ...s }))] }, results: { npis: 0, signals: 0, engRate: 0, openRate: 0, ctr: 0, repActioned: 0 }},
      ],
      durationDays: newForm.durationDays, daysSoFar: 0,
    };
    onSave(exp);
    setShowNew(false);
    setNewForm({ name: "", journeyId: "", durationDays: 30 });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Journey Experiments</div>
        <Btn variant="primary" onClick={() => setShowNew(!showNew)}>+ New Experiment</Btn>
      </div>

      {showNew && (
        <div style={{ background: T.surface, border: `1px solid ${T.purpleBorder}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 120px auto", gap: 10, alignItems: "end" }}>
            <div><label style={labelStyle}>Experiment Name</label><input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Email-First vs Banner-First" style={inputStyle} /></div>
            <div><label style={labelStyle}>Base Journey</label><Select value={newForm.journeyId} onChange={v => setNewForm(f => ({ ...f, journeyId: v }))} options={[{ value: "", label: "Select..." }, ...journeys.map(j => ({ value: j.id, label: `${j.name} (${j.brand})` }))]} /></div>
            <div><label style={labelStyle}>Duration (days)</label><input type="number" min="7" value={newForm.durationDays} onChange={e => setNewForm(f => ({ ...f, durationDays: parseInt(e.target.value) || 30 }))} style={inputStyle} /></div>
            <Btn variant="primary" onClick={createExperiment} disabled={!newForm.name.trim() || !newForm.journeyId}>Create</Btn>
          </div>
        </div>
      )}

      {experiments.map(exp => {
        const j = journeys.find(jj => jj.id === exp.journeyId);
        const expanded = expandedId === exp.id;
        const a = exp.variants[0]?.results || {};
        const b = exp.variants[1]?.results || {};
        const metrics = ["engRate", "openRate", "ctr", "repActioned"];
        const metricLabels = { engRate: "Engagement Rate", openRate: "Email Open Rate", ctr: "Banner CTR", repActioned: "Rep Actioned %" };

        return (
          <div key={exp.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ padding: 16, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => setExpandedId(expanded ? null : exp.id)}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{exp.name}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>{j?.name || exp.journeyId} · {exp.daysSoFar}/{exp.durationDays}d</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge color={exp.status === "running" ? T.green : exp.status === "completed" ? T.accent : T.textDim} bg={exp.status === "running" ? T.greenBg : exp.status === "completed" ? T.accentBg : T.surfaceRaised} border={exp.status === "running" ? T.greenBorder : exp.status === "completed" ? T.accentBorder : T.border}>{exp.status}</Badge>
                {/* Progress */}
                <div style={{ width: 60, height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min((exp.daysSoFar / exp.durationDays) * 100, 100)}%`, height: "100%", borderRadius: 2, background: T.accent }} />
                </div>
                <span style={{ fontSize: 14, color: T.textDim, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
              </div>
            </div>

            {expanded && (
              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.border}` }}>
                {/* Variant comparison */}
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 8 : 12, marginTop: 14, marginBottom: 14 }}>
                  {exp.variants.map(v => (
                    <div key={v.id} style={{ background: T.bgAlt, border: `1px solid ${v.id === "A" ? T.accentBorder : T.purpleBorder}`, borderRadius: T.radius, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: v.id === "A" ? T.accent : T.purple, marginRight: 6 }}>{v.id}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{v.label}</span>
                        </div>
                        <Badge color={T.textDim} bg={T.surfaceRaised} border={T.border}>{v.split}% split</Badge>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 6 }}>
                        <div style={{ textAlign: "center", padding: 6, background: T.surfaceRaised, borderRadius: T.radiusSm }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{v.results.npis}</div>
                          <div style={{ fontSize: 8, color: T.textDim, textTransform: "uppercase" }}>NPIs</div>
                        </div>
                        <div style={{ textAlign: "center", padding: 6, background: T.surfaceRaised, borderRadius: T.radiusSm }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{v.results.signals}</div>
                          <div style={{ fontSize: 8, color: T.textDim, textTransform: "uppercase" }}>Signals</div>
                        </div>
                      </div>
                      {/* Step sequence for variant */}
                      {v.journeyOverride?.steps && (
                        <div style={{ marginTop: 8 }}>
                          {v.journeyOverride.steps.map((s, i) => {
                            const ch = CHANNELS[s.channel] || { color: T.textDim };
                            return <div key={i} style={{ fontSize: 9, padding: "2px 0", color: T.textSecondary }}><span style={{ color: ch.color, fontWeight: 600 }}>D{s.day}</span> {s.channel}</div>;
                          })}
                        </div>
                      )}
                      {!v.journeyOverride && j && (
                        <div style={{ marginTop: 8 }}>
                          {j.steps.slice(0, 4).map((s, i) => {
                            const ch = CHANNELS[s.channel] || { color: T.textDim };
                            return <div key={i} style={{ fontSize: 9, padding: "2px 0", color: T.textSecondary }}><span style={{ color: ch.color, fontWeight: 600 }}>D{s.day}</span> {s.channel}</div>;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Metric comparison bars */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginBottom: 8 }}>METRIC COMPARISON</div>
                  {metrics.map(m => {
                    const va = a[m] || 0, vb = b[m] || 0;
                    const winner = va > vb ? "A" : vb > va ? "B" : "tie";
                    const lift = va > 0 ? (((vb - va) / va) * 100).toFixed(1) : "—";
                    const z = zScore(va / 100, a.npis || 100, vb / 100, b.npis || 100);
                    const sig = Math.abs(z) > 1.96;
                    return (
                      <div key={m} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: T.textSecondary }}>{metricLabels[m]}</span>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: lift > 0 ? T.green : lift < 0 ? T.red : T.textDim, fontFamily: T.mono }}>{lift > 0 ? "+" : ""}{lift}%</span>
                            {sig && <Badge color={T.green} bg={T.greenBg} border={T.greenBorder}>p&lt;0.05</Badge>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <span style={{ fontSize: 9, fontWeight: 600, color: T.accent, minWidth: 20 }}>A</span>
                          <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${va}%`, height: "100%", borderRadius: 3, background: winner === "A" ? T.accent : T.accentBg }} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: T.mono, color: T.text, minWidth: 30, textAlign: "right" }}>{va}%</span>
                        </div>
                        <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 2 }}>
                          <span style={{ fontSize: 9, fontWeight: 600, color: T.purple, minWidth: 20 }}>B</span>
                          <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${vb}%`, height: "100%", borderRadius: 3, background: winner === "B" ? T.purple : T.purpleBg }} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: T.mono, color: T.text, minWidth: 30, textAlign: "right" }}>{vb}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {exp.status === "draft" && <Btn variant="primary" onClick={() => onSave({ ...exp, status: "running" })} style={{ background: T.green }}>▶ Start Experiment</Btn>}
                  {exp.status === "running" && <Btn variant="secondary" onClick={() => onSave({ ...exp, status: "completed" })}>⏹ End Experiment</Btn>}
                  <Btn variant="danger" onClick={() => onDelete(exp.id)}>Delete</Btn>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {experiments.length === 0 && !showNew && (
        <div style={{ textAlign: "center", padding: 40, color: T.textDim }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🧪</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>No experiments yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Split-test journey variants to find the optimal channel sequence and timing</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// FEATURE 7: CHANNEL FATIGUE MODELING
// ═══════════════════════════════════════════
function ChannelFatiguePanel({ npis, journeys }) {
  const mob = useIsMobile();
  const [selectedNPI, setSelectedNPI] = useState(null);
  const [viewMode, setViewMode] = useState("overview"); // overview | npi

  // Generate simulated fatigue data per channel
  const fatigueData = useMemo(() => {
    const channels = Object.keys(CHANNELS);
    return channels.map(ch => {
      const cfg = CHANNELS[ch];
      const baseDecay = ch.includes("Email") ? 0.06 : ch.includes("Banner") ? 0.04 : 0.02;
      const weeks = Array.from({ length: 12 }, (_, w) => {
        const base = ch.includes("Email") ? 42 : ch.includes("Rep") ? 65 : ch.includes("Endemic") ? 3.2 : 2.8;
        const decayed = base * Math.exp(-baseDecay * w);
        return { week: w + 1, rate: Math.round(decayed * 10) / 10, base };
      });
      const currentRate = weeks[weeks.length - 1].rate;
      const halfLife = Math.round(Math.log(2) / baseDecay);
      const fatigueLevel = currentRate / weeks[0].rate;
      return { channel: ch, cfg, weeks, currentRate, halfLife, fatigueLevel, baseDecay };
    });
  }, []);

  // Per-NPI fatigue profiles
  const npiFatigue = useMemo(() => {
    return npis.slice(0, 20).map(n => {
      const j = journeys.find(jj => jj.id === n.journeyId);
      const channels = {};
      Object.keys(CHANNELS).forEach(ch => {
        const touchCount = j ? j.steps.filter(s => s.channel === ch).length : 0;
        const baseEng = ch.includes("Email") ? 40 : ch.includes("Rep") ? 60 : 3;
        const fatigueFactor = Math.max(0.3, 1 - (touchCount * 0.15 + (100 - n.engScore) * 0.003));
        channels[ch] = {
          touchCount,
          currentEng: Math.round(baseEng * fatigueFactor * 10) / 10,
          fatigueFactor: Math.round(fatigueFactor * 100),
          recommendation: fatigueFactor < 0.5 ? "reduce" : fatigueFactor < 0.7 ? "maintain" : "increase",
        };
      });
      return { ...n, channels };
    });
  }, [npis, journeys]);

  const selectedData = selectedNPI ? npiFatigue.find(n => n.npi === selectedNPI) : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <Select value={viewMode} onChange={setViewMode} options={[{ value: "overview", label: "📊 Channel Overview" }, { value: "npi", label: "👤 Per-NPI Analysis" }]} style={{ width: 200 }} />
      </div>

      {viewMode === "overview" && (
        <div>
          {/* Channel fatigue cards with decay curves */}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
            {fatigueData.map(fd => {
              const healthColor = fd.fatigueLevel > 0.7 ? T.green : fd.fatigueLevel > 0.4 ? T.amber : T.red;
              const healthLabel = fd.fatigueLevel > 0.7 ? "Healthy" : fd.fatigueLevel > 0.4 ? "Fatiguing" : "Exhausted";
              return (
                <div key={fd.channel} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 16, borderLeft: `4px solid ${fd.cfg.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 14, marginRight: 6 }}>{fd.cfg.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{fd.channel}</span>
                    </div>
                    <Badge color={healthColor} bg={`${healthColor}18`} border={`${healthColor}40`}>{healthLabel}</Badge>
                  </div>

                  {/* Mini decay curve SVG */}
                  <svg viewBox="0 0 200 60" style={{ width: "100%", height: 60, marginBottom: 8 }}>
                    <defs><linearGradient id={`grad-${fd.channel.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={fd.cfg.color} stopOpacity="0.3" /><stop offset="100%" stopColor={fd.cfg.color} stopOpacity="0" /></linearGradient></defs>
                    {/* Area */}
                    <path d={`M 0 ${55 - (fd.weeks[0].rate / fd.weeks[0].base) * 50} ${fd.weeks.map((w, i) => `L ${(i / 11) * 200} ${55 - (w.rate / w.base) * 50}`).join(" ")} L 200 55 L 0 55 Z`} fill={`url(#grad-${fd.channel.replace(/\s/g, "")})`} />
                    {/* Line */}
                    <polyline points={fd.weeks.map((w, i) => `${(i / 11) * 200},${55 - (w.rate / w.base) * 50}`).join(" ")} fill="none" stroke={fd.cfg.color} strokeWidth="2" />
                    {/* Threshold line */}
                    <line x1="0" y1="30" x2="200" y2="30" stroke={T.amber} strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />
                    <text x="195" y="28" textAnchor="end" fill={T.textDim} fontSize="6" fontFamily="IBM Plex Mono">50% threshold</text>
                  </svg>

                  <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr", gap: 6, fontSize: 10 }}>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: fd.cfg.color, fontFamily: T.mono }}>{fd.currentRate}%</div><div style={{ color: T.textDim, fontSize: 8 }}>Current Rate</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{fd.halfLife}w</div><div style={{ color: T.textDim, fontSize: 8 }}>Half-life</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: healthColor, fontFamily: T.mono }}>{Math.round(fd.fatigueLevel * 100)}%</div><div style={{ color: T.textDim, fontSize: 8 }}>Health</div></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendation engine */}
          <div style={{ marginTop: 16, background: T.surface, border: `1px solid ${T.amberBorder}`, borderRadius: T.radiusLg, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 10 }}>⚡ Auto-Reweight Recommendations</div>
            <div style={{ display: "grid", gap: 6 }}>
              {fatigueData.filter(fd => fd.fatigueLevel < 0.6).map(fd => (
                <div key={fd.channel} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: T.bgAlt, borderRadius: T.radiusSm }}>
                  <span style={{ fontSize: 14 }}>{fd.cfg.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.text, flex: 1 }}>{fd.channel}</span>
                  <span style={{ fontSize: 10, color: T.red }}>Health: {Math.round(fd.fatigueLevel * 100)}%</span>
                  <span style={{ fontSize: 10, color: T.amber, fontWeight: 600 }}>→ Reduce frequency by {Math.round((1 - fd.fatigueLevel) * 50)}%</span>
                </div>
              ))}
              {fatigueData.filter(fd => fd.fatigueLevel >= 0.6).length === fatigueData.length && (
                <div style={{ padding: 12, textAlign: "center", color: T.green, fontSize: 11 }}>✅ All channels are within healthy engagement thresholds</div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === "npi" && (
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : selectedData ? "1fr 400px" : "1fr", gap: 16 }}>
          {/* NPI list with fatigue indicators */}
          <div>
            <div style={{ display: "grid", gap: 4 }}>
              {npiFatigue.map(n => {
                const worstChannel = Object.entries(n.channels).reduce((w, [ch, d]) => d.fatigueFactor < (w.f || 999) ? { ch, f: d.fatigueFactor } : w, {});
                return (
                  <div key={n.npi} onClick={() => setSelectedNPI(n.npi === selectedNPI ? null : n.npi)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: n.npi === selectedNPI ? T.accentBg : T.surface, border: `1px solid ${n.npi === selectedNPI ? T.accentBorder : T.border}`, borderRadius: T.radius, cursor: "pointer" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{n.name}</div>
                      <div style={{ fontSize: 10, color: T.textDim }}>{n.specialty} · D{n.decile} · Eng: {n.engScore}</div>
                    </div>
                    {/* Channel fatigue mini-bars */}
                    <div style={{ display: "flex", gap: 3 }}>
                      {Object.entries(n.channels).slice(0, 4).map(([ch, d]) => {
                        const c = d.fatigueFactor > 70 ? T.green : d.fatigueFactor > 40 ? T.amber : T.red;
                        return <div key={ch} title={`${ch}: ${d.fatigueFactor}%`} style={{ width: 4, height: 20, borderRadius: 2, background: c, opacity: 0.8 }} />;
                      })}
                    </div>
                    {worstChannel.ch && worstChannel.f < 50 && (
                      <Badge color={T.red} bg={T.redBg} border={T.redBorder}>{CHANNELS[worstChannel.ch]?.abbr} fatigued</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected NPI detail */}
          {selectedData && (
            <div style={{ background: T.surface, border: `1px solid ${T.borderLight}`, borderRadius: T.radiusLg, padding: 18, position: "sticky", top: 80 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{selectedData.name}</div>
              <div style={{ fontSize: 10, color: T.textDim, marginBottom: 14 }}>{selectedData.specialty} · D{selectedData.decile} · Eng: {selectedData.engScore}</div>

              <div style={{ display: "grid", gap: 10 }}>
                {Object.entries(selectedData.channels).map(([ch, d]) => {
                  const cfg = CHANNELS[ch] || {};
                  const color = d.fatigueFactor > 70 ? T.green : d.fatigueFactor > 40 ? T.amber : T.red;
                  const recColor = d.recommendation === "increase" ? T.green : d.recommendation === "maintain" ? T.amber : T.red;
                  const recIcon = d.recommendation === "increase" ? "▲" : d.recommendation === "maintain" ? "●" : "▼";
                  return (
                    <div key={ch} style={{ padding: 10, background: T.bgAlt, borderRadius: T.radius, borderLeft: `3px solid ${cfg.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{cfg.icon} {ch}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: recColor }}>{recIcon} {d.recommendation}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div><div style={{ fontSize: 9, color: T.textDim }}>Touches</div><div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{d.touchCount}</div></div>
                        <div><div style={{ fontSize: 9, color: T.textDim }}>Eng Rate</div><div style={{ fontSize: 13, fontWeight: 700, color: cfg.color, fontFamily: T.mono }}>{d.currentEng}%</div></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: T.textDim }}>Health</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${d.fatigueFactor}%`, height: "100%", borderRadius: 3, background: color }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: T.mono }}>{d.fatigueFactor}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// FEATURE 8: REP TERRITORY DASHBOARD
// ═══════════════════════════════════════════
function RepTerritoryDashboard({ npis, journeys, assets }) {
  const mob = useIsMobile();
  const [territory, setTerritory] = useState("all");
  const [sortBy, setSortBy] = useState("priority"); // priority | engagement | signal
  const [expandedNPI, setExpandedNPI] = useState(null);

  const territories = useMemo(() => {
    const t = {};
    npis.forEach(n => {
      const st = n.state || "Unknown";
      if (!t[st]) t[st] = [];
      t[st].push(n);
    });
    return t;
  }, [npis]);

  const filteredNPIs = territory === "all" ? npis : (territories[territory] || []);

  const sorted = useMemo(() => {
    const arr = [...filteredNPIs].filter(n => n.status === "active");
    if (sortBy === "priority") arr.sort((a, b) => (b.decile * 10 + (100 - b.engScore) * 0.5) - (a.decile * 10 + (100 - a.engScore) * 0.5));
    else if (sortBy === "engagement") arr.sort((a, b) => a.engScore - b.engScore); // Lowest first = most needs attention
    else arr.sort((a, b) => (b.signalTime || "").localeCompare(a.signalTime || ""));
    return arr;
  }, [filteredNPIs, sortBy]);

  return (
    <div>
      {/* Territory overview */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(100px, 1fr))", gap: 6, marginBottom: 16 }}>
        <div onClick={() => setTerritory("all")} style={{ padding: "10px 8px", borderRadius: T.radius, cursor: "pointer", textAlign: "center", background: territory === "all" ? T.accentBg : T.surface, border: `1px solid ${territory === "all" ? T.accentBorder : T.border}` }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: territory === "all" ? T.accentLight : T.text, fontFamily: T.mono }}>{npis.filter(n => n.status === "active").length}</div>
          <div style={{ fontSize: 9, color: T.textDim }}>All Active</div>
        </div>
        {Object.entries(territories).sort((a, b) => b[1].length - a[1].length).map(([st, list]) => {
          const active = list.filter(n => n.status === "active").length;
          return (
            <div key={st} onClick={() => setTerritory(st)} style={{ padding: "10px 8px", borderRadius: T.radius, cursor: "pointer", textAlign: "center", background: territory === st ? T.accentBg : T.surface, border: `1px solid ${territory === st ? T.accentBorder : T.border}` }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: territory === st ? T.accentLight : T.text, fontFamily: T.mono }}>{active}</div>
              <div style={{ fontSize: 9, color: T.textDim }}>{US_GEO[st]?.n || st}</div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <Select value={sortBy} onChange={setSortBy} options={[{ value: "priority", label: "🎯 Priority (High Decile + Low Eng)" }, { value: "engagement", label: "📉 Needs Attention (Low Eng First)" }, { value: "signal", label: "📡 Most Recent Signal" }]} style={{ width: 280 }} />
        <span style={{ fontSize: 11, color: T.textDim, fontFamily: T.mono, marginLeft: "auto" }}>{sorted.length} active HCPs · {territory === "all" ? "All territories" : US_GEO[territory]?.n || territory}</span>
      </div>

      {/* Call prep cards */}
      <div style={{ display: "grid", gap: 8 }}>
        {sorted.map((n, i) => {
          const j = journeys.find(jj => jj.id === n.journeyId);
          const expanded = expandedNPI === n.npi;
          const step = j?.steps?.[Math.min(n.currentStep, (j?.steps?.length || 1) - 1)];
          const ch = step ? (CHANNELS[step.channel] || {}) : {};
          const priorityScore = n.decile * 10 + (100 - n.engScore) * 0.5;
          const urgency = priorityScore > 80 ? { label: "HIGH", color: T.red } : priorityScore > 50 ? { label: "MED", color: T.amber } : { label: "LOW", color: T.green };
          const stepAsset = assets?.find(a => a.journeyId === n.journeyId && a.stepId === step?.id);

          return (
            <div key={n.npi} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, borderLeft: `4px solid ${ch.color || T.border}`, overflow: "hidden" }}>
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }} onClick={() => setExpandedNPI(expanded ? null : n.npi)}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.textDim, fontFamily: T.mono, minWidth: 24 }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{n.name}</div>
                  <div style={{ fontSize: 10, color: T.textDim }}>{n.specialty} · NPI {n.npi} · D{n.decile} · {n.state}</div>
                </div>
                <Badge color={urgency.color} bg={`${urgency.color}18`} border={`${urgency.color}40`}>{urgency.label}</Badge>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: T.textDim }}>Next</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: ch.color || T.textSecondary }}>{n.nextTouch}</div>
                </div>
                <span style={{ fontSize: 14, color: T.textDim, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
              </div>

              {/* Expanded call prep */}
              {expanded && (
                <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 8 : 12, marginTop: 0, paddingTop: 14 }}>
                  {/* Left: Context */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginBottom: 8 }}>📋 CALL PREP</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ padding: "8px 10px", background: T.bgAlt, borderRadius: T.radiusSm }}>
                        <div style={{ fontSize: 9, color: T.textDim }}>LAST SIGNAL</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.accentLight }}>{n.lastSignal} <span style={{ color: T.textDim, fontWeight: 400 }}>at {n.signalTime}</span></div>
                      </div>
                      <div style={{ padding: "8px 10px", background: T.bgAlt, borderRadius: T.radiusSm }}>
                        <div style={{ fontSize: 9, color: T.textDim }}>ACTIVE JOURNEY</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{j?.name || "None"}</div>
                        <div style={{ fontSize: 10, color: T.textDim }}>Step {n.currentStep + 1} of {j?.steps?.length || 0} · {j?.brand}</div>
                      </div>
                      <div style={{ padding: "8px 10px", background: T.bgAlt, borderRadius: T.radiusSm }}>
                        <div style={{ fontSize: 9, color: T.textDim }}>ENGAGEMENT</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${n.engScore}%`, height: "100%", borderRadius: 3, background: n.engScore > 70 ? T.green : n.engScore > 40 ? T.amber : T.red }} />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: n.engScore > 70 ? T.green : n.engScore > 40 ? T.amber : T.red, fontFamily: T.mono }}>{n.engScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Talking points + asset */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginBottom: 8 }}>💬 SUGGESTED TALKING POINTS</div>
                    <div style={{ padding: 10, background: T.bgAlt, borderRadius: T.radiusSm, fontSize: 11, color: T.textSecondary, lineHeight: 1.7, marginBottom: 8 }}>
                      {j?.condition && <div>• Patient presented with <strong style={{ color: T.text }}>{j.condition}</strong></div>}
                      {n.lastSignal && <div>• Latest lab: <strong style={{ color: T.accentLight }}>{n.lastSignal}</strong></div>}
                      {j?.brand && <div>• Discuss <strong style={{ color: T.text }}>{j.brand}</strong> clinical evidence</div>}
                      {n.engScore < 50 && <div>• <span style={{ color: T.amber }}>Low engagement</span> — consider new approach or MSL referral</div>}
                      {n.engScore >= 70 && <div>• <span style={{ color: T.green }}>High engagement</span> — reinforce with formulary access support</div>}
                    </div>
                    {stepAsset && (
                      <div style={{ padding: 8, background: T.surfaceRaised, borderRadius: T.radiusSm, display: "flex", alignItems: "center", gap: 8 }}>
                        <AssetThumb asset={stepAsset} size={28} onClick={() => {}} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: T.text }}>{stepAsset.name}</div>
                          <div style={{ fontSize: 9, color: T.textDim }}>Leave-behind: {ASSET_TYPES[stepAsset.type]?.label}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const mob = useIsMobile();
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
                <div key={field.key} style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "140px 1fr 160px", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: T.radius, background: isMapped ? T.surfaceRaised : T.bgAlt, border: `1px solid ${isMapped ? T.greenBorder : field.required ? T.redBorder : T.border}` }}>
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
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "32px 90px 140px 90px 44px 44px 1fr", gap: 4, padding: "7px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>#</span><span>NPI</span><span>Name</span><span>Specialty</span><span>State</span><span>Dec.</span><span>Status</span>
            </div>
            {pagedRows.map((v, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "32px 90px 140px 90px 44px 44px 1fr", gap: 4, padding: "7px 12px",
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

          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3, 1fr)", gap: mob ? 6 : 12, maxWidth: 400, margin: "0 auto 24px" }}>
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
  const mob = useIsMobile();
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
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "380px 1fr", gap: 16, alignItems: "start" }}>
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
                  <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 340px", gap: 16, alignItems: "start" }}>
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
                    <div key={field.key} style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "140px 1fr 200px", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: T.radius, background: isMapped ? T.surfaceRaised : T.bgAlt, border: `1px solid ${isMapped ? T.greenBorder : field.required ? T.redBorder : T.border}` }}>
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
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "30px 90px 120px 80px 60px 1fr", gap: 4, padding: "7px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: "uppercase" }}>
                  <span>#</span><span>NPI</span><span>Name</span><span>Biomarker</span><span>Value</span><span>Status</span>
                </div>
                {bPagedRows.map((v, i) => {
                  const bmObj = v.biomarkerId ? BIOMARKERS.find(b => b.id === v.biomarkerId) : null;
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "30px 90px 120px 80px 60px 1fr", gap: 4, padding: "7px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 11, background: !v.valid ? T.redBg : "transparent", borderLeft: `3px solid ${!v.valid ? T.red : v.warnings.length > 0 ? T.amber : "transparent"}` }}>
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

              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3, 1fr)", gap: mob ? 6 : 12, maxWidth: 500, margin: "0 auto 20px" }}>
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
  const mob = useIsMobile();
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
  const [segments, setSegments] = useState(initSegments);
  const [conflictRules, setConflictRules] = useState(initConflictRules);
  const [experiments, setExperiments] = useState(initExperiments);

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

  // Segment CRUD
  const saveSegment = useCallback((seg) => setSegments(s => {
    const idx = s.findIndex(x => x.id === seg.id);
    if (idx >= 0) { const u = [...s]; u[idx] = seg; return u; }
    return [...s, seg];
  }), []);
  const deleteSegment = useCallback((id) => setSegments(s => s.filter(x => x.id !== id)), []);

  // Conflict rules CRUD
  const saveConflictRule = useCallback((rule) => setConflictRules(r => {
    const idx = r.findIndex(x => x.id === rule.id);
    if (idx >= 0) { const u = [...r]; u[idx] = rule; return u; }
    return [...r, rule];
  }), []);
  const deleteConflictRule = useCallback((id) => setConflictRules(r => r.filter(x => x.id !== id)), []);

  // Experiment CRUD
  const saveExperiment = useCallback((exp) => setExperiments(e => {
    const idx = e.findIndex(x => x.id === exp.id);
    if (idx >= 0) { const u = [...e]; u[idx] = exp; return u; }
    return [...e, exp];
  }), []);
  const deleteExperiment = useCallback((id) => setExperiments(e => e.filter(x => x.id !== id)), []);

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
    <div style={{ fontFamily: T.sans, background: T.bg, color: T.text, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`@import url('${FONT_LINK}');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { overflow-x: hidden; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.borderLight}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.textDim}; }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        input:focus, select:focus { border-color: ${T.borderFocus} !important; outline: none; }
        input::placeholder { color: ${T.textDim}; }
        @media (max-width: 768px) {
          table { font-size: 11px !important; }
          textarea, input, select { font-size: 16px !important; }
          button { min-height: 36px; }
        }
      `}</style>

      {/* ─── HEADER ─── */}
      <header style={{ borderBottom: `1px solid ${T.border}`, padding: mob ? "10px 12px" : "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: `${T.bg}f0`, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: mob ? 8 : 12 }}>
          <div style={{ width: mob ? 26 : 30, height: mob ? 26 : 30, borderRadius: 7, background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: mob ? 11 : 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>⚡</div>
          <div>
            <div style={{ fontSize: mob ? 13 : 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Orchéstra™</div>
            {!mob && <div style={{ fontSize: 9, color: T.textDim, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>Signal-to-Script™ HCP Orchestration</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: mob ? 8 : 14 }}>
          <Btn variant="primary" onClick={() => setShowBuilder("new")} style={mob ? { fontSize: 10, padding: "5px 10px" } : {}}>{mob ? "+" : "+ New Journey"}</Btn>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}`, animation: "pulseGlow 2s ease infinite" }} />
            <span style={{ fontSize: 10, color: T.green, fontWeight: 600, fontFamily: T.mono }}>LIVE</span>
          </span>
        </div>
      </header>

      {/* ─── TABS ─── */}
      <div style={{ padding: mob ? "0 8px" : "0 24px", background: T.bg }}>
        <Tabs active={tab} onChange={setTab} groups={[
          { label: "Operate", items: [
            { key: "dashboard", label: "Command Center" },
            { key: "trigger", label: "⚡ Trigger" },
            { key: "livefeed", label: "Live Feed" },
          ]},
          { label: "Build", items: [
            { key: "journeys", label: "Journeys", count: journeys.length },
            { key: "nlbuilder", label: "🧠 AI Builder" },
            { key: "experiments", label: "🧪 A/B Tests", count: experiments.length },
          ]},
          { label: "Content", items: [
            { key: "assets", label: "🎨 Assets", count: assets.length },
            { key: "mlr", label: "⚖️ MLR" },
          ]},
          { label: "Audience", items: [
            { key: "npis", label: "NPI Targeting", count: npis.length },
            { key: "segments", label: "🎯 Segments", count: segments.length },
            { key: "geomap", label: "🗺 Heatmap" },
            { key: "fatigue", label: "📉 Fatigue" },
            { key: "repdash", label: "👤 Rep Dash" },
          ]},
          { label: "Governance", items: [
            { key: "conflicts", label: "⚖️ Conflicts", count: conflictRules.length },
          ]},
        ]} />
      </div>

      {/* ─── CONTENT ─── */}
      <main style={{ padding: mob ? "12px 10px 40px" : "18px 24px 40px", maxWidth: 1440, margin: "0 auto" }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mob ? 8 : 12, marginBottom: 18 }}>
              <MetricCard label="Lab Signals Today" value={metrics.signals.toLocaleString()} delta="+14.2%" up icon="⚡" delay={0} />
              <MetricCard label="Live Journeys" value={String(metrics.activeJourneys)} delta="+2" up icon="🔄" delay={80} />
              <MetricCard label="Touchpoints Delivered" value={metrics.touchpoints.toLocaleString()} delta="+18.7%" up icon="📡" delay={160} />
              <MetricCard label="NPIs Active" value={metrics.totalNPIs.toLocaleString()} delta="+11.5%" up icon="🎯" delay={240} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 10 : 14 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2, 1fr)" : `repeat(${channelPerf.length}, 1fr)`, gap: 8 }}>
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

        {/* ═══ AI JOURNEY BUILDER ═══ */}
        {tab === "nlbuilder" && (
          <NLJourneyBuilder
            journeys={journeys}
            onCreateJourney={(j) => {
              saveJourney(j);
              setTab("journeys");
            }}
          />
        )}

        {/* ═══ MLR COMPLIANCE ═══ */}
        {tab === "mlr" && (
          <MLRPanel
            assets={assets}
            onUpdate={updateAsset}
            onPreview={setAssetPreview}
          />
        )}

        {/* ═══ SEGMENTS ═══ */}
        {tab === "segments" && (
          <SegmentBuilder
            npis={npis}
            segments={segments}
            onSave={saveSegment}
            onDelete={deleteSegment}
            journeys={journeys}
          />
        )}

        {/* ═══ GEO HEATMAP ═══ */}
        {tab === "geomap" && (
          <GeoHeatmap
            npis={npis}
            journeys={journeys}
          />
        )}

        {/* ═══ CONFLICT RESOLUTION ═══ */}
        {tab === "conflicts" && (
          <ConflictResolutionPanel
            npis={npis}
            journeys={journeys}
            rules={conflictRules}
            onSaveRule={saveConflictRule}
            onDeleteRule={deleteConflictRule}
          />
        )}

        {/* ═══ A/B EXPERIMENTS ═══ */}
        {tab === "experiments" && (
          <ABExperimentPanel
            experiments={experiments}
            journeys={journeys}
            npis={npis}
            onSave={saveExperiment}
            onDelete={deleteExperiment}
          />
        )}

        {/* ═══ CHANNEL FATIGUE ═══ */}
        {tab === "fatigue" && (
          <ChannelFatiguePanel
            npis={npis}
            journeys={journeys}
          />
        )}

        {/* ═══ REP TERRITORY DASHBOARD ═══ */}
        {tab === "repdash" && (
          <RepTerritoryDashboard
            npis={npis}
            journeys={journeys}
            assets={assets}
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
              <div style={{ display: mob ? "none" : "grid", gridTemplateColumns: "1.6fr 1fr 0.5fr 0.5fr 0.8fr 1.4fr 0.9fr 0.6fr", gap: 6, padding: "9px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 9, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>HCP</span><span>Specialty</span><span>State</span><span>Decile</span>
                <span>Journey</span><span>Next Touch</span><span>Engagement</span><span>Status</span>
              </div>
              {filteredNPIs.map((r, i) => {
                const bc = r.engScore > 70 ? T.green : r.engScore > 40 ? T.amber : T.red;
                return (
                  <div key={r.npi} onClick={() => setSelectedNPI(r)} style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1.6fr 1fr 0.5fr 0.5fr 0.8fr 1.4fr 0.9fr 0.6fr", gap: mob ? 4 : 6, padding: mob ? "10px 12px" : "10px 16px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", transition: "background 0.1s", background: i % 2 === 0 ? "transparent" : T.bgAlt }}>
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
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : `repeat(${liveJourneys.length}, 1fr)`, gap: 10 }}>
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
