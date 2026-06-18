import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = "https://nojqklljkixfenaedmeo.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vanFrbGxqa2l4ZmVuYWVkbWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTAyNTgsImV4cCI6MjA5NzM2NjI1OH0.nf-GkCk8kkyMsDgG8uLAL6c01UwbtMT702bG9izjpxA";
const supabase = createClient(SUPA_URL, SUPA_KEY);

// Converte snake_case do banco para cameCase do app
function dbToApp(p) {
  return {
    id: p.id, restaurante: p.restaurante, tipo: p.tipo, produto: p.produto,
    precoNormal: p.preco_normal, precoPromo: p.preco_promo,
    recorrencia: p.recorrencia, dias: p.dias || [],
    qtd: p.qtd, status: p.status,
    incRestaurante: p.inc_restaurante, incFranqueadora: p.inc_franqueadora,
    incLvto: p.inc_lvto, incTotal: p.inc_total,
    responsavel: p.responsavel, cidade: p.cidade, obs: p.obs,
  };
}

function appToDB(p) {
  return {
    id: p.id, restaurante: p.restaurante, tipo: p.tipo, produto: p.produto,
    preco_normal: p.precoNormal || null, preco_promo: p.precoPromo || null,
    recorrencia: p.recorrencia, dias: p.dias || [],
    qtd: p.qtd || null, status: p.status,
    inc_restaurante: p.incRestaurante || 0, inc_franqueadora: p.incFranqueadora || 0,
    inc_lvto: p.incLvto || 0, inc_total: p.incTotal || 0,
    responsavel: p.responsavel, cidade: p.cidade, obs: p.obs,
  };
}

function cupomToDB(c) {
  return {
    id: c.id, codigo: c.codigo, tipo_desconto: c.tipoDesconto,
    valor: c.valor ? parseFloat(c.valor) : null,
    pedido_min: c.pedidoMin ? parseFloat(c.pedidoMin) : null,
    aplicar_para: c.aplicarPara, loja_especifica: c.lojaEspecifica || null,
    curvas: c.curvas || [], quem_banca: c.quemBanca,
    pct_loja: c.pctLoja ? parseFloat(c.pctLoja) : null,
    pct_franquia: c.pctFranquia ? parseFloat(c.pctFranquia) : null,
    recorrencia: c.recorrencia, dias: c.dias || [],
    data_inicio: c.dataInicio || null, data_fim: c.dataFim || null,
    status: c.status, obs: c.obs || null,
  };
}

function dbToCupom(c) {
  return {
    id: c.id, codigo: c.codigo, tipoDesconto: c.tipo_desconto,
    valor: c.valor ? String(c.valor) : "",
    pedidoMin: c.pedido_min ? String(c.pedido_min) : "",
    aplicarPara: c.aplicar_para, lojaEspecifica: c.loja_especifica || "",
    curvas: c.curvas || [], quemBanca: c.quem_banca,
    pctLoja: c.pct_loja ? String(c.pct_loja) : "",
    pctFranquia: c.pct_franquia ? String(c.pct_franquia) : "",
    recorrencia: c.recorrencia, dias: c.dias || [],
    dataInicio: c.data_inicio || "", dataFim: c.data_fim || "",
    status: c.status, obs: c.obs || "",
  };
}

const DIAS_SEMANA = ["SEG","TER","QUA","QUI","SEX","SAB","DOM"];
const DIAS_LABEL  = { SEG:"Seg", TER:"Ter", QUA:"Qua", QUI:"Qui", SEX:"Sex", SAB:"Sáb", DOM:"Dom" };

const STATUS_CONFIG = {
  ATIVA:            { label:"Ativa",           color:"#00C853", bg:"#E8F5E9", dot:"#00C853" },
  PAUSADA:          { label:"Pausada",          color:"#FF9800", bg:"#FFF3E0", dot:"#FF9800" },
  DESABILITADA:     { label:"Desabilitada",     color:"#F44336", bg:"#FFEBEE", dot:"#F44336" },
  CADASTRADA:       { label:"Cadastrada",       color:"#2196F3", bg:"#E3F2FD", dot:"#2196F3" },
  "NAO CADASTRADA": { label:"Não Cadastrada",   color:"#9E9E9E", bg:"#F5F5F5", dot:"#9E9E9E" },
  "":               { label:"Sem Status",       color:"#9E9E9E", bg:"#F5F5F5", dot:"#9E9E9E" },
};

const TIPO_CONFIG = {
  "DE/POR":              { icon:"🏷️", label:"De/Por" },
  "COMBO COCA-COLA":     { icon:"🥤", label:"Combo Coca-Cola" },
  "ENTREGA GRATIS":      { icon:"🚚", label:"Entrega Grátis" },
  "ENTREGA PROMOCIONAL": { icon:"📦", label:"Entrega Promocional" },
};

// Converte string legada de dias p/ array
function parseDias(str) {
  if (!str) return [];
  if (str === "TODOS DIAS") return [...DIAS_SEMANA];
  const map = {
    SEGUNDA:"SEG", TERCA:"TER", QUARTA:"QUA", QUINTA:"QUI",
    SEXTA:"SEX", SABADO:"SAB", DOMINGO:"DOM",
    SEG:"SEG", TER:"TER", QUA:"QUA", QUI:"QUI", SEX:"SEX", SAB:"SAB", DOM:"DOM",
  };
  return str.split(/[,/\s]+/).map(d => map[d.trim().toUpperCase()]).filter(Boolean);
}

function formatDias(arr) {
  if (!arr || arr.length === 0) return "—";
  if (arr.length === 7) return "Todos os dias";
  return arr.map(d => DIAS_LABEL[d] || d).join(", ");
}

const INICIAL = [
  { id:"PROMO-0008", restaurante:"Grand Pastel Santanense", tipo:"COMBO COCA-COLA",      produto:"Frango Catupiry G + Coca 350ml",  precoNormal:29.0,  precoPromo:23.99, recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:null,  status:"DESABILITADA", incRestaurante:2,     incFranqueadora:1,    incLvto:2,    incTotal:5,     responsavel:"Lucas Rodrigues", cidade:"Livramento",  obs:"Sem limite por mês." },
  { id:"PROMO-0009", restaurante:"Quiero Café",             tipo:"ENTREGA GRATIS",        produto:"-",                               precoNormal:null,  precoPromo:null,  recorrencia:"SEMANAL", dias:["TER"],                                      qtd:null,  status:"ATIVA",        incRestaurante:0,     incFranqueadora:0,    incLvto:3.5,  incTotal:3.5,   responsavel:"Igor Pretto",    cidade:"Livramento",  obs:"Só no centro." },
  { id:"PROMO-0013", restaurante:"Buffalo Bill",            tipo:"DE/POR",                produto:"Old West Kids",                   precoNormal:null,  precoPromo:null,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"PAUSADA",      incRestaurante:4.5,   incFranqueadora:2,    incLvto:2.51, incTotal:9.01,  responsavel:"Lucas Rodrigues", cidade:"Livramento",  obs:"Total de 100 combos. 2 por pedido." },
  { id:"PROMO-0014", restaurante:"Buffalo Bill",            tipo:"DE/POR",                produto:"Touro Sentado",                   precoNormal:null,  precoPromo:null,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"PAUSADA",      incRestaurante:4.5,   incFranqueadora:2,    incLvto:2.51, incTotal:9.01,  responsavel:"Lucas Rodrigues", cidade:"Livramento",  obs:"Até 2 por pedido." },
  { id:"PROMO-0015", restaurante:"Sandubão",                tipo:"DE/POR",                produto:"Sambarilove",                     precoNormal:null,  precoPromo:null,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"PAUSADA",      incRestaurante:4.5,   incFranqueadora:2,    incLvto:2.51, incTotal:9.01,  responsavel:"Lucas Rodrigues", cidade:"Livramento",  obs:"Até 2 por pedido." },
  { id:"PROMO-0016", restaurante:"Sandubão",                tipo:"DE/POR",                produto:"Xis Salada",                      precoNormal:null,  precoPromo:null,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"PAUSADA",      incRestaurante:2.5,   incFranqueadora:2,    incLvto:2.51, incTotal:7.01,  responsavel:"Lucas Rodrigues", cidade:"Livramento",  obs:"Até 2 por pedido." },
  { id:"PROMO-0019", restaurante:"Senna Point",             tipo:"DE/POR",                produto:"Mc Laren",                        precoNormal:null,  precoPromo:null,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"PAUSADA",      incRestaurante:5.5,   incFranqueadora:2,    incLvto:3.5,  incTotal:11,    responsavel:"Lucas Rodrigues", cidade:"Livramento",  obs:"Até 2 por pedido." },
  { id:"PROMO-0031", restaurante:"Feira Central",           tipo:"ENTREGA GRATIS",        produto:"-",                               precoNormal:null,  precoPromo:null,  recorrencia:"SEMANAL", dias:["QUI"],                                      qtd:null,  status:"ATIVA",        incRestaurante:0,     incFranqueadora:0,    incLvto:0,    incTotal:0,     responsavel:"Igor Pretto",    cidade:"Livramento",  obs:"Acima de R$70." },
  { id:"PROMO-0032", restaurante:"Burger House",            tipo:"DE/POR",                produto:"Burger + Coca-Cola 350ml",        precoNormal:41.0,  precoPromo:31.99, recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"DESABILITADA", incRestaurante:4.5,   incFranqueadora:2,    incLvto:2.51, incTotal:9.01,  responsavel:"Lucas Rodrigues", cidade:"Livramento",  obs:"Até 2 por pedido." },
  { id:"PROMO-0034", restaurante:"Hot Dog do Pedrinho",     tipo:"ENTREGA PROMOCIONAL",   produto:"Entrega por 3,99",               precoNormal:null,  precoPromo:null,  recorrencia:"SEMANAL", dias:["TER","SEX"],                                qtd:null,  status:"ATIVA",        incRestaurante:2,     incFranqueadora:0,    incLvto:2,    incTotal:4,     responsavel:"Igor Pretto",    cidade:"Livramento",  obs:"Terças e sextas por 3,99." },
  { id:"PROMO-0035", restaurante:"A Melhor",                tipo:"ENTREGA GRATIS",        produto:"-",                               precoNormal:null,  precoPromo:null,  recorrencia:"SEMANAL", dias:["QUI"],                                      qtd:null,  status:"ATIVA",        incRestaurante:0,     incFranqueadora:0,    incLvto:0,    incTotal:0,     responsavel:"Igor Pretto",    cidade:"Livramento",  obs:"Pedido mínimo R$80." },
  { id:"PROMO-0036", restaurante:"KV Lanches",              tipo:"ENTREGA GRATIS",        produto:"-",                               precoNormal:null,  precoPromo:null,  recorrencia:"SEMANAL", dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:null,  status:"ATIVA",        incRestaurante:0,     incFranqueadora:0,    incLvto:0,    incTotal:0,     responsavel:"Igor Pretto",    cidade:"Livramento",  obs:"A partir de R$80." },
  { id:"PROMO-0037", restaurante:"Ágape Farma",             tipo:"ENTREGA GRATIS",        produto:"-",                               precoNormal:null,  precoPromo:null,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:null,  status:"ATIVA",        incRestaurante:0,     incFranqueadora:0,    incLvto:0,    incTotal:0,     responsavel:"Igor Pretto",    cidade:"Livramento",  obs:"Acima de R$70." },
  { id:"PROMO-0038", restaurante:"A Melhor Pizzaria",       tipo:"DE/POR",                produto:"Pizza Salgada Grande",            precoNormal:104.9, precoPromo:49.99, recorrencia:"SEMANAL", dias:["TER"],                                      qtd:null,  status:"ATIVA",        incRestaurante:54.91, incFranqueadora:0,    incLvto:0,    incTotal:54.91, responsavel:"Lucas Rodrigues", cidade:"Livramento",  obs:"Subsídio total da loja." },
  { id:"SG-0001",   restaurante:"Grand Pastel Santanense", tipo:"COMBO COCA-COLA",       produto:"Frango Catupiry G + Coca 350ml",  precoNormal:29.0,  precoPromo:23.99, recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:null,  status:"ATIVA",        incRestaurante:2,     incFranqueadora:1,    incLvto:2,    incTotal:5,     responsavel:"Lucas Rodrigues", cidade:"São Gabriel", obs:"Sem limite por mês." },
  { id:"SG-0002",   restaurante:"Buffalo Bill",            tipo:"DE/POR",                produto:"Old West Kids",                   precoNormal:31.0,  precoPromo:21.99, recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"PAUSADA",      incRestaurante:4.5,   incFranqueadora:2,    incLvto:2.51, incTotal:9.01,  responsavel:"Lucas Rodrigues", cidade:"São Gabriel", obs:"2 por pedido." },
  { id:"SG-0003",   restaurante:"Senna Point",             tipo:"DE/POR",                produto:"Mc Laren + Coca-Cola 350ml",      precoNormal:50.9,  precoPromo:39.9,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"PAUSADA",      incRestaurante:5.5,   incFranqueadora:2,    incLvto:3.5,  incTotal:11,    responsavel:"Lucas Rodrigues", cidade:"São Gabriel", obs:"Total de 100 combos." },
  { id:"SG-0004",   restaurante:"Tay Lanches",             tipo:"DE/POR",                produto:"Xis Família + Coca-Cola 1L",      precoNormal:69.8,  precoPromo:60.89, recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"PAUSADA",      incRestaurante:4.5,   incFranqueadora:2,    incLvto:2.51, incTotal:9.01,  responsavel:"Lucas Rodrigues", cidade:"São Gabriel", obs:"Total de 100 combos." },
  { id:"SG-0005",   restaurante:"A Melhor Pizzaria",       tipo:"DE/POR",                produto:"Pizza Salgada Grande",            precoNormal:104.9, precoPromo:49.99, recorrencia:"SEMANAL", dias:["TER"],                                      qtd:null,  status:"ATIVA",        incRestaurante:54.91, incFranqueadora:0,    incLvto:0,    incTotal:54.91, responsavel:"Lucas Rodrigues", cidade:"São Gabriel", obs:"Todas as terças." },
  { id:"ORC-0001",  restaurante:"Buffalo Bill",            tipo:"DE/POR",                produto:"Old West Kids (BARATÍSSIMOS)",    precoNormal:31.0,  precoPromo:null,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"CADASTRADA",   incRestaurante:4.5,   incFranqueadora:4.51, incLvto:0,    incTotal:9.01,  responsavel:"Lucas Rodrigues", cidade:"Orçamento",   obs:"100 produtos por loja." },
  { id:"ORC-0002",  restaurante:"Saideira Bar",            tipo:"DE/POR",                produto:"Xis Salada (BARATÍSSIMOS)",       precoNormal:24.0,  precoPromo:null,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"CADASTRADA",   incRestaurante:4.5,   incFranqueadora:4.51, incLvto:0,    incTotal:9.01,  responsavel:"Lucas Rodrigues", cidade:"Orçamento",   obs:"100 produtos por loja." },
  { id:"ORC-0003",  restaurante:"Quiero Café",             tipo:"DE/POR",                produto:"À cavalo (BARATÍSSIMOS)",         precoNormal:34.9,  precoPromo:null,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"CADASTRADA",   incRestaurante:5,     incFranqueadora:5,    incLvto:0,    incTotal:10,    responsavel:"Lucas Rodrigues", cidade:"Orçamento",   obs:"100 produtos por loja." },
  { id:"ORC-0004",  restaurante:"Marchi Hamburgueria",     tipo:"DE/POR",                produto:"Cheese Salada (BARATÍSSIMOS)",    precoNormal:32.0,  precoPromo:null,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:100,   status:"CADASTRADA",   incRestaurante:4.5,   incFranqueadora:4.51, incLvto:0,    incTotal:9.01,  responsavel:"Lucas Rodrigues", cidade:"Orçamento",   obs:"100 produtos por loja." },
  { id:"ORC-0005",  restaurante:"Hot Dog do Dani",         tipo:"DE/POR",                produto:"Dog Vira Lata (BARATÍSSIMOS)",   precoNormal:14.0,  precoPromo:null,  recorrencia:"MENSAL",  dias:["SEG","TER","QUA","QUI","SEX","SAB","DOM"], qtd:50,    status:"CADASTRADA",   incRestaurante:0,     incFranqueadora:4.09, incLvto:0,    incTotal:4.09,  responsavel:"Lucas Rodrigues", cidade:"Orçamento",   obs:"100 produtos por loja." },
];

