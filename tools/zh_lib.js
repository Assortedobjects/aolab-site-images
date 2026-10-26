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
          if (typeof v==="string") { const z=tr(v, ctx); if (z) { patch[k]=z; log.ctrl++; } }
          else if (Array.isArray(v)) { for (const b of v) for (const r of (b&&b.children)||[]) if (r.type==="TextRun") { const z=tr(r.text, ctx); if (z) { try { tree.replaceText(r.id, r.text, z); log.ctrl++; } catch(e){ log.err.push("rich:"+r.id+":"+e.message); } } } }
          else if (v && typeof v==="object") { const m=mapLink(v); if (m) { patch[k]=m; log.link++; } else if (v.type==="reference" && FIELD[v.id]) { patch[k]=tree.ref(FIELD[v.id], v.providerId); log.ref++; } }
        }
        if (Object.keys(patch).length) { tree.patch(n.id, patch); if (patch.component) log.swap++; }
      }
    } catch(e) { log.err.push(n.id+":"+String(e.message||e).slice(0,120)); }
  }
}
return { D, CTX, FIELD, PATHS, tr, mapHref, mapLink, hasWork, processSubtree, log };
