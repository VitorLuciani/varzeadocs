/* ============================================================
   FRAGHOUSE — script.js
   Vanilla JS SPA. Data comes from /assets/json (mock, ready to be
   swapped for real APIs later). Interactive state (checklist,
   check-in, financeiro, sorteio, campeonato) persists in localStorage
   so this works as a real tool once hosted on GitHub Pages.
   ============================================================ */

const STORE_KEY = 'fraghouse_state_v1';
let DATA = { jogadores: [], lans: [], config: {} };
let STATE = loadState();
let charts = {};

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return { checklist:{}, checkin:{}, financeiro:{}, partidas:[], campeonato:null, sorteio:null };
}
function saveState(){ localStorage.setItem(STORE_KEY, JSON.stringify(STATE)); }

/* ---------------- boot ---------------- */
async function boot(){
  const [jogadores, lans, config] = await Promise.all([
    fetch('assets/json/jogadores.json').then(r=>r.json()),
    fetch('assets/json/lans.json').then(r=>r.json()),
    fetch('assets/json/config.json').then(r=>r.json())
  ]);
  DATA.jogadores = jogadores;
  DATA.lans = lans;
  DATA.config = config;

  if(!STATE.partidas || STATE.partidas.length===0) STATE.partidas = seedPartidas();
  if(!STATE.financeiro || !STATE.financeiro.pagantes) STATE.financeiro = JSON.parse(JSON.stringify(config.financeiro));
  if(!STATE.checkin || Object.keys(STATE.checkin).length===0){
    STATE.checkin = {};
    jogadores.forEach(j=> STATE.checkin[j.id]='talvez');
  }
  if(!STATE.checklist || Object.keys(STATE.checklist).length===0){
    STATE.checklist = {};
    config.checklist.forEach((item,i)=> STATE.checklist[i]=false);
  }
  saveState();

  initNav();
  initClock();
  renderAll();
}

function seedPartidas(){
  // light mock match log so charts have data day one
  const mapas=['Mirage','Dust2','Inferno','Ancient','Anubis','Train'];
  const out=[];
  DATA.jogadores.forEach(j=>{
    for(let i=0;i<4;i++){
      out.push({
        mapa: mapas[Math.floor(Math.random()*mapas.length)],
        jogador: j.nick,
        resultado: Math.random()>0.45 ? 'Vitória':'Derrota',
        kills: 10+Math.floor(Math.random()*15),
        deaths: 8+Math.floor(Math.random()*12),
        adr: (55+Math.random()*35).toFixed(1)
      });
    }
  });
  return out;
}

/* ---------------- navigation ---------------- */
function initNav(){
  document.querySelectorAll('.nav-item').forEach(el=>{
    el.addEventListener('click', ()=> showView(el.dataset.view));
  });
  document.getElementById('menuToggle').addEventListener('click', ()=>{
    document.getElementById('sidebar').classList.toggle('open');
  });
}

const VIEW_META = {
  dashboard:['Overview','Dashboard'], proxima:['Overview','Próxima LAN'], historico:['Overview','Histórico'],
  timeline:['Overview','Timeline'], ranking:['Competitivo','Ranking Geral'], jogadores:['Competitivo','Jogadores'],
  sorteio:['Competitivo','Sorteio de Times'], campeonato:['Competitivo','Campeonato'], estatisticas:['Competitivo','Estatísticas'],
  hall:['Competitivo','Hall da Fama'], conquistas:['Competitivo','Conquistas'], servidor:['Operação','Servidor Dedicado'],
  playbooks:['Operação','Playbooks'], checkin:['Operação','Check-in'], checklist:['Operação','Checklist'],
  financeiro:['Operação','Financeiro'], galeria:['Memória','Galeria'], live:['Modo TV','Painel Ao Vivo']
};

function showView(name){
  if(name==='live'){ enterLive(); return; }
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===name));
  const [eyebrow,title] = VIEW_META[name] || ['',''];
  document.getElementById('pageEyebrow').textContent = eyebrow;
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('sidebar').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ---------------- clock / countdown ---------------- */
function initClock(){
  tickClock();
  setInterval(tickClock, 1000);
}
function tickClock(){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  const str = `${hh}:${mm}:${ss}`;
  const hud = document.getElementById('hudClock'); if(hud) hud.textContent = str;
  const live = document.getElementById('liveClock'); if(live) live.textContent = str;
  updateCountdowns();
}
function updateCountdowns(){
  const target = new Date(DATA.config.proximaLan).getTime();
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff/86400000);
  const h = Math.floor(diff%86400000/3600000);
  const m = Math.floor(diff%3600000/60000);
  const s = Math.floor(diff%60000/1000);
  const html = `
    <div class="box"><div class="num mono">${d}</div><div class="lbl">Dias</div></div>
    <div class="box"><div class="num mono">${h}</div><div class="lbl">Horas</div></div>
    <div class="box"><div class="num mono">${m}</div><div class="lbl">Min</div></div>
    <div class="box"><div class="num mono">${s}</div><div class="lbl">Seg</div></div>`;
  ['countdownBox','countdownBox2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
}

