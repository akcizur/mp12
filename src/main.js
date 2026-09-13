import './styles.css'

const DB_KEY = 'mp12-inventory-v4'
const THEME_KEY = 'mp12-theme'

const seed = {
  materials: [
    { id:'1', name:'Hroznový extrakt' },
    { id:'2', name:'MagChel Magnesium bisglycinate' },
    { id:'3', name:'Heřmánkový extrakt' },
    { id:'4', name:'Mátový extrakt' },
    { id:'5', name:'Ashwagandha extrakt' }
  ],
  boxes: Array.from({length:12}, (_,i) => ({id:String(i+1)})),
  positions: Array.from({length:40}, (_,i) => ({id:String(i+1), name:`Pozice ${String.fromCharCode(65 + Math.floor(i/10))}${i%10+1}`})),
  packs: [
    {id:'P-26-001',material:'1',lot:'AK66-260801',expiry:'08/27',box:'1',position:'1',qty:2400,packState:'nový'},
    {id:'P-26-002',material:'1',lot:'AK66-260812',expiry:'08/27',box:'2',position:'2',qty:1800,packState:'otevřený'},
    {id:'P-26-003',material:'2',lot:'BS-260802',expiry:'08/27',box:'3',position:'3',qty:4100,packState:'nový'},
    {id:'P-26-004',material:'3',lot:'RR-260805',expiry:'08/27',box:'4',position:'11',qty:3200,packState:'nový'},
    {id:'P-26-005',material:'4',lot:'KT-260808',expiry:'08/27',box:'5',position:'12',qty:2100,packState:'otevřený'},
    {id:'P-26-006',material:'5',lot:'MA-260810',expiry:'08/27',box:'6',position:'13',qty:2900,packState:'nový'},
    {id:'P-26-007',material:'2',lot:'BS-260818',expiry:'09/27',box:'7',position:'21',qty:2200,packState:'nový'}
  ],
  movements: [],
  counts: [],
  meta: { nextPack:8, nextMovement:1, nextMaterial:6, nextBox:13, nextPosition:41, nextCount:1 }
}

const state = { page:'inventory', q:'', sort:{key:'material',dir:'asc'}, compact:false, theme:localStorage.getItem(THEME_KEY)||'dark' }
let db = loadDb()

