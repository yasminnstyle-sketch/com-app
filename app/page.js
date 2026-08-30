"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutGrid, Boxes, Wallet, Truck, Plus, X, ChevronRight,
  Search, Trash2, TrendingUp, TrendingDown, Star,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { CATALOG } from "../lib/catalog";

// ---------- constants ----------
const PROJECT_STATUSES = ["Новый", "Снабжение", "Производство", "Монтаж", "Готово"];
const STATUS_COLOR = {
  "Новый": "#8A7F72",
  "Снабжение": "#C1694F",
  "Производство": "#B08A3E",
  "Монтаж": "#5B7FA6",
  "Готово": "#6E8B5C",
};
const ITEM_STATUSES = ["Нужно", "Заказано", "Получено"];
const CATEGORY_COLOR = {
  "Материал": "#5B7FA6",
  "Фурнитура": "#B08A3E",
  "Аутсорс": "#7A6BA6",
  "Другое": "#8A7F72",
};
const money = (n) => (Number(n) || 0).toLocaleString("ru-RU") + " сум";

// ---------- data hook (Supabase) ----------
function useSupabaseData() {
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);
  const [cash, setCash] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [p, i, c, s, pay] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("items").select("*").order("created_at", { ascending: false }),
        supabase.from("cash").select("*").order("date", { ascending: false }),
        supabase.from("suppliers").select("*").order("created_at", { ascending: false }),
        supabase.from("payments").select("*").order("date", { ascending: false }),
      ]);
      if (p.error) throw p.error;
      setProjects(p.data || []);
      setItems(i.data || []);
      setCash(c.data || []);
      setSuppliers(s.data || []);
      setPayments(pay.data || []);
    } catch (e) {
      console.error(e);
      setError(e.message || String(e));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addProject = async (p) => {
    const { data, error } = await supabase.from("projects").insert({ status: "Новый", ...p }).select().single();
    if (!error) setProjects((prev) => [data, ...prev]);
  };
  const updateProject = async (id, patch) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    await supabase.from("projects").update(patch).eq("id", id);
  };
  const deleteProject = async (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setItems((prev) => prev.filter((i) => i.project_id !== id));
    setCash((prev) => prev.filter((c) => c.project_id !== id));
    await supabase.from("projects").delete().eq("id", id);
  };

  const addItem = async (it) => {
    const { data, error } = await supabase.from("items").insert({ status: "Нужно", priority: false, ...it }).select().single();
    if (!error) setItems((prev) => [data, ...prev]);
  };
  const updateItem = async (id, patch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    await supabase.from("items").update(patch).eq("id", id);
  };
  const deleteItem = async (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("items").delete().eq("id", id);
  };

  const addCash = async (c) => {
    const { data, error } = await supabase.from("cash").insert(c).select().single();
    if (!error) setCash((prev) => [data, ...prev]);
  };
  const deleteCash = async (id) => {
    setCash((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("cash").delete().eq("id", id);
  };

  const addSupplier = async (s) => {
    const { data, error } = await supabase.from("suppliers").insert(s).select().single();
    if (!error) setSuppliers((prev) => [data, ...prev]);
  };

  const addPayment = async (p) => {
    const { data, error } = await supabase.from("payments").insert(p).select().single();
    if (!error) setPayments((prev) => [data, ...prev]);
  };

  return {
    projects, items, cash, suppliers, payments, loaded, error,
    addProject, updateProject, deleteProject,
    addItem, updateItem, deleteItem,
    addCash, deleteCash,
    addSupplier, addPayment,
  };
}

// ---------- small UI atoms ----------
function Badge({ children, color }) {
  return (
    <span style={{ background: color + "1a", color, border: `1px solid ${color}40` }} className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant = "primary", small, disabled, type = "button" }) {
  const base = "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-40";
  const size = small ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm";
  const styles = {
    primary: "bg-[#5C3A21] text-[#F7F1E8] hover:bg-[#4A2E1A]",
    ghost: "bg-transparent text-[#5C3A21] hover:bg-[#5C3A21]/8",
    danger: "bg-transparent text-[#B4432F] hover:bg-[#B4432F]/10",
    subtle: "bg-[#EFE8DB] text-[#3A2E23] hover:bg-[#E4DAC8]",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${size} ${styles[variant]}`}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#8A7F72] mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-[#E4DAC8] bg-white px-3 py-2 text-sm text-[#2B2420] placeholder:text-[#B3A796] focus:outline-none focus:ring-2 focus:ring-[#5C3A21]/30 focus:border-[#5C3A21]";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-0 sm:p-4">
      <div className="bg-[#FBF8F2] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4DAC8] sticky top-0 bg-[#FBF8F2]">
          <h3 className="font-semibold text-[#2B2420]">{title}</h3>
          <button onClick={onClose} className="text-[#8A7F72] hover:text-[#2B2420]"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-[#B3A796]">
      <Icon size={28} className="mb-2 opacity-60" />
      <p className="text-sm font-medium text-[#8A7F72]">{text}</p>
      {sub && <p className="text-xs mt-1 max-w-xs">{sub}</p>}
    </div>
  );
}

// ---------- main page ----------
export default function Page() {
  const store = useSupabaseData();
  const [tab, setTab] = useState("projects");
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const [showNewCash, setShowNewCash] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [supplierFocus, setSupplierFocus] = useState(null);

  const { projects, items, cash, suppliers, payments, loaded, error } = store;

  const projectSpend = useCallback((pid) => cash.filter((c) => c.project_id === pid).reduce((s, c) => s + Number(c.amount || 0), 0), [cash]);
  const projectItemsCount = useCallback((pid) => items.filter((i) => i.project_id === pid).length, [items]);
  const projectUrgent = useCallback((pid) => items.filter((i) => i.project_id === pid && i.priority && i.status !== "Получено").length, [items]);
  const supplierBalance = useCallback((sid) => {
    const owed = payments.filter((p) => p.supplier_id === sid && p.type === "Начислено").reduce((s, p) => s + Number(p.amount || 0), 0);
    const paid = payments.filter((p) => p.supplier_id === sid && p.type === "Оплачено").reduce((s, p) => s + Number(p.amount || 0), 0);
    return owed - paid;
  }, [payments]);

  const totalCashOut = useMemo(() => cash.reduce((s, c) => s + Number(c.amount || 0), 0), [cash]);
  const totalOwed = useMemo(() => suppliers.reduce((s, sup) => s + Math.max(0, supplierBalance(sup.id)), 0), [suppliers, supplierBalance]);

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F7F1E8] text-[#8A7F72] text-sm">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F1E8] p-6">
        <div className="max-w-md text-center text-sm text-[#B4432F]">
          <p className="font-medium mb-2">Не удалось подключиться к базе данных</p>
          <p className="text-[#8A7F72]">{error}</p>
          <p className="text-[#8A7F72] mt-2">Проверь переменные NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F1E8] text-[#2B2420] flex flex-col md:flex-row" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <aside className="md:w-56 w-full bg-[#3A2E23] text-[#EFE4D3] flex md:flex-col shrink-0">
        <div className="hidden md:flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <div className="w-7 h-7 rounded-md bg-[#C1694F] flex items-center justify-center font-bold text-sm">C</div>
          <div>
            <div className="font-semibold text-sm leading-tight">Compacto</div>
            <div className="text-[10px] text-[#B3A796]">внутренняя система</div>
          </div>
        </div>
        <nav className="flex md:flex-col flex-1 md:py-3 overflow-x-auto md:overflow-visible">
          {[
            { id: "projects", label: "Проекты", icon: LayoutGrid },
            { id: "supply", label: "Снабжение", icon: Boxes },
            { id: "cash", label: "Касса", icon: Wallet },
            { id: "suppliers", label: "Поставщики", icon: Truck },
          ].map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id !== "supply") setActiveProjectId(null); }}
              className={`flex items-center gap-2.5 px-5 py-3 text-sm shrink-0 md:w-full transition-colors ${tab === t.id ? "bg-white/10 text-white font-medium" : "text-[#C9BBA3] hover:bg-white/5"}`}>
              <t.icon size={16} />{t.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#E4DAC8] border-b border-[#E4DAC8]">
          <StatCell label="Активных проектов" value={projects.filter((p) => p.status !== "Готово").length} />
          <StatCell label="Выдано налички" value={money(totalCashOut)} />
          <StatCell label="Должны поставщикам" value={money(totalOwed)} accent="#C1694F" />
          <StatCell label="Срочных позиций" value={items.filter((i) => i.priority && i.status !== "Получено").length} accent="#B08A3E" />
        </div>

        <div className="p-4 md:p-6">
          {tab === "projects" && (
            <ProjectsTab projects={projects} projectSpend={projectSpend} projectItemsCount={projectItemsCount} projectUrgent={projectUrgent}
              onOpen={(id) => { setActiveProjectId(id); setTab("supply"); }} onNew={() => setShowNewProject(true)}
              onUpdateStatus={(id, status) => store.updateProject(id, { status })} onDelete={store.deleteProject} />
          )}
          {tab === "supply" && (
            <SupplyTab projects={projects} items={items} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId}
              onNewItem={() => setShowNewItem(true)} onUpdateItem={store.updateItem} onDeleteItem={store.deleteItem} />
          )}
          {tab === "cash" && (
            <CashTab cash={cash} projects={projects} onNew={() => setShowNewCash(true)} onDelete={store.deleteCash} />
          )}
          {tab === "suppliers" && (
            <SuppliersTab suppliers={suppliers} payments={payments} balance={supplierBalance}
              onNewSupplier={() => setShowNewSupplier(true)} onNewPayment={(sid) => { setSupplierFocus(sid); setShowNewPayment(true); }} />
          )}
        </div>
      </main>

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onSave={async (p) => { await store.addProject(p); setShowNewProject(false); }} />}
      {showNewItem && <NewItemModal projects={projects} defaultProjectId={activeProjectId} onClose={() => setShowNewItem(false)} onSave={async (it) => { await store.addItem(it); setShowNewItem(false); }} />}
      {showNewCash && <NewCashModal projects={projects} defaultProjectId={activeProjectId} onClose={() => setShowNewCash(false)} onSave={async (c) => { await store.addCash(c); setShowNewCash(false); }} />}
      {showNewSupplier && <NewSupplierModal onClose={() => setShowNewSupplier(false)} onSave={async (s) => { await store.addSupplier(s); setShowNewSupplier(false); }} />}
      {showNewPayment && <NewPaymentModal suppliers={suppliers} projects={projects} defaultSupplierId={supplierFocus} onClose={() => setShowNewPayment(false)} onSave={async (p) => { await store.addPayment(p); setShowNewPayment(false); }} />}
    </div>
  );
}

function StatCell({ label, value, accent = "#5C3A21" }) {
  return (
    <div className="bg-[#FBF8F2] px-4 py-3">
      <div className="text-[11px] text-[#8A7F72] mb-0.5">{label}</div>
      <div className="text-lg font-semibold" style={{ color: accent }}>{value}</div>
    </div>
  );
}

// ---------- Projects tab ----------
function ProjectsTab({ projects, projectSpend, projectItemsCount, projectUrgent, onOpen, onNew, onUpdateStatus, onDelete }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Проекты</h2>
        <Btn onClick={onNew}><Plus size={15} /> Новый проект</Btn>
      </div>
      {projects.length === 0 ? (
        <EmptyState icon={LayoutGrid} text="Пока нет проектов" sub="Добавь первый проект — клиент, статус, и всё снабжение и касса будут привязаны к нему." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const urgent = projectUrgent(p.id);
            return (
              <div key={p.id} className="bg-[#FBF8F2] rounded-xl border border-[#E4DAC8] p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-[#8A7F72] truncate">{p.client}</div>
                  </div>
                  <button onClick={() => onDelete(p.id)} className="text-[#B3A796] hover:text-[#B4432F] shrink-0 ml-2"><Trash2 size={14} /></button>
                </div>
                <select value={p.status} onChange={(e) => onUpdateStatus(p.id, e.target.value)} style={{ color: STATUS_COLOR[p.status] }} className="text-xs font-medium rounded-full border px-2 py-1 mb-3 bg-white">
                  {PROJECT_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                <div className="flex items-center justify-between text-xs text-[#8A7F72] mb-3">
                  <span>{projectItemsCount(p.id)} позиций в снабжении</span>
                  {urgent > 0 && <Badge color="#C1694F">{urgent} срочно</Badge>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E4DAC8]">
                  <span className="text-sm font-medium">{money(projectSpend(p.id))}</span>
                  <button onClick={() => onOpen(p.id)} className="text-[#5C3A21] text-xs font-medium flex items-center gap-0.5 hover:gap-1.5 transition-all">Снабжение <ChevronRight size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Supply tab ----------
function SupplyTab({ projects, items, activeProjectId, setActiveProjectId, onNewItem, onUpdateItem, onDeleteItem }) {
  const [filter, setFilter] = useState("");
  const filtered = items.filter((i) => !activeProjectId || i.project_id === activeProjectId).filter((i) => i.name.toLowerCase().includes(filter.toLowerCase()));
  const projectName = (pid) => projects.find((p) => p.id === pid)?.name || "—";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Снабжение</h2>
        <Btn onClick={onNewItem}><Plus size={15} /> Позиция</Btn>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={activeProjectId || ""} onChange={(e) => setActiveProjectId(e.target.value || null)} className={inputCls + " max-w-xs"}>
          <option value="">Все проекты</option>
          {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3A796]" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Поиск позиции..." className={inputCls + " pl-8"} />
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Boxes} text="Нет позиций" sub="Добавь материалы, фурнитуру или задачи снабжения — с привязкой к проекту и приоритетом." />
      ) : (
        <div className="space-y-2">
          {filtered.slice().sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0)).map((it) => (
            <div key={it.id} className="bg-[#FBF8F2] rounded-lg border border-[#E4DAC8] p-3 flex items-center gap-3">
              <button onClick={() => onUpdateItem(it.id, { priority: !it.priority })} title="Срочно" className={it.priority ? "text-[#C1694F]" : "text-[#D8CDB8]"}>
                <Star size={16} fill={it.priority ? "currentColor" : "none"} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{it.name}</div>
                <div className="text-xs text-[#8A7F72] flex flex-wrap gap-x-2">
                  {it.category && <Badge color={CATEGORY_COLOR[it.category] || "#8A7F72"}>{it.category}</Badge>}
                  {!activeProjectId && <span>{projectName(it.project_id)}</span>}
                  {it.supplier && <span>· {it.supplier}</span>}
                  {it.qty && <span>· {it.qty} {it.unit || "шт"}</span>}
                </div>
              </div>
              {(it.price && it.qty) ? <div className="text-xs font-medium text-[#5C3A21] shrink-0 hidden sm:block">{money(Number(it.price) * Number(it.qty))}</div> : null}
              <select value={it.status} onChange={(e) => onUpdateItem(it.id, { status: e.target.value })} className="text-xs rounded-full border border-[#E4DAC8] px-2 py-1 bg-white shrink-0">
                {ITEM_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <button onClick={() => onDeleteItem(it.id)} className="text-[#B3A796] hover:text-[#B4432F] shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Cash tab ----------
function CashTab({ cash, projects, onNew, onDelete }) {
  const projectName = (pid) => projects.find((p) => p.id === pid)?.name || "Без проекта";
  const sorted = cash.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Касса</h2>
        <Btn onClick={onNew}><Plus size={15} /> Выдача</Btn>
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={Wallet} text="Пока нет записей" sub="Фиксируй каждую выдачу налички — кому, на что, по какому проекту." />
      ) : (
        <div className="bg-[#FBF8F2] rounded-xl border border-[#E4DAC8] divide-y divide-[#E4DAC8] overflow-hidden">
          {sorted.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="text-xs text-[#B3A796] w-20 shrink-0">{c.date}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{c.person} — {c.purpose}</div>
                <div className="text-xs text-[#8A7F72]">{projectName(c.project_id)}{c.note ? ` · ${c.note}` : ""}</div>
              </div>
              <div className="text-sm font-semibold shrink-0">{money(c.amount)}</div>
              <button onClick={() => onDelete(c.id)} className="text-[#B3A796] hover:text-[#B4432F] shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Suppliers tab ----------
function SuppliersTab({ suppliers, payments, balance, onNewSupplier, onNewPayment }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Поставщики</h2>
        <Btn onClick={onNewSupplier}><Plus size={15} /> Поставщик</Btn>
      </div>
      {suppliers.length === 0 ? (
        <EmptyState icon={Truck} text="Пока нет поставщиков" sub="Добавь поставщика, чтобы вести расчёты: начисления и оплаты." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => {
            const bal = balance(s.id);
            const supPayments = payments.filter((p) => p.supplier_id === s.id).sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 3);
            return (
              <div key={s.id} className="bg-[#FBF8F2] rounded-xl border border-[#E4DAC8] p-4">
                <div className="font-medium mb-1">{s.name}</div>
                <div className="text-xs text-[#8A7F72] mb-3">{s.category || "поставщик"}</div>
                <div className="flex items-center gap-1.5 mb-3">
                  {bal > 0 ? <TrendingUp size={14} className="text-[#C1694F]" /> : <TrendingDown size={14} className="text-[#6E8B5C]" />}
                  <span className="text-sm font-semibold" style={{ color: bal > 0 ? "#C1694F" : "#6E8B5C" }}>
                    {bal > 0 ? `Должны: ${money(bal)}` : bal < 0 ? `Переплата: ${money(-bal)}` : "Расчёт закрыт"}
                  </span>
                </div>
                {supPayments.length > 0 && (
                  <div className="space-y-1 mb-3 text-xs text-[#8A7F72]">
                    {supPayments.map((p) => (<div key={p.id} className="flex justify-between"><span>{p.type === "Начислено" ? "+" : "−"} {p.date}</span><span>{money(p.amount)}</span></div>))}
                  </div>
                )}
                <Btn variant="subtle" small onClick={() => onNewPayment(s.id)}>Запись расчёта</Btn>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Modals ----------
function NewProjectModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  return (
    <Modal title="Новый проект" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Название проекта"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Кухня — Ивановы" /></Field>
        <Field label="Клиент"><input value={client} onChange={(e) => setClient(e.target.value)} className={inputCls} placeholder="Имя клиента" /></Field>
        <div className="pt-2"><Btn disabled={!name} onClick={() => onSave({ name, client })}>Создать проект</Btn></div>
      </div>
    </Modal>
  );
}

function NewItemModal({ projects, defaultProjectId, onClose, onSave }) {
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || "");
  const [mode, setMode] = useState("catalog");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [supplier, setSupplier] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [priority, setPriority] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (const f of CATALOG.fittings) {
      if (f.name.toLowerCase().includes(q) || (f.brand || "").toLowerCase().includes(q) || (f.type || "").toLowerCase().includes(q)) {
        out.push({ kind: "Фурнитура", label: `${f.type} · ${f.brand} — ${f.name}`, name: f.name, category: "Фурнитура", supplier: f.brand, unit: "шт", price: f.price });
      }
    }
    for (const m of CATALOG.materials) {
      if (m.name.toLowerCase().includes(q)) out.push({ kind: "Материал", label: m.name, name: m.name, category: "Материал", supplier: "", unit: m.unit || "", price: m.price });
    }
    for (const o of CATALOG.outsource) {
      if (o.name.toLowerCase().includes(q)) out.push({ kind: "Аутсорс", label: o.name, name: o.name, category: "Аутсорс", supplier: "", unit: "", price: o.price });
    }
    return out.slice(0, 25);
  }, [query]);

  const pick = (r) => {
    setName(r.name); setCategory(r.category); setSupplier(r.supplier || ""); setUnit(r.unit || "");
    setPrice(r.price != null ? String(r.price) : ""); setQuery(""); setMode("manual");
  };

  return (
    <Modal title="Позиция снабжения" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Проект">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
            {projects.length === 0 && <option value="">Сначала создай проект</option>}
            {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </Field>
        {!name && (
          <div className="flex rounded-lg bg-[#EFE8DB] p-0.5 text-xs font-medium">
            <button onClick={() => setMode("catalog")} className={`flex-1 py-1.5 rounded-md ${mode === "catalog" ? "bg-white text-[#5C3A21] shadow-sm" : "text-[#8A7F72]"}`}>Из справочника</button>
            <button onClick={() => setMode("manual")} className={`flex-1 py-1.5 rounded-md ${mode === "manual" ? "bg-white text-[#5C3A21] shadow-sm" : "text-[#8A7F72]"}`}>Вручную</button>
          </div>
        )}
        {mode === "catalog" && !name && (
          <div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3A796]" />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} className={inputCls + " pl-8"} placeholder="Начни вводить: Blum, ЛДСП, малярка..." />
            </div>
            {results.length > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-[#E4DAC8] divide-y divide-[#E4DAC8] bg-white">
                {results.map((r, i) => (
                  <button key={i} onClick={() => pick(r)} className="w-full text-left px-3 py-2 text-xs hover:bg-[#F7F1E8] flex items-center justify-between gap-2">
                    <span className="min-w-0"><Badge color={CATEGORY_COLOR[r.category]}>{r.kind}</Badge> <span className="text-[#2B2420]">{r.label}</span></span>
                    {r.price != null && <span className="shrink-0 text-[#8A7F72]">${r.price}</span>}
                  </button>
                ))}
              </div>
            )}
            {query && results.length === 0 && <p className="text-xs text-[#B3A796] mt-2">Не нашлось в справочнике — можно добавить вручную.</p>}
          </div>
        )}
        {(mode === "manual" || name) && (
          <>
            <Field label="Название"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="ЛДСП белый, петли Blum..." /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Категория">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                  <option value="">—</option><option value="Материал">Материал</option><option value="Фурнитура">Фурнитура</option><option value="Аутсорс">Аутсорс</option><option value="Другое">Другое</option>
                </select>
              </Field>
              <Field label="Поставщик / бренд"><input value={supplier} onChange={(e) => setSupplier(e.target.value)} className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Кол-во"><input value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} placeholder="шт / м²" /></Field>
              <Field label={`Цена за ед.${unit ? ` (${unit})` : ""} $`}><input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} className={inputCls} placeholder="0" /></Field>
            </div>
          </>
        )}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} />Срочная позиция</label>
        <div className="pt-2">
          <Btn disabled={!name || !projectId} onClick={() => onSave({ project_id: projectId, name, category, supplier, unit, price: price || null, qty, priority })}>Добавить</Btn>
        </div>
      </div>
    </Modal>
  );
}

function NewCashModal({ projects, defaultProjectId, onClose, onSave }) {
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [person, setPerson] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal title="Выдача из кассы" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Проект (необязательно)">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
            <option value="">Без проекта</option>
            {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Кому"><input autoFocus value={person} onChange={(e) => setPerson(e.target.value)} className={inputCls} placeholder="Имя" /></Field>
          <Field label="На что"><input value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputCls} placeholder="Зарплата / закупка / такси" /></Field>
        </div>
        <Field label="Сумма"><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} className={inputCls} placeholder="0" /></Field>
        <Field label="Комментарий"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="Чек приложен и т.п." /></Field>
        <div className="pt-2">
          <Btn disabled={!person || !amount} onClick={() => onSave({ project_id: projectId || null, person, purpose, amount: Number(amount), note, date: new Date().toISOString().slice(0, 10) })}>Записать</Btn>
        </div>
      </div>
    </Modal>
  );
}

function NewSupplierModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  return (
    <Modal title="Новый поставщик" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Название"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="kis.uz, Hettich..." /></Field>
        <Field label="Категория"><input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} placeholder="фурнитура / ЛДСП / камень..." /></Field>
        <div className="pt-2"><Btn disabled={!name} onClick={() => onSave({ name, category })}>Добавить</Btn></div>
      </div>
    </Modal>
  );
}

function NewPaymentModal({ suppliers, projects, defaultSupplierId, onClose, onSave }) {
  const [supplierId, setSupplierId] = useState(defaultSupplierId || suppliers[0]?.id || "");
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState("Начислено");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal title="Запись расчёта" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Поставщик">
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputCls}>
            {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </Field>
        <Field label="Проект (необязательно)">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
            <option value="">Без проекта</option>
            {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Тип">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option value="Начислено">Начислено (долг)</option><option value="Оплачено">Оплачено</option>
            </select>
          </Field>
          <Field label="Сумма"><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} className={inputCls} placeholder="0" /></Field>
        </div>
        <Field label="Комментарий"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="За что" /></Field>
        <div className="pt-2">
          <Btn disabled={!supplierId || !amount} onClick={() => onSave({ supplier_id: supplierId, project_id: projectId || null, type, amount: Number(amount), note, date: new Date().toISOString().slice(0, 10) })}>Сохранить</Btn>
        </div>
      </div>
    </Modal>
  );
}