/* ---------------- render orchestrator ---------------- */
function renderAll(){
  renderDashboard();
  renderProxima();
  renderHistorico();
  renderTimeline();
  renderRanking();
  renderJogadores();
  renderSorteioPool();
  renderCampeonatoPainel();
  renderEstatisticas();
  renderHall();
  renderConquistas();
  renderServidor();
  renderPlaybooks();
  renderCheckin();
  renderChecklist();
  renderFinanceiro();
  renderGaleria();
}

/* ---------------- DASHBOARD ---------------- */
function renderDashboard(){
  const c = DATA.config;
  const confirmados = Object.values(STATE.checkin).filter(v=>v==='sim').length;
  const stats = [
    {label:'Jogadores Confirmados', value:confirmados, unit:`/${DATA.jogadores.length}`, icon:'fa-user-check'},
    {label:'Status do Servidor', value: c.servidor.status==='online'?'Online':'Offline', unit:'', icon:'fa-server'},
    {label:'Último Campeão', value: c.campeaoAtual, unit:'', icon:'fa-trophy', small:true},
    {label:'Total de LANs', value: c.totalLans, unit:'realizadas', icon:'fa-calendar-check'}
  ];
  document.getElementById('dashStats').innerHTML = stats.map(s=>`
    <div class="card stat-card">
      <i class="fa-solid ${s.icon}"></i>
      <div class="label">${s.label}</div>
      <div class="value" style="${s.small?'font-size:20px;':''}">${s.value}<span class="unit">${s.unit}</span></div>
    </div>`).join('');

  const topPlayer = [...DATA.jogadores].sort((a,b)=>b.rating-a.rating)[0];
  document.getElementById('dashHighlights').innerHTML = `
    <div class="card quiet"><div class="label muted small">MVP Última LAN</div><div class="font-display" style="font-size:18px;margin-top:6px;">${c.mvpAtual}</div></div>
    <div class="card quiet"><div class="label muted small">Melhor Rating Geral</div><div class="font-display" style="font-size:18px;margin-top:6px;">${topPlayer.nick} <span class="pill orange">${topPlayer.rating}</span></div></div>
    <div class="card quiet"><div class="label muted small">Total de Partidas</div><div class="font-display" style="font-size:18px;margin-top:6px;">${STATE.partidas.length + c.totalPartidas}</div></div>
    <div class="card quiet"><div class="label muted small">Jogadores Cadastrados</div><div class="font-display" style="font-size:18px;margin-top:6px;">${DATA.jogadores.length}</div></div>`;
}

/* ---------------- PRÓXIMA LAN ---------------- */
function renderProxima(){
  document.getElementById('proximaDataTxt').textContent = new Date(DATA.config.proximaLan).toLocaleString('pt-BR');
  const sim = Object.values(STATE.checkin).filter(v=>v==='sim').length;
  const talvez = Object.values(STATE.checkin).filter(v=>v==='talvez').length;
  const nao = Object.values(STATE.checkin).filter(v=>v==='nao').length;
  document.getElementById('proximaCheckinResumo').innerHTML = `
    <div class="flex between mb-10"><span class="muted">Confirmados</span><span class="pill ok">${sim}</span></div>
    <div class="flex between mb-10"><span class="muted">Talvez</span><span class="pill warn">${talvez}</span></div>
    <div class="flex between"><span class="muted">Não vão</span><span class="pill off">${nao}</span></div>`;
}

