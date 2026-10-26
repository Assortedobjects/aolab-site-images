// zh_lib: shared helpers for building the Chinese site. Evaluated with new Function("api","tree", src)
const DICT_URL = "https://raw.githubusercontent.com/Assortedobjects/aolab-site-images/2c3edf9acf54420e826cc2aae7a55062b2ceedf1/data/dict_zh.json";
const j = await (await fetch(DICT_URL)).json();
const D = j.dict, CTX = j.ctx;
const FIELD = { PY4p1EU9a:"pKJxCHgrU", faRDo8oWF:"yejMGFxi1", DHYCE4HN1:"kyG3PFfJd", T5w248OHF:"n6GXTiMWh", SZqukZtTo:"Pj3mqFspE", i_MNXOxBQ:"R8PWRnx91", nvUnHMiMP:"Iw0TNmEwG",
  CkechKFUo:"qLQauDHe3", WHgv8DJyW:"RyMyZ_jD8", yWFBHnut7:"yc9czPSAS",
  owm4sKAAG:"wEGQgc4hG", KSjfTPfCq:"JnShKypGe", dj6IJkw9o:"iuRY_0H74", MvXAIr4rB:"UH1Eafa_4", j5yjgQBTd:"Wfpf5IRWn", psxdJrlgA:"ucm9oMLW3" };
const PATHS = { "/":"/zh", "/aolab-work":"/zh/aolab-work", "/aolab-work/strategy":"/zh/aolab-work/strategy", "/aolab-work/product":"/zh/aolab-work/product", "/aolab-work/spatial":"/zh/aolab-work/spatial",
  "/aolab-service":"/zh/aolab-service", "/aolab-culture":"/zh/aolab-culture", "/aolab-lifestyle":"/zh/aolab-lifestyle", "/about":"/zh/about", "/aolab-gallery":"/zh/aolab-gallery",
  "/works/:T9gdzTukW":"/zh/works/:T9gdzTukW", "/aolab-lifestyle/:UZkFGW2A6":"/zh/aolab-lifestyle/:UZkFGW2A6", "/aolab-gallery/:wqd3mW1pR":"/zh/aolab-gallery/:wqd3mW1pR" };
function tr(text, ctx){ if (typeof text!=="string") return null; const t=text.trim(); if(!t) return null; const c = ctx && CTX[ctx] && CTX[ctx][t]; return c || D[t] || null; }
function mapHref(h){ if (typeof h!=="string" || !h.startsWith("/") || h.startsWith("/zh")) return null; const i=h.indexOf("#"); const p = i>=0? h.slice(0,i):h; const hash = i>=0? h.slice(i):""; const np = PATHS[p]; return np? np+hash : null; }
function mapLink(l){ if (!l) return null; if (typeof l==="string") { const m=mapHref(l); return m? m : null; } if (typeof l==="object" && l.href) { const m=mapHref(l.href); return m? {...l, href:m} : null; } return null; }
function hasWork(n, compNeeds){ // does this node need ZH processing
  if (n.type==="TextRun" && tr(n.text)) return true;
  if (n.link && mapLink(n.link)) return true;
  if (n.type==="RichTextNode" && n.text && typeof n.text==="object" && FIELD[n.text.id]) return true;
  if (n.type==="ComponentInstanceNode") { if (compNeeds && compNeeds.has(n.component)) return true; for (const [k,v] of Object.entries(n)) { if(!k.startsWith("$control__")||k==="$control__variant") continue; if (typeof v==="string" && tr(v)) return true; if (v && typeof v==="object" && !Array.isArray(v) && (mapLink(v) || (v.type==="reference" && FIELD[v.id]))) return true; if (Array.isArray(v)) for (const b of v) for (const r of (b&&b.children)||[]) if (r.type==="TextRun" && tr(r.text)) return true; } }
  return false; }