function clone(x){return JSON.parse(JSON.stringify(x))}
function numericId(value){const n=Number(String(value??'').trim());return Number.isInteger(n)&&n>0?String(n):''}
function nextNumericId(items){const max=(items||[]).reduce((m,x)=>Math.max(m,Number(x?.id)||0),0);return String(max+1)}
function migrateMaterialIds(data){
  const list=Array.isArray(data.materials)?data.materials:[]
  const map=new Map()
  let next=1
  list.forEach(item=>{const old=String(item.id??'').trim();const current=numericId(old)||String(next++);map.set(old,current)})
  const materials=list.map((item,index)=>({id:map.get(String(item.id??'').trim())||String(index+1),name:String(item.name??'').trim()})).filter(x=>x.name)
  if (!materials.length) return seed.materials.map(clone)
  if (Array.isArray(data.packs)) data.packs.forEach(p=>{p.material=map.get(String(p.material??''))||numericId(p.material)||String(p.material??'')})
  return materials
}
function migrateBoxIds(data){
  const list=Array.isArray(data.boxes)?data.boxes:[]
  const map=new Map()
  const boxes=[]
  list.forEach((item,index)=>{const old=String(item.id??'').replace(/^B-/i,'').trim();const id=numericId(old)||String(index+1);map.set(old,id);boxes.push({id})})
  if (!boxes.length) return seed.boxes.map(clone)
  if (Array.isArray(data.packs)) data.packs.forEach(p=>{const old=String(p.box??'').replace(/^B-/i,'');p.box=map.get(old)||numericId(old)||old})
  return boxes
}
function migratePositionIds(data){
  const list=Array.isArray(data.positions)?data.positions:[]
  const map=new Map()
  const positions=[]
  list.forEach((item,index)=>{const old=String(item.id??'').trim();const id=numericId(old)||String(index+1);const name=String(item.name??'').trim()||(!numericId(old)?old:`Pozice ${id}`);map.set(old,id);positions.push({id,name})})
  if (!positions.length) return seed.positions.map(clone)
  if (Array.isArray(data.packs)) data.packs.forEach(p=>{const old=String(p.position??'').trim();p.position=map.get(old)||numericId(old)||old})
  return positions
}
function loadDb(){
  try{
    const raw=JSON.parse(localStorage.getItem(DB_KEY)||'null')
    return raw?normalize(raw):clone(seed)
  }catch{return clone(seed)}
}
function saveDb(){localStorage.setItem(DB_KEY,JSON.stringify(db))}
function normalize(data){
  const d={...clone(seed),...data}
  d.packs=Array.isArray(d.packs)?d.packs.map(p=>({...p,id:normalizePackId(p.id),material:String(p.material??''),lot:String(p.lot||''),expiry:normExpiry(p.expiry),box:String(p.box||''),position:String(p.position||''),qty:Math.max(0,Number(p.qty)||0),packState:p.packState==='otevřený'?'otevřený':'nový'})):[]
  d.materials=migrateMaterialIds(d)
  d.boxes=migrateBoxIds(d)
  d.positions=migratePositionIds(d)
  d.movements=Array.isArray(d.movements)?d.movements:[]
  d.counts=Array.isArray(d.counts)?d.counts:[]
  d.meta={...clone(seed.meta),...(d.meta||{})}
  d.meta.nextMaterial=Math.max(Number(d.meta.nextMaterial)||1,Number(nextNumericId(d.materials)))
  d.meta.nextBox=Math.max(Number(d.meta.nextBox)||1,Number(nextNumericId(d.boxes)))
  d.meta.nextPosition=Math.max(Number(d.meta.nextPosition)||1,Number(nextNumericId(d.positions)))
  return d
}
function normalizePackId(value){const s=String(value||'').trim().toUpperCase();const m=s.match(/^P-(?:2026-)?(\d{1,4})$/);return m?`P-26-${String(m[1]).padStart(3,'0')}`:s||''}
function nextPackId(){const used=new Set(db.packs.map(p=>Number(String(p.id).match(/P-26-(\d+)/)?.[1]||0)));let n=Number(db.meta.nextPack||1);while(used.has(n))n++;db.meta.nextPack=n+1;return `P-26-${String(n).padStart(3,'0')}`}
function nextId(kind,prefix){const key=`next${kind}`;const n=Number(db.meta[key]||1);db.meta[key]=n+1;return `${prefix}${String(n).padStart(3,'0')}`}
function normExpiry(v){const m=String(v??'').trim().replace(/\./g,'/').match(/^(\d{1,2})\/(\d{2})$/);return m?`${m[1].padStart(2,'0')}/${m[2]}`:String(v||'')}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function fmt(n){return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2}).format(Number(n)||0)}
function material(id){return db.materials.find(x=>String(x.id)===String(id))}
function pack(id){return db.packs.find(x=>x.id===id)}
function position(id){return db.positions.find(x=>String(x.id)===String(id))}
function expRank(v){const m=String(v).match(/^(\d{2})\/(\d{2})$/);return m?(2000+Number(m[2]))*12+Number(m[1]):Number.MAX_SAFE_INTEGER}
function expState(v){const d=expRank(v);if(!Number.isFinite(d)||d===Number.MAX_SAFE_INTEGER)return'neznámá';const now=new Date(),cur=now.getFullYear()*12+now.getMonth()+1,diff=d-cur;return diff<0?'po expiraci':diff<=2?'brzy expiruje':'OK'}
function activePacks(){return db.packs.filter(p=>p.qty>0)}
function optionList(items,value,label){return items.map(x=>`<option value="${esc(x.id)}" ${String(x.id)===String(value)?'selected':''}>${esc(label?label(x):x.id)}</option>`).join('')}
function materialOptions(value){return optionList(db.materials,value,m=>m.name)}
function boxOptions(value){return optionList(db.boxes,value)}
function positionOptions(value){return optionList(db.positions,value,p=>`${p.id} · ${p.name}`)}