/* ---------------- HISTÓRICO ---------------- */
function renderHistorico(){
  document.getElementById('historicoGrid').innerHTML = DATA.lans.map(l=>`
    <div class="card lan-card" onclick="openLanModal(${l.id})">
      <h3>${l.nome}</h3>
      <div class="date mono">${new Date(l.data).toLocaleDateString('pt-BR')}</div>
      <div class="row"><span>Jogadores</span><span>${l.jogadores}</span></div>
      <div class="row"><span>Campeão</span><span>${l.campeao}</span></div>
      <div class="row"><span>MVP</span><span>${l.mvp}</span></div>
      <div class="row"><span>Mapas</span><span>${l.mapas}</span></div>
    </div>`).join('');
}
function openLanModal(id){
  const l = DATA.lans.find(x=>x.id===id);
  document.getElementById('modalTitle').textContent = l.nome;
  document.getElementById('modalBody').innerHTML = `
    <div class="grid grid-2">
      <div><label>Data</label><div class="mono">${new Date(l.data).toLocaleDateString('pt-BR')}</div></div>
      <div><label>Jogadores</label><div>${l.jogadores}</div></div>
      <div><label>Campeão</label><div class="pill orange">${l.campeao}</div></div>
      <div><label>Vice</label><div>${l.vice}</div></div>
      <div><label>MVP</label><div class="pill blue">${l.mvp}</div></div>
      <div><label>Mapas Jogados</label><div>${l.mapas}</div></div>
    </div>
    <label style="margin-top:10px;">Observações</label>
    <p class="small muted">${l.obs}</p>
    <label style="margin-top:10px;">Galeria</label>
    <div class="grid grid-3">${[1,2,3].map(()=>`<div class="gallery-item" style="background:linear-gradient(135deg,var(--orange-dim),var(--blue-dim));"></div>`).join('')}</div>`;
  openModal();
}

/* ---------------- TIMELINE ---------------- */
function renderTimeline(){
  document.getElementById('timelineList').innerHTML = DATA.config.timeline.map(t=>`
    <div class="tl-item">
      <div class="tl-date">${new Date(t.data).toLocaleDateString('pt-BR')}</div>
      <h4>${t.titulo}</h4>
      <p>${t.desc}</p>
    </div>`).join('');
}

/* ---------------- RANKING ---------------- */
let rankingSort = {key:'rating', dir:-1};
const RANK_COLS = [
  {key:'pos', label:'#'}, {key:'nick', label:'Nome'}, {key:'rating', label:'Pontuação'},
  {key:'vitorias', label:'Vitórias'}, {key:'derrotas', label:'Derrotas'},
  {key:'titulos', label:'Títulos'}, {key:'mvps', label:'MVPs'}, {key:'winrate', label:'Win Rate'}
];
function renderRanking(){
  const rows = DATA.jogadores.map(j=>({...j, winrate: (j.vitorias/(j.vitorias+j.derrotas)*100).toFixed(1)}));
  rows.sort((a,b)=> (a[rankingSort.key]>b[rankingSort.key]?1:-1)*rankingSort.dir);
  const thead = `<tr>${RANK_COLS.map(c=>`<th class="${c.key===rankingSort.key?'sorted':''}" onclick="sortRanking('${c.key}')">${c.label} ${c.key===rankingSort.key?(rankingSort.dir===1?'▲':'▼'):''}</th>`).join('')}</tr>`;
  const tbody = rows.map((r,i)=>`
    <tr>
      <td class="${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':''}">${i+1}</td>
      <td>${r.nick}</td><td class="mono">${r.rating}</td><td>${r.vitorias}</td><td>${r.derrotas}</td>
      <td>${r.titulos}</td><td>${r.mvps}</td><td>${r.winrate}%</td>
    </tr>`).join('');
  document.getElementById('rankingTable').querySelector('thead').innerHTML = thead;
  document.getElementById('rankingTable').querySelector('tbody').innerHTML = tbody;
}
function sortRanking(key){
  if(rankingSort.key===key) rankingSort.dir *= -1; else { rankingSort.key=key; rankingSort.dir=-1; }
  renderRanking();
}

