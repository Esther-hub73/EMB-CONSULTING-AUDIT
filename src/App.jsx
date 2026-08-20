import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  Building2, BedDouble, Plus, ChevronLeft, CheckCircle2, XCircle, MinusCircle,
  Camera, TrendingUp, AlertTriangle, Download, Loader2, Sparkles, X, ClipboardCheck,
  BellRing, Trash2, ShieldCheck, Shirt, UtensilsCrossed, Wine, PartyPopper, ChefHat,
  Wrench, Briefcase, Wallet, Users, Waves, Megaphone, Leaf, MapPin,
  Settings, ArrowUp, ArrowDown, Pencil, GraduationCap, ChevronDown, ChevronUp, CalendarClock, Rocket,
} from 'lucide-react';
import { storageGet, storageSet } from './lib/storage';
import { loadChecklists, addChecklistItem, updateChecklistItem, deleteChecklistItem, swapOrder, deleteEstablishmentChecklists } from './lib/checklistsData';
import { OPENING_LOTS, DEFAULT_OPENING_TASKS } from './data/defaultOpeningTasks';

/* ---------------------------------- TOKENS --------------------------------- */

const COLORS = {
  ink: '#0F2438',
  slate: '#33506E',
  slateLight: '#6E88A0',
  ivory: '#FAF7F1',
  paper: '#FFFFFF',
  brass: '#C9AD73',
  brassDark: '#A98A4C',
  brassLight: '#EFE3C8',
  sage: '#4F7A5B',
  sageLight: '#E4EFE6',
  terracotta: '#B85C4A',
  terracottaLight: '#F6E4DF',
  amber: '#C98A2C',
  amberLight: '#F7EAD3',
  border: '#E3DCC9',
};

const F_DISPLAY = "'Fraunces', serif";
const F_BODY = "'Inter', system-ui, sans-serif";
const F_MONO = "'IBM Plex Mono', monospace";

const DEPARTMENTS = [
  { id: 'exterieurs', name: 'Extérieurs & Abords', icon: MapPin },
  { id: 'reception', name: 'Réception', icon: Building2 },
  { id: 'etages', name: 'Étages', icon: BedDouble },
  { id: 'buanderie', name: 'Buanderie', icon: Shirt },
  { id: 'piscine', name: 'Piscine', icon: Waves },
  { id: 'restaurant', name: 'Restaurant', icon: UtensilsCrossed },
  { id: 'cuisine', name: 'Cuisine', icon: ChefHat },
  { id: 'bar', name: 'Bar', icon: Wine },
  { id: 'banquet', name: 'Banquet', icon: PartyPopper },
  { id: 'commercial', name: 'Commercial', icon: Briefcase },
  { id: 'rh', name: 'Ressources Humaines', icon: Users },
  { id: 'gestion', name: 'Gestion & Comptabilité', icon: Wallet },
  { id: 'marketing', name: 'Marketing & Communication', icon: Megaphone },
  { id: 'rse', name: 'RSE', icon: Leaf },
];

const GROUPS = [
  { id: 'hebergement', name: 'Hébergement', deptIds: ['exterieurs', 'reception', 'etages', 'buanderie', 'piscine'] },
  { id: 'restauration', name: 'Restaurant', deptIds: ['restaurant', 'cuisine', 'bar', 'banquet'] },
  { id: 'commercial_grp', name: 'Commercial', deptIds: ['commercial'] },
  { id: 'rh_grp', name: 'Ressources Humaines', deptIds: ['rh'] },
  { id: 'gestion_grp', name: 'Gestion & Comptabilité', deptIds: ['gestion'] },
  { id: 'marketing_grp', name: 'Marketing & Communication', deptIds: ['marketing'] },
  { id: 'rse_grp', name: 'RSE', deptIds: ['rse'] },
];

const DEPT_COLORS = {
  exterieurs: '#7A6A4F', reception: '#A98A4C', etages: '#4F7A5B', buanderie: '#B85C4A', piscine: '#2C7FA6',
  restaurant: '#C98A2C', cuisine: '#C9515A', bar: '#6B4C9A', banquet: '#1B7A6E',
  commercial: '#33506E', rh: '#9A6B2C', gestion: '#5B6B7A', marketing: '#A64C6B', rse: '#5B8A3A',
};

// (La grille de critères par défaut a été déplacée dans src/data/defaultChecklists.js)

const PRIORITES = ['Haute', 'Moyenne', 'Basse'];
const PRIORITE_COLOR = { Haute: COLORS.terracotta, Moyenne: COLORS.amber, Basse: COLORS.sage };

/* --------------------------------- HELPERS ---------------------------------- */

function computeScore(responses) {
  const relevant = responses.filter(r => r.status === 'conforme' || r.status === 'non_conforme');
  if (relevant.length === 0) return null;
  const ok = relevant.filter(r => r.status === 'conforme').length;
  return Math.round((ok / relevant.length) * 100);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function generateAIAnalysis(departmentName, pointText, comment) {
  // Calls our own serverless function (/api/analyze) which holds the Anthropic
  // API key server-side. Never call api.anthropic.com directly from the browser
  // in a hosted app — that would expose the key and be blocked by CORS anyway.
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ department: departmentName, pointText, comment }),
  });
  if (!response.ok) throw new Error('AI proxy request failed');
  return response.json();
}

/* ------------------------------- UI PRIMITIVES ------------------------------ */

function ScoreDial({ score, size = 120, label, thickness = 9 }) {
  const r = size / 2 - thickness;
  const c = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;
  const color = score == null ? COLORS.border : pct >= 85 ? COLORS.sage : pct >= 60 ? COLORS.amber : COLORS.terracotta;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.border} strokeWidth={thickness} />
          {score != null && (
            <circle
              cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness}
              strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.7s ease' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold leading-none">
            {score == null ? '—' : Math.round(score)}
          </span>
          <span style={{ fontFamily: F_MONO, color: COLORS.slateLight }} className="text-[9px] tracking-widest mt-1">/100</span>
        </div>
      </div>
      {label && <span style={{ fontFamily: F_BODY, color: COLORS.slate }} className="text-xs mt-2 text-center max-w-[120px]">{label}</span>}
    </div>
  );
}

function StatusButton({ active, color, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all"
      style={{
        fontFamily: F_BODY,
        borderColor: active ? color : COLORS.border,
        backgroundColor: active ? `${color}1A` : COLORS.paper,
        color: active ? color : COLORS.slate,
        fontWeight: active ? 600 : 500,
      }}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function PriorityBadge({ priorite }) {
  const c = PRIORITE_COLOR[priorite] || COLORS.slate;
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ fontFamily: F_BODY, backgroundColor: `${c}1A`, color: c }}
    >
      {priorite || '—'}
    </span>
  );
}

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };
  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    hasDrawn.current = true;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasDrawn.current) onChange(canvasRef.current.toDataURL());
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef} width={380} height={140}
        className="border rounded-lg touch-none mx-auto block"
        style={{ borderColor: COLORS.border, backgroundColor: COLORS.paper }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <button onClick={clear} className="text-xs mt-2 underline block mx-auto" style={{ fontFamily: F_BODY, color: COLORS.slate }}>
        Effacer la signature
      </button>
    </div>
  );
}

function Header({ onHome, onDashboard, onProjects, activeSection }) {
  return (
    <header className="print:hidden sticky top-0 z-20 border-b" style={{ backgroundColor: COLORS.ink, borderColor: COLORS.ink }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <button onClick={onHome} className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.brass }}>
            <BellRing size={18} color={COLORS.ink} />
          </div>
          <div className="text-left hidden sm:block">
            <div style={{ fontFamily: F_DISPLAY, color: COLORS.ivory }} className="text-lg leading-none font-semibold">EMB Consulting</div>
            <div style={{ fontFamily: F_BODY, color: COLORS.brassLight }} className="text-[11px] tracking-wide">Audit qualité · Hôtels &amp; Restaurants</div>
          </div>
        </button>
        {activeSection !== 'home' && (
          <div className="flex items-center gap-2">
            <button onClick={onDashboard} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: activeSection === 'dashboard' ? COLORS.brass : COLORS.brassLight, color: activeSection === 'dashboard' ? COLORS.brass : COLORS.brassLight }}>
              Tableau de bord
            </button>
            <button onClick={onProjects} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: activeSection === 'projects' ? COLORS.brass : COLORS.brassLight, color: activeSection === 'projects' ? COLORS.brass : COLORS.brassLight }}>
              Projets d'ouverture
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ------------------------------------ APP ----------------------------------- */