const fmt = (v) => v != null ? `R$ ${Number(v).toFixed(2).replace(".", ",")}` : "—";
const desconto = (n, p) => n && p ? Math.round(((n - p) / n) * 100) : null;
const gerarId = (cidade) => {
  const prefix = cidade === "Livramento" ? "PROMO" : cidade === "São Gabriel" ? "SG" : "ORC";
  return `${prefix}-${Date.now().toString().slice(-5)}`;
};

// ── Seletor de dias da semana ──────────────────────────────────────────────
function DiasSemanaSelector({ value = [], onChange }) {
  const toggle = (dia) => {
    if (dia === "TODOS") {
      onChange(value.length === 7 ? [] : [...DIAS_SEMANA]);
      return;
    }
    const next = value.includes(dia) ? value.filter(d => d !== dia) : [...value, dia];
    onChange(next);
  };
  const todos = value.length === 7;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      <button type="button" onClick={() => toggle("TODOS")} style={{
        padding:"5px 12px", borderRadius:20, border:"1.5px solid",
        borderColor: todos ? "#FF5000" : "#E0E0E0",
        background: todos ? "#FF5000" : "#fff",
        color: todos ? "#fff" : "#888",
        fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.15s",
      }}>Todos</button>
      {DIAS_SEMANA.map(d => {
        const sel = value.includes(d);
        return (
          <button key={d} type="button" onClick={() => toggle(d)} style={{
            width:40, padding:"5px 0", borderRadius:20, border:"1.5px solid",
            borderColor: sel ? "#FF5000" : "#E0E0E0",
            background: sel ? "#FFF0EB" : "#fff",
            color: sel ? "#FF5000" : "#aaa",
            fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.15s",
          }}>{DIAS_LABEL[d]}</button>
        );
      })}
    </div>
  );
}

// ── Badge de status ────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG[""];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:20,
      background:cfg.bg, color:cfg.color,
      fontSize:11, fontWeight:700,
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot, flexShrink:0 }} />
      {cfg.label}
    </span>
  );
}

// ── Chips de dias no card ──────────────────────────────────────────────────
function DiaChips({ dias }) {
  if (!dias || dias.length === 0) return <span style={{ fontSize:11, color:"#bbb" }}>—</span>;
  if (dias.length === 7) return (
    <span style={{ fontSize:11, background:"#F5F5F5", color:"#777", padding:"2px 8px", borderRadius:8, fontWeight:600 }}>Todos os dias</span>
  );
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
      {dias.map(d => (
        <span key={d} style={{ fontSize:10, background:"#FFF0EB", color:"#FF5000", padding:"2px 7px", borderRadius:8, fontWeight:700 }}>
          {DIAS_LABEL[d]}
        </span>
      ))}
    </div>
  );
}

// ── Card de promoção ───────────────────────────────────────────────────────
function Card({ p, onClick }) {
  const desc = desconto(p.precoNormal, p.precoPromo);
  const tipoInfo = TIPO_CONFIG[p.tipo] || { icon:"🎯", label:p.tipo };
  return (
    <div onClick={() => onClick(p)} style={{
      background:"#fff", borderRadius:16, padding:"18px 20px",
      border:"1px solid #F0F0F0", cursor:"pointer",
      transition:"all 0.15s", boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow="0 4px 20px rgba(255,80,0,0.12)"; e.currentTarget.style.borderColor="#FF5000"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor="#F0F0F0"; }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ fontSize:11, color:"#999", fontWeight:600 }}>{p.id}</div>
        <StatusBadge status={p.status} />
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:"#1A1A1A", marginBottom:4, lineHeight:1.3 }}>{p.restaurante}</div>
      <div style={{ fontSize:12, color:"#666", marginBottom:10 }}>{tipoInfo.icon} {p.produto !== "-" ? p.produto : tipoInfo.label}</div>

      {/* Preços */}
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:10 }}>
        {p.precoNormal && <span style={{ fontSize:12, color:"#bbb", textDecoration:"line-through" }}>{fmt(p.precoNormal)}</span>}
        {p.precoPromo  && <span style={{ fontSize:16, fontWeight:800, color:"#FF5000" }}>{fmt(p.precoPromo)}</span>}
        {desc && <span style={{ background:"#FF5000", color:"#fff", fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:10 }}>-{desc}%</span>}
        {!p.precoNormal && !p.precoPromo && <span style={{ fontSize:13, color:"#888" }}>Entrega grátis</span>}
      </div>

      {/* Dias */}
      <div style={{ marginBottom:8 }}><DiaChips dias={p.dias} /></div>

      {/* Tags inferiores */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:11, background:"#F5F5F5", color:"#555", padding:"3px 8px", borderRadius:8, fontWeight:600 }}>📅 {p.recorrencia}</span>
        <span style={{ fontSize:11, background:"#F5F5F5", color:"#555", padding:"3px 8px", borderRadius:8, fontWeight:600 }}>📍 {p.cidade}</span>
        {p.qtd && <span style={{ fontSize:11, background:"#E3F2FD", color:"#1565C0", padding:"3px 8px", borderRadius:8, fontWeight:700 }}>📦 {p.qtd} un.</span>}
        {(() => { const u=(p.incRestaurante||0)+(p.incFranqueadora||0)+(p.incLvto||0); const prev=p.qtd?u*p.qtd:null; return u>0?(<span style={{ fontSize:11, background:"#FFF3E0", color:"#E65100", padding:"3px 8px", borderRadius:8, fontWeight:600 }}>💰 {fmt(u)}/un{prev?` · Prev. ${fmt(prev)}`:""}</span>):null; })()}
      </div>
    </div>
  );
}

// ── Modal de detalhe / edição ──────────────────────────────────────────────
const EMPTY = {
  id:"", restaurante:"", tipo:"DE/POR", produto:"", precoNormal:"", precoPromo:"",
  recorrencia:"SEMANAL", dias:[], qtd:"", status:"ATIVA",
  incRestaurante:"", incFranqueadora:"", incLvto:"", incTotal:0,
  responsavel:"", cidade:"Livramento", obs:"",
};