/* ---------------- JOGADORES ---------------- */
function renderJogadores(){
  document.getElementById('jogadoresGrid').innerHTML = DATA.jogadores.map(j=>`
    <div class="card player-card" onclick="openPlayerModal(${j.id})">
      <div class="player-avatar">${j.nick.slice(0,2).toUpperCase()}</div>
      <div class="nick">${j.nick}</div>
      <div class="role">${j.funcao}</div>
      <div class="player-mini-stats">
        <div><b>${j.kd}</b>K/D</div><div><b>${j.rating}</b>RTG</div><div><b>${j.titulos}</b>TIT</div>
      </div>
    </div>`).join('');
}
function openPlayerModal(id){
  const j = DATA.jogadores.find(x=>x.id===id);
  document.getElementById('modalTitle').textContent = `${j.nick} — ${j.nome}`;
  document.getElementById('modalBody').innerHTML = `
    <div class="grid grid-4 mb-10">
      <div class="card quiet stat-card" style="padding:12px;"><div class="label">K/D</div><div class="value" style="font-size:20px;">${j.kd}</div></div>
      <div class="card quiet stat-card" style="padding:12px;"><div class="label">ADR</div><div class="value" style="font-size:20px;">${j.adr}</div></div>
      <div class="card quiet stat-card" style="padding:12px;"><div class="label">HS%</div><div class="value" style="font-size:20px;">${j.hs}%</div></div>
      <div class="card quiet stat-card" style="padding:12px;"><div class="label">Rating</div><div class="value" style="font-size:20px;">${j.rating}</div></div>
    </div>
    <div class="grid grid-2 mb-10">
      <div><label>Função</label><div>${j.funcao}</div></div>
      <div><label>Anos participando</label><div>${j.anos}</div></div>
      <div><label>Mapas favoritos</label><div>${j.mapasFavoritos.join(', ')}</div></div>
      <div><label>Parceiro c/ maior índice de vitória</label><div>${j.parceiro}</div></div>
      <div><label>Títulos / MVPs</label><div>${j.titulos} / ${j.mvps}</div></div>
      <div><label>LANs jogadas</label><div>${j.lans}</div></div>
    </div>
    <label>Evolução de Rating</label>
    <canvas id="modalChart" height="90"></canvas>`;
  openModal();
  requestAnimationFrame(()=>{
    const ctx = document.getElementById('modalChart');
    if(charts.modal) charts.modal.destroy();
    charts.modal = new Chart(ctx, {
      type:'line',
      data:{ labels:j.evolucao.map((_,i)=>'LAN '+(i+1)), datasets:[{data:j.evolucao, borderColor:'#ff5c1a', backgroundColor:'rgba(255,92,26,.15)', fill:true, tension:.35}]},
      options: chartOpts(false)
    });
  });
}

/* ---------------- SORTEIO DE TIMES ---------------- */
function renderSorteioPool(){
  document.getElementById('sorteioPool').innerHTML = DATA.jogadores.map(j=>`
    <div class="player-chip ${STATE.sorteio?.late?.includes(j.id)?'pool-late':''}" id="pool-${j.id}">
      <span>${j.nick}</span>
      <button class="btn small ghost" style="margin-left:auto;" onclick="toggleLate(${j.id})" title="Marcar atrasado"><i class="fa-solid fa-clock"></i></button>
    </div>`).join('');
  if(STATE.sorteio){ renderTeams(STATE.sorteio.ct, STATE.sorteio.tr); }
}
function toggleLate(id){
  STATE.sorteio = STATE.sorteio || {late:[], ct:[], tr:[]};
  STATE.sorteio.late = STATE.sorteio.late || [];
  const idx = STATE.sorteio.late.indexOf(id);
  if(idx>-1) STATE.sorteio.late.splice(idx,1); else STATE.sorteio.late.push(id);
  saveState(); renderSorteioPool();
}
function sortearTimes(){
  const late = STATE.sorteio?.late || [];
  const onTime = DATA.jogadores.filter(j=>!late.includes(j.id)).sort(()=>Math.random()-0.5);
  const lateArr = DATA.jogadores.filter(j=>late.includes(j.id)).sort(()=>Math.random()-0.5);
  const pool = [...onTime, ...lateArr];
  const ct = [], tr = [];
  pool.forEach((j,i)=> (i%2===0?ct:tr).push(j.id));
  STATE.sorteio = { late, ct, tr };
  saveState();
  renderTeams(ct,tr);
  toast('Times sorteados!');
}
function renderTeams(ctIds, trIds){
  const chip = id=>{ const j = DATA.jogadores.find(x=>x.id===id); return `<div class="player-chip"><span>${j.nick}</span><span class="muted small" style="margin-left:auto;">${j.funcao}</span></div>`; };
  document.getElementById('teamCT').innerHTML = ctIds.map(chip).join('') || '<p class="muted small">Sorteie os times.</p>';
  document.getElementById('teamTR').innerHTML = trIds.map(chip).join('') || '<p class="muted small">Sorteie os times.</p>';
}