const app=document.querySelector('#app')
app.innerHTML=`<div class="app-shell"><aside class="sidebar" id="sidebar"><div class="brand"><div class="brand-mark">M</div><div><b>MP12</b><span>INVENTORY</span></div></div><button class="new-btn" id="newBtn">＋ Nový záznam</button><div class="nav-label">PAGES</div><nav id="nav"></nav><div class="sidebar-foot"><button class="ghost-btn" id="importBtn">↑ Import CSV</button><button class="ghost-btn" id="exportBtn">↓ Export CSV</button><button class="ghost-btn" id="themeBtn">◐ Motiv</button><small>GitHub Pages · local DB</small></div></aside><main class="main"><header class="mobile-bar"><button id="menuBtn" class="icon-btn">☰</button><b>MP12</b></header><div class="stage" id="stage"></div></main></div><input type="file" id="csvFile" accept=".csv,text/csv" hidden/><div id="modalRoot"></div><div id="toastRoot" class="toast-root"></div>`

const pages=[['inventory','▤','Zásoby','Pytle, šarže, expirace, boxy a pozice.'],['warehouse','⌗','Pozice','Pozice → boxy → pytle.'],['movements','↕','Pohyby','Audit příjmů, výdejů a přesunů.'],['materials','◇','Suroviny','Názvy surovin s automatickým číselným ID.'],['counts','◫','Inventury','Evidence inventurních kontrol.']]
const pageMeta=id=>{const p=pages.find(x=>x[0]===id);return{title:p?.[2]||id,desc:p?.[3]||''}}
function renderNav(){document.querySelector('#nav').innerHTML=pages.map(([id,icon,label])=>`<button class="nav-item ${state.page===id?'active':''}" data-page="${id}"><span>${icon}</span>${label}</button>`).join('')}
function switchPage(next){if(next===state.page)return;const old=document.querySelector('.page-layer.current');state.page=next;const layer=buildPageLayer();layer.classList.add('enter');document.querySelector('#stage').appendChild(layer);requestAnimationFrame(()=>{layer.classList.remove('enter');if(old){old.classList.remove('current');old.classList.add('exit');setTimeout(()=>old.remove(),240)}});renderNav();closeSidebar()}
function buildPageLayer(){const meta=pageMeta(state.page),layer=document.createElement('section');layer.className='page-layer current';layer.innerHTML=`<div class="page-head"><div><div class="eyebrow">PAGES / ${state.page.toUpperCase()}</div><h1>${meta.title}</h1><p>${meta.desc}</p></div><div class="head-actions"><button class="btn" id="refreshBtn">Obnovit</button><button class="btn primary" id="headAction">＋ Přidat</button></div></div><div class="page-content">${renderPageContent()}</div>`;layer.querySelector('#refreshBtn').onclick=()=>renderPage();layer.querySelector('#headAction').onclick=()=>newRecord();bindLayer(layer);return layer}
function renderPage(){document.querySelector('#stage').replaceChildren(buildPageLayer())}
function renderPageContent(){if(state.page==='inventory')return inventoryPage();if(state.page==='warehouse')return warehousePage();if(state.page==='movements')return movementsPage();if(state.page==='materials')return materialsPage();return countsPage()}
function tableToolbar(extra=''){return`<div class="table-tools"><label class="search"><span>⌕</span><input id="q" value="${esc(state.q)}" placeholder="Hledat…"/></label><div class="tool-group">${extra}<button class="btn small" id="compactBtn">${state.compact?'Standard':'Kompaktní'}</button></div></div>`}
function inventoryRows(){const q=state.q.trim().toLocaleLowerCase('cs-CZ');const rows=activePacks().filter(p=>`${p.id} ${material(p.material)?.name||''} ${p.lot} ${p.expiry} ${p.box} ${position(p.position)?.name||''} ${p.packState}`.toLocaleLowerCase('cs-CZ').includes(q));const key=state.sort.key,dir=state.sort.dir;rows.sort((a,b)=>{let x=key==='material'?material(a.material)?.name||'':key==='qty'?a.qty:key==='expiry'?expRank(a.expiry):a[key]||'';let y=key==='material'?material(b.material)?.name||'':key==='qty'?b.qty:key==='expiry'?expRank(b.expiry):b[key]||'';const r=x>y?1:x<y?-1:0;return dir==='asc'?r:-r});return rows}
function th(key,label){return`<th><button class="th-btn" data-sort="${key}">${label}<span>↕</span></button></th>`}
function inventoryPage(){const rows=inventoryRows();return`${tableToolbar('<button class="btn small" id="receiveBtn">＋ Příjem</button>')}<div class="table-card"><table><thead><tr>${th('id','ID pytle')}${th('material','Surovina')}${th('lot','Šarže')}${th('expiry','Expirace')}${th('box','Box')}${th('position','Pozice')}${th('qty','Hmotnost (g)')}<th>Stav</th><th></th></tr></thead><tbody>${rows.length?rows.map(p=>`<tr><td class="mono"><b>${esc(p.id)}</b></td><td>${esc(material(p.material)?.name||p.material)}</td><td class="mono">${esc(p.lot)}</td><td class="mono"><span class="expiry ${expState(p.expiry)!=='OK'?'warn':''}">${esc(p.expiry)}</span></td><td class="mono">${esc(p.box)}</td><td><span class="chip">${esc(position(p.position)?.id||p.position)} · ${esc(position(p.position)?.name||'')}</span></td><td class="mono"><b>${fmt(p.qty)}</b></td><td><span class="badge ${p.packState==='otevřený'?'open':'new'}">${esc(p.packState)}</span></td><td><button class="row-action" data-action="menu" data-id="${esc(p.id)}">•••</button></td></tr>`).join(''):`<tr><td colspan="9" class="empty">Žádné záznamy.</td></tr>`}</tbody></table></div>`}
function warehousePage(){return`<div class="warehouse-card"><div class="warehouse-grid">${db.positions.map(pos=>{const items=activePacks().filter(p=>p.position===pos.id),qty=items.reduce((a,p)=>a+p.qty,0);return`<button class="slot ${items.length?'busy':''}" data-slot="${pos.id}"><b>${esc(pos.id)} · ${esc(pos.name)}</b><span>${items.length?`${items.length} pytle`:'volná'}</span>${items.length?`<small>${fmt(qty)} g</small>`:''}</button>`}).join('')}</div></div>`}
function movementsPage(){const q=state.q.toLowerCase(),rows=db.movements.filter(m=>`${m.id} ${m.type} ${m.pack} ${m.from} ${m.to} ${m.reason}`.toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date));return`${tableToolbar()}<div class="table-card"><table><thead><tr><th>ID</th><th>Čas</th><th>Typ</th><th>Pytel</th><th>Trasa</th><th>Množství</th><th>Důvod</th></tr></thead><tbody>${rows.length?rows.map(m=>`<tr><td class="mono">${esc(m.id)}</td><td>${new Date(m.date).toLocaleString('cs-CZ',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</td><td><span class="badge ${m.type==='Příjem'?'new':m.type==='Výdej'?'open':''}">${esc(m.type)}</span></td><td class="mono">${esc(m.pack)}</td><td>${esc(m.from)} → ${esc(m.to)}</td><td class="mono">${m.qty?`${m.qty>0?'+':''}${fmt(m.qty)} g`:'—'}</td><td>${esc(m.reason)}</td></tr>`).join(''):`<tr><td colspan="7" class="empty">Žádné pohyby.</td></tr>`}</tbody></table></div>`}
function materialsPage(){const q=state.q.toLowerCase(),rows=db.materials.filter(m=>`${m.id} ${m.name}`.toLowerCase().includes(q));return`${tableToolbar('<button class="btn small" id="newMaterialBtn">＋ Surovina</button>')}<div class="table-card"><table><thead><tr><th>ID</th><th>Název</th><th>Aktuální zásoba</th><th></th></tr></thead><tbody>${rows.map(m=>{const qty=activePacks().filter(p=>String(p.material)===String(m.id)).reduce((a,p)=>a+p.qty,0);return`<tr><td class="mono"><b>${esc(m.id)}</b></td><td>${esc(m.name)}</td><td class="mono">${fmt(qty)} g</td><td><button class="row-action" data-action="material-edit" data-id="${m.id}">Upravit</button></td></tr>`}).join('')||`<tr><td colspan="4" class="empty">Žádné suroviny.</td></tr>`}</tbody></table></div>`}
function countsPage(){return`${tableToolbar('<button class="btn small" id="newCountBtn">＋ Inventura</button>')}<div class="table-card"><table><thead><tr><th>ID</th><th>Vytvořeno</th><th>Položek</th><th>Stav</th><th></th></tr></thead><tbody>${db.counts.map(c=>`<tr><td class="mono">${c.id}</td><td>${new Date(c.date).toLocaleString('cs-CZ')}</td><td>${c.items||0}</td><td><span class="badge">${c.status}</span></td><td><button class="row-action">Otevřít</button></td></tr>`).join('')||`<tr><td colspan="5" class="empty">Žádné inventury.</td></tr>`}</tbody></table></div>`}

function modal(title,body,onSave){const root=document.querySelector('#modalRoot');root.innerHTML=`<div class="modal-backdrop"><form class="modal-card"><div class="modal-head"><div><div class="eyebrow">MP12</div><h2>${title}</h2></div><button type="button" class="icon-btn" data-close>×</button></div>${body}<div class="modal-actions"><button type="button" class="btn" data-close>Zrušit</button><button class="btn primary">Uložit</button></div></form></div>`;root.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>root.replaceChildren());const form=root.querySelector('form');form.onsubmit=e=>{e.preventDefault();onSave(new FormData(form));root.replaceChildren()}}
function newRecord(){if(state.page==='inventory')receive();else if(state.page==='materials')newMaterial();else if(state.page==='warehouse')newPosition();else if(state.page==='counts')newCount();else receive()}
function receive(){const generatedId=nextPackId();modal('Příjem pytle',`<div class="form-grid"><label>ID pytle<small>automaticky vygenerované</small><input value="${generatedId}" readonly></label><label>Surovina<select name="material" required>${materialOptions(db.materials[0]?.id||'')}</select></label><label>Šarže<input name="lot" required></label><label>Expirace<input name="expiry" placeholder="MM/YY" pattern="\\d{2}/\\d{2}" required></label><label>Box<select name="box" required>${boxOptions(db.boxes[0]?.id||'')}</select></label><label>Pozice<select name="position" required>${positionOptions(db.positions[0]?.id||'')}</select></label><label>Hmotnost (g)<input name="qty" type="number" min="0" step="0.01" required></label><label>Stav<select name="packState"><option>nový</option><option>otevřený</option></select></label></div>`,f=>{const p={id:generatedId,material:String(f.get('material')||''),lot:String(f.get('lot')||'').trim(),expiry:normExpiry(f.get('expiry')),box:String(f.get('box')||''),position:String(f.get('position')||''),qty:Math.max(0,Number(f.get('qty'))||0),packState:String(f.get('packState')||'nový')};if(!db.materials.some(x=>String(x.id)===p.material)||!db.boxes.some(x=>String(x.id)===p.box)||!db.positions.some(x=>String(x.id)===p.position)){toast('Neplatný údaj z číselníku');return}db.packs.unshift(p);db.movements.unshift({id:nextId('Movement','M-'),date:new Date().toISOString(),type:'Příjem',pack:p.id,qty:p.qty,from:'Příjem',to:p.position,reason:'Příjem zásoby'});saveDb();renderPage();toast(`Vytvořeno ${p.id}`)})}
function movePack(p){modal(`Přesun ${p.id}`,`<div class="form-grid"><label>Původní pozice<input value="${esc(position(p.position)?.id||p.position)} · ${esc(position(p.position)?.name||'')}" readonly></label><label>Nová pozice<select name="position" required>${positionOptions(p.position)}</select></label><label>Box<select name="box" required>${boxOptions(p.box)}</select></label></div>`,f=>{const from=p.position,to=String(f.get('position')||''),box=String(f.get('box')||'');if(!db.positions.some(x=>String(x.id)===to)||!db.boxes.some(x=>String(x.id)===box)){toast('Neplatný údaj z číselníku');return}p.position=to;p.box=box;db.movements.unshift({id:nextId('Movement','M-'),date:new Date().toISOString(),type:'Přesun',pack:p.id,qty:0,from,to,reason:'Změna pozice'});saveDb();renderPage();toast(`Přesunuto ${p.id}`)})}
function issuePack(p){modal(`Výdej ${p.id}`,`<div class="form-grid"><label>Dostupné (g)<input value="${fmt(p.qty)}" readonly></label><label>Výdej (g)<input name="qty" type="number" min="0.01" max="${p.qty}" step="0.01" required></label><label>Důvod<input name="reason" value="Výdej"></label></div>`,f=>{const qty=Math.min(p.qty,Math.max(0,Number(f.get('qty'))||0));if(!qty)return;const from=p.position;p.qty=Number((p.qty-qty).toFixed(2));db.movements.unshift({id:nextId('Movement','M-'),date:new Date().toISOString(),type:'Výdej',pack:p.id,qty:-qty,from,to:'Výdej',reason:f.get('reason')||'Výdej'});saveDb();renderPage();toast(`Vydáno ${fmt(qty)} g`)})}
function detailPack(p){modal(p.id,`<div class="detail-grid"><div><span>Surovina</span><b>${esc(material(p.material)?.name||p.material)}</b></div><div><span>Šarže</span><b>${esc(p.lot)}</b></div><div><span>Expirace</span><b>${esc(p.expiry)}</b></div><div><span>Box / pozice</span><b>${esc(p.box)} / ${esc(position(p.position)?.id||p.position)} · ${esc(position(p.position)?.name||'')}</b></div><div><span>Hmotnost</span><b>${fmt(p.qty)} g</b></div><div><span>Stav</span><b>${esc(p.packState)}</b></div></div><div class="quick-actions"><button type="button" class="btn small" data-detail-move>Přesun</button><button type="button" class="btn small" data-detail-issue>Výdej</button></div>`,()=>{});document.querySelector('[data-detail-move]')?.addEventListener('click',()=>{document.querySelector('#modalRoot').replaceChildren();movePack(p)});document.querySelector('[data-detail-issue]')?.addEventListener('click',()=>{document.querySelector('#modalRoot').replaceChildren();issuePack(p)})}
function newMaterial(){const generatedId=nextNumericId(db.materials);modal('Nová surovina',`<div class="form-grid"><label>ID<small>automatické číselné ID</small><input value="${generatedId}" readonly></label><label>Název suroviny<input name="name" required autofocus></label></div>`,f=>{const name=String(f.get('name')||'').trim();if(!name)return;db.materials.push({id:generatedId,name});db.meta.nextMaterial=Math.max(Number(db.meta.nextMaterial)||1,Number(generatedId)+1);saveDb();renderPage();toast(`Surovina ${generatedId} vytvořena`)})}
function newBox(){const generatedId=nextNumericId(db.boxes);modal('Přidat box',`<div class="form-grid"><label>Číslo boxu<small>automatické číselné ID</small><input value="${generatedId}" readonly></label></div>`,()=>{db.boxes.push({id:generatedId});db.meta.nextBox=Math.max(Number(db.meta.nextBox)||1,Number(generatedId)+1);saveDb();renderPage();toast(`Box ${generatedId} přidán`)})}
function newPosition(){const generatedId=nextNumericId(db.positions);modal('Nová pozice',`<div class="form-grid"><label>ID pozice<small>automatické číselné ID</small><input value="${generatedId}" readonly></label><label>Název pozice<input name="name" placeholder="např. Regál A1" required autofocus></label></div>`,f=>{const name=String(f.get('name')||'').trim();if(!name)return;db.positions.push({id:generatedId,name});db.meta.nextPosition=Math.max(Number(db.meta.nextPosition)||1,Number(generatedId)+1);saveDb();renderPage();toast(`Pozice ${generatedId} vytvořena`)})}
function newCount(){modal('Nová inventura',`<div class="form-grid"><label>ID<input name="id" value="I-${String(db.meta.nextCount).padStart(3,'0')}" readonly></label><label>Položek<input value="${activePacks().length}" readonly></label></div>`,f=>{db.counts.unshift({id:f.get('id'),date:new Date().toISOString(),items:activePacks().length,status:'otevřená'});db.meta.nextCount++;saveDb();renderPage();toast('Inventura vytvořena')})}
function parseCsv(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i],next=text[i+1];if(ch==='"'&&next==='"'){field+='"';i++;continue}if(ch==='"'){quoted=!quoted;continue}if(ch===','&&!quoted){row.push(field);field='';continue}if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field='';continue}field+=ch}if(field||row.length){row.push(field);if(row.some(Boolean))rows.push(row)}return rows}
function importCsv(text){const rows=parseCsv(text);if(!rows.length)throw Error('Prázdné CSV');const headers=rows.shift().map(x=>x.trim());const idx=Object.fromEntries(headers.map((h,i)=>[h.toLowerCase(),i]));if(idx.id==null)throw Error('CSV musí obsahovat sloupec id');let added=0,updated=0;for(const r of rows){const id=normalizePackId(r[idx.id]);if(!id)continue;const incoming={id,material:String(r[idx.material]||'1').trim(),lot:String(r[idx.lot]||'').trim(),expiry:normExpiry(r[idx.expiry]||''),box:String(r[idx.box]||'').trim(),position:String(r[idx.position]||'').trim(),qty:Math.max(0,Number(String(r[idx.qty]||'0').replace(',','.'))||0),packState:String(r[idx.packState]||'nový').trim()==='otevřený'?'otevřený':'nový'};if(!db.materials.some(x=>String(x.id)===incoming.material)||!db.boxes.some(x=>String(x.id)===incoming.box)||!db.positions.some(x=>String(x.id)===incoming.position))continue;const existing=pack(id);if(existing){Object.assign(existing,incoming);updated++}else{db.packs.push(incoming);added++}}saveDb();renderPage();toast(`CSV: +${added} / aktualizováno ${updated}`)}
function exportCsv(){const header=['id','material','lot','expiry','box','position','qty','packState'];const lines=[header.join(',')];for(const p of db.packs)lines.push(header.map(k=>`"${String(p[k]??'').replace(/"/g,'""')}"`).join(','));const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mp12-inventory.csv';a.click();URL.revokeObjectURL(a.href)}
function toast(text){const root=document.querySelector('#toastRoot');const el=document.createElement('div');el.className='toast';el.textContent=text;root.appendChild(el);setTimeout(()=>el.remove(),2200)}
function closeSidebar(){document.querySelector('#sidebar')?.classList.remove('open')}
function bindLayer(layer){layer.querySelector('#q')?.addEventListener('input',e=>{state.q=e.target.value;renderPage()});layer.querySelector('#compactBtn')?.addEventListener('click',()=>{state.compact=!state.compact;document.body.classList.toggle('compact',state.compact);renderPage()});layer.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{const key=b.dataset.sort;state.sort={key,dir:state.sort.key===key&&state.sort.dir==='asc'?'desc':'asc'};renderPage()});layer.querySelector('#receiveBtn')?.addEventListener('click',receive);layer.querySelector('#newMaterialBtn')?.addEventListener('click',newMaterial);layer.querySelector('#newCountBtn')?.addEventListener('click',newCount);layer.querySelectorAll('[data-action="menu"]').forEach(b=>b.onclick=()=>{const p=pack(b.dataset.id);if(!p)return;modal(p.id,`<div class="quick-actions"><button type="button" class="btn" data-move>Přesun</button><button type="button" class="btn" data-issue>Výdej</button><button type="button" class="btn" data-detail>Detail</button></div>`,()=>{});const root=document.querySelector('#modalRoot');root.querySelector('[data-move]')?.addEventListener('click',()=>{root.replaceChildren();movePack(p)});root.querySelector('[data-issue]')?.addEventListener('click',()=>{root.replaceChildren();issuePack(p)});root.querySelector('[data-detail]')?.addEventListener('click',()=>{root.replaceChildren();detailPack(p)})});layer.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{state.page='inventory';state.q=position(b.dataset.slot)?.id||b.dataset.slot;renderNav();renderPage()})}
document.addEventListener('click',e=>{const nav=e.target.closest('[data-page]');if(nav)switchPage(nav.dataset.page)})
document.querySelector('#themeBtn').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';localStorage.setItem(THEME_KEY,state.theme);document.documentElement.dataset.theme=state.theme}
document.querySelector('#importBtn').onclick=()=>document.querySelector('#csvFile').click();document.querySelector('#csvFile').onchange=e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{importCsv(String(reader.result||''))}catch(err){toast(err.message||'Import selhal')}e.target.value=''}};document.querySelector('#exportBtn').onclick=exportCsv;document.querySelector('#menuBtn').onclick=()=>document.querySelector('#sidebar')?.classList.toggle('open')

document.documentElement.dataset.theme=state.theme
document.body.classList.toggle('compact',state.compact)
document.querySelector('#sidebar').classList.remove('open')
renderNav();renderPage()