function Modal({ p, modo, onClose, onSave, onDelete }) {
  const editando = modo === "editar" || modo === "novo";
  const [form, setForm] = useState(() => {
    if (modo === "novo") return { ...EMPTY };
    return { ...p, precoNormal: p.precoNormal ?? "", precoPromo: p.precoPromo ?? "",
              incRestaurante: p.incRestaurante ?? "", incFranqueadora: p.incFranqueadora ?? "",
              incLvto: p.incLvto ?? "", qtd: p.qtd ?? "" };
  });

  const set = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      const r = parseFloat(next.incRestaurante) || 0;
      const fr = parseFloat(next.incFranqueadora) || 0;
      const lv = parseFloat(next.incLvto) || 0;
      next.incTotal = r + fr + lv;
      return next;
    });
  };

  const inp = {
    border:"1.5px solid #E8E8E8", borderRadius:10, padding:"8px 12px",
    fontSize:13, background:"#FAFAFA", color:"#333", outline:"none",
    fontFamily:"inherit", width:"100%", boxSizing:"border-box",
  };
  const lbl = { fontSize:11, fontWeight:700, color:"#999", marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:0.4 };

  if (!p && modo === "ver") return null;

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:24, padding:28,
        maxWidth:540, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)",
        maxHeight:"92vh", overflowY:"auto",
      }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontSize:15, fontWeight:800, color:"#1A1A1A" }}>
            {modo === "novo" ? "Nova Promoção" : modo === "editar" ? "Editar Promoção" : form.restaurante}
          </span>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#999", lineHeight:1 }}>×</button>
        </div>

        {/* Modo visualização */}
        {modo === "ver" && (
          <>
            <div style={{ fontSize:13, color:"#666", marginBottom:12 }}>{(TIPO_CONFIG[p.tipo] || {}).icon} {p.tipo}</div>
            <StatusBadge status={p.status} />
            <div style={{ height:1, background:"#F0F0F0", margin:"16px 0" }} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              {[
                ["Produto", p.produto !== "-" ? p.produto : "—"],
                ["Recorrência", p.recorrencia],
                ["Cidade", p.cidade],
                ["Preço Normal", fmt(p.precoNormal)],
                ["Preço Promo", p.precoPromo ? fmt(p.precoPromo) : "—"],
                ["Desconto", desconto(p.precoNormal, p.precoPromo) ? `${desconto(p.precoNormal, p.precoPromo)}%` : "—"],
                ["Qtd. de itens", p.qtd ? `${p.qtd} unidades` : "Sem limite"],
                ["Responsável", (p.responsavel || "").split("@")[0]],
              ].map(([label, val]) => (
                <div key={label} style={{ background:"#FAFAFA", borderRadius:10, padding:"10px 14px" }}>
                  <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1A1A1A" }}>{val}</div>
                </div>
              ))}
            </div>
            {/* Bloco de incentivos detalhado */}
            {(() => {
              const unitario = (p.incRestaurante||0) + (p.incFranqueadora||0) + (p.incLvto||0);
              const previsto = p.qtd ? unitario * p.qtd : null;
              return (
                <div style={{ background:"#FFF8F5", borderRadius:12, padding:"14px 16px", border:"1px solid #FFE0CC", marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#FF5000", textTransform:"uppercase", letterSpacing:0.4, marginBottom:10 }}>💰 Incentivos</div>
                  {/* Linha por parte com unitário + previsto */}
                  {[
                    ["🏪 Restaurante", p.incRestaurante, "#2E7D32", "#E8F5E9", "#C8E6C9"],
                    ["🏢 Franqueadora", p.incFranqueadora, "#1565C0", "#E3F2FD", "#BBDEFB"],
                    ["🚀 DM (lvto)",    p.incLvto,          "#E65100", "#FFF3E0", "#FFE0B2"],
                  ].map(([lbl, val, cor, bg, borda]) => {
                    const v = val || 0;
                    const prev = p.qtd ? v * p.qtd : null;
                    return (
                      <div key={lbl} style={{ background:bg, borderRadius:10, padding:"10px 14px", border:`1px solid ${borda}`, marginBottom:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontSize:11, fontWeight:700, color:cor, marginBottom:2 }}>{lbl}</div>
                            <div style={{ fontSize:13, fontWeight:600, color:"#555" }}>{fmt(v)}<span style={{ fontSize:10, color:"#aaa", marginLeft:4 }}>/ item</span></div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:10, color:"#aaa", marginBottom:2 }}>Investimento previsto</div>
                            {prev != null
                              ? <div style={{ fontSize:16, fontWeight:800, color:cor }}>{fmt(prev)}</div>
                              : <div style={{ fontSize:12, color:"#ccc" }}>QTD não definida</div>
                            }
                            {prev != null && <div style={{ fontSize:10, color:"#aaa" }}>{p.qtd} un. × {fmt(v)}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Total geral */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid #FFE0CC", paddingTop:10, marginTop:4 }}>
                    <div>
                      <div style={{ fontSize:11, color:"#aaa", fontWeight:600 }}>Total unitário / item</div>
                      <div style={{ fontSize:15, fontWeight:800, color:"#E65100" }}>{fmt(unitario)}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:11, color:"#aaa", fontWeight:600 }}>Total previsto</div>
                      {previsto != null
                        ? <div style={{ fontSize:18, fontWeight:800, color:"#FF5000" }}>{fmt(previsto)}</div>
                        : <div style={{ fontSize:13, color:"#ccc" }}>QTD não definida</div>
                      }
                      {previsto != null && <div style={{ fontSize:10, color:"#bbb" }}>{p.qtd} un. × {fmt(unitario)}</div>}
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* Dias */}
            <div style={{ background:"#FAFAFA", borderRadius:10, padding:"10px 14px", marginBottom:12 }}>
              <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase", marginBottom:6 }}>Dias da semana</div>
              <DiaChips dias={p.dias} />
            </div>
            {p.obs && (
              <div style={{ background:"#FAFAFA", borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
                <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>Observações</div>
                <div style={{ fontSize:13, color:"#555" }}>{p.obs}</div>
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => onSave(p, "editar")} style={{ flex:1, padding:"10px", borderRadius:12, border:"none", background:"#FF5000", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13 }}>Editar</button>
              <button onClick={() => onDelete(p.id)} style={{ padding:"10px 16px", borderRadius:12, border:"1.5px solid #FFEBEE", background:"#fff", color:"#F44336", fontWeight:700, cursor:"pointer", fontSize:13 }}>Excluir</button>
            </div>
          </>
        )}

        {/* Modo edição / novo */}
        {editando && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Restaurante *</label>
                <input style={inp} value={form.restaurante} onChange={e => set("restaurante", e.target.value)} placeholder="Nome do restaurante" />
              </div>
              <div>
                <label style={lbl}>Tipo de promoção *</label>
                <select style={inp} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                  {Object.keys(TIPO_CONFIG).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Status *</label>
                <select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>
                  {Object.keys(STATUS_CONFIG).filter(k => k).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Produto</label>
                <input style={inp} value={form.produto} onChange={e => set("produto", e.target.value)} placeholder="Nome do produto ou combo" />
              </div>
              <div>
                <label style={lbl}>Preço normal (R$)</label>
                <input style={inp} type="number" step="0.01" value={form.precoNormal} onChange={e => set("precoNormal", e.target.value)} placeholder="0,00" />
              </div>
              <div>
                <label style={lbl}>Preço promo (R$)</label>
                <input style={inp} type="number" step="0.01" value={form.precoPromo} onChange={e => set("precoPromo", e.target.value)} placeholder="0,00" />
              </div>

              {/* QTD de itens — destaque */}
              <div>
                <label style={lbl}>📦 Qtd. de itens (limite)</label>
                <input style={{ ...inp, borderColor:"#1565C0", background:"#EEF4FF" }} type="number" min="1" value={form.qtd} onChange={e => set("qtd", e.target.value)} placeholder="Ex: 100 (deixe vazio = sem limite)" />
              </div>

              <div>
                <label style={lbl}>Recorrência</label>
                <select style={inp} value={form.recorrencia} onChange={e => set("recorrencia", e.target.value)}>
                  <option value="SEMANAL">Semanal</option>
                  <option value="MENSAL">Mensal</option>
                  <option value="UNICA">Única</option>
                </select>
              </div>

              {/* Dias da semana — destaque */}
              <div style={{ gridColumn:"1/-1" }}>
                <label style={{ ...lbl, color:"#FF5000" }}>📅 Dias da semana *</label>
                <DiasSemanaSelector value={form.dias} onChange={v => set("dias", v)} />
                {form.dias.length > 0 && (
                  <div style={{ fontSize:11, color:"#999", marginTop:6 }}>
                    Selecionado: {formatDias(form.dias)}
                  </div>
                )}
              </div>

              <div>
                <label style={lbl}>Cidade</label>
                <select style={inp} value={form.cidade} onChange={e => set("cidade", e.target.value)}>
                  <option>Livramento</option>
                  <option>São Gabriel</option>
                  <option>Orçamento</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Responsável</label>
                <input style={inp} value={form.responsavel} onChange={e => set("responsavel", e.target.value)} placeholder="Nome ou e-mail" />
              </div>

              {/* Incentivos */}
              <div style={{ gridColumn:"1/-1", background:"#FAFAFA", borderRadius:12, padding:"12px 14px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#FF5000", marginBottom:4, textTransform:"uppercase" }}>💰 Incentivos por item</div>
                <div style={{ fontSize:11, color:"#bbb", marginBottom:10 }}>Valor que cada parte investe por unidade vendida</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[["incRestaurante","Restaurante"], ["incFranqueadora","Franqueadora"], ["incLvto","DM (lvto)"]].map(([k, label]) => (
                    <div key={k}>
                      <label style={lbl}>{label} / item</label>
                      <input style={inp} type="number" step="0.01" value={form[k]} onChange={e => set(k, e.target.value)} placeholder="0,00" />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"flex-end", borderTop:"1px solid #FFE0CC", paddingTop:8 }}>
                  <div>
                    <div style={{ fontSize:10, color:"#aaa", fontWeight:600, textTransform:"uppercase" }}>Unitário por item</div>
                    <div style={{ fontSize:14, fontWeight:800, color:"#E65100" }}>{fmt(form.incTotal)}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, color:"#aaa", fontWeight:600, textTransform:"uppercase" }}>Investimento previsto</div>
                    {form.qtd && form.incTotal > 0
                      ? <div style={{ fontSize:16, fontWeight:800, color:"#FF5000" }}>{fmt(form.incTotal * parseInt(form.qtd))}<span style={{ fontSize:10, color:"#bbb", fontWeight:400, marginLeft:4 }}>{form.qtd} un.</span></div>
                      : <div style={{ fontSize:12, color:"#ccc" }}>Informe a QTD</div>
                    }
                  </div>
                </div>
              </div>

              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Observações</label>
                <textarea style={{ ...inp, resize:"vertical", minHeight:60 }} value={form.obs} onChange={e => set("obs", e.target.value)} placeholder="Limite por pedido, bairros, condições..." />
              </div>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => {
                const novoId = modo === "novo" ? gerarId(form.cidade) : form.id;
                const pn = form.precoNormal !== "" ? parseFloat(form.precoNormal) : null;
                const pp = form.precoPromo  !== "" ? parseFloat(form.precoPromo)  : null;
                const qt = form.qtd !== "" ? parseInt(form.qtd) : null;
                onSave({ ...form, id:novoId, precoNormal:pn, precoPromo:pp, qtd:qt,
                  incRestaurante:parseFloat(form.incRestaurante)||0,
                  incFranqueadora:parseFloat(form.incFranqueadora)||0,
                  incLvto:parseFloat(form.incLvto)||0,
                });
              }} style={{ flex:1, padding:"11px", borderRadius:12, border:"none", background:"#FF5000", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14 }}>
                {modo === "novo" ? "Criar promoção" : "Salvar alterações"}
              </button>
              <button onClick={onClose} style={{ padding:"11px 18px", borderRadius:12, border:"1.5px solid #E0E0E0", background:"#fff", color:"#777", fontWeight:600, cursor:"pointer" }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers de data ───────────────────────────────────────────────────────
const DIAS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MESES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function inicioSemana(ref) {
  const d = new Date(ref);
  d.setDate(d.getDate() - d.getDay()); // domingo
  d.setHours(0,0,0,0);
  return d;
}

function addDias(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtData(d) {
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}

const DIA_MAP = { DOM:"Dom", SEG:"Seg", TER:"Ter", QUA:"Qua", QUI:"Qui", SEX:"Sex", SAB:"Sáb" };

// Verifica se a promoção está ativa num dia da semana (índice 0=Dom)
function promoNoDia(promo, diaSemIdx) {
  if (!promo.dias || promo.dias.length === 0) return false;
  if (promo.status !== "ATIVA" && promo.status !== "CADASTRADA") return false;
  const chave = ["DOM","SEG","TER","QUA","QUI","SEX","SAB"][diaSemIdx];
  return promo.dias.includes(chave);
}

// Sugestão de copy de push automática
function gerarCopyPush(promo) {
  if (promo.tipo === "ENTREGA GRATIS") return `🚚 Entrega GRÁTIS no ${promo.restaurante} hoje! Peça agora pelo app.`;
  if (promo.tipo === "ENTREGA PROMOCIONAL") return `📦 Entrega por apenas R$3,99 no ${promo.restaurante}! Aproveite hoje.`;
  if (promo.tipo === "COMBO COCA-COLA") return `🥤 Combo especial no ${promo.restaurante}! ${promo.produto} por só ${promo.precoPromo ? `R$${promo.precoPromo.toFixed(2).replace(".",",")}` : "preço especial"} 🔥`;
  if (promo.precoPromo && promo.precoNormal) {
    const desc = Math.round(((promo.precoNormal - promo.precoPromo) / promo.precoNormal) * 100);
    return `🔥 ${desc}% OFF no ${promo.restaurante}! ${promo.produto} de R$${promo.precoNormal.toFixed(2).replace(".",",")} por R$${promo.precoPromo.toFixed(2).replace(".",",")}. Só hoje!`;
  }
  return `🎉 Promoção especial no ${promo.restaurante}! Abra o app e aproveite.`;
}

function gerarCopyStory(promo) {
  const linhas = [];
  linhas.push(`📍 ${promo.restaurante}`);
  if (promo.produto && promo.produto !== "-") linhas.push(`🍽️ ${promo.produto}`);
  if (promo.precoPromo) linhas.push(`💰 Por apenas R$${promo.precoPromo.toFixed(2).replace(".",",")}!`);
  if (promo.tipo === "ENTREGA GRATIS") linhas.push("🚚 Entrega GRÁTIS!");
  linhas.push("👆 Link na bio ou peça pelo app");
  return linhas.join("\n");
}

// ── Modal de ação de marketing ─────────────────────────────────────────────
function ModalMarketing({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    pushAgendado: item.pushAgendado || "",
    pushStatus:   item.pushStatus   || "PENDENTE",
    storyAgendado:item.storyAgendado|| "",
    storyStatus:  item.storyStatus  || "PENDENTE",
    postAgendado: item.postAgendado || "",
    postStatus:   item.postStatus   || "PENDENTE",
    obs:          item.obs          || "",
  });

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const inp = { border:"1.5px solid #E8E8E8", borderRadius:10, padding:"8px 12px", fontSize:13, background:"#FAFAFA", color:"#333", outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" };
  const lbl = { fontSize:11, fontWeight:700, color:"#999", marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:0.4 };

  const STATUS_OPTS = ["PENDENTE","AGENDADO","PUBLICADO","CANCELADO"];
  const STATUS_COLOR = { PENDENTE:"#FF9800", AGENDADO:"#2196F3", PUBLICADO:"#00C853", CANCELADO:"#F44336" };

  const secao = (emoji, titulo, keyHorario, keyStatus, copyText) => (
    <div style={{ background:"#FAFAFA", borderRadius:14, padding:"14px 16px", border:"1px solid #F0F0F0" }}>
      <div style={{ fontSize:13, fontWeight:800, color:"#1A1A1A", marginBottom:10 }}>{emoji} {titulo}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div>
          <label style={lbl}>Horário agendado</label>
          <input type="datetime-local" style={inp} value={form[keyHorario]} onChange={e => set(keyHorario, e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Status</label>
          <select style={{...inp, color: STATUS_COLOR[form[keyStatus]], fontWeight:700}} value={form[keyStatus]} onChange={e => set(keyStatus, e.target.value)}>
            {STATUS_OPTS.map(s => <option key={s} value={s} style={{color: STATUS_COLOR[s]}}>{s}</option>)}
          </select>
        </div>
      </div>
      {copyText && (
        <div>
          <label style={lbl}>Sugestão de copy</label>
          <textarea readOnly style={{...inp, resize:"vertical", minHeight:60, fontSize:12, background:"#F0F7FF", borderColor:"#BBDEFB", color:"#1565C0"}} value={copyText} />
        </div>
      )}
    </div>
  );

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:24, padding:28, maxWidth:560, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#1A1A1A" }}>{item.promo.restaurante}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#999" }}>×</button>
        </div>
        <div style={{ fontSize:12, color:"#999", marginBottom:20 }}>{item.promo.produto !== "-" ? item.promo.produto : item.promo.tipo} · {fmtData(item.data)}</div>

        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          {secao("🔔","Push Notification","pushAgendado","pushStatus", gerarCopyPush(item.promo))}
          {secao("📱","Story Instagram","storyAgendado","storyStatus", gerarCopyStory(item.promo))}
          {secao("🖼️","Post Instagram","postAgendado","postStatus", null)}
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Observações</label>
          <textarea style={{...inp, resize:"vertical", minHeight:50}} value={form.obs} onChange={e => set("obs",e.target.value)} placeholder="Arte aprovada, link da arte, impulsionar..." />
        </div>

        <button onClick={() => onSave({...item, ...form})} style={{ width:"100%", padding:"11px", borderRadius:12, border:"none", background:"#FF5000", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14 }}>
          Salvar agendamento
        </button>
      </div>
    </div>
  );
}

// ── Aba Marketing principal ────────────────────────────────────────────────
const STATUS_MKT_COLOR = { PENDENTE:"#FF9800", AGENDADO:"#2196F3", PUBLICADO:"#00C853", CANCELADO:"#9E9E9E" };
const STATUS_MKT_BG    = { PENDENTE:"#FFF3E0", AGENDADO:"#E3F2FD", PUBLICADO:"#E8F5E9", CANCELADO:"#F5F5F5" };

function AbaMarketing({ promos }) {
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const [semana, setSemana] = useState(() => inicioSemana(hoje));
  const [acoes, setAcoes] = useState({});       // chave: `${promoId}_${dataISO}` → dados de marketing
  const [modalItem, setModalItem] = useState(null);
  const [diaFiltro, setDiaFiltro] = useState(null); // null = todos

  // Dias da semana atual
  const dias = Array.from({length:7}, (_,i) => addDias(semana, i));

  // Monta grade: para cada dia, quais promos estão ativas
  const grade = dias.map((d,i) => ({
    data: d,
    diaSem: i,
    promos: promos.filter(p => promoNoDia(p, d.getDay())),
  }));

  const chave = (promoId, data) => `${promoId}_${data.toISOString().split("T")[0]}`;

  const getAcao = (promoId, data) => acoes[chave(promoId, data)] || {};

  const salvarAcao = (item) => {
    const k = chave(item.promo.id, item.data);
    setAcoes(a => ({...a, [k]: item}));
    setModalItem(null);
  };

  // Estatísticas da semana
  const statsAcoes = useMemo(() => {
    const vals = Object.values(acoes);
    return {
      total: grade.reduce((s,d) => s + d.promos.length, 0),
      agendados: vals.filter(v => v.pushStatus === "AGENDADO" || v.storyStatus === "AGENDADO" || v.postStatus === "AGENDADO").length,
      publicados: vals.filter(v => v.pushStatus === "PUBLICADO").length,
      pendentes: 0,
    };
  }, [acoes, grade]);

  const diasFiltrados = diaFiltro !== null ? [grade[diaFiltro]] : grade;

  const isHoje = (d) => d.toDateString() === hoje.toDateString();

  const nomeSemana = `${fmtData(dias[1])} – ${fmtData(dias[6])} de ${MESES_PT[dias[3].getMonth()]}`;

  const badgeAcao = (status) => status && status !== "PENDENTE" ? (
    <span style={{ fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:6, background: STATUS_MKT_BG[status] || "#F5F5F5", color: STATUS_MKT_COLOR[status] || "#999" }}>{status}</span>
  ) : null;

  return (
    <div>
      {/* Cabeçalho Marketing */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:"#1A1A1A" }}>Marketing</div>
          <div style={{ fontSize:13, color:"#999", marginTop:2 }}>Promos da semana · Push · Stories · Posts</div>
        </div>
        {/* Nav semana */}
        <div style={{ display:"flex", alignItems:"center", gap:10, background:"#fff", border:"1px solid #F0F0F0", borderRadius:14, padding:"8px 14px" }}>
          <button onClick={() => setSemana(d => addDias(d,-7))} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#FF5000", lineHeight:1 }}>‹</button>
          <span style={{ fontSize:13, fontWeight:700, color:"#333", minWidth:180, textAlign:"center" }}>{nomeSemana}</span>
          <button onClick={() => setSemana(d => addDias(d,7))} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#FF5000", lineHeight:1 }}>›</button>
          <button onClick={() => setSemana(inicioSemana(hoje))} style={{ fontSize:11, fontWeight:700, color:"#FF5000", background:"#FFF0EB", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer" }}>Hoje</button>
        </div>
      </div>

      {/* KPIs rápidos da semana */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:20 }}>
        {[
          { label:"Promos na semana", val:statsAcoes.total,      color:"#FF5000", bg:"#FFF0EB", icon:"🏷️" },
          { label:"Push agendados",   val:statsAcoes.agendados,  color:"#2196F3", bg:"#E3F2FD", icon:"🔔" },
          { label:"Publicados",       val:statsAcoes.publicados, color:"#00C853", bg:"#E8F5E9", icon:"✅" },
        ].map(item => (
          <div key={item.label} style={{ background:item.bg, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ fontSize:20 }}>{item.icon}</div>
            <div style={{ fontSize:26, fontWeight:800, color:item.color, marginTop:4 }}>{item.val}</div>
            <div style={{ fontSize:11, color:"#777", fontWeight:600, marginTop:2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Filtro por dia */}
      <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap" }}>
        <button onClick={() => setDiaFiltro(null)} style={{ padding:"6px 14px", borderRadius:20, border:"1.5px solid", borderColor: diaFiltro === null ? "#FF5000":"#E0E0E0", background: diaFiltro === null ? "#FF5000":"#fff", color: diaFiltro === null ? "#fff":"#888", fontSize:12, fontWeight:700, cursor:"pointer" }}>
          Semana toda
        </button>
        {dias.map((d,i) => {
          const qtd = grade[i].promos.length;
          const sel = diaFiltro === i;
          return (
            <button key={i} onClick={() => setDiaFiltro(sel ? null : i)} style={{
              padding:"6px 12px", borderRadius:20, border:"1.5px solid",
              borderColor: isHoje(d) ? "#FF5000" : sel ? "#FF5000":"#E0E0E0",
              background: sel ? "#FF5000" : isHoje(d) ? "#FFF0EB":"#fff",
              color: sel ? "#fff" : isHoje(d) ? "#FF5000":"#888",
              fontSize:12, fontWeight:700, cursor:"pointer", position:"relative",
            }}>
              {DIAS_PT[i]} {fmtData(d)}
              {qtd > 0 && <span style={{ marginLeft:5, background: sel?"rgba(255,255,255,0.3)":"#FF5000", color:"#fff", borderRadius:10, fontSize:10, fontWeight:800, padding:"1px 5px" }}>{qtd}</span>}
            </button>
          );
        })}
      </div>

      {/* Grade de dias */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {diasFiltrados.map(({ data, diaSem, promos: promosNoDia }) => (
          <div key={data.toISOString()}>
            {/* Header do dia */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{
                width:44, height:44, borderRadius:14, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", flexShrink:0,
                background: isHoje(data) ? "#FF5000":"#F5F5F5",
                color: isHoje(data) ? "#fff":"#555",
              }}>
                <div style={{ fontSize:10, fontWeight:700, lineHeight:1 }}>{DIAS_PT[data.getDay()]}</div>
                <div style={{ fontSize:18, fontWeight:800, lineHeight:1.2 }}>{data.getDate()}</div>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:"#1A1A1A" }}>
                  {DIAS_PT[data.getDay()]}, {data.getDate()} de {MESES_PT[data.getMonth()]}
                  {isHoje(data) && <span style={{ marginLeft:8, fontSize:11, background:"#FF5000", color:"#fff", padding:"2px 8px", borderRadius:10, fontWeight:700 }}>HOJE</span>}
                </div>
                <div style={{ fontSize:12, color:"#aaa" }}>{promosNoDia.length} promoção{promosNoDia.length !== 1 ? "ões":"" } ativa{promosNoDia.length !== 1 ? "s":""}</div>
              </div>
            </div>

            {promosNoDia.length === 0 ? (
              <div style={{ background:"#FAFAFA", borderRadius:12, padding:"14px 16px", fontSize:13, color:"#ccc", border:"1px dashed #E8E8E8" }}>
                Nenhuma promoção ativa neste dia
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                {promosNoDia.map(promo => {
                  const acao = getAcao(promo.id, data);
                  const tipoInfo = TIPO_CONFIG[promo.tipo] || { icon:"🎯" };
                  const desc = promo.precoNormal && promo.precoPromo ? Math.round(((promo.precoNormal - promo.precoPromo)/promo.precoNormal)*100) : null;
                  return (
                    <div key={promo.id} style={{ background:"#fff", borderRadius:16, border:"1px solid #F0F0F0", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                      {/* Topo colorido */}
                      <div style={{ background: isHoje(data) ? "#FF5000":"#1A1A1A", padding:"12px 16px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:800, color:"#fff", lineHeight:1.3 }}>{promo.restaurante}</div>
                            <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:2 }}>{tipoInfo.icon} {promo.produto !== "-" ? promo.produto : promo.tipo}</div>
                          </div>
                          {desc && <span style={{ background:"rgba(255,255,255,0.2)", color:"#fff", fontSize:11, fontWeight:800, padding:"3px 8px", borderRadius:10 }}>-{desc}%</span>}
                        </div>
                        {promo.precoPromo && (
                          <div style={{ fontSize:18, fontWeight:800, color:"#fff", marginTop:6 }}>
                            R$ {promo.precoPromo.toFixed(2).replace(".",",")}
                            {promo.precoNormal && <span style={{ fontSize:12, fontWeight:400, color:"rgba(255,255,255,0.6)", marginLeft:8, textDecoration:"line-through" }}>R$ {promo.precoNormal.toFixed(2).replace(".",",")}</span>}
                          </div>
                        )}
                        {promo.tipo === "ENTREGA GRATIS" && <div style={{ fontSize:14, fontWeight:800, color:"#fff", marginTop:4 }}>🚚 Entrega grátis</div>}
                      </div>

                      {/* Corpo: status das ações */}
                      <div style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                          {[
                            ["🔔", "Push",  acao.pushStatus,  acao.pushAgendado],
                            ["📱", "Story", acao.storyStatus, acao.storyAgendado],
                            ["🖼️", "Post",  acao.postStatus,  acao.postAgendado],
                          ].map(([icon, nome, status, horario]) => (
                            <div key={nome} style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ fontSize:13 }}>{icon}</span>
                              <span style={{ fontSize:12, color:"#555", fontWeight:600, minWidth:38 }}>{nome}</span>
                              {status && status !== "PENDENTE"
                                ? <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:8, background: STATUS_MKT_BG[status]||"#F5F5F5", color: STATUS_MKT_COLOR[status]||"#999" }}>{status}</span>
                                : <span style={{ fontSize:10, color:"#ccc" }}>— não agendado</span>
                              }
                              {horario && <span style={{ fontSize:10, color:"#aaa", marginLeft:"auto" }}>{horario.split("T")[1]?.slice(0,5)}</span>}
                            </div>
                          ))}
                        </div>

                        {/* Copy de push sugerida */}
                        {!acao.pushAgendado && (
                          <div style={{ marginTop:10, background:"#FFF8F5", borderRadius:10, padding:"8px 10px", border:"1px solid #FFE0CC" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:"#FF5000", marginBottom:3 }}>💡 Sugestão de push</div>
                            <div style={{ fontSize:11, color:"#555", lineHeight:1.5 }}>{gerarCopyPush(promo)}</div>
                          </div>
                        )}

                        <button onClick={() => setModalItem({ promo, data, ...acao })} style={{
                          marginTop:12, width:"100%", padding:"8px", borderRadius:10,
                          border:"1.5px solid #FF5000", background:"transparent", color:"#FF5000",
                          fontWeight:700, fontSize:12, cursor:"pointer",
                        }}>
                          {acao.pushAgendado || acao.storyAgendado || acao.postAgendado ? "Editar agendamento" : "Agendar ações"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de agendamento */}
      {modalItem && <ModalMarketing item={modalItem} onClose={() => setModalItem(null)} onSave={salvarAcao} />}
    </div>
  );
}

// ── Cupons ────────────────────────────────────────────────────────────────
const CUPOM_EMPTY = {
  codigo:"", tipoDesconto:"PERCENT", valor:"", pedidoMin:"",
  aplicarPara:"TODAS", lojaEspecifica:"", curvas:[],
  quemBanca:"50_50", recorrencia:"SEMANAL", dias:[], dataInicio:"", dataFim:"",
  status:"ATIVO", obs:"",
};

const QUEM_BANCA_OPTS = [
  { key:"50_50",    label:"50% / 50%",     sub:"Loja + Franquia" },
  { key:"LOJA",     label:"100% Loja",     sub:"Só a loja banca" },
  { key:"FRANQUIA", label:"100% Franquia", sub:"Só a franquia banca" },
  { key:"CUSTOM",   label:"Personalizado", sub:"Definir % manualmente" },
];

function CardCupom({ c, onClick }) {
  const isAtivo = c.status === "ATIVO";
  const corBorda = isAtivo ? "#FF5000" : "#ccc";
  const descLabel = c.tipoDesconto === "PERCENT" ? `${c.valor}% OFF` : `R$ ${Number(c.valor).toFixed(2).replace(".",",")} OFF`;
  const bancaLabel = { "50_50":"50% Loja / 50% Franq.", LOJA:"100% Loja", FRANQUIA:"100% Franquia", CUSTOM:"Personalizado" }[c.quemBanca];
  return (
    <div onClick={() => onClick(c)} style={{
      background:"#fff", borderRadius:16, border:"1px solid #F0F0F0",
      borderLeft:`4px solid ${corBorda}`, padding:"16px 18px",
      cursor:"pointer", transition:"all 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow="0 4px 16px rgba(255,80,0,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ fontSize:16, fontWeight:800, color: isAtivo?"#1A1A1A":"#aaa", letterSpacing:1 }}>{c.codigo}</div>
        <div style={{ display:"flex", gap:6 }}>
          <span style={{ fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:10, background:isAtivo?"#FFF0EB":"#F5F5F5", color:isAtivo?"#FF5000":"#aaa" }}>{descLabel}</span>
          <span style={{ fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:10, background:isAtivo?"#E8F5E9":"#F5F5F5", color:isAtivo?"#2E7D32":"#aaa" }}>{isAtivo?"ATIVO":"EXPIRADO"}</span>
        </div>
      </div>
      {c.pedidoMin && <div style={{ fontSize:12, color:"#888", marginBottom:6 }}>Pedido mín. R$ {Number(c.pedidoMin).toFixed(2).replace(".",",")}</div>}
      <div style={{ fontSize:12, color:"#777", marginBottom:8 }}>
        {c.aplicarPara==="TODAS" ? "Todas as lojas" : c.aplicarPara==="LOJA_ESP" ? `Loja: ${c.lojaEspecifica}` : `Curva ${c.curvas.join(", ")}`}
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
        {c.dias.length===7
          ? <span style={{ fontSize:10, background:"#F5F5F5", color:"#777", padding:"2px 8px", borderRadius:8, fontWeight:600 }}>Todos os dias</span>
          : c.dias.map(d => <span key={d} style={{ fontSize:10, background:"#FFF0EB", color:"#FF5000", padding:"2px 7px", borderRadius:8, fontWeight:700 }}>{DIAS_LABEL[d]}</span>)
        }
        <span style={{ fontSize:10, background:"#F5F5F5", color:"#666", padding:"2px 8px", borderRadius:8, fontWeight:600 }}>📅 {c.recorrencia}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:11, color:"#aaa" }}>💳 {bancaLabel}</div>
        {(c.dataInicio||c.dataFim) && <div style={{ fontSize:11, color:"#bbb" }}>{c.dataInicio&&`De ${c.dataInicio}`}{c.dataFim&&` até ${c.dataFim}`}</div>}
      </div>
    </div>
  );
}

function ModalCupom({ c, modo, onClose, onSave, onDelete }) {
  const editando = modo==="novo" || modo==="editar";
  const [form, setForm] = useState(() => modo==="novo" ? {...CUPOM_EMPTY} : {...c});
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const inp = { border:"1.5px solid #E8E8E8", borderRadius:10, padding:"8px 12px", fontSize:13, background:"#FAFAFA", color:"#333", outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" };
  const lbl = { fontSize:11, fontWeight:700, color:"#999", marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:0.4 };
  const chip = (sel, onClick, label) => (
    <button type="button" onClick={onClick} style={{ padding:"5px 12px", borderRadius:20, border:"1.5px solid", borderColor:sel?"#FF5000":"#E0E0E0", background:sel?"#FFF0EB":"#fff", color:sel?"#FF5000":"#888", fontSize:12, fontWeight:700, cursor:"pointer" }}>{label}</button>
  );
  const descLabel = form.tipoDesconto==="PERCENT" ? `${form.valor||0}% OFF` : `R$ ${Number(form.valor||0).toFixed(2)} OFF`;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:24, padding:28, maxWidth:560, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", maxHeight:"93vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontSize:15, fontWeight:800, color:"#1A1A1A" }}>{modo==="novo"?"Novo cupom":modo==="editar"?"Editar cupom":form.codigo}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#999" }}>×</button>
        </div>
        {modo==="ver" && c && (
          <>
            <div style={{ background:"#FFF0EB", borderRadius:14, padding:"14px 18px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:"#FF5000", letterSpacing:2 }}>{c.codigo}</div>
              <div style={{ fontSize:18, fontWeight:800, color:"#FF5000" }}>{descLabel}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              {[
                ["Tipo", c.tipoDesconto==="PERCENT"?"Porcentagem":"Valor fixo"],
                ["Pedido mín.", c.pedidoMin?`R$ ${Number(c.pedidoMin).toFixed(2).replace(".",",")}` : "Sem mínimo"],
                ["Recorrência", c.recorrencia],
                ["Aplicar para", c.aplicarPara==="TODAS"?"Todas as lojas":c.aplicarPara==="LOJA_ESP"?`Loja: ${c.lojaEspecifica}`:`Curva ${c.curvas.join(", ")}`],
                ["Quem banca", {"50_50":"50% Loja / 50% Franquia",LOJA:"100% Loja",FRANQUIA:"100% Franquia",CUSTOM:"Personalizado"}[c.quemBanca]],
                ["Validade", `${c.dataInicio||"—"} → ${c.dataFim||"—"}`],
              ].map(([label,val]) => (
                <div key={label} style={{ background:"#FAFAFA", borderRadius:10, padding:"10px 14px" }}>
                  <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1A1A1A" }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"#FAFAFA", borderRadius:10, padding:"10px 14px", marginBottom:12 }}>
              <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase", marginBottom:6 }}>Dias da semana</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {c.dias.length===7
                  ? <span style={{ fontSize:11, background:"#F0F0F0", color:"#555", padding:"3px 10px", borderRadius:8 }}>Todos os dias</span>
                  : c.dias.map(d=><span key={d} style={{ fontSize:11, background:"#FFF0EB", color:"#FF5000", padding:"3px 9px", borderRadius:8, fontWeight:700 }}>{DIAS_LABEL[d]}</span>)
                }
              </div>
            </div>
            {c.obs && <div style={{ background:"#FAFAFA", borderRadius:10, padding:"10px 14px", marginBottom:16 }}><div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>Observações</div><div style={{ fontSize:13, color:"#555" }}>{c.obs}</div></div>}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>onSave(c,"editar")} style={{ flex:1, padding:"10px", borderRadius:12, border:"none", background:"#FF5000", color:"#fff", fontWeight:700, cursor:"pointer" }}>Editar</button>
              <button onClick={()=>onDelete(c.id)} style={{ padding:"10px 16px", borderRadius:12, border:"1.5px solid #FFEBEE", background:"#fff", color:"#F44336", fontWeight:700, cursor:"pointer" }}>Excluir</button>
            </div>
          </>
        )}
        {editando && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={lbl}>Código do cupom *</label>
                <input style={{ ...inp, textTransform:"uppercase", fontWeight:700, letterSpacing:1 }} value={form.codigo} onChange={e=>set("codigo",e.target.value.toUpperCase())} placeholder="Ex: BEMVINDO20" />
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select style={inp} value={form.status} onChange={e=>set("status",e.target.value)}>
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                  <option value="EXPIRADO">Expirado</option>
                </select>
              </div>
            </div>
            <div style={{ background:"#FAFAFA", borderRadius:12, padding:"14px 16px", border:"1px solid #F0F0F0" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#FF5000", textTransform:"uppercase", marginBottom:10 }}>🏷️ Desconto</div>
              <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                {chip(form.tipoDesconto==="PERCENT", ()=>set("tipoDesconto","PERCENT"), "% Porcentagem")}
                {chip(form.tipoDesconto==="FIXO",    ()=>set("tipoDesconto","FIXO"),    "R$ Valor fixo")}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={lbl}>{form.tipoDesconto==="PERCENT"?"Porcentagem (%)":"Valor (R$)"}</label>
                  <input style={inp} type="number" step="0.01" value={form.valor} onChange={e=>set("valor",e.target.value)} placeholder={form.tipoDesconto==="PERCENT"?"Ex: 15":"Ex: 5.00"} />
                </div>
                <div>
                  <label style={lbl}>Pedido mínimo (R$)</label>
                  <input style={inp} type="number" step="0.01" value={form.pedidoMin} onChange={e=>set("pedidoMin",e.target.value)} placeholder="Sem mínimo" />
                </div>
              </div>
              {form.valor && <div style={{ marginTop:8, fontSize:12, fontWeight:700, color:"#FF5000" }}>Preview: {descLabel}{form.pedidoMin?` · Mín. R$${Number(form.pedidoMin).toFixed(2)}`:""}</div>}
            </div>
            <div style={{ background:"#FAFAFA", borderRadius:12, padding:"14px 16px", border:"1px solid #F0F0F0" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#FF5000", textTransform:"uppercase", marginBottom:10 }}>📅 Recorrência</div>
              <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                {["SEMANAL","MENSAL","UNICA"].map(r=>chip(form.recorrencia===r,()=>set("recorrencia",r),r.charAt(0)+r.slice(1).toLowerCase()))}
              </div>
              <label style={{ ...lbl, color:"#FF5000" }}>Dias da semana *</label>
              <DiasSemanaSelector value={form.dias} onChange={v=>set("dias",v)} />
              {form.dias.length>0 && <div style={{ fontSize:11, color:"#999", marginTop:6 }}>Selecionado: {formatDias(form.dias)}</div>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={lbl}>Data início</label><input style={inp} type="date" value={form.dataInicio} onChange={e=>set("dataInicio",e.target.value)} /></div>
              <div><label style={lbl}>Data fim</label><input style={inp} type="date" value={form.dataFim} onChange={e=>set("dataFim",e.target.value)} /></div>
            </div>
            <div style={{ background:"#FAFAFA", borderRadius:12, padding:"14px 16px", border:"1px solid #F0F0F0" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#FF5000", textTransform:"uppercase", marginBottom:10 }}>🏪 Aplicar para</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                {chip(form.aplicarPara==="TODAS",    ()=>set("aplicarPara","TODAS"),    "Todas as lojas")}
                {chip(form.aplicarPara==="CURVA",    ()=>set("aplicarPara","CURVA"),    "Por curva")}
                {chip(form.aplicarPara==="LOJA_ESP", ()=>set("aplicarPara","LOJA_ESP"), "Loja específica")}
              </div>
              {form.aplicarPara==="CURVA" && (
                <div style={{ display:"flex", gap:6 }}>
                  {["A","B","C"].map(cv=>(
                    <button key={cv} type="button" onClick={()=>{ const cur=form.curvas.includes(cv)?form.curvas.filter(x=>x!==cv):[...form.curvas,cv]; set("curvas",cur); }} style={{ width:44, height:36, borderRadius:10, border:"1.5px solid", borderColor:form.curvas.includes(cv)?"#FF5000":"#E0E0E0", background:form.curvas.includes(cv)?"#FFF0EB":"#fff", color:form.curvas.includes(cv)?"#FF5000":"#aaa", fontSize:14, fontWeight:800, cursor:"pointer" }}>{cv}</button>
                  ))}
                </div>
              )}
              {form.aplicarPara==="LOJA_ESP" && <input style={{ ...inp, marginTop:8 }} value={form.lojaEspecifica} onChange={e=>set("lojaEspecifica",e.target.value)} placeholder="Nome da loja" />}
            </div>
            <div style={{ background:"#FAFAFA", borderRadius:12, padding:"14px 16px", border:"1px solid #F0F0F0" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#FF5000", textTransform:"uppercase", marginBottom:10 }}>💳 Quem banca o desconto</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {QUEM_BANCA_OPTS.map(o=>(
                  <button key={o.key} type="button" onClick={()=>set("quemBanca",o.key)} style={{ padding:"10px 12px", borderRadius:12, border:"1.5px solid", borderColor:form.quemBanca===o.key?"#FF5000":"#E0E0E0", background:form.quemBanca===o.key?"#FFF0EB":"#fff", cursor:"pointer", textAlign:"left" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:form.quemBanca===o.key?"#FF5000":"#333" }}>{o.label}</div>
                    <div style={{ fontSize:11, color:"#aaa", marginTop:2 }}>{o.sub}</div>
                  </button>
                ))}
              </div>
              {form.quemBanca==="CUSTOM" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
                  <div><label style={lbl}>% Loja</label><input style={inp} type="number" min="0" max="100" value={form.pctLoja||""} onChange={e=>set("pctLoja",e.target.value)} placeholder="50" /></div>
                  <div><label style={lbl}>% Franquia</label><input style={inp} type="number" min="0" max="100" value={form.pctFranquia||""} onChange={e=>set("pctFranquia",e.target.value)} placeholder="50" /></div>
                </div>
              )}
            </div>
            <div>
              <label style={lbl}>Observações</label>
              <textarea style={{ ...inp, resize:"vertical", minHeight:50 }} value={form.obs} onChange={e=>set("obs",e.target.value)} placeholder="Restrições, condições especiais..." />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{ const novo={...form, id:form.id||`CUP-${Date.now().toString().slice(-5)}`}; onSave(novo); }} style={{ flex:1, padding:"11px", borderRadius:12, border:"none", background:"#FF5000", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14 }}>
                {modo==="novo"?"Criar cupom":"Salvar alterações"}
              </button>
              <button onClick={onClose} style={{ padding:"11px 18px", borderRadius:12, border:"1.5px solid #E0E0E0", background:"#fff", color:"#777", fontWeight:600, cursor:"pointer" }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AbaCupons() {
  const [cupons, setCupons] = useState([]);
  const [loadingC, setLoadingC] = useState(true);
  const [modalCupom, setModalCupom] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  const carregarCupons = useCallback(async () => {
    setLoadingC(true);
    const { data, error } = await supabase.from("cupons").select("*").order("created_at", { ascending: false });
    if (!error) setCupons((data || []).map(dbToCupom));
    setLoadingC(false);
  }, []);

  useEffect(() => { carregarCupons(); }, [carregarCupons]);

  const filtrados = cupons.filter(c => {
    const q = busca.toLowerCase();
    return (!q || c.codigo.toLowerCase().includes(q) || (c.lojaEspecifica||"").toLowerCase().includes(q))
      && (filtroStatus==="TODOS" || c.status===filtroStatus);
  });
  const salvar = async (form, modoOverride) => {
    if (modoOverride==="editar") { setModalCupom({c:form, modo:"editar"}); return; }
    const row = cupomToDB(form);
    const { error } = await supabase.from("cupons").upsert(row, { onConflict: "id" });
    if (error) { alert("Erro ao salvar cupom: " + error.message); return; }
    await carregarCupons();
    setModalCupom(null);
  };
  const excluir = async (id) => {
    if (!window.confirm("Excluir este cupom?")) return;
    await supabase.from("cupons").delete().eq("id", id);
    await carregarCupons();
    setModalCupom(null);
  };
  const inp = { border:"1.5px solid #E8E8E8", borderRadius:10, padding:"9px 12px", fontSize:13, background:"#FAFAFA", color:"#333", outline:"none", fontFamily:"inherit" };
  const ativos = cupons.filter(c=>c.status==="ATIVO").length;
  const expirados = cupons.filter(c=>c.status==="EXPIRADO").length;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:20 }}>
        {[
          { label:"Total de cupons", val:cupons.length, color:"#FF5000", bg:"#FFF0EB", icon:"🎟️" },
          { label:"Ativos",          val:ativos,        color:"#00C853", bg:"#E8F5E9", icon:"✅" },
          { label:"Expirados",       val:expirados,     color:"#9E9E9E", bg:"#F5F5F5", icon:"⏰" },
        ].map(item=>(
          <div key={item.label} style={{ background:item.bg, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ fontSize:20 }}>{item.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color:item.color, marginTop:4 }}>{item.val}</div>
            <div style={{ fontSize:11, color:"#777", fontWeight:600, marginTop:2 }}>{item.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:"#fff", borderRadius:16, padding:"14px 18px", border:"1px solid #F0F0F0", marginBottom:18, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <input placeholder="🔍 Buscar cupom ou loja..." value={busca} onChange={e=>setBusca(e.target.value)} style={{ ...inp, flex:"1 1 180px", minWidth:0 }} />
        <select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} style={{ ...inp, minWidth:130 }}>
          <option value="TODOS">Todos</option>
          <option value="ATIVO">✅ Ativos</option>
          <option value="INATIVO">⏸️ Inativos</option>
          <option value="EXPIRADO">⏰ Expirados</option>
        </select>
        <button onClick={()=>setModalCupom({c:null, modo:"novo"})} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#FF5000", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13, whiteSpace:"nowrap" }}>🎟️ + Novo cupom</button>
      </div>
      <div style={{ fontSize:13, color:"#888", marginBottom:14 }}>{filtrados.length} cupom{filtrados.length!==1?"ns":""} encontrado{filtrados.length!==1?"s":""}</div>
      {loadingC
        ? <div style={{ textAlign:"center", padding:"40px", color:"#aaa" }}>⏳ Carregando cupons...</div>
        : filtrados.length===0
          ? <div style={{ textAlign:"center", padding:"60px 20px", color:"#BBB" }}><div style={{ fontSize:40, marginBottom:12 }}>🎟️</div><div style={{ fontSize:16, fontWeight:600 }}>Nenhum cupom encontrado</div></div>
          : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>{filtrados.map(c=><CardCupom key={c.id} c={c} onClick={cup=>setModalCupom({c:cup, modo:"ver"})} />)}</div>
      }
      {modalCupom && <ModalCupom c={modalCupom.c} modo={modalCupom.modo} onClose={()=>setModalCupom(null)} onSave={salvar} onDelete={excluir} />}
    </div>
  );
}

// ── Aba Visitas ────────────────────────────────────────────────────────────
function AbaVisitas() {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [gps, setGps] = useState(null);
  const [gpsErro, setGpsErro] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [dados, setDados] = useState({ restaurante:"", responsavel:"", observacoes:"", proxima_atividade:"" });

  const inp = { border:"1.5px solid #E8E8E8", borderRadius:10, padding:"9px 12px", fontSize:13, background:"#FAFAFA", color:"#333", outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" };
  const lbl = { fontSize:11, fontWeight:700, color:"#999", marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:0.4 };

  const carregarVisitas = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("visitas").select("*").order("created_at", { ascending: false });
    setVisitas(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { carregarVisitas(); }, [carregarVisitas]);

  const pegarGPS = () => {
    setGpsErro(null);
    if (!navigator.geolocation) { setGpsErro("GPS não disponível neste dispositivo"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGpsErro("Não foi possível obter localização. Verifique as permissões.")
    );
  };

  const abrirForm = () => {
    setDados({ restaurante:"", responsavel:"", observacoes:"", proxima_atividade:"" });
    setFotoFile(null); setFotoPreview(null); setGps(null); setGpsErro(null);
    setForm(true);
    pegarGPS();
  };

  const onFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const salvar = async () => {
    if (!dados.restaurante.trim()) { alert("Informe o nome do restaurante."); return; }
    setSalvando(true);
    try {
      let foto_url = null;
      if (fotoFile) {
        const ext = fotoFile.name.split(".").pop();
        const path = `${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("visitas-fotos").upload(path, fotoFile, { upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("visitas-fotos").getPublicUrl(path);
          foto_url = urlData.publicUrl;
        }
      }
      const { error } = await supabase.from("visitas").insert({
        restaurante: dados.restaurante.trim(),
        responsavel: dados.responsavel.trim() || null,
        observacoes: dados.observacoes.trim() || null,
        proxima_atividade: dados.proxima_atividade.trim() || null,
        latitude: gps?.lat || null,
        longitude: gps?.lng || null,
        foto_url,
      });
      if (error) { alert("Erro ao salvar: " + error.message); }
      else { setForm(false); carregarVisitas(); }
    } finally { setSalvando(false); }
  };

  const fmtData = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, color:"#1A1A1A" }}>📍 Visitas</div>
        <button onClick={abrirForm} style={{ padding:"9px 20px", borderRadius:10, border:"none", background:"#FF5000", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13 }}>
          + Nova Visita
        </button>
      </div>

      {form && (
        <div onClick={() => setForm(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:24, padding:28, maxWidth:500, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", maxHeight:"95vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <span style={{ fontSize:16, fontWeight:800, color:"#1A1A1A" }}>📍 Registrar Visita</span>
              <button onClick={() => setForm(false)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#999" }}>×</button>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Foto da visita</label>
              {fotoPreview ? (
                <div style={{ position:"relative", marginBottom:8 }}>
                  <img src={fotoPreview} alt="preview" style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:12, border:"1.5px solid #E8E8E8" }} />
                  <button onClick={() => { setFotoFile(null); setFotoPreview(null); }} style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.6)", border:"none", borderRadius:20, color:"#fff", cursor:"pointer", padding:"3px 10px", fontSize:12 }}>Trocar</button>
                </div>
              ) : (
                <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, padding:"24px", borderRadius:12, border:"2px dashed #E0E0E0", background:"#FAFAFA", cursor:"pointer" }}>
                  <span style={{ fontSize:32 }}>📷</span>
                  <span style={{ fontSize:13, color:"#888", fontWeight:600 }}>Tirar foto / Escolher imagem</span>
                  <input type="file" accept="image/*" capture="camera" onChange={onFoto} style={{ display:"none" }} />
                </label>
              )}
            </div>

            <div style={{ marginBottom:16, padding:"10px 14px", borderRadius:10, background: gps ? "#E8F5E9" : gpsErro ? "#FFEBEE" : "#F5F5F5", border:`1.5px solid ${gps ? "#C8E6C9" : gpsErro ? "#FFCDD2" : "#E8E8E8"}` }}>
              {gps ? (
                <div style={{ fontSize:12, color:"#2E7D32", fontWeight:600 }}>✅ Localização capturada ({gps.lat.toFixed(5)}, {gps.lng.toFixed(5)})</div>
              ) : gpsErro ? (
                <div>
                  <div style={{ fontSize:12, color:"#C62828", marginBottom:6 }}>⚠️ {gpsErro}</div>
                  <button onClick={pegarGPS} style={{ fontSize:11, padding:"4px 10px", borderRadius:8, border:"1px solid #C62828", background:"transparent", color:"#C62828", cursor:"pointer" }}>Tentar novamente</button>
                </div>
              ) : (
                <div style={{ fontSize:12, color:"#888" }}>⏳ Obtendo localização GPS...</div>
              )}
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Restaurante *</label>
              <input style={inp} placeholder="Nome do restaurante" value={dados.restaurante} onChange={e => setDados(d => ({...d, restaurante: e.target.value}))} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Responsável (opcional)</label>
              <input style={inp} placeholder="Seu nome" value={dados.responsavel} onChange={e => setDados(d => ({...d, responsavel: e.target.value}))} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Observações da visita</label>
              <textarea style={{ ...inp, minHeight:80, resize:"vertical" }} placeholder="O que foi observado..." value={dados.observacoes} onChange={e => setDados(d => ({...d, observacoes: e.target.value}))} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={lbl}>Próxima atividade</label>
              <textarea style={{ ...inp, minHeight:60, resize:"vertical" }} placeholder="O que fazer na próxima visita..." value={dados.proxima_atividade} onChange={e => setDados(d => ({...d, proxima_atividade: e.target.value}))} />
            </div>

            <button onClick={salvar} disabled={salvando} style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", background: salvando ? "#ccc" : "#FF5000", color:"#fff", fontWeight:800, fontSize:14, cursor: salvando ? "default" : "pointer" }}>
              {salvando ? "Salvando..." : "✅ Registrar Visita"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:"40px", color:"#999" }}>⏳ Carregando...</div>
      ) : visitas.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#BBB" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📍</div>
          <div style={{ fontSize:16, fontWeight:600 }}>Nenhuma visita registrada ainda</div>
          <div style={{ fontSize:13, marginTop:6 }}>Clique em "+ Nova Visita" para começar</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {visitas.map(v => (
            <div key={v.id} style={{ background:"#fff", borderRadius:16, border:"1px solid #F0F0F0", overflow:"hidden", display:"flex" }}>
              {v.foto_url ? (
                <img src={v.foto_url} alt="visita" style={{ width:110, height:110, objectFit:"cover", flexShrink:0 }} />
              ) : (
                <div style={{ width:110, height:110, background:"#F5F5F5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>📷</div>
              )}
              <div style={{ padding:"14px 16px", flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#1A1A1A" }}>{v.restaurante}</div>
                  <div style={{ fontSize:11, color:"#aaa", whiteSpace:"nowrap", marginLeft:8 }}>{fmtData(v.created_at)}</div>
                </div>
                {v.responsavel && <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>👤 {v.responsavel}</div>}
                {v.latitude && <div style={{ fontSize:11, color:"#aaa", marginBottom:6 }}>📍 {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}</div>}
                {v.observacoes && (
                  <div style={{ fontSize:12, color:"#555", marginBottom:4, background:"#FAFAFA", borderRadius:8, padding:"6px 10px" }}>
                    <span style={{ fontWeight:700, color:"#999", fontSize:10, textTransform:"uppercase" }}>Obs: </span>{v.observacoes}
                  </div>
                )}
                {v.proxima_atividade && (
                  <div style={{ fontSize:12, color:"#E65100", background:"#FFF3E0", borderRadius:8, padding:"5px 10px", display:"inline-block" }}>
                    <span style={{ fontWeight:700, fontSize:10, textTransform:"uppercase" }}>Próxima: </span>{v.proxima_atividade}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── App principal ──────────────────────────────────────────────────────────
export default function App() {
  const [lista, setLista]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [erro, setErro]         = useState(null);

  // Carregar promoções do Supabase
  const carregarPromos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("promocoes").select("*").order("created_at", { ascending: false });
    if (error) { setErro("Erro ao carregar promoções"); console.error(error); }
    else { setLista((data || []).map(dbToApp)); }
    setLoading(false);
  }, []);

  useEffect(() => { carregarPromos(); }, [carregarPromos]);
  const [busca, setBusca]       = useState("");
  const [statusF, setStatusF]   = useState("TODOS");
  const [cidadeF, setCidadeF]   = useState("TODAS");
  const [tipoF, setTipoF]       = useState("TODOS");
  const [modal, setModal]       = useState(null); // { p, modo }
  const [aba, setAba]           = useState("promocoes");
  const [subAba, setSubAba]     = useState("promos"); // "promos" | "cupons"
  const [layout, setLayout]     = useState("grid"); // "grid" | "lista"

  const filtered = useMemo(() => lista.filter(p => {
    const q = busca.toLowerCase();
    return (!q || p.restaurante.toLowerCase().includes(q) || p.produto.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      && (statusF === "TODOS" || p.status === statusF)
      && (cidadeF === "TODAS" || p.cidade === cidadeF)
      && (tipoF   === "TODOS" || p.tipo   === tipoF);
  }), [lista, busca, statusF, cidadeF, tipoF]);

  const stats = useMemo(() => ({
    ativas:           lista.filter(p => p.status === "ATIVA").length,
    pausadas:         lista.filter(p => p.status === "PAUSADA").length,
    cadastradas:      lista.filter(p => p.status === "CADASTRADA").length,
    desabilitadas:    lista.filter(p => p.status === "DESABILITADA").length,
    restaurantes:     [...new Set(lista.map(p => p.restaurante))].length,
    prevLojas:        lista.reduce((a, p) => a + (p.qtd ? (p.incRestaurante||0)*p.qtd : 0), 0),
    prevFranqueadora: lista.reduce((a, p) => a + (p.qtd ? (p.incFranqueadora||0)*p.qtd : 0), 0),
    prevDM:           lista.reduce((a, p) => a + (p.qtd ? (p.incLvto||0)*p.qtd : 0), 0),
    get incTotal() { return this.prevLojas + this.prevFranqueadora + this.prevDM; },
  }), [lista]);

  const handleSave = async (form, modoOverride) => {
    if (modoOverride === "editar") { setModal({ p: form, modo:"editar" }); return; }
    const row = appToDB(form);
    const { error } = await supabase.from("promocoes").upsert(row, { onConflict: "id" });
    if (error) { alert("Erro ao salvar: " + error.message); return; }
    await carregarPromos();
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Excluir esta promoção?")) return;
    const { error } = await supabase.from("promocoes").delete().eq("id", id);
    if (error) { alert("Erro ao excluir: " + error.message); return; }
    await carregarPromos();
    setModal(null);
  };

  const inp = {
    border:"1.5px solid #E8E8E8", borderRadius:10, padding:"9px 12px",
    fontSize:13, background:"#FAFAFA", color:"#333", outline:"none", fontFamily:"inherit",
  };
  const tab = (active) => ({
    padding:"8px 18px", borderRadius:10, border:"none", cursor:"pointer",
    fontSize:13, fontWeight: active ? 700 : 500,
    background: active ? "#FF5000" : "transparent",
    color: active ? "#fff" : "#888",
    transition:"all 0.15s",
  });

  return (
    <div style={{ minHeight:"100vh", background:"#F7F7F8", fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #F0F0F0", padding:"0 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:16, paddingTop:16, paddingBottom:8 }}>
          <div style={{ background:"#FF5000", borderRadius:12, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🚀</div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:"#1A1A1A" }}>Delivery Much</div>
            <div style={{ fontSize:11, color:"#FF5000", fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>Gestão de Promoções</div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
            {[["promocoes","🏷️ Promoções"],["marketing","📣 Marketing"],["dashboard","📊 Dashboard"],["visitas","📍 Visitas"]].map(([key, label]) => (
              <button key={key} onClick={() => setAba(key)} style={tab(aba === key)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px" }}>
        {loading && (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
            <div style={{ fontSize:15, color:"#999" }}>Carregando promoções...</div>
          </div>
        )}
        {erro && <div style={{ background:"#FFEBEE", color:"#C62828", padding:"12px 16px", borderRadius:12, marginBottom:16, fontSize:13 }}>{erro}</div>}
        {!loading && <>

        {/* ── VISITAS ── */}
        {aba === "visitas" && <AbaVisitas />}

        {/* ── MARKETING ── */}
        {aba === "marketing" && <AbaMarketing promos={lista} />}

        {/* ── DASHBOARD ── */}
        {aba === "dashboard" && (
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:"#1A1A1A", marginBottom:20 }}>Visão Geral</div>
            {/* KPIs de status */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:20 }}>
              {[
                { label:"Ativas",        val:stats.ativas,        color:"#00C853", bg:"#E8F5E9", icon:"✅" },
                { label:"Pausadas",      val:stats.pausadas,      color:"#FF9800", bg:"#FFF3E0", icon:"⏸️" },
                { label:"Cadastradas",   val:stats.cadastradas,   color:"#2196F3", bg:"#E3F2FD", icon:"📋" },
                { label:"Desabilitadas", val:stats.desabilitadas, color:"#F44336", bg:"#FFEBEE", icon:"🔴" },
                { label:"Restaurantes",  val:stats.restaurantes,  color:"#9C27B0", bg:"#F3E5F5", icon:"🍔" },
              ].map(item => (
                <div key={item.label} style={{ background:item.bg, borderRadius:16, padding:"16px" }}>
                  <div style={{ fontSize:20 }}>{item.icon}</div>
                  <div style={{ fontSize:24, fontWeight:800, color:item.color, marginTop:6 }}>{item.val}</div>
                  <div style={{ fontSize:11, color:"#666", fontWeight:600, marginTop:2 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Bloco de Investimentos Previstos */}
            <div style={{ background:"#fff", borderRadius:16, border:"1px solid #F0F0F0", padding:"20px 24px", marginBottom:24 }}>
              <div style={{ fontSize:15, fontWeight:800, color:"#1A1A1A", marginBottom:4 }}>💰 Investimento Previsto</div>
              <div style={{ fontSize:12, color:"#aaa", marginBottom:16 }}>Considera apenas promoções com QTD definida · unitário × qtd</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:16 }}>
                {[
                  { label:"🏪 Lojas",        val:stats.prevLojas,        color:"#2E7D32", bg:"#E8F5E9", borda:"#C8E6C9", desc:"incRestaurante × qtd" },
                  { label:"🏢 Franqueadora",  val:stats.prevFranqueadora, color:"#1565C0", bg:"#E3F2FD", borda:"#BBDEFB", desc:"incFranqueadora × qtd" },
                  { label:"🚀 DM (lvto)",     val:stats.prevDM,           color:"#E65100", bg:"#FFF3E0", borda:"#FFE0B2", desc:"incLvto × qtd" },
                ].map(item => (
                  <div key={item.label} style={{ background:item.bg, border:`1px solid ${item.borda}`, borderRadius:14, padding:"16px 18px" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:item.color, marginBottom:6 }}>{item.label}</div>
                    <div style={{ fontSize:26, fontWeight:800, color:item.color }}>
                      {item.val > 0 ? `R$ ${item.val.toFixed(2).replace(".",",")}` : "—"}
                    </div>
                    <div style={{ fontSize:10, color:"#aaa", marginTop:4 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
              {/* Barra proporcional */}
              {stats.incTotal > 0 && (() => {
                const total = stats.incTotal;
                const pLojas = Math.round((stats.prevLojas / total) * 100);
                const pFranq = Math.round((stats.prevFranqueadora / total) * 100);
                const pDM    = 100 - pLojas - pFranq;
                return (
                  <div>
                    <div style={{ display:"flex", height:10, borderRadius:10, overflow:"hidden", gap:2 }}>
                      {pLojas > 0 && <div style={{ width:`${pLojas}%`, background:"#4CAF50" }} title={`Lojas ${pLojas}%`} />}
                      {pFranq > 0 && <div style={{ width:`${pFranq}%`, background:"#2196F3" }} title={`Franqueadora ${pFranq}%`} />}
                      {pDM    > 0 && <div style={{ width:`${pDM}%`,    background:"#FF5000" }} title={`DM ${pDM}%`} />}
                    </div>
                    <div style={{ display:"flex", gap:16, marginTop:8, fontSize:11, color:"#888" }}>
                      <span><span style={{ color:"#4CAF50", fontWeight:700 }}>●</span> Lojas {pLojas}%</span>
                      <span><span style={{ color:"#2196F3", fontWeight:700 }}>●</span> Franqueadora {pFranq}%</span>
                      <span><span style={{ color:"#FF5000", fontWeight:700 }}>●</span> DM {pDM}%</span>
                      <span style={{ marginLeft:"auto", fontWeight:700, color:"#1A1A1A" }}>Total: R$ {total.toFixed(2).replace(".",",")}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:"#1A1A1A", marginBottom:14 }}>Por Status</div>
            <div style={{ background:"#fff", borderRadius:16, padding:"20px 24px", border:"1px solid #F0F0F0" }}>
              {Object.entries(STATUS_CONFIG).filter(([k]) => k).map(([key, cfg]) => {
                const count = lista.filter(p => p.status === key).length;
                const pct = Math.round((count / lista.length) * 100);
                return count > 0 ? (
                  <div key={key} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:"#333" }}>{cfg.label}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:cfg.color }}>{count}</span>
                    </div>
                    <div style={{ background:"#F0F0F0", borderRadius:6, height:8, overflow:"hidden" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:cfg.color, borderRadius:6 }} />
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* ── PROMOÇÕES ── */}
        {aba === "promocoes" && (
          <div>
            {/* Sub-toggle Promoções / Cupons */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", background:"#EBEBEB", borderRadius:20, padding:4, gap:2 }}>
                {[["promos","🏷️ Promoções"],["cupons","🎟️ Cupons"]].map(([key,label]) => (
                  <button key={key} onClick={() => setSubAba(key)} style={{
                    padding:"7px 20px", borderRadius:16, border:"none", cursor:"pointer", fontSize:13,
                    fontWeight: subAba===key ? 700 : 500,
                    background: subAba===key ? "#fff" : "transparent",
                    color: subAba===key ? "#FF5000" : "#888",
                    boxShadow: subAba===key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    transition:"all 0.15s",
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {subAba === "cupons" && <AbaCupons />}

            {subAba === "promos" && <>
            {/* Filtros */}
            <div style={{ background:"#fff", borderRadius:16, padding:"16px 20px", border:"1px solid #F0F0F0", marginBottom:20, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
              <input placeholder="🔍 Buscar restaurante, produto ou ID..." value={busca} onChange={e => setBusca(e.target.value)}
                style={{ ...inp, flex:"1 1 200px", minWidth:0 }} />
              <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ ...inp, minWidth:130 }}>
                <option value="TODOS">Todos os Status</option>
                <option value="ATIVA">✅ Ativa</option>
                <option value="PAUSADA">⏸️ Pausada</option>
                <option value="CADASTRADA">📋 Cadastrada</option>
                <option value="DESABILITADA">🔴 Desabilitada</option>
              </select>
              <select value={cidadeF} onChange={e => setCidadeF(e.target.value)} style={{ ...inp, minWidth:130 }}>
                <option value="TODAS">Todas as Cidades</option>
                <option>Livramento</option>
                <option>São Gabriel</option>
                <option>Orçamento</option>
              </select>
              <select value={tipoF} onChange={e => setTipoF(e.target.value)} style={{ ...inp, minWidth:150 }}>
                <option value="TODOS">Todos os Tipos</option>
                <option value="DE/POR">🏷️ De/Por</option>
                <option value="ENTREGA GRATIS">🚚 Entrega Grátis</option>
                <option value="ENTREGA PROMOCIONAL">📦 Entrega Promo</option>
                <option value="COMBO COCA-COLA">🥤 Combo Coca-Cola</option>
              </select>
              {(busca || statusF !== "TODOS" || cidadeF !== "TODAS" || tipoF !== "TODOS") && (
                <button onClick={() => { setBusca(""); setStatusF("TODOS"); setCidadeF("TODAS"); setTipoF("TODOS"); }}
                  style={{ ...inp, cursor:"pointer", color:"#FF5000", fontWeight:700, background:"#FFF3EE", border:"1.5px solid #FFD0B8" }}>
                  Limpar
                </button>
              )}
              <button onClick={() => setModal({ p:null, modo:"novo" })}
                style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#FF5000", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13, whiteSpace:"nowrap" }}>
                + Nova
              </button>
            </div>

            {/* Contador + toggle de layout */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ fontSize:13, color:"#888" }}>
                {filtered.length} promoção{filtered.length !== 1 ? "ões" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
              </div>
              <div style={{ display:"flex", background:"#F0F0F0", borderRadius:10, padding:3, gap:2 }}>
                {[["grid","⊞"],["lista","☰"]].map(([key, icon]) => (
                  <button key={key} onClick={() => setLayout(key)} style={{
                    width:34, height:30, borderRadius:8, border:"none", cursor:"pointer", fontSize:15,
                    background: layout===key ? "#fff" : "transparent",
                    color: layout===key ? "#FF5000" : "#aaa",
                    fontWeight: layout===key ? 700 : 400,
                    boxShadow: layout===key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition:"all 0.15s",
                  }}>{icon}</button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#BBB" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:16, fontWeight:600 }}>Nenhuma promoção encontrada</div>
              </div>
            ) : layout === "grid" ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
                {filtered.map(p => <Card key={p.id} p={p} onClick={promo => setModal({ p:promo, modo:"ver" })} />)}
              </div>
            ) : (
              <div style={{ background:"#fff", borderRadius:16, border:"1px solid #F0F0F0", overflow:"hidden" }}>
                {/* Cabeçalho da lista */}
                <div style={{ display:"grid", gridTemplateColumns:"2fr 2fr 100px 120px 100px 110px 60px", gap:0, background:"#FAFAFA", padding:"10px 16px", borderBottom:"1px solid #F0F0F0" }}>
                  {["Restaurante","Produto / Tipo","Status","Dias","Preço normal","Preço promo",""].map((h,i) => (
                    <div key={i} style={{ fontSize:10, fontWeight:700, color:"#bbb", textTransform:"uppercase", letterSpacing:0.4 }}>{h}</div>
                  ))}
                </div>
                {/* Linhas */}
                {filtered.map((p, idx) => {
                  const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG[""];
                  const tipoInfo = TIPO_CONFIG[p.tipo] || { icon:"🎯" };
                  const desc = p.precoNormal && p.precoPromo ? Math.round(((p.precoNormal-p.precoPromo)/p.precoNormal)*100) : null;
                  return (
                    <div key={p.id} onClick={() => setModal({ p, modo:"ver" })} style={{
                      display:"grid", gridTemplateColumns:"2fr 2fr 100px 120px 100px 110px 60px",
                      gap:0, padding:"12px 16px", cursor:"pointer",
                      background: idx%2===0 ? "#fff":"#FAFAFA",
                      borderBottom:"1px solid #F5F5F5",
                      transition:"background 0.1s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background="#FFF5F2"}
                      onMouseLeave={e => e.currentTarget.style.background=idx%2===0?"#fff":"#FAFAFA"}>
                      {/* Restaurante */}
                      <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", gap:2, paddingRight:8 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"#111", lineHeight:1.2 }}>{p.restaurante}</div>
                        <div style={{ fontSize:10, color:"#bbb" }}>{p.id} · {p.cidade}</div>
                      </div>
                      {/* Produto / Tipo */}
                      <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", gap:2, paddingRight:8 }}>
                        <div style={{ fontSize:12, color:"#555" }}>{tipoInfo.icon} {p.produto !== "-" ? p.produto : tipoInfo.label}</div>
                        <div style={{ fontSize:10, color:"#bbb" }}>{p.tipo}</div>
                      </div>
                      {/* Status */}
                      <div style={{ display:"flex", alignItems:"center" }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:10, background:cfg.bg, color:cfg.color, whiteSpace:"nowrap" }}>
                          {cfg.label}
                        </span>
                      </div>
                      {/* Dias */}
                      <div style={{ display:"flex", flexWrap:"wrap", gap:2, alignItems:"center" }}>
                        {!p.dias || p.dias.length===0
                          ? <span style={{ fontSize:10, color:"#ccc" }}>—</span>
                          : p.dias.length===7
                            ? <span style={{ fontSize:10, background:"#F5F5F5", color:"#777", padding:"2px 6px", borderRadius:6, fontWeight:600 }}>Todos</span>
                            : p.dias.slice(0,3).map(d => <span key={d} style={{ fontSize:9, background:"#FFF0EB", color:"#FF5000", padding:"1px 5px", borderRadius:6, fontWeight:700 }}>{DIAS_LABEL[d]}</span>)
                        }
                        {p.dias && p.dias.length > 3 && p.dias.length < 7 && <span style={{ fontSize:9, color:"#bbb" }}>+{p.dias.length-3}</span>}
                      </div>
                      {/* Preço normal */}
                      <div style={{ display:"flex", alignItems:"center" }}>
                        {p.precoNormal
                          ? <span style={{ fontSize:12, color:"#888" }}>R$ {p.precoNormal.toFixed(2).replace(".",",")}</span>
                          : <span style={{ fontSize:12, color:"#ddd" }}>—</span>
                        }
                      </div>
                      {/* Preço promo */}
                      <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", gap:2 }}>
                        {p.precoPromo
                          ? <>
                              <span style={{ fontSize:13, fontWeight:800, color:"#FF5000" }}>R$ {p.precoPromo.toFixed(2).replace(".",",")}</span>
                              {desc && <span style={{ fontSize:9, background:"#FF5000", color:"#fff", fontWeight:800, padding:"1px 5px", borderRadius:6, width:"fit-content" }}>-{desc}%</span>}
                            </>
                          : <span style={{ fontSize:12, color:"#ddd" }}>—</span>
                        }
                      </div>
                      {/* Ação */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end" }}>
                        <button onClick={e => { e.stopPropagation(); setModal({ p, modo:"ver" }); }} style={{
                          fontSize:11, fontWeight:700, padding:"5px 10px", borderRadius:8,
                          border:"1.5px solid #FF5000", background:"transparent", color:"#FF5000", cursor:"pointer",
                        }}>Ver</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </>}
          </div>
        )}
      </>}

      </div>
      {/* Modal */}
      {modal && (
        <Modal
          p={modal.p}
          modo={modal.modo}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