/* ---------------- CAMPEONATO ---------------- */
function gerarCampeonato(){
  const formato = document.getElementById('formatoSelect').value;
  const players = DATA.jogadores.map(j=>j.nick).sort(()=>Math.random()-0.5);
  let html = '';
  if(formato==='todos'){
    const confrontos = [];
    for(let i=0;i<players.length;i++) for(let k=i+1;k<players.length;k++) confrontos.push([players[i],players[k]]);
    html = `<div class="card table-wrap"><table><thead><tr><th>#</th><th>Jogador A</th><th>Jogador B</th><th>Resultado</th></tr></thead><tbody>
      ${confrontos.map((c,i)=>`<tr><td>${i+1}</td><td>${c[0]}</td><td>${c[1]}</td><td class="muted">a definir</td></tr>`).join('')}
    </tbody></table></div>`;
  } else if(formato==='mata'){
    let round = [...players];
    if(round.length%2!==0) round.push('BYE');
    let rounds = [];
    let n = round.length;
    while(n>1){ rounds.push(round); round = round.slice(0, n/2).map((_,i)=>'Vencedor '+(i+1)); n = n/2; }
    html = `<div class="bracket">${rounds.map((r,ri)=>`
      <div class="bracket-round">
        <div class="round-label">${ri===0?'Rodada 1':'Rodada '+(ri+1)}</div>
        ${chunk(r,2).map(pair=>`<div class="bracket-match">
          <div class="m-row winner"><span>${pair[0]}</span><span>—</span></div>
          <div class="m-row"><span>${pair[1]||'BYE'}</span><span>—</span></div>
        </div>`).join('')}
      </div>`).join('')}</div>`;
  } else {
    const md = formato==='md1'?'MD1':'MD3';
    const confrontos = chunk(players,2);
    html = `<div class="card table-wrap"><table><thead><tr><th>#</th><th>Confronto</th><th>Formato</th><th>Resultado</th></tr></thead><tbody>
      ${confrontos.map((c,i)=>`<tr><td>${i+1}</td><td>${c[0]} vs ${c[1]||'BYE'}</td><td>${md}</td><td class="muted">a definir</td></tr>`).join('')}
    </tbody></table></div>`;
  }
  document.getElementById('campeonatoOutput').innerHTML = html;
  STATE.campeonato = {formato};
  saveState();
}
function chunk(arr,size){ const out=[]; for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; }

function renderCampeonatoPainel(){
  const rows = DATA.jogadores.map(j=>({
    nick:j.nick, saldo: j.vitorias - j.derrotas, v:j.vitorias, d:j.derrotas, pts: j.vitorias*3
  })).sort((a,b)=>b.pts-a.pts);
  document.getElementById('painelTable').querySelector('thead').innerHTML =
    `<tr><th>#</th><th>Jogador</th><th>Vitórias</th><th>Derrotas</th><th>Saldo</th><th>Pontos</th></tr>`;
  document.getElementById('painelTable').querySelector('tbody').innerHTML = rows.map((r,i)=>`
    <tr><td>${i+1}</td><td>${r.nick}</td><td>${r.v}</td><td>${r.d}</td><td>${r.saldo>=0?'+':''}${r.saldo}</td><td class="mono">${r.pts}</td></tr>`).join('');
}

/* ---------------- ESTATÍSTICAS ---------------- */
function renderEstatisticas(){
  const sel = document.getElementById('pJogador');
  sel.innerHTML = DATA.jogadores.map(j=>`<option>${j.nick}</option>`).join('');
  buildStatCharts();
}
function registrarPartida(e){
  e.preventDefault();
  STATE.partidas.push({
    mapa: document.getElementById('pMapa').value,
    jogador: document.getElementById('pJogador').value,
    resultado: document.getElementById('pResultado').value,
    kills: +document.getElementById('pKills').value,
    deaths: +document.getElementById('pDeaths').value,
    adr: +document.getElementById('pAdr').value
  });
  saveState();
  buildStatCharts();
  toast('Partida registrada!');
  return false;
}
function chartOpts(showLegend){
  return {
    responsive:true,
    plugins:{ legend:{display:!!showLegend, labels:{color:'#7c8a9c'}} },
    scales:{
      x:{ ticks:{color:'#7c8a9c'}, grid:{color:'#1f2733'} },
      y:{ ticks:{color:'#7c8a9c'}, grid:{color:'#1f2733'} }
    }
  };
}
function buildStatCharts(){
  const mapCounts = {};
  STATE.partidas.filter(p=>p.resultado==='Vitória').forEach(p=> mapCounts[p.mapa]=(mapCounts[p.mapa]||0)+1);
  mkChart('chartMapas','bar',Object.keys(mapCounts),[{label:'Vitórias',data:Object.values(mapCounts),backgroundColor:'#ff5c1a'}]);

  mkChart('chartRating','line', DATA.jogadores[0].evolucao.map((_,i)=>'LAN '+(i+1)),
    DATA.jogadores.slice(0,3).map((j,i)=>({label:j.nick, data:j.evolucao, borderColor:[ '#ff5c1a','#2f8bff','#2fd66a'][i], backgroundColor:'transparent', tension:.35})), true);

  mkChart('chartHS','bar', DATA.jogadores.map(j=>j.nick), [{label:'HS%',data:DATA.jogadores.map(j=>j.hs),backgroundColor:'#2f8bff'}]);

  const vitPorJogador = {};
  STATE.partidas.forEach(p=>{ if(p.resultado==='Vitória') vitPorJogador[p.jogador]=(vitPorJogador[p.jogador]||0)+1; });
  mkChart('chartVitorias','doughnut', Object.keys(vitPorJogador), [{data:Object.values(vitPorJogador), backgroundColor:['#ff5c1a','#2f8bff','#2fd66a','#f2b705','#ef4444','#7c8a9c']}], true);

  mkChart('chartKD','bar', DATA.jogadores.map(j=>j.nick), [{label:'K/D',data:DATA.jogadores.map(j=>j.kd),backgroundColor:'#ff5c1a'}]);
}
function mkChart(id, type, labels, datasets, legend){
  const el = document.getElementById(id); if(!el) return;
  if(charts[id]) charts[id].destroy();
  charts[id] = new Chart(el, { type, data:{labels,datasets}, options: chartOpts(legend) });
}