export default function App() {
  const [data, setData] = useState({ establishments: [], audits: [] });
  const [projectsData, setProjectsData] = useState({ projects: [] }); // rétroplanning d'ouverture
  const [checklistsByEst, setChecklistsByEst] = useState({}); // { [establishmentId]: { [departmentId]: [{id, category, text}] } }
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); // home | dashboard | newEst | estDetail | audit | report | admin | alertes | formation | amelioration | projects | newProject | projectDetail
  const [selectedEstId, setSelectedEstId] = useState(null);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentAudit, setCurrentAudit] = useState(null);
  const [auditStep, setAuditStep] = useState('checklist'); // checklist | signature

  const ensureChecklists = useCallback(async (estId, force = false) => {
    if (!estId) return null;
    if (!force && checklistsByEst[estId]) return checklistsByEst[estId];
    try {
      const loaded = await loadChecklists(estId);
      setChecklistsByEst(prev => ({ ...prev, [estId]: loaded }));
      return loaded;
    } catch (e) { console.error(e); return null; }
  }, [checklistsByEst]);

  useEffect(() => {
    (async () => {
      try {
        const res = await storageGet('audit-app-data');
        if (res && res.value) setData(JSON.parse(res.value));
      } catch (e) { /* first run, no data yet */ }
      try {
        const res2 = await storageGet('opening-projects-data');
        if (res2 && res2.value) setProjectsData(JSON.parse(res2.value));
      } catch (e) { /* first run, no data yet */ }
      setLoading(false);
    })();
  }, []);

  const saveProjectsData = useCallback(async (next) => {
    setProjectsData(next);
    try { await storageSet('opening-projects-data', JSON.stringify(next)); } catch (e) { console.error(e); }
  }, []);

  const saveData = useCallback(async (next) => {
    setData(next);
    try { await storageSet('audit-app-data', JSON.stringify(next)); } catch (e) { console.error(e); }
  }, []);

  const establishments = data.establishments;
  const audits = data.audits;
  const selectedEst = establishments.find(e => e.id === selectedEstId) || null;
  const selectedAudit = audits.find(a => a.id === selectedAuditId) || null;
  const selectedEstChecklists = selectedEstId ? checklistsByEst[selectedEstId] : null;

  /* ---- actions ---- */
  const addEstablishment = (est) => {
    const newEst = { ...est, id: 'est_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), createdAt: new Date().toISOString() };
    const next = { ...data, establishments: [...establishments, newEst] };
    saveData(next);
    ensureChecklists(newEst.id);
    setView('dashboard');
  };

  const openEstablishment = (id) => {
    setSelectedEstId(id);
    setView('estDetail');
    ensureChecklists(id);
  };

  const startAudit = async (establishmentId, department) => {
    const checklists = await ensureChecklists(establishmentId);
    setCurrentAudit({
      id: 'audit_' + Date.now(),
      establishmentId,
      department,
      date: new Date().toISOString(),
      auditor: '',
      responses: (checklists?.[department] || []).map(p => ({ ...p, status: null, comment: '', photo: null, ai: null, aiLoading: false, priorite: '', responsable: '', delai: '', budget: '', actionStatus: 'ouvert', dueDate: '', traitePar: '', traiteLe: '', verifiePar: '', verifieLe: '', verifieNote: '' })),
      signature: null,
    });
    setAuditStep('checklist');
    setView('audit');
  };

  const updateResponse = (pointId, patch) => {
    setCurrentAudit(prev => ({ ...prev, responses: prev.responses.map(r => r.id === pointId ? { ...r, ...patch } : r) }));
  };

  const runAI = async (pointId) => {
    const point = currentAudit.responses.find(r => r.id === pointId);
    const deptName = DEPARTMENTS.find(d => d.id === currentAudit.department).name;
    updateResponse(pointId, { aiLoading: true });
    try {
      const result = await generateAIAnalysis(deptName, point.text, point.comment);
      updateResponse(pointId, {
        aiLoading: false, ai: result,
        priorite: result.priorite || 'Moyenne',
        responsable: result.responsable || '',
        delai: result.delai || '',
        budget: result.budget_estimatif || '',
      });
    } catch (e) {
      updateResponse(pointId, { aiLoading: false, ai: { error: true, preconisation: "Analyse indisponible pour le moment — merci de réessayer." } });
    }
  };

  const finalizeAudit = () => {
    const score = computeScore(currentAudit.responses);
    const finished = { ...currentAudit, score };
    const next = { ...data, audits: [...audits, finished] };
    saveData(next);
    setSelectedAuditId(finished.id);
    setCurrentAudit(null);
    setView('report');
  };

  const updateActionItem = (auditId, pointId, patch) => {
    const next = {
      ...data,
      audits: audits.map(a => a.id !== auditId ? a : {
        ...a,
        responses: a.responses.map(r => r.id !== pointId ? r : { ...r, ...patch }),
      }),
    };
    saveData(next);
  };

  const deleteEstablishment = (id) => {
    const next = { establishments: establishments.filter(e => e.id !== id), audits: audits.filter(a => a.establishmentId !== id) };
    saveData(next);
    deleteEstablishmentChecklists(id).catch(console.error);
    setChecklistsByEst(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (selectedEstId === id) setSelectedEstId(null);
    setView('dashboard');
  };

  /* ---- opening projects (rétroplanning) ---- */
  const projects = projectsData.projects;
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const addProject = (proj) => {
    const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const tasks = DEFAULT_OPENING_TASKS.map(t => ({
      ...t,
      id: `${projectId}__${t.id}`,
      done: false, resp: '', debut: '', fin: '', priorite: 'Haute', statut: 'À faire', livrable: '', commentaires: '',
    }));
    const newProject = { ...proj, id: projectId, createdAt: new Date().toISOString(), tasks };
    saveProjectsData({ projects: [...projects, newProject] });
    setSelectedProjectId(projectId);
    setView('projectDetail');
  };

  const updateProjectTask = (projectId, taskId, patch) => {
    const next = {
      projects: projects.map(p => p.id !== projectId ? p : {
        ...p,
        tasks: p.tasks.map(t => t.id !== taskId ? t : { ...t, ...patch }),
      }),
    };
    saveProjectsData(next);
  };

  const addCustomTask = (projectId, phase, lot, title) => {
    const next = {
      projects: projects.map(p => p.id !== projectId ? p : {
        ...p,
        tasks: [...p.tasks, { id: `${projectId}__custom_${Date.now()}`, phase, lot, title, done: false, resp: '', debut: '', fin: '', priorite: 'Haute', statut: 'À faire', livrable: '', commentaires: '' }],
      }),
    };
    saveProjectsData(next);
  };

  const deleteProject = (id) => {
    saveProjectsData({ projects: projects.filter(p => p.id !== id) });
    if (selectedProjectId === id) setSelectedProjectId(null);
    setView('projects');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.ivory }}>
        <Loader2 className="animate-spin" color={COLORS.brass} size={28} />
      </div>
    );
  }

  const dashboardViews = ['dashboard', 'newEst', 'estDetail', 'audit', 'report', 'admin', 'alertes', 'formation', 'amelioration'];
  const projectViews = ['projects', 'newProject', 'projectDetail'];
  const activeSection = view === 'home' ? 'home' : projectViews.includes(view) ? 'projects' : 'dashboard';

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.ivory, fontFamily: F_BODY }}>
      <Header onHome={() => setView('home')} onDashboard={() => setView('dashboard')} onProjects={() => setView('projects')} activeSection={activeSection} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {view === 'home' && (
          <Home establishments={establishments} audits={audits} onGoDashboard={() => setView('dashboard')} onGoProjects={() => setView('projects')} onNew={() => setView('newEst')} />
        )}
        {view === 'dashboard' && (
          <Dashboard
            establishments={establishments} audits={audits}
            onNew={() => setView('newEst')}
            onOpen={openEstablishment}
            onDelete={deleteEstablishment}
          />
        )}
        {view === 'newEst' && (
          <NewEstablishment onCancel={() => setView('dashboard')} onSave={addEstablishment} />
        )}
        {view === 'estDetail' && selectedEst && (
          <EstablishmentDetail
            establishment={selectedEst} audits={audits.filter(a => a.establishmentId === selectedEst.id)}
            checklists={selectedEstChecklists}
            onBack={() => setView('dashboard')}
            onStartAudit={(dept) => startAudit(selectedEst.id, dept)}
            onOpenReport={(id) => { setSelectedAuditId(id); setView('report'); }}
            onDelete={() => deleteEstablishment(selectedEst.id)}
            onOpenAdmin={() => setView('admin')}
            onOpenAlerts={() => setView('alertes')}
            onOpenFormation={() => setView('formation')}
            onOpenAmelioration={() => setView('amelioration')}
          />
        )}
        {view === 'audit' && currentAudit && (
          <AuditFlow
            audit={currentAudit} step={auditStep} setStep={setAuditStep}
            onUpdate={updateResponse} onRunAI={runAI}
            onSetAuditor={(name) => setCurrentAudit(p => ({ ...p, auditor: name }))}
            onSetSignature={(sig) => setCurrentAudit(p => ({ ...p, signature: sig }))}
            onFinalize={finalizeAudit}
            onBack={() => { setCurrentAudit(null); setView('estDetail'); }}
          />
        )}
        {view === 'report' && selectedAudit && (
          <Report
            audit={selectedAudit}
            establishment={establishments.find(e => e.id === selectedAudit.establishmentId)}
            allEstAudits={audits.filter(a => a.establishmentId === selectedAudit.establishmentId && a.department === selectedAudit.department)}
            onUpdateAction={(pointId, patch) => updateActionItem(selectedAudit.id, pointId, patch)}
            onBack={() => setView('estDetail')}
          />
        )}
        {view === 'admin' && selectedEst && selectedEstChecklists && (
          <AdminChecklists establishment={selectedEst} checklists={selectedEstChecklists} onRefresh={() => ensureChecklists(selectedEst.id, true)} onBack={() => setView('estDetail')} />
        )}
        {view === 'admin' && selectedEst && !selectedEstChecklists && (
          <div>
            <button onClick={() => setView('estDetail')} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
              <ChevronLeft size={16} /> {selectedEst.name}
            </button>
            <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: COLORS.terracotta }}>
              <AlertTriangle className="mx-auto mb-3" color={COLORS.terracotta} size={28} />
              <p style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-lg mb-1">Impossible de charger les critères</p>
              <p style={{ color: COLORS.slate }} className="text-sm mb-4">
                La connexion à la base de données a échoué. Vérifie que la table <code>checklist_items</code> existe dans Supabase
                (SQL Editor → exécuter <code>supabase-schema.sql</code>), et que les variables <code>VITE_SUPABASE_URL</code> /
                <code>VITE_SUPABASE_ANON_KEY</code> sont correctes sur Vercel — puis redéploie sans cache.
                Ouvre la console du navigateur (F12) pour voir le détail de l'erreur.
              </p>
              <button onClick={() => ensureChecklists(selectedEst.id, true)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: COLORS.brass, color: COLORS.ink }}>
                Réessayer
              </button>
            </div>
          </div>
        )}
        {view === 'alertes' && selectedEst && (
          <AlertsView establishment={selectedEst} audits={audits.filter(a => a.establishmentId === selectedEst.id)} onBack={() => setView('estDetail')} onOpenReport={(id) => { setSelectedAuditId(id); setView('report'); }} />
        )}
        {view === 'formation' && selectedEst && (
          <FormationView establishment={selectedEst} audits={audits.filter(a => a.establishmentId === selectedEst.id)} onBack={() => setView('estDetail')} />
        )}
        {view === 'amelioration' && selectedEst && (
          <AmeliorationView establishment={selectedEst} audits={audits.filter(a => a.establishmentId === selectedEst.id)} onBack={() => setView('estDetail')} />
        )}
        {view === 'projects' && (
          <ProjectsList projects={projects} onNew={() => setView('newProject')} onOpen={(id) => { setSelectedProjectId(id); setView('projectDetail'); }} onDelete={deleteProject} />
        )}
        {view === 'newProject' && (
          <NewProject onCancel={() => setView('projects')} onSave={addProject} />
        )}
        {view === 'projectDetail' && selectedProject && (
          <ProjectDetail
            project={selectedProject}
            onBack={() => setView('projects')}
            onUpdateTask={(taskId, patch) => updateProjectTask(selectedProject.id, taskId, patch)}
            onAddTask={(phase, lot, title) => addCustomTask(selectedProject.id, phase, lot, title)}
            onDelete={() => deleteProject(selectedProject.id)}
          />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------ DASHBOARD ----------------------------------- */

function Home({ establishments, audits, onGoDashboard, onGoProjects, onNew }) {
  const avgScore = audits.length ? Math.round(audits.reduce((s, a) => s + (a.score || 0), 0) / audits.length) : null;
  const openActions = audits.reduce((s, a) => s + a.responses.filter(r => r.status === 'non_conforme' && r.actionStatus !== 'verifie').length, 0);

  const pillars = [
    { icon: Building2, title: 'Base dédiée par hôtel', text: 'Audits, scores et critères propres à chaque établissement.' },
    { icon: Sparkles, title: 'Analyse IA', text: 'Causes, risques et préconisations générés à chaque non-conformité.' },
    { icon: ShieldCheck, title: 'Contrôle vérifié', text: 'Chaque action corrective est vérifiée avant clôture.' },
    { icon: TrendingUp, title: 'Amélioration continue', text: 'Taux de résolution, récidive, besoins de formation.' },
  ];

  return (
    <div>
      <div className="text-center py-16 sm:py-20">
        <div style={{ fontFamily: F_MONO, color: COLORS.brassDark }} className="text-xs uppercase tracking-widest mb-4">Plateforme de pilotage qualité</div>
        <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-3xl sm:text-4xl font-semibold leading-tight max-w-xl mx-auto mb-4">
          L'excellence de votre établissement, <em style={{ color: COLORS.brassDark, fontStyle: 'italic' }}>mesurée, prouvée, améliorée.</em>
        </h1>
        <p style={{ color: COLORS.slate }} className="text-base max-w-md mx-auto mb-8">
          Chaque hôtel dispose de sa propre base : ses audits, ses scores et ses critères ne sont jamais partagés avec les autres établissements.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={onGoDashboard} className="px-6 py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}>
            Tableau de bord →
          </button>
          <button onClick={onGoProjects} className="px-6 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: COLORS.border, color: COLORS.ink, backgroundColor: COLORS.paper }}>
            Projets d'ouverture →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-12 rounded-2xl overflow-hidden border" style={{ backgroundColor: COLORS.border, borderColor: COLORS.border }}>
          {[
            { v: establishments.length, l: 'Établissements' },
            { v: audits.length, l: 'Audits réalisés' },
            { v: avgScore == null ? '—' : `${avgScore}/100`, l: 'Score moyen' },
            { v: openActions, l: 'Actions ouvertes' },
          ].map((k, i) => (
            <div key={i} style={{ backgroundColor: COLORS.paper }} className="p-5 text-center">
              <div style={{ fontFamily: F_MONO, color: COLORS.ink }} className="text-xl">{k.v}</div>
              <div style={{ color: COLORS.slateLight }} className="text-[11px] mt-1">{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pb-20">
        <h2 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-xl text-center mb-1">Un pilotage complet, pas juste un contrôle</h2>
        <p style={{ color: COLORS.slate }} className="text-sm text-center mb-8">Audit → Diagnostic → Score → Risque → Préconisation → Plan d'action → Contrôle → Amélioration</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pillars.map((p, i) => (
            <div key={i} className="rounded-xl border p-5" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
              <p.icon size={18} color={COLORS.brassDark} className="mb-2" />
              <div style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-sm font-semibold mb-1">{p.title}</div>
              <div style={{ color: COLORS.slate }} className="text-xs leading-relaxed">{p.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- DASHBOARD ----------------------------------- */

function Dashboard({ establishments, audits, onNew, onOpen, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);
  const avgScore = audits.length ? Math.round(audits.reduce((s, a) => s + (a.score || 0), 0) / audits.length) : null;
  const openActions = audits.reduce((s, a) => s + a.responses.filter(r => r.status === 'non_conforme' && r.actionStatus !== 'verifie').length, 0);
  const verifiedActions = audits.reduce((s, a) => s + a.responses.filter(r => r.status === 'non_conforme' && r.actionStatus === 'verifie').length, 0);
  const overdueActions = audits.reduce((s, a) => s + a.responses.filter(r => r.status === 'non_conforme' && r.actionStatus !== 'verifie' && r.dueDate && new Date(r.dueDate) < new Date()).length, 0);

  const kpis = [
    { label: 'Établissements', value: establishments.length },
    { label: 'Audits réalisés', value: audits.length },
    { label: 'Score moyen', value: avgScore == null ? '—' : `${avgScore}/100` },
    { label: 'Actions ouvertes', value: openActions, sub: `${verifiedActions} vérifiées`, alert: overdueActions > 0 ? `${overdueActions} en retard` : null },
  ];

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-3xl font-semibold">Mes établissements</h1>
          <p style={{ color: COLORS.slate }} className="text-sm mt-1">Chaque carte ouvre la base propre de l'hôtel — ses audits et ses critères, indépendants des autres.</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}
        >
          <Plus size={16} /> Nouvel établissement
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {kpis.map((k, i) => (
          <div key={i} className="rounded-xl border p-4" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
            <div style={{ fontFamily: F_MONO, color: COLORS.ink }} className="text-2xl font-medium">{k.value}</div>
            <div style={{ color: COLORS.slate }} className="text-xs mt-1">{k.label}</div>
            {k.sub && <div style={{ color: COLORS.sage }} className="text-[11px] mt-0.5">{k.sub}</div>}
            {k.alert && <div style={{ color: COLORS.terracotta }} className="text-[11px] mt-0.5 font-semibold">⚠ {k.alert}</div>}
          </div>
        ))}
      </div>

      {establishments.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center" style={{ borderColor: COLORS.border }}>
          <ClipboardCheck className="mx-auto mb-3" color={COLORS.brass} size={28} />
          <p style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-lg mb-1">Aucun établissement pour l'instant</p>
          <p style={{ color: COLORS.slate }} className="text-sm mb-4">Créez votre premier établissement pour lancer un audit.</p>
          <button onClick={onNew} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: COLORS.brass, color: COLORS.ink }}>
            Créer un établissement
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {establishments.map(est => {
            const estAudits = audits.filter(a => a.establishmentId === est.id);
            const deptScores = DEPARTMENTS.map(d => {
              const list = estAudits.filter(a => a.department === d.id).sort((a, b) => new Date(b.date) - new Date(a.date));
              return list[0]?.score ?? null;
            }).filter(s => s != null);
            const globalScore = deptScores.length ? Math.round(deptScores.reduce((a, b) => a + b, 0) / deptScores.length) : null;
            const confirming = confirmId === est.id;
            return (
              <div key={est.id} className="rounded-xl border p-5" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
                <button onClick={() => onOpen(est.id)} className="w-full text-left flex items-center gap-4">
                  <ScoreDial score={globalScore} size={64} thickness={6} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-lg font-semibold truncate">{est.name}</div>
                    <div style={{ color: COLORS.slate }} className="text-sm">{est.type}{est.ville ? ` · ${est.ville}` : ''}</div>
                    <div style={{ color: COLORS.slateLight }} className="text-xs mt-1">{estAudits.length} audit{estAudits.length > 1 ? 's' : ''} réalisé{estAudits.length > 1 ? 's' : ''}</div>
                  </div>
                </button>
                <div className="flex justify-end mt-3">
                  {!confirming ? (
                    <button onClick={() => setConfirmId(est.id)} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: COLORS.terracottaLight, color: COLORS.terracotta }}>
                      <Trash2 size={12} /> Supprimer
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <span style={{ color: COLORS.slate }}>Supprimer définitivement ?</span>
                      <button onClick={() => { onDelete(est.id); setConfirmId(null); }} className="px-2.5 py-1 rounded-lg font-semibold" style={{ backgroundColor: COLORS.terracotta, color: COLORS.paper }}>Oui</button>
                      <button onClick={() => setConfirmId(null)} className="px-2.5 py-1 rounded-lg border" style={{ borderColor: COLORS.border, color: COLORS.slate }}>Annuler</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- NEW ESTABLISHMENT --------------------------------- */

function NewEstablishment({ onCancel, onSave }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Hôtel');
  const [ville, setVille] = useState('');
  const [categorie, setCategorie] = useState('');

  return (
    <div className="max-w-lg">
      <button onClick={onCancel} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> Retour
      </button>
      <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold mb-6">Nouvel établissement</h1>
      <div className="space-y-4 rounded-xl border p-5" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Nom de l'établissement</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Hôtel Belle Rive" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }}>
              <option>Hôtel</option>
              <option>Restaurant</option>
              <option>Hôtel-Restaurant</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Catégorie</label>
            <select value={categorie} onChange={e => setCategorie(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }}>
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Ville</label>
          <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Ex : Marrakech" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }} />
        </div>
        <button
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), type, ville: ville.trim(), categorie })}
          className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
          style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}
        >
          Créer l'établissement
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- ESTABLISHMENT DETAIL -------------------------------- */

function EstablishmentDetail({ establishment, audits, checklists, onBack, onStartAudit, onOpenReport, onDelete, onOpenAdmin, onOpenAlerts, onOpenFormation, onOpenAmelioration }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deptScores = DEPARTMENTS.map(d => {
    const list = audits.filter(a => a.department === d.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    return { dept: d, latest: list[0] || null, history: list };
  });
  const validScores = deptScores.map(d => d.latest?.score).filter(s => s != null);
  const globalScore = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;
  const criteriaCount = checklists ? Object.values(checklists).reduce((s, arr) => s + arr.length, 0) : null;
  const openActionsCount = audits.reduce((s, a) => s + a.responses.filter(r => r.status === 'non_conforme' && r.actionStatus !== 'verifie').length, 0);
  const formationThemesCount = (() => {
    const groups = {};
    audits.forEach(a => a.responses.filter(r => r.status === 'non_conforme').forEach(r => {
      const key = `${a.department}::${r.category}`;
      groups[key] = (groups[key] || 0) + 1;
    }));
    return Object.values(groups).filter(c => c >= 2).length;
  })();

  const chartData = [...audits].sort((a, b) => new Date(a.date) - new Date(b.date)).map(a => ({
    date: fmtDate(a.date),
    [DEPARTMENTS.find(d => d.id === a.department).name]: a.score,
  }));

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> Tableau de bord
      </button>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-3xl font-semibold">{establishment.name}</h1>
          <p style={{ color: COLORS.slate }} className="text-sm mt-1">{establishment.type}{establishment.ville ? ` · ${establishment.ville}` : ''}{establishment.categorie ? ` · ${establishment.categorie}★` : ''}</p>
        </div>
        <ScoreDial score={globalScore} label="Score global" size={90} />
      </div>

      <div className="flex items-center gap-2 rounded-lg p-3 mb-6 text-xs" style={{ backgroundColor: COLORS.sageLight, color: '#2F4F3A' }}>
        <ShieldCheck size={15} color={COLORS.sage} className="shrink-0" />
        <span><b style={{ color: COLORS.sage }}>Base propre à cet hôtel.</b> Les audits, scores et critères ci-dessous n'apparaissent que pour {establishment.name} — jamais partagés avec les autres établissements.</span>
      </div>

      {GROUPS.map(group => {
        const groupDepts = deptScores.filter(d => group.deptIds.includes(d.dept.id));
        const groupValid = groupDepts.map(d => d.latest?.score).filter(s => s != null);
        const groupScore = groupValid.length ? Math.round(groupValid.reduce((a, b) => a + b, 0) / groupValid.length) : null;
        return (
          <div key={group.id} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-lg font-semibold">{group.name}</span>
              {groupScore != null && (
                <span style={{ fontFamily: F_MONO, color: COLORS.brassDark, borderColor: COLORS.border }} className="text-xs px-2 py-0.5 rounded-full border">
                  Score pôle : {groupScore}/100
                </span>
              )}
            </div>
            <div className={`grid gap-4 ${groupDepts.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
              {groupDepts.map(({ dept, latest }) => {
                const Icon = dept.icon;
                return (
                  <div key={dept.id} className="rounded-xl border p-5" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={17} color={COLORS.brassDark} className="shrink-0" />
                        <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold text-base truncate">{dept.name}</span>
                      </div>
                      <ScoreDial score={latest?.score ?? null} size={50} thickness={5} />
                    </div>
                    <p style={{ color: COLORS.slateLight }} className="text-xs mb-3">
                      {latest ? `${fmtDate(latest.date)} · ${latest.auditor || 'auditeur non renseigné'}` : "Aucun audit réalisé"}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => onStartAudit(dept.id)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: COLORS.brass, color: COLORS.ink }}>
                        Lancer un audit
                      </button>
                      {latest && (
                        <button onClick={() => onOpenReport(latest.id)} className="px-2.5 py-2 rounded-lg text-xs border" style={{ borderColor: COLORS.border, color: COLORS.slate }}>
                          Rapport
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <button onClick={onOpenAlerts} className="text-left rounded-xl border p-4 flex items-center gap-3" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.terracottaLight }}><AlertTriangle size={16} color={COLORS.terracotta} /></div>
          <div><div style={{ color: COLORS.ink }} className="text-sm font-semibold">Alertes d'échéance</div><div style={{ color: COLORS.slateLight }} className="text-xs">{openActionsCount ? `${openActionsCount} action(s) en attente` : 'Aucune action en attente'}</div></div>
        </button>
        <button onClick={onOpenFormation} className="text-left rounded-xl border p-4 flex items-center gap-3" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.amberLight }}><GraduationCap size={16} color={COLORS.amber} /></div>
          <div><div style={{ color: COLORS.ink }} className="text-sm font-semibold">Besoins de formation</div><div style={{ color: COLORS.slateLight }} className="text-xs">{formationThemesCount ? `${formationThemesCount} thème(s) récurrent(s)` : 'Aucune tendance détectée'}</div></div>
        </button>
        <button onClick={onOpenAmelioration} className="text-left rounded-xl border p-4 flex items-center gap-3" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.sageLight }}><TrendingUp size={16} color={COLORS.sage} /></div>
          <div><div style={{ color: COLORS.ink }} className="text-sm font-semibold">Amélioration continue</div><div style={{ color: COLORS.slateLight }} className="text-xs">Taux de résolution, récidive</div></div>
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl p-4 mb-8 border border-dashed" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.brass }}>
        <div>
          <div style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-sm font-semibold">Critères d'audit de cet hôtel</div>
          <div style={{ color: COLORS.slate }} className="text-xs mt-0.5">{criteriaCount == null ? 'Chargement…' : `${criteriaCount} critères personnalisés pour cet établissement`}</div>
        </div>
        <button onClick={onOpenAdmin} className="px-4 py-2 rounded-lg text-sm font-semibold border shrink-0" style={{ borderColor: COLORS.border, color: COLORS.ink }}>
          Gérer les critères →
        </button>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl border p-5 mb-8" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} color={COLORS.brassDark} />
            <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold">Évolution des scores</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.slate }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.slate }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {[...new Set(audits.map(a => a.department))].map(deptId => (
                <Line key={deptId} type="monotone" dataKey={DEPARTMENTS.find(d => d.id === deptId).name} stroke={DEPT_COLORS[deptId]} strokeWidth={2} connectNulls dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border p-5 mb-8" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold">Historique des audits</span>
        {audits.length === 0 ? (
          <p style={{ color: COLORS.slateLight }} className="text-sm mt-2">Aucun audit pour le moment.</p>
        ) : (
          <div className="mt-3 divide-y" style={{ borderColor: COLORS.border }}>
            {[...audits].sort((a, b) => new Date(b.date) - new Date(a.date)).map(a => (
              <button key={a.id} onClick={() => onOpenReport(a.id)} className="w-full flex items-center justify-between py-3 text-left">
                <div>
                  <div style={{ color: COLORS.ink }} className="text-sm font-medium">{DEPARTMENTS.find(d => d.id === a.department).name} — {fmtDate(a.date)}</div>
                  <div style={{ color: COLORS.slateLight }} className="text-xs">{a.auditor || 'Auditeur non renseigné'}</div>
                </div>
                <PriorityBadge priorite={a.score >= 85 ? 'Basse' : a.score >= 60 ? 'Moyenne' : 'Haute'} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-right">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-xs flex items-center gap-1 ml-auto" style={{ color: COLORS.terracotta }}>
            <Trash2 size={13} /> Supprimer l'établissement
          </button>
        ) : (
          <div className="flex items-center gap-2 justify-end text-xs">
            <span style={{ color: COLORS.slate }}>Confirmer la suppression ?</span>
            <button onClick={onDelete} className="px-2 py-1 rounded font-semibold" style={{ backgroundColor: COLORS.terracotta, color: COLORS.paper }}>Oui, supprimer</button>
            <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded border" style={{ borderColor: COLORS.border }}>Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------ AUDIT FLOW ------------------------------------ */

function AuditFlow({ audit, step, setStep, onUpdate, onRunAI, onSetAuditor, onSetSignature, onFinalize, onBack }) {
  const dept = DEPARTMENTS.find(d => d.id === audit.department);
  const answered = audit.responses.filter(r => r.status).length;
  const total = audit.responses.length;
  const categories = [...new Set(audit.responses.map(r => r.category))];

  if (step === 'signature') {
    return (
      <div className="max-w-lg mx-auto">
        <button onClick={() => setStep('checklist')} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
          <ChevronLeft size={16} /> Revenir à la grille
        </button>
        <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold mb-1">Validation de l'audit</h1>
        <p style={{ color: COLORS.slate }} className="text-sm mb-6">{dept.name} · Score obtenu : <b>{computeScore(audit.responses)}/100</b></p>

        <div className="rounded-xl border p-5 mb-4" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Nom de l'auditeur</label>
          <input value={audit.auditor} onChange={e => onSetAuditor(e.target.value)} placeholder="Prénom et nom" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }} />
        </div>

        <div className="rounded-xl border p-5 mb-6" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <label className="text-xs font-semibold block mb-2" style={{ color: COLORS.slate }}>Signature</label>
          <SignaturePad onChange={onSetSignature} />
        </div>

        <button
          disabled={!audit.auditor.trim() || !audit.signature}
          onClick={onFinalize}
          className="w-full py-3 rounded-lg text-sm font-semibold disabled:opacity-40"
          style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}
        >
          Valider et générer le rapport
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> Quitter l'audit
      </button>
      <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold mb-1">Audit — {dept.name}</h1>
      <p style={{ color: COLORS.slate }} className="text-sm mb-6">{answered}/{total} points contrôlés</p>

      {categories.map(cat => (
        <div key={cat} className="mb-6">
          <div style={{ fontFamily: F_MONO, color: COLORS.brassDark }} className="text-xs uppercase tracking-widest mb-2">{cat}</div>
          <div className="space-y-3">
            {audit.responses.filter(r => r.category === cat).map(point => (
              <ChecklistItem key={point.id} point={point} onUpdate={(patch) => onUpdate(point.id, patch)} onRunAI={() => onRunAI(point.id)} />
            ))}
          </div>
        </div>
      ))}

      <div className="fixed bottom-0 left-0 right-0 print:hidden border-t p-4" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.border }}>
            <div className="h-full transition-all" style={{ width: `${(answered / total) * 100}%`, backgroundColor: COLORS.brass }} />
          </div>
          <button
            disabled={answered < total}
            onClick={() => setStep('signature')}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap disabled:opacity-40"
            style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}
          >
            Continuer vers la signature
          </button>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ point, onUpdate, onRunAI }) {
  const isNonConforme = point.status === 'non_conforme';
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdate({ photo: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: COLORS.paper, borderColor: isNonConforme ? COLORS.terracotta : COLORS.border }}>
      <p style={{ color: COLORS.ink }} className="text-sm font-medium mb-3">{point.text}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <StatusButton active={point.status === 'conforme'} color={COLORS.sage} icon={CheckCircle2} label="Conforme" onClick={() => onUpdate({ status: 'conforme' })} />
        <StatusButton active={point.status === 'non_conforme'} color={COLORS.terracotta} icon={XCircle} label="Non conforme" onClick={() => onUpdate({ status: 'non_conforme' })} />
        <StatusButton active={point.status === 'na'} color={COLORS.slate} icon={MinusCircle} label="Non applicable" onClick={() => onUpdate({ status: 'na' })} />
      </div>

      {point.status && point.status !== 'na' && (
        <div className="space-y-2">
          <textarea
            value={point.comment} onChange={e => onUpdate({ comment: e.target.value })}
            placeholder="Commentaire de l'auditeur (optionnel)"
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none" rows={2}
            style={{ borderColor: COLORS.border }}
          />
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border" style={{ borderColor: COLORS.border, color: COLORS.slate }}>
              <Camera size={13} /> {point.photo ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
            {point.photo && <img src={point.photo} alt="" className="w-10 h-10 rounded object-cover border" style={{ borderColor: COLORS.border }} />}
          </div>
        </div>
      )}

      {isNonConforme && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
          {!point.ai && !point.aiLoading && (
            <button onClick={onRunAI} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.terracottaLight, color: COLORS.terracotta }}>
              <Sparkles size={13} /> Générer l'analyse IA
            </button>
          )}
          {point.aiLoading && (
            <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.slate }}>
              <Loader2 size={13} className="animate-spin" /> Analyse en cours…
            </div>
          )}
          {point.ai && !point.ai.error && (
            <div className="rounded-lg p-3 text-xs space-y-2" style={{ backgroundColor: COLORS.terracottaLight }}>
              <div><b style={{ color: COLORS.ink }}>Cause probable :</b> <span style={{ color: COLORS.slate }}>{point.ai.cause_probable}</span></div>
              <div>
                <b style={{ color: COLORS.ink }}>Risques :</b>
                <ul className="list-disc ml-4 mt-0.5" style={{ color: COLORS.slate }}>
                  {(point.ai.risques || []).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <div><b style={{ color: COLORS.ink }}>Préconisation :</b> <span style={{ color: COLORS.slate }}>{point.ai.preconisation}</span></div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="block text-[10px] font-semibold mb-0.5" style={{ color: COLORS.slate }}>Priorité</label>
                  <select value={point.priorite} onChange={e => onUpdate({ priorite: e.target.value })} className="w-full px-2 py-1 rounded border text-xs" style={{ borderColor: COLORS.border }}>
                    {PRIORITES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold mb-0.5" style={{ color: COLORS.slate }}>Responsable</label>
                  <input value={point.responsable} onChange={e => onUpdate({ responsable: e.target.value })} className="w-full px-2 py-1 rounded border text-xs" style={{ borderColor: COLORS.border }} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold mb-0.5" style={{ color: COLORS.slate }}>Délai</label>
                  <input value={point.delai} onChange={e => onUpdate({ delai: e.target.value })} className="w-full px-2 py-1 rounded border text-xs" style={{ borderColor: COLORS.border }} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold mb-0.5" style={{ color: COLORS.slate }}>Budget estimatif</label>
                  <input value={point.budget} onChange={e => onUpdate({ budget: e.target.value })} className="w-full px-2 py-1 rounded border text-xs" style={{ borderColor: COLORS.border }} />
                </div>
              </div>
            </div>
          )}
          {point.ai?.error && (
            <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.terracotta }}>
              <AlertTriangle size={13} /> {point.ai.preconisation}
              <button onClick={onRunAI} className="underline">Réessayer</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------- REPORT --------------------------------------- */

function Report({ audit, establishment, allEstAudits, onUpdateAction, onBack }) {
  const dept = DEPARTMENTS.find(d => d.id === audit.department);
  const conformes = audit.responses.filter(r => r.status === 'conforme');
  const nonConformes = audit.responses.filter(r => r.status === 'non_conforme')
    .sort((a, b) => PRIORITES.indexOf(a.priorite) - PRIORITES.indexOf(b.priorite));

  const prevAudit = [...allEstAudits].filter(a => a.id !== audit.id && new Date(a.date) < new Date(audit.date)).sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const radarData = [...new Set(audit.responses.map(r => r.category))].map(cat => {
    const pts = audit.responses.filter(r => r.category === cat && r.status !== 'na' && r.status);
    const score = pts.length ? Math.round((pts.filter(r => r.status === 'conforme').length / pts.length) * 100) : 0;
    const prevPts = prevAudit ? prevAudit.responses.filter(r => r.category === cat && r.status !== 'na' && r.status) : [];
    const prevScore = prevPts.length ? Math.round((prevPts.filter(r => r.status === 'conforme').length / prevPts.length) * 100) : null;
    return { categorie: cat, Actuel: score, ...(prevScore != null ? { Précédent: prevScore } : {}) };
  });

  const verifiedCount = nonConformes.filter(r => r.actionStatus === 'verifie').length;

  const resume = `L'audit du département ${dept.name} de ${establishment?.name || "l'établissement"} réalisé le ${fmtDate(audit.date)} par ${audit.auditor} obtient un score de ${audit.score}/100. Sur ${audit.responses.filter(r => r.status !== 'na').length} points contrôlés, ${conformes.length} sont conformes et ${nonConformes.length} nécessitent une action corrective. ${nonConformes.length > 0 ? `Le point le plus prioritaire concerne : « ${nonConformes[0].text} ».` : "Aucune non-conformité majeure n'a été relevée lors de cet audit."}`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="print:hidden flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-1 text-sm" style={{ color: COLORS.slate }}>
          <ChevronLeft size={16} /> Retour à l'établissement
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}>
          <Download size={15} /> Exporter en PDF
        </button>
      </div>

      <div className="rounded-xl border p-6 mb-6" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div style={{ fontFamily: F_MONO, color: COLORS.brassDark }} className="text-xs uppercase tracking-widest mb-1">Rapport d'audit</div>
            <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold">{establishment?.name} — {dept.name}</h1>
            <p style={{ color: COLORS.slate }} className="text-sm mt-1">{fmtDate(audit.date)} · Auditeur : {audit.auditor}</p>
          </div>
          <ScoreDial score={audit.score} size={80} />
        </div>

        <div className="mb-5">
          <div style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold mb-1.5">Résumé exécutif</div>
          <p style={{ color: COLORS.slate }} className="text-sm leading-relaxed">{resume}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div className="rounded-lg p-3" style={{ backgroundColor: COLORS.sageLight }}>
            <div style={{ color: COLORS.sage }} className="text-xs font-semibold mb-1.5">FORCES</div>
            <ul className="text-xs space-y-1" style={{ color: COLORS.ink }}>
              {conformes.slice(0, 4).map(c => <li key={c.id}>• {c.text}</li>)}
              {conformes.length === 0 && <li style={{ color: COLORS.slateLight }}>Aucun point conforme relevé</li>}
            </ul>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: COLORS.terracottaLight }}>
            <div style={{ color: COLORS.terracotta }} className="text-xs font-semibold mb-1.5">FAIBLESSES</div>
            <ul className="text-xs space-y-1" style={{ color: COLORS.ink }}>
              {nonConformes.slice(0, 4).map(c => <li key={c.id}>• {c.text}</li>)}
              {nonConformes.length === 0 && <li style={{ color: COLORS.slateLight }}>Aucune non-conformité relevée</li>}
            </ul>
          </div>
        </div>

        {radarData.length > 0 && (
          <div className="mb-2">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={COLORS.border} />
                <PolarAngleAxis dataKey="categorie" tick={{ fontSize: 10, fill: COLORS.slate }} />
                <Radar name="Actuel" dataKey="Actuel" stroke={COLORS.brassDark} fill={COLORS.brass} fillOpacity={0.35} />
                {prevAudit && <Radar name="Précédent" dataKey="Précédent" stroke={COLORS.slate} fill={COLORS.slate} fillOpacity={0.12} />}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {nonConformes.length > 0 && (
        <div className="rounded-xl border p-6 mb-6" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold">Plan d'actions</div>
            <span style={{ color: COLORS.slateLight }} className="text-xs">{verifiedCount}/{nonConformes.length} vérifiées</span>
          </div>
          <div className="space-y-3">
            {nonConformes.map(nc => (
              <ActionItem key={nc.id} item={nc} onUpdate={(patch) => onUpdateAction(nc.id, patch)} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border p-6 flex items-center justify-between" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.slate }}>
          <ShieldCheck size={16} color={COLORS.sage} /> Audit signé par {audit.auditor}
        </div>
        {audit.signature && <img src={audit.signature} alt="Signature" className="h-14" />}
      </div>
    </div>
  );
}

function actionUrgency(item) {
  if (item.actionStatus === 'verifie') return null;
  if (!item.dueDate) return null;
  const due = new Date(item.dueDate);
  const today = new Date();
  const days = Math.ceil((due - today) / 86400000);
  if (days < 0) return { label: `En retard de ${Math.abs(days)} j`, color: COLORS.terracotta };
  if (days <= 3) return { label: `Échéance dans ${days} j`, color: COLORS.amber };
  return null;
}

function ActionItem({ item, onUpdate }) {
  const [declaring, setDeclaring] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [traitePar, setTraitePar] = useState('');
  const [verifiePar, setVerifiePar] = useState('');
  const [verifieNote, setVerifieNote] = useState('');
  const urgency = actionUrgency(item);
  const verified = item.actionStatus === 'verifie';

  return (
    <div className="rounded-lg border p-3" style={{ borderColor: COLORS.border, opacity: verified ? 0.6 : 1 }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p style={{ color: COLORS.ink }} className="text-sm font-medium flex-1">{item.text}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {urgency && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${urgency.color}1A`, color: urgency.color }}>{urgency.label}</span>}
          <PriorityBadge priorite={item.priorite} />
        </div>
      </div>
      {item.comment && <p style={{ color: COLORS.slateLight }} className="text-xs mb-1.5 italic">« {item.comment} »</p>}
      {item.photo && <img src={item.photo} alt="" className="w-16 h-16 rounded object-cover border mb-1.5" style={{ borderColor: COLORS.border }} />}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-2" style={{ color: COLORS.slate }}>
        <div><b>Responsable :</b> {item.responsable || '—'}</div>
        <div><b>Délai :</b> {item.delai || '—'}</div>
        <div><b>Budget :</b> {item.budget || '—'}</div>
      </div>

      <div className="flex items-center gap-2 mb-2 print:hidden">
        <label className="text-xs" style={{ color: COLORS.slate }}>Échéance :</label>
        <input
          type="date" value={item.dueDate || ''} disabled={verified}
          onChange={e => onUpdate({ dueDate: e.target.value })}
          className="px-2 py-1 rounded border text-xs" style={{ borderColor: COLORS.border }}
        />
      </div>

      {item.actionStatus === 'ouvert' && !declaring && (
        <button onClick={() => setDeclaring(true)} className="print:hidden text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: COLORS.border, color: COLORS.slate }}>
          Déclarer traité
        </button>
      )}
      {declaring && (
        <div className="print:hidden flex flex-wrap items-center gap-2">
          <input value={traitePar} onChange={e => setTraitePar(e.target.value)} placeholder="Traité par (nom)" className="px-2 py-1.5 rounded border text-xs" style={{ borderColor: COLORS.border }} />
          <button
            disabled={!traitePar.trim()}
            onClick={() => { onUpdate({ actionStatus: 'a_verifier', traitePar: traitePar.trim(), traiteLe: new Date().toISOString() }); setDeclaring(false); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ backgroundColor: COLORS.brass, color: COLORS.ink }}
          >
            Confirmer
          </button>
          <button onClick={() => setDeclaring(false)} className="text-xs px-2 py-1.5" style={{ color: COLORS.slateLight }}>Annuler</button>
        </div>
      )}

      {item.actionStatus === 'a_verifier' && (
        <div className="rounded-lg p-2.5" style={{ backgroundColor: COLORS.amberLight }}>
          <div className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: COLORS.amber }}>
            <ShieldCheck size={13} /> En attente de vérification — traité par {item.traitePar} le {fmtDate(item.traiteLe)}
          </div>
          {!verifying ? (
            <div className="flex gap-2 print:hidden">
              <button onClick={() => setVerifying(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}>
                Vérifier et clôturer
              </button>
              <button onClick={() => onUpdate({ actionStatus: 'ouvert', traitePar: '', traiteLe: '' })} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: COLORS.terracotta, color: COLORS.terracotta }}>
                Rejeter (non corrigé)
              </button>
            </div>
          ) : (
            <div className="print:hidden space-y-2">
              <input value={verifiePar} onChange={e => setVerifiePar(e.target.value)} placeholder="Vérifié par (nom)" className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: COLORS.border }} />
              <input value={verifieNote} onChange={e => setVerifieNote(e.target.value)} placeholder="Note de contrôle (optionnel)" className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: COLORS.border }} />
              <button
                disabled={!verifiePar.trim()}
                onClick={() => onUpdate({ actionStatus: 'verifie', verifiePar: verifiePar.trim(), verifieLe: new Date().toISOString(), verifieNote: verifieNote.trim() })}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ backgroundColor: COLORS.sage, color: COLORS.paper }}
              >
                Confirmer la clôture
              </button>
            </div>
          )}
        </div>
      )}

      {verified && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.sage }}>
          <ShieldCheck size={13} /> Vérifié par {item.verifiePar} le {fmtDate(item.verifieLe)}{item.verifieNote ? ` — "${item.verifieNote}"` : ''}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- ADMIN CRITÈRES ------------------------------- */

function AdminChecklists({ establishment, checklists, onRefresh, onBack }) {
  const [deptId, setDeptId] = useState(DEPARTMENTS[0].id);
  const [busy, setBusy] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [editText, setEditText] = useState('');

  const dept = DEPARTMENTS.find(d => d.id === deptId);
  const items = checklists[deptId] || [];
  const categories = [...new Set(items.map(i => i.category))];

  const withBusy = async (fn) => {
    setBusy(true);
    try { await fn(); await onRefresh(); } catch (e) { console.error(e); alert("Une erreur est survenue, réessaie."); }
    setBusy(false);
  };

  const handleAdd = () => {
    if (!newText.trim() || !newCategory.trim()) return;
    withBusy(async () => {
      await addChecklistItem(establishment.id, deptId, newCategory.trim(), newText.trim());
      setNewText('');
    });
  };

  const startEdit = (item) => { setEditingId(item.id); setEditCategory(item.category); setEditText(item.text); };
  const saveEdit = () => {
    withBusy(async () => {
      await updateChecklistItem(establishment.id, deptId, editingId, { category: editCategory.trim(), text: editText.trim() });
      setEditingId(null);
    });
  };

  const remove = (item) => {
    if (!confirm(`Supprimer ce critère ?\n\n« ${item.text} »`)) return;
    withBusy(() => deleteChecklistItem(establishment.id, deptId, item.id));
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    withBusy(() => swapOrder(establishment.id, deptId, items[index], items[target]));
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> {establishment.name}
      </button>
      <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold mb-1">Critères d'audit — {establishment.name}</h1>
      <p style={{ color: COLORS.slate }} className="text-sm mb-5">Ajoute, modifie, réordonne ou supprime les points de contrôle propres à cet établissement. Les audits déjà réalisés ne sont jamais modifiés rétroactivement, et ces changements n'affectent aucun autre hôtel.</p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {DEPARTMENTS.map(d => {
          const Icon = d.icon;
          const active = d.id === deptId;
          return (
            <button
              key={d.id} onClick={() => setDeptId(d.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border"
              style={{
                borderColor: active ? COLORS.brass : COLORS.border,
                backgroundColor: active ? COLORS.brassLight : COLORS.paper,
                color: COLORS.ink,
              }}
            >
              <Icon size={13} /> {d.name}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border p-5 mb-5" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-4">
          <dept.icon size={17} color={COLORS.brassDark} />
          <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold text-lg">{dept.name}</span>
          <span style={{ color: COLORS.slateLight }} className="text-xs">({items.length} critères)</span>
        </div>

        {categories.map(cat => (
          <div key={cat} className="mb-4">
            <div style={{ fontFamily: F_MONO, color: COLORS.brassDark }} className="text-xs uppercase tracking-widest mb-2">{cat}</div>
            <div className="space-y-2">
              {items.filter(i => i.category === cat).map((item) => {
                const index = items.findIndex(i => i.id === item.id);
                const isEditing = editingId === item.id;
                return (
                  <div key={item.id} className="rounded-lg border p-3" style={{ borderColor: COLORS.border }}>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="Catégorie" className="w-full px-2 py-1.5 rounded border text-sm" style={{ borderColor: COLORS.border }} />
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2} className="w-full px-2 py-1.5 rounded border text-sm resize-none" style={{ borderColor: COLORS.border }} />
                        <div className="flex gap-2">
                          <button disabled={busy} onClick={saveEdit} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}>Enregistrer</button>
                          <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: COLORS.border, color: COLORS.slate }}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <p style={{ color: COLORS.ink }} className="text-sm flex-1">{item.text}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button disabled={busy} onClick={() => move(index, -1)} className="p-1 rounded border" style={{ borderColor: COLORS.border, color: COLORS.slate }}><ArrowUp size={13} /></button>
                          <button disabled={busy} onClick={() => move(index, 1)} className="p-1 rounded border" style={{ borderColor: COLORS.border, color: COLORS.slate }}><ArrowDown size={13} /></button>
                          <button disabled={busy} onClick={() => startEdit(item)} className="p-1 rounded border" style={{ borderColor: COLORS.border, color: COLORS.slate }}><Pencil size={13} /></button>
                          <button disabled={busy} onClick={() => remove(item)} className="p-1 rounded border" style={{ borderColor: COLORS.terracotta, color: COLORS.terracotta }}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="rounded-lg p-3 mt-4" style={{ backgroundColor: COLORS.ivory }}>
          <div style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Plus size={14} /> Ajouter un critère</div>
          <div className="space-y-2">
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Catégorie (ex : Accueil & arrivée)" className="w-full px-2.5 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }} list="categories-list" />
            <datalist id="categories-list">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
            <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Intitulé du critère" rows={2} className="w-full px-2.5 py-2 rounded-lg border text-sm resize-none" style={{ borderColor: COLORS.border }} />
            <button disabled={busy || !newText.trim() || !newCategory.trim()} onClick={handleAdd} className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40" style={{ backgroundColor: COLORS.brass, color: COLORS.ink }}>
              Ajouter au département
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- ALERTES D'ÉCHÉANCE --------------------------- */

function AlertsView({ establishment, audits, onBack, onOpenReport }) {
  const items = [];
  audits.forEach(a => {
    a.responses.forEach(r => {
      if (r.status !== 'non_conforme' || r.actionStatus === 'verifie') return;
      const urgency = actionUrgency(r);
      items.push({
        auditId: a.id, department: DEPARTMENTS.find(d => d.id === a.department)?.name || a.department,
        text: r.text, priorite: r.priorite, responsable: r.responsable, dueDate: r.dueDate, actionStatus: r.actionStatus, urgency,
      });
    });
  });

  const overdue = items.filter(i => i.urgency?.color === COLORS.terracotta);
  const soon = items.filter(i => i.urgency?.color === COLORS.amber);
  const noDate = items.filter(i => !i.dueDate);
  const rest = items.filter(i => i.dueDate && !i.urgency);
  const ordered = [...overdue, ...soon, ...rest, ...noDate];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> {establishment.name}
      </button>
      <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold mb-1">Alertes d'échéance</h1>
      <p style={{ color: COLORS.slate }} className="text-sm mb-6">{items.length} action{items.length > 1 ? 's' : ''} en cours pour {establishment.name} — {overdue.length} en retard, {soon.length} à échéance proche.</p>

      {ordered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center" style={{ borderColor: COLORS.border }}>
          <ShieldCheck className="mx-auto mb-3" color={COLORS.sage} size={28} />
          <p style={{ color: COLORS.slate }} className="text-sm">Aucune action en attente pour cet hôtel. Tout est à jour !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ordered.map((i, idx) => (
            <button key={idx} onClick={() => onOpenReport(i.auditId)} className="w-full text-left rounded-lg border p-3 flex items-center justify-between gap-3" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
              <div className="min-w-0">
                <div style={{ color: COLORS.ink }} className="text-sm font-medium truncate">{i.text}</div>
                <div style={{ color: COLORS.slateLight }} className="text-xs mt-0.5">{i.department} · {i.responsable || 'responsable non défini'}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {i.urgency && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${i.urgency.color}1A`, color: i.urgency.color }}>{i.urgency.label}</span>}
                {i.actionStatus === 'a_verifier' && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.amberLight, color: COLORS.amber }}>À vérifier</span>}
                <PriorityBadge priorite={i.priorite} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------- FORMATION ----------------------------------- */

function FormationView({ establishment, audits, onBack }) {
  const groups = {};
  audits.forEach(a => {
    a.responses.filter(r => r.status === 'non_conforme').forEach(r => {
      const key = `${a.department}::${r.category}`;
      if (!groups[key]) groups[key] = { department: a.department, category: r.category, count: 0, examples: new Set() };
      groups[key].count += 1;
      groups[key].examples.add(r.text);
    });
  });

  const recurring = Object.values(groups)
    .filter(g => g.count >= 2)
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> {establishment.name}
      </button>
      <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold mb-1">Besoins de formation</h1>
      <p style={{ color: COLORS.slate }} className="text-sm mb-6">Thèmes détectés à partir des non-conformités qui reviennent le plus souvent dans les audits de {establishment.name} (2 occurrences ou plus).</p>

      {recurring.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center" style={{ borderColor: COLORS.border }}>
          <GraduationCap className="mx-auto mb-3" color={COLORS.brass} size={28} />
          <p style={{ color: COLORS.slate }} className="text-sm">Pas encore assez d'audits pour détecter des tendances de formation dans cet hôtel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurring.map((g, idx) => {
            const dept = DEPARTMENTS.find(d => d.id === g.department);
            return (
              <div key={idx} className="rounded-xl border p-4" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {dept && <dept.icon size={15} color={COLORS.brassDark} />}
                    <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold text-sm">{dept?.name} — {g.category}</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.amberLight, color: COLORS.amber }}>{g.count} occurrences</span>
                </div>
                <ul className="text-xs space-y-0.5 mb-2" style={{ color: COLORS.slate }}>
                  {[...g.examples].slice(0, 3).map((ex, i) => <li key={i}>• {ex}</li>)}
                </ul>
                <div className="mt-2 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: COLORS.sageLight, color: COLORS.sage }}>
                  Recommandation : organiser une session de formation ciblée sur « {g.category} » pour {dept?.name}.
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ AMÉLIORATION CONTINUE ----------------------------- */

function AmeliorationView({ establishment, audits, onBack }) {
  const allNonConf = audits.flatMap(a => a.responses.filter(r => r.status === 'non_conforme').map(r => ({ ...r, auditDate: a.date })));
  const verified = allNonConf.filter(r => r.actionStatus === 'verifie');
  const tauxResolution = allNonConf.length ? Math.round((verified.length / allNonConf.length) * 100) : null;

  const delais = verified
    .filter(r => r.verifieLe && r.auditDate)
    .map(r => Math.max(0, Math.round((new Date(r.verifieLe) - new Date(r.auditDate)) / 86400000)));
  const delaiMoyen = delais.length ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length) : null;

  // Taux de récidive : catégories non conformes présentes dans au moins 2 audits consécutifs d'un même département/établissement
  let recurrentCategories = 0;
  let totalCategoriesSeen = 0;
  const byEstDept = {};
  audits.forEach(a => {
    const key = `${a.establishmentId}::${a.department}`;
    if (!byEstDept[key]) byEstDept[key] = [];
    byEstDept[key].push(a);
  });
  Object.values(byEstDept).forEach(list => {
    const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
    const seenCategories = new Set();
    for (let i = 0; i < sorted.length; i++) {
      const cats = new Set(sorted[i].responses.filter(r => r.status === 'non_conforme').map(r => r.category));
      cats.forEach(c => {
        totalCategoriesSeen += 1;
        if (seenCategories.has(c)) recurrentCategories += 1;
        seenCategories.add(c);
      });
    }
  });
  const tauxRecidive = totalCategoriesSeen ? Math.round((recurrentCategories / totalCategoriesSeen) * 100) : null;

  const chartData = [...audits].sort((a, b) => new Date(a.date) - new Date(b.date)).map(a => ({
    date: fmtDate(a.date), score: a.score,
  }));

  const kpis = [
    { label: 'Taux de résolution', value: tauxResolution == null ? '—' : `${tauxResolution}%`, sub: `${verified.length}/${allNonConf.length} actions vérifiées` },
    { label: 'Délai moyen de résolution', value: delaiMoyen == null ? '—' : `${delaiMoyen} j`, sub: 'entre audit et vérification' },
    { label: 'Taux de récidive', value: tauxRecidive == null ? '—' : `${tauxRecidive}%`, sub: 'catégories qui reviennent non conformes' },
    { label: 'Audits réalisés', value: audits.length, sub: 'depuis le 1er audit' },
  ];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> {establishment.name}
      </button>
      <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold mb-1">Amélioration continue</h1>
      <p style={{ color: COLORS.slate }} className="text-sm mb-6">Indicateurs de pilotage pour {establishment.name}.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {kpis.map((k, i) => (
          <div key={i} className="rounded-xl border p-4" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
            <div style={{ fontFamily: F_MONO, color: COLORS.ink }} className="text-2xl font-medium">{k.value}</div>
            <div style={{ color: COLORS.slate }} className="text-xs mt-1">{k.label}</div>
            {k.sub && <div style={{ color: COLORS.slateLight }} className="text-[11px] mt-0.5">{k.sub}</div>}
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl border p-5" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} color={COLORS.brassDark} />
            <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold">Évolution des scores</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.slate }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.slate }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke={COLORS.brassDark} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ==================================================================== */
/* ============================ PROJETS D'OUVERTURE =================== */
/* ==================================================================== */

const OPENING_PHASES = [
  { id: 'avant', label: "Avant l'ouverture" },
  { id: 'pendant', label: "Pendant l'ouverture" },
  { id: 'apres', label: "Après l'ouverture" },
];

function projectProgress(project) {
  const total = project.tasks.length;
  const done = project.tasks.filter(t => t.done).length;
  return total ? Math.round((done / total) * 100) : 0;
}
function phaseProgressOf(project, phaseId) {
  const list = project.tasks.filter(t => t.phase === phaseId);
  const done = list.filter(t => t.done).length;
  return { total: list.length, done, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
}
function lotProgressOf(project, phaseId, lot) {
  const list = project.tasks.filter(t => t.phase === phaseId && t.lot === lot);
  const done = list.filter(t => t.done).length;
  return { total: list.length, done, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
}

function ProjectsList({ projects, onNew, onOpen, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-3xl font-semibold">Projets d'ouverture</h1>
          <p style={{ color: COLORS.slate }} className="text-sm mt-1">Rétroplanning des hôtels en cours d'ouverture — indépendant des établissements audités.</p>
        </div>
        <button onClick={onNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}>
          <Plus size={16} /> Nouveau projet
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center" style={{ borderColor: COLORS.border }}>
          <Rocket className="mx-auto mb-3" color={COLORS.brass} size={28} />
          <p style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-lg mb-1">Aucun projet d'ouverture pour l'instant</p>
          <p style={{ color: COLORS.slate }} className="text-sm mb-4">Crée un projet pour démarrer le rétroplanning d'un nouvel hôtel.</p>
          <button onClick={onNew} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: COLORS.brass, color: COLORS.ink }}>
            Créer un projet
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {projects.map(p => {
            const pct = projectProgress(p);
            const confirming = confirmId === p.id;
            return (
              <div key={p.id} className="rounded-xl border p-5" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
                <button onClick={() => onOpen(p.id)} className="w-full text-left">
                  <div style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-lg font-semibold">{p.name}</div>
                  <div style={{ color: COLORS.slate }} className="text-sm">{p.ville ? `${p.ville} · ` : ''}Ouverture prévue : {p.targetDate ? fmtDate(p.targetDate) : 'non définie'}</div>
                  <div className="flex gap-2 mt-3">
                    {OPENING_PHASES.map(ph => {
                      const s = phaseProgressOf(p, ph.id);
                      return (
                        <div key={ph.id} className="flex-1 text-center rounded-lg py-1.5 text-[10px] font-bold" style={{ backgroundColor: COLORS.ivory, color: COLORS.slate }}>
                          {s.done}/{s.total}
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{ backgroundColor: COLORS.border }}>
                    <div className="h-full" style={{ width: `${pct}%`, backgroundColor: COLORS.brass }} />
                  </div>
                  <div style={{ color: COLORS.slateLight }} className="text-xs mt-1.5">{pct}% d'avancement global</div>
                </button>
                <div className="flex justify-end mt-3">
                  {!confirming ? (
                    <button onClick={() => setConfirmId(p.id)} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: COLORS.terracottaLight, color: COLORS.terracotta }}>
                      <Trash2 size={12} /> Supprimer
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <span style={{ color: COLORS.slate }}>Supprimer ce projet ?</span>
                      <button onClick={() => { onDelete(p.id); setConfirmId(null); }} className="px-2.5 py-1 rounded-lg font-semibold" style={{ backgroundColor: COLORS.terracotta, color: COLORS.paper }}>Oui</button>
                      <button onClick={() => setConfirmId(null)} className="px-2.5 py-1 rounded-lg border" style={{ borderColor: COLORS.border, color: COLORS.slate }}>Annuler</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewProject({ onCancel, onSave }) {
  const [name, setName] = useState('');
  const [ville, setVille] = useState('');
  const [targetDate, setTargetDate] = useState('');

  return (
    <div className="max-w-lg">
      <button onClick={onCancel} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> Retour
      </button>
      <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold mb-6">Nouveau projet d'ouverture</h1>
      <div className="space-y-4 rounded-xl border p-5" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Nom du projet / établissement</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Hôtel Riverside" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }} />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Ville</label>
          <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Ex : Bruxelles" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }} />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Date d'ouverture prévue</label>
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }} />
        </div>
        <p style={{ color: COLORS.slateLight }} className="text-xs">
          Le projet démarre avec la trame complète EMB Consulting : 152 tâches réparties en 10 lots pour la phase "Avant l'ouverture", plus les phases "Pendant" et "Après".
        </p>
        <button
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), ville: ville.trim(), targetDate })}
          className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
          style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}
        >
          Créer le projet
        </button>
      </div>
    </div>
  );
}

function ProjectDetail({ project, onBack, onUpdateTask, onAddTask, onDelete }) {
  const [currentPhase, setCurrentPhase] = useState('avant');
  const [currentLot, setCurrentLot] = useState('all');
  const [expanded, setExpanded] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const overallPct = projectProgress(project);
  const phaseTasks = project.tasks.filter(t => t.phase === currentPhase);
  const lotsInPhase = [...new Set(phaseTasks.map(t => t.lot))];
  const lotsToShow = currentLot === 'all' ? lotsInPhase : [currentLot];

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const lot = currentLot === 'all' ? (lotsInPhase[0] || 'Général') : currentLot;
    onAddTask(currentPhase, lot, newTaskTitle.trim());
    setNewTaskTitle('');
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> Projets d'ouverture
      </button>

      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl sm:text-3xl font-semibold">{project.name}</h1>
          <p style={{ color: COLORS.slate }} className="text-sm mt-1">{project.ville ? `${project.ville} · ` : ''}Ouverture prévue : {project.targetDate ? fmtDate(project.targetDate) : 'non définie'}</p>
        </div>
        <div className="text-right">
          <div style={{ fontFamily: F_MONO, color: COLORS.ink }} className="text-2xl">{overallPct}%</div>
          <div style={{ color: COLORS.slateLight }} className="text-[11px]">avancement global</div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b mb-4" style={{ borderColor: COLORS.border }}>
        {OPENING_PHASES.map(ph => {
          const s = phaseProgressOf(project, ph.id);
          const active = currentPhase === ph.id;
          return (
            <button
              key={ph.id}
              onClick={() => { setCurrentPhase(ph.id); setCurrentLot('all'); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2"
              style={{ color: active ? COLORS.ink : COLORS.slate, borderColor: active ? COLORS.brass : 'transparent' }}
            >
              {ph.label}
              <span style={{ fontFamily: F_MONO, backgroundColor: COLORS.border, color: COLORS.slate }} className="text-[10px] px-1.5 py-0.5 rounded-full">{s.done}/{s.total}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button onClick={() => setCurrentLot('all')} className="text-[11px] font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap" style={{ backgroundColor: currentLot === 'all' ? COLORS.ink : COLORS.paper, color: currentLot === 'all' ? COLORS.ivory : COLORS.slate, borderColor: currentLot === 'all' ? COLORS.ink : COLORS.border }}>
          Tous les lots
        </button>
        {lotsInPhase.map(lot => (
          <button key={lot} onClick={() => setCurrentLot(lot)} className="text-[11px] font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap" style={{ backgroundColor: currentLot === lot ? COLORS.ink : COLORS.paper, color: currentLot === lot ? COLORS.ivory : COLORS.slate, borderColor: currentLot === lot ? COLORS.ink : COLORS.border }}>
            {lot}
          </button>
        ))}
      </div>

      {lotsToShow.map(lot => {
        const lp = lotProgressOf(project, currentPhase, lot);
        if (lp.total === 0) return null;
        const tasks = project.tasks.filter(t => t.phase === currentPhase && t.lot === lot);
        return (
          <div key={lot} className="rounded-xl border p-4 mb-3" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold text-sm">{lot}</span>
              <span style={{ color: COLORS.slateLight }} className="text-xs">{lp.done}/{lp.total}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: COLORS.border }}>
              <div className="h-full" style={{ width: `${lp.pct}%`, backgroundColor: COLORS.brass }} />
            </div>
            {tasks.map(t => (
              <OpeningTaskRow key={t.id} task={t} expanded={!!expanded[t.id]} onToggleExpand={() => toggleExpand(t.id)} onUpdate={(patch) => onUpdateTask(t.id, patch)} />
            ))}
          </div>
        );
      })}

      <div className="rounded-xl border p-4 mb-8 flex gap-2" style={{ backgroundColor: COLORS.ivory, borderColor: COLORS.border }}>
        <input
          value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
          placeholder={`Ajouter une tâche à cette phase${currentLot !== 'all' ? ` (${currentLot})` : ''}…`}
          className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }}
        />
        <button onClick={handleAddTask} className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: COLORS.border, color: COLORS.ink }}>
          Ajouter
        </button>
      </div>

      <div className="text-right">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-xs flex items-center gap-1 ml-auto" style={{ color: COLORS.terracotta }}>
            <Trash2 size={13} /> Supprimer ce projet
          </button>
        ) : (
          <div className="flex items-center gap-2 justify-end text-xs">
            <span style={{ color: COLORS.slate }}>Confirmer la suppression ?</span>
            <button onClick={onDelete} className="px-2 py-1 rounded font-semibold" style={{ backgroundColor: COLORS.terracotta, color: COLORS.paper }}>Oui, supprimer</button>
            <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded border" style={{ borderColor: COLORS.border }}>Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
}

function OpeningTaskRow({ task, expanded, onToggleExpand, onUpdate }) {
  const prio = task.priorite || 'Haute';
  const prioColor = PRIORITE_COLOR[prio] || COLORS.slate;
  const statut = task.done ? 'Fait' : (task.statut || 'À faire');
  const statutColor = statut === 'Fait' ? COLORS.sage : statut === 'En cours' ? COLORS.amber : COLORS.slateLight;

  return (
    <div className="border-t first:border-t-0" style={{ borderColor: COLORS.border }}>
      <div className="flex items-center gap-2 py-2">
        <button
          onClick={() => onUpdate({ done: !task.done, statut: !task.done ? 'Fait' : 'À faire' })}
          className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 text-[10px]"
          style={{ borderColor: task.done ? COLORS.sage : COLORS.border, backgroundColor: task.done ? COLORS.sage : 'transparent', color: '#fff' }}
        >
          {task.done ? '✓' : ''}
        </button>
        <span className="text-sm flex-1" style={{ color: task.done ? COLORS.slateLight : COLORS.ink, textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${prioColor}1A`, color: prioColor }}>{prio}</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 hidden sm:inline-block" style={{ backgroundColor: `${statutColor}1A`, color: statutColor }}>{statut}</span>
        <input
          value={task.resp || ''} onChange={e => onUpdate({ resp: e.target.value })}
          placeholder="Responsable…"
          className="hidden sm:block w-28 text-xs px-2 py-1 rounded-lg border shrink-0"
          style={{ borderColor: COLORS.border }}
        />
        <button onClick={onToggleExpand} className="w-6 h-6 rounded-lg border flex items-center justify-center shrink-0" style={{ borderColor: COLORS.border, color: COLORS.slateLight }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
      {expanded && (
        <div className="grid grid-cols-2 gap-2 rounded-lg p-3 mb-3" style={{ backgroundColor: COLORS.ivory }}>
          <div className="sm:hidden col-span-2">
            <label className="text-[10px]" style={{ color: COLORS.slateLight }}>Responsable</label>
            <input value={task.resp || ''} onChange={e => onUpdate({ resp: e.target.value })} className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: COLORS.border }} />
          </div>
          <div>
            <label className="text-[10px]" style={{ color: COLORS.slateLight }}>Début</label>
            <input type="date" value={task.debut || ''} onChange={e => onUpdate({ debut: e.target.value })} className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: COLORS.border }} />
          </div>
          <div>
            <label className="text-[10px]" style={{ color: COLORS.slateLight }}>Échéance (fin)</label>
            <input type="date" value={task.fin || ''} onChange={e => onUpdate({ fin: e.target.value })} className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: COLORS.border }} />
          </div>
          <div>
            <label className="text-[10px]" style={{ color: COLORS.slateLight }}>Priorité</label>
            <select value={prio} onChange={e => onUpdate({ priorite: e.target.value })} className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: COLORS.border }}>
              {PRIORITES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px]" style={{ color: COLORS.slateLight }}>Statut</label>
            <select value={statut} onChange={e => onUpdate({ statut: e.target.value, done: e.target.value === 'Fait' })} className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: COLORS.border }}>
              <option>À faire</option>
              <option>En cours</option>
              <option>Fait</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[10px]" style={{ color: COLORS.slateLight }}>Livrable attendu</label>
            <input value={task.livrable || ''} onChange={e => onUpdate({ livrable: e.target.value })} placeholder="Ex : Plan validé, PV de réception…" className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: COLORS.border }} />
          </div>
          <div className="col-span-2">
            <label className="text-[10px]" style={{ color: COLORS.slateLight }}>Commentaires</label>
            <textarea value={task.commentaires || ''} onChange={e => onUpdate({ commentaires: e.target.value })} rows={2} placeholder="Notes, blocages, précisions…" className="w-full text-xs px-2 py-1.5 rounded-lg border resize-none" style={{ borderColor: COLORS.border }} />
          </div>
        </div>
      )}
    </div>
  );
}