function escH(t){ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function richToHtml(arr, ctx){ let h=""; for (const b of arr) { if (!b) continue; const tag = b.tag || "p"; let inner=""; for (const r of (b.children||[])) { if (r.type==="TextRun") { const z = tr(r.text, ctx); let t = escH(z || r.text); if (r.bold) t = "<strong>"+t+"</strong>"; if (r.italic) t = "<em>"+t+"</em>"; inner += t; } else if (r.type==="TextLineBreak") inner += "<br>"; } h += "<"+tag+">"+inner+"</"+tag+">"; } return h; }
function trHtml(html, ctx){ let ch=false; const out = html.replace(/>([^<>]+)</g, (m, t)=>{ const z = tr(t, ctx); if (z) { ch=true; return ">"+escH(z)+"<"; } return m; }); return ch? out : null; }
const log = { text:0, link:0, ref:0, ctrl:0, swap:0, err:[] };
function processSubtree(rootId, ctx, compMap, variantMap){
  for (const n of tree.walk(rootId)) {
    try {
      if (n.type==="TextRun") { const z = tr(n.text, ctx); if (z) { if (tree.replaceText(n.id, n.text, z)) log.text++; } if (n.link) { const m=mapLink(n.link); if (m) { tree.patch(n.id, {link:m}); log.link++; } } continue; }
      if (n.link) { const m = mapLink(n.link); if (m) { tree.patch(n.id, {link:m}); log.link++; } }
      if (n.type==="RichTextNode" && n.text && typeof n.text==="object" && n.text.type==="reference" && FIELD[n.text.id]) { tree.patch(n.id, {text: tree.ref(FIELD[n.text.id], n.text.providerId)}); log.ref++; }
      if (n.type==="ComponentInstanceNode") {
        const patch = {};
        if (compMap && compMap[n.component] && !n.$isReplica) { patch.component = compMap[n.component]; }
        if (variantMap && n.$control__variant && variantMap[n.$control__variant]) patch.$control__variant = variantMap[n.$control__variant];
        for (const [k,v] of Object.entries(n)) { if(!k.startsWith("$control__")||k==="$control__variant") continue;
          if (typeof v==="string") { const z=tr(v, ctx); if (z) { patch[k]=z; log.ctrl++; } else if (v.indexOf("<")>=0) { const zh=trHtml(v, ctx); if (zh) { patch[k]=zh; log.ctrl++; } } }
          else if (Array.isArray(v)) { for (const b of v) for (const r of (b&&b.children)||[]) if (r.type==="TextRun") { const z=tr(r.text, ctx); if (z) { try { tree.replaceText(r.id, r.text, z); log.ctrl++; } catch(e){ log.err.push("rich:"+r.id+":"+e.message); } } } }
          else if (v && typeof v==="object") { const m=mapLink(v); if (m) { patch[k]=m; log.link++; } else if (v.type==="reference" && FIELD[v.id]) { patch[k]=tree.ref(FIELD[v.id], v.providerId); log.ref++; } }
        }
        if (Object.keys(patch).length) { tree.patch(n.id, patch); if (patch.component) log.swap++; }
      }
      if (variantMap) { const ip={}; for (const k of ["onTap","onClick","onMouseEnter","onMouseLeave","onAppear","onTapStart","onMouseDown","onMouseUp","triggerActions"]) { const v=n[k]; if (!v) continue; let js=JSON.stringify(v); let ch=false; js = js.replace(/"variant":"([A-Za-z0-9_-]+)"/g, (m,id)=>{ if (variantMap[id]) { ch=true; return '"variant":"'+variantMap[id]+'"'; } return m; }); if (ch) ip[k]=JSON.parse(js); } if (Object.keys(ip).length) { tree.patch(n.id, ip); log.ia=(log.ia||0)+1; } }
    } catch(e) { log.err.push(n.id+":"+String(e.message||e).slice(0,120)); }
  }
}

function grounds(scope){ return (tree.get(scope).children||[]).map(c=>c.id); }
async function swapInstance(id, compMap, variantMap){
  const P = tree.get(id); if (!P || P.$originalId) return "skip";
  const newComp = compMap[P.component]; if (!newComp) return "skip";
  const parent = tree.getParentNodeFor(id); if (!parent) return "noparent";
  const idx = (parent.children||[]).findIndex(c=>c.id===id);
  const s = await tree.serialize(id, {depth:0});
  const attrs = {};
  for (const [k,v] of Object.entries(s)) { if (k==="id"||k==="type"||k==="children"||k==="component"||k==="__class"||(k.startsWith("$")&&!k.startsWith("$control__"))) continue; attrs[k] = (Array.isArray(v) && k.startsWith("$control__") && v.length && v[0] && v[0].type==="TextBlock") ? richToHtml(v) : v; }
  if (attrs.$control__variant && variantMap[attrs.$control__variant]) attrs.$control__variant = variantMap[attrs.$control__variant];
  const N = tree.insert("ComponentInstanceNode", "zs"+id, {...attrs, component:newComp, parent: parent.id, index: idx});
  const scope = tree.getScopeNodeFor(id);
  const reps = [];
  if (scope) for (const g of grounds(scope.id)) { const rid = g+id; const RP = tree.get(rid); if (!RP) continue; reps.push([g, rid]); }
  for (const [g, rid] of reps) {
    const rs = await tree.serialize(rid, {depth:0}); const rpatch = {};
    for (const [k,v] of Object.entries(rs)) { if (k==="id"||k==="type"||k==="children"||k==="component"||k==="__class"||(k.startsWith("$")&&!k.startsWith("$control__"))) continue; if (Array.isArray(v) && v.length && v[0] && v[0].type==="TextBlock") continue; if (JSON.stringify(v)!==JSON.stringify(s[k])) rpatch[k] = (k==="$control__variant" && variantMap[v]) ? variantMap[v] : v; }
    const rn = g+N.id; if (!tree.get(rn)) continue;
    if (Object.keys(rpatch).length) { try { tree.patch(rn, rpatch); } catch(e) { log.err.push("rpatch "+rn+": "+String(e.message).slice(0,80)); } }
    const rparent = tree.getParentNodeFor(rid); if (rparent) { const ridx = (rparent.children||[]).findIndex(c=>c.id===rid); try { tree.move(rn, rparent.id, ridx); } catch(e) { log.err.push("move "+rn+": "+String(e.message).slice(0,80)); } }
  }
  tree.remove(id); log.swap++;
  return N.id;
}
async function swapAll(root, compMap, variantMap, max=1e9){
  const list = []; for (const n of tree.walk(root)) if (n.type==="ComponentInstanceNode" && !n.$originalId && compMap[n.component]) list.push(n.id);
  let done=0; for (const id of list) { if (done>=max) break; try { await swapInstance(id, compMap, variantMap); } catch(e) { log.err.push("swap "+id+": "+String(e.message||e).slice(0,120)); } done++; }
  return list.length - done;
}
return { richToHtml, trHtml, D, CTX, FIELD, PATHS, tr, mapHref, mapLink, hasWork, processSubtree, swapInstance, swapAll, log };