/* ---------------- HALL DA FAMA ---------------- */
function renderHall(){
  document.getElementById('hallGrid').innerHTML = DATA.config.hallDaFama.map(h=>`
    <div class="card fame-card">
      <i class="fa-solid ${h.icone}"></i>
      <div class="fame-title">${h.titulo}</div>
      <div class="fame-player">${h.jogador}</div>
      <div class="fame-value mono">${h.valor}</div>
    </div>`).join('');
}

/* ---------------- CONQUISTAS ---------------- */
let conquistasPlayerId = null;
function renderConquistas(){
  conquistasPlayerId = conquistasPlayerId || DATA.jogadores[0].id;
  document.getElementById('conquistasPlayerPicker').innerHTML = DATA.jogadores.map(j=>`
    <button class="btn small ${j.id===conquistasPlayerId?'primary':'ghost'}" onclick="pickConquistaPlayer(${j.id})">${j.nick}</button>`).join('');
  const player = DATA.jogadores.find(j=>j.id===conquistasPlayerId);
  document.getElementById('medalsGrid').innerHTML = DATA.config.conquistasCatalogo.map(m=>`
    <div class="medal ${player.conquistas.includes(m.id)?'':'locked'}">
      <div class="ic">${m.icone}</div>
      <div class="nm">${m.nome}</div>
    </div>`).join('');
}
function pickConquistaPlayer(id){ conquistasPlayerId=id; renderConquistas(); }

/* ---------------- SERVIDOR ---------------- */
function renderServidor(){
  const s = DATA.config.servidor;
  document.getElementById('servidorInfo').innerHTML = `
    <div><label>IP</label><div class="mono">${s.ip}</div></div>
    <div><label>Porta</label><div class="mono">${s.porta}</div></div>
    <div><label>Senha</label><div class="mono">${s.senha}</div></div>
    <div><label>Mapa Atual</label><div>${s.mapaAtual}</div></div>
    <div><label>Jogadores</label><div>${s.jogadores}</div></div>
    <div><label>Tickrate</label><div>${s.tickrate}</div></div>
    <div><label>MatchZy</label><div class="mono">v${s.matchzy}</div></div>
    <div><label>CounterStrikeSharp</label><div class="mono">v${s.css}</div></div>`;
  document.getElementById('servidorStatusBig').innerHTML = `
    <div style="font-size:44px;color:${s.status==='online'?'var(--ok)':'var(--danger)'};"><i class="fa-solid fa-server"></i></div>
    <div class="pill ${s.status==='online'?'ok':'off'}" style="margin-top:10px;">${s.status==='online'?'ONLINE':'OFFLINE'}</div>`;
  const dot = document.getElementById('serverDot');
  dot.classList.toggle('off', s.status!=='online');
  document.getElementById('serverPillText').textContent = 'Servidor '+(s.status==='online'?'Online':'Offline');
}
function reiniciarServidor(){
  toast('Comando de reinício enviado (simulado).');
}

/* ---------------- PLAYBOOKS ---------------- */
let currentMapa = null;
function renderPlaybooks(){
  currentMapa = currentMapa || DATA.config.playbooks[0].mapa;
  document.getElementById('mapaPicker').innerHTML = DATA.config.playbooks.map(p=>`
    <div class="card quiet" style="cursor:pointer;text-align:center;${p.mapa===currentMapa?'border-color:var(--orange);':''}" onclick="pickMapa('${p.mapa}')">
      <div class="font-display" style="font-size:16px;">${p.mapa}</div>
    </div>`).join('');
  const p = DATA.config.playbooks.find(x=>x.mapa===currentMapa);
  document.getElementById('playbookDetail').innerHTML = `
    <div class="section-head mt-0"><h2>${p.mapa}</h2></div>
    <div class="grid grid-2 mb-10">
      <div><label><i class="fa-solid fa-shield-halved" style="color:var(--blue)"></i> Estratégia CT</label><p class="small muted">${p.ct}</p></div>
      <div><label><i class="fa-solid fa-bomb" style="color:var(--orange)"></i> Estratégia TR</label><p class="small muted">${p.tr}</p></div>
    </div>
    <div class="grid grid-2 mb-10">
      <div><label>Execuções</label><p class="small muted">${p.execucoes.join(' · ')}</p></div>
      <div><label>Defaults</label><p class="small muted">${p.defaults.join(' · ')}</p></div>
    </div>
    <label>Posicionamentos</label><p class="small muted">${p.posicionamentos}</p>
    <label>Observações</label><p class="small muted">${p.obs}</p>`;
}
function pickMapa(m){ currentMapa=m; renderPlaybooks(); }

/* ---------------- CHECK-IN ---------------- */
function renderCheckin(){
  document.getElementById('checkinList').innerHTML = DATA.jogadores.map(j=>{
    const v = STATE.checkin[j.id] || 'talvez';
    return `<div class="check-row">
      <span>${j.nick}</span>
      <div class="checkin-choice" style="max-width:260px;margin-left:auto;">
        <button class="${v==='sim'?'active yes':''}" onclick="setCheckin(${j.id},'sim')">Confirmado</button>
        <button class="${v==='talvez'?'active maybe':''}" onclick="setCheckin(${j.id},'talvez')">Talvez</button>
        <button class="${v==='nao'?'active no':''}" onclick="setCheckin(${j.id},'nao')">Não vai</button>
      </div>
    </div>`;
  }).join('');
  const sim = Object.values(STATE.checkin).filter(v=>v==='sim').length;
  const talvez = Object.values(STATE.checkin).filter(v=>v==='talvez').length;
  const nao = Object.values(STATE.checkin).filter(v=>v==='nao').length;
  document.getElementById('checkinResumo').innerHTML = `
    <div class="flex between mb-10"><span class="muted">Confirmados</span><span class="pill ok">${sim}</span></div>
    <div class="flex between mb-10"><span class="muted">Pendentes (talvez)</span><span class="pill warn">${talvez}</span></div>
    <div class="flex between"><span class="muted">Não vão</span><span class="pill off">${nao}</span></div>`;
}
function setCheckin(id, val){
  STATE.checkin[id] = val; saveState(); renderCheckin(); renderDashboard(); renderProxima();
}

/* ---------------- CHECKLIST ---------------- */
function renderChecklist(){
  const items = DATA.config.checklist;
  document.getElementById('checklistList').innerHTML = items.map((it,i)=>`
    <div class="check-row ${STATE.checklist[i]?'done':''}">
      <input type="checkbox" id="chk-${i}" ${STATE.checklist[i]?'checked':''} onchange="toggleChecklist(${i})">
      <label for="chk-${i}" style="margin:0;">${it.item}</label>
      <span class="cat">${it.categoria}</span>
    </div>`).join('');
  updateChecklistProgress();
}
function toggleChecklist(i){
  STATE.checklist[i] = !STATE.checklist[i]; saveState();
  renderChecklist();
}
function updateChecklistProgress(){
  const items = DATA.config.checklist;
  const done = items.filter((_,i)=>STATE.checklist[i]).length;
  const pct = Math.round(done/items.length*100);
  document.getElementById('checklistBar').style.width = pct+'%';
  document.getElementById('checklistPct').textContent = pct+'% concluído';
}

/* ---------------- FINANCEIRO ---------------- */
function renderFinanceiro(){
  const f = STATE.financeiro;
  const arrecadado = f.pagantes.filter(p=>p.status==='pago').reduce((s,p)=>s+p.valor,0);
  const despesasTotal = f.despesas.reduce((s,d)=>s+d.valor,0);
  const saldo = arrecadado - despesasTotal;
  document.getElementById('financeiroStats').innerHTML = `
    <div class="card stat-card"><div class="label">Arrecadado</div><div class="value">R$ ${arrecadado}</div></div>
    <div class="card stat-card"><div class="label">Despesas</div><div class="value">R$ ${despesasTotal}</div></div>
    <div class="card stat-card"><div class="label">Saldo Final</div><div class="value" style="color:${saldo>=0?'var(--ok)':'var(--danger)'}">R$ ${saldo}</div></div>
    <div class="card stat-card"><div class="label">Pendentes</div><div class="value">${f.pagantes.filter(p=>p.status==='pendente').length}</div></div>`;
  document.getElementById('pagamentosList').innerHTML = f.pagantes.map((p,i)=>`
    <div class="check-row">
      <span>${p.nome}</span>
      <span class="muted mono" style="margin-left:auto;">R$ ${p.valor}</span>
      <button class="btn small ${p.status==='pago'?'primary':'ghost'}" style="margin-left:10px;" onclick="togglePagamento(${i})">${p.status==='pago'?'Pago':'Pendente'}</button>
    </div>`).join('');
  mkChart('chartDespesas','doughnut', f.despesas.map(d=>d.categoria), [{data:f.despesas.map(d=>d.valor), backgroundColor:['#ff5c1a','#2f8bff','#2fd66a','#f2b705']}], true);
}
function togglePagamento(i){
  STATE.financeiro.pagantes[i].status = STATE.financeiro.pagantes[i].status==='pago' ? 'pendente':'pago';
  saveState(); renderFinanceiro();
}

/* ---------------- GALERIA ---------------- */
function renderGaleria(){
  document.getElementById('galeriaGrid').innerHTML = DATA.config.galeria.map(g=>`
    <div class="gallery-item" style="background:linear-gradient(135deg, ${g.cor}33, ${g.cor}11);" onclick="openGaleriaModal('${g.lan}')">
      <span>${g.lan}</span>
    </div>`).join('');
}
function openGaleriaModal(lan){
  document.getElementById('modalTitle').textContent = 'Galeria — ' + lan;
  document.getElementById('modalBody').innerHTML = `<div class="grid grid-3">${[1,2,3,4,5,6].map(()=>`<div class="gallery-item" style="background:linear-gradient(135deg,var(--orange-dim),var(--blue-dim));"></div>`).join('')}</div>`;
  openModal();
}

/* ---------------- PAINEL AO VIVO ---------------- */
function enterLive(){
  document.querySelector('.app').style.display='none';
  document.getElementById('view-live').style.display='block';
  const c = DATA.config;
  document.getElementById('livePanelStats').innerHTML = `
    <div class="card stat-card"><div class="label">Jogadores Presentes</div><div class="value">${Object.values(STATE.checkin).filter(v=>v==='sim').length}</div></div>
    <div class="card stat-card"><div class="label">Servidor</div><div class="value">${c.servidor.status==='online'?'Online':'Offline'}</div></div>
    <div class="card stat-card"><div class="label">Mapa Atual</div><div class="value" style="font-size:20px;">${c.servidor.mapaAtual}</div></div>
    <div class="card stat-card"><div class="label">Campeão Atual</div><div class="value" style="font-size:20px;">${c.campeaoAtual}</div></div>`;
  const rows = [...DATA.jogadores].sort((a,b)=>b.rating-a.rating).slice(0,5);
  document.getElementById('liveProximo').innerHTML = `<p class="font-display" style="font-size:20px;">${rows[0].nick} <span class="muted" style="font-size:14px;">vs</span> ${rows[1].nick}</p><p class="muted small">Melhor de 3 — de_mirage</p>`;
  document.getElementById('liveResultados').innerHTML = DATA.lans.slice(-3).reverse().map(l=>`
    <div class="flex between mb-10"><span class="muted small">${l.nome}</span><span class="small">${l.campeao}</span></div>`).join('');
}
function exitLive(){
  document.querySelector('.app').style.display='flex';
  document.getElementById('view-live').style.display='none';
}

/* ---------------- modal / toast helpers ---------------- */
function openModal(){ document.getElementById('modalOverlay').classList.add('active'); }
function closeModal(){ document.getElementById('modalOverlay').classList.remove('active'); }
document.addEventListener('click', e=>{ if(e.target.id==='modalOverlay') closeModal(); });

let toastTimer;
function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.remove('show'), 2600);
}

boot();
