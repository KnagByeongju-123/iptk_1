/* mes_cycle.js — v225  발주 차수(신규진행)
 *  부품이 이미 진행 중인데 설계변경·가공불량·파손 등으로 처음부터 다시 구매/가공할 때 「신규진행」으로 차수를 올린다.
 *  차수는 화면(구분)마다 따로 센다 — 원재료 2차, 구매품 1차, 외주가공 3차 가 같이 있을 수 있다.
 *  · order_lines.cycle_no        : 그 발주가 속한 차수 (기본 1)
 *  · part_cycles                 : 차수 시작 이력 (제번·구분·품번·차수·사유·메모·시작자·시각)
 *  현재 차수 = part_cycles 의 최대 차수 (없으면 1). 발주 화면은 현재 차수의 order_lines 만 진행으로 본다.
 *
 *  MESCYCLE.load(job, category)             → 제번의 차수 이력을 읽어 둔다 (Map 품번→[{no,reason,memo,by,at}])
 *  MESCYCLE.cur(part)                       → 현재 차수 번호
 *  MESCYCLE.reason(part)                    → 현재 차수 사유 (1차면 '')
 *  MESCYCLE.rowsOf(rows, part?)             → order_lines 행 중 현재 차수 행만 (part 생략 시 행마다 자기 품번 기준)
 *  MESCYCLE.badge(no, part?, why?)          → 'n차' 배지 HTML (1차는 '') — part 가 있으면 이력, 없으면 why(사유)를 말풍선에
 *  MESCYCLE.start({job,category,parts:[{part,name,cur,info}],by,onDone}) → 사유 선택 대화상자 → part_cycles 에 (cur+1) 기록
 */
(function(){
if(window.MESCYCLE)return;
const REASONS=['설계변경','가공불량','파손·분실','추가수량','재제작','기타'];
let JOB='',CAT='',HIST=new Map();          /* 품번 → 차수 이력 배열(오름차순) */
const key=p=>String(p||'').trim();
const online=()=>!!(window.MESDB&&MESDB.online);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function load(job,category){
 JOB=String(job||'');CAT=String(category||'');HIST=new Map();
 if(!JOB||!CAT||!online())return HIST;
 try{
  const rs=await MESDB.table('part_cycles').select(`select=part_no,cycle_no,reason,memo,started_by,started_at&job_no=eq.${encodeURIComponent(JOB)}&category=eq.${encodeURIComponent(CAT)}&order=cycle_no`,{fresh:true});
  (rs||[]).forEach(r=>{const k=key(r.part_no);const a=HIST.get(k)||[];a.push({no:Number(r.cycle_no)||1,reason:r.reason||'',memo:r.memo||'',by:r.started_by||'',at:String(r.started_at||'').slice(0,10)});HIST.set(k,a)});
 }catch(e){/* 표(part_cycles)가 아직 없으면 전부 1차로 본다 */}
 return HIST;
}
const hist=p=>HIST.get(key(p))||[];
const cur=p=>{const a=hist(p);return a.length?Math.max(1,...a.map(x=>x.no)):1};
const reason=p=>{const a=hist(p),n=cur(p);const h=a.find(x=>x.no===n);return h?h.reason:''};
const lineNo=r=>Number(r&&r.cycle_no)||1;
function rowsOf(rows,part){return (rows||[]).filter(r=>lineNo(r)===cur(part!=null?part:r.part_no))}
function title(p){const a=hist(p);if(!a.length)return '';return a.map(x=>`${x.no}차 — ${x.reason||''}${x.memo?' ('+x.memo+')':''}${x.at?' · '+x.at:''}${x.by?' '+x.by:''}`).join('\n')}
function badge(no,part,why,force){no=Number(no)||1;if(no<=1&&!force)return '';const t=part!=null?title(part):'';return `<span class="cycb" title="${esc(t||(no+'차 진행'+(why?' — '+why:'')))}">${no}차</span>`}

/* ── 신규진행 대화상자 ── */
function css(){if(document.getElementById('mesCycleCss'))return;const s=document.createElement('style');s.id='mesCycleCss';s.textContent=`
.cycb{display:inline-block;margin-left:4px;padding:0 5px;border-radius:9px;background:#fbe6c8;color:#7a4a12;font-size:10px;font-weight:700;line-height:15px;vertical-align:1px}
#cycMask{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center}
#cycPop{width:640px;max-width:96vw;max-height:90vh;overflow:auto;background:#fff;border:1px solid #6f8090;box-shadow:0 8px 26px rgba(0,0,0,.28);font-size:12px;color:#243441}
#cycPop .hd{display:flex;align-items:center;gap:8px;padding:8px 12px;background:linear-gradient(#e9f1f8,#d3e1ee);border-bottom:1px solid #b7c2cb;font-weight:700}
#cycPop .hd .x{margin-left:auto;border:0;background:none;font-size:18px;cursor:pointer;color:#456}
#cycPop .bd{padding:10px 12px}
#cycPop .note{border:1px solid #e5ad62;background:#fff7ea;color:#8a4f08;padding:6px 8px;margin-bottom:8px;line-height:1.45}
#cycPop table{border-collapse:collapse;width:100%}#cycPop th,#cycPop td{border:1px solid #c9d3dc;padding:3px 6px;height:24px;white-space:nowrap}#cycPop th{background:#eef3f8;text-align:center}
#cycPop td.c{text-align:center}#cycPop tr.off td{color:#9aa6b1;background:#f7f9fa}
#cycPop .rs{display:flex;flex-wrap:wrap;gap:6px 12px;margin:10px 0 6px}#cycPop .rs label{display:flex;align-items:center;gap:4px;cursor:pointer}
#cycPop input.memo{width:100%;height:26px;border:1px solid #b7c2cb;padding:0 7px;box-sizing:border-box}
#cycPop .ft{display:flex;gap:6px;justify-content:flex-end;padding:8px 12px;border-top:1px solid #d5dde4;background:#f5f7f8}
#cycPop .ft button{height:28px;padding:0 12px;border:1px solid #8b9ba9;background:linear-gradient(#fff,#e9eef2);cursor:pointer;border-radius:2px}
#cycPop .ft button.go{background:linear-gradient(#fbe6c8,#e9c48f);border-color:#b8874a;font-weight:700;color:#5a3a10}
@media (max-width:640px){#cycPop{width:100vw;max-height:100vh}}`;document.head.appendChild(s)}
function close(){const m=document.getElementById('cycMask');if(m)m.remove()}

/* o = {job, category, parts:[{part,name,info,can,why}], by, onDone(startedParts)}
 *   info : 현재 차수의 진행 상태 글 (예: '발주 2 · 입고 1')   can:false 면 체크 불가(why 이유) */
function start(o){
 o=o||{};css();close();
 const parts=(o.parts||[]).map(p=>Object.assign({can:true},p,{cur:cur(p.part)}));
 if(!parts.length){alert('신규진행할 품번이 없습니다.');return}
 const m=document.createElement('div');m.id='cycMask';
 m.innerHTML=`<div id="cycPop" role="dialog">
  <div class="hd">↻ 신규진행 (새 차수 시작) — ${esc(o.category||'')} · ${esc(o.job||'')}<button class="x" type="button" title="닫기">×</button></div>
  <div class="bd">
   <div class="note"><b>신규진행</b>은 이미 진행 중인 부품을 <b>처음부터 다시</b> 구매/가공할 때 씁니다. 지금까지의 발주·입고 이력은 <b>이전 차수</b>로 그대로 남고, 이 화면은 새 차수(빈 상태)부터 다시 진행합니다.
   같은 차수 안에서 수량만 더 사는 것은 [재발주]/[추가발주]를 쓰세요. 차수는 원재료·구매품·사내외가공이 각각 따로 셉니다.</div>
   <div style="max-height:42vh;overflow:auto"><table><thead><tr><th style="width:30px"><input type="checkbox" id="cycAll" title="전체"></th><th>품번</th><th>부품명</th><th>현재</th><th>현재 차수 진행</th><th>다음</th></tr></thead><tbody>
   ${parts.map((p,i)=>`<tr class="${p.can?'':'off'}"${p.can?'':` title="${esc(p.why||'')}"`}><td class="c"><input type="checkbox" data-i="${i}"${p.can?'':' disabled'}></td><td>${esc(p.part)}</td><td>${esc(p.name||'')}</td><td class="c">${p.cur}차</td><td>${esc(p.info||'')}</td><td class="c"><b>${p.cur+1}차</b></td></tr>`).join('')}
   </tbody></table></div>
   <div class="rs">${REASONS.map((r,i)=>`<label><input type="radio" name="cycReason" value="${esc(r)}"${i===0?' checked':''}>${esc(r)}</label>`).join('')}</div>
   <input class="memo" id="cycMemo" placeholder="메모 (선택) — 예: 도면 Rev.B 반영, 열처리 후 크랙">
  </div>
  <div class="ft"><button type="button" class="go" id="cycGo">↻ 신규진행 시작</button><button type="button" id="cycNo">취소</button></div></div>`;
 document.body.appendChild(m);
 const q=s=>m.querySelector(s);
 q('.x').onclick=q('#cycNo').onclick=close;
 m.addEventListener('click',e=>{if(e.target===m)close()});
 q('#cycAll').onchange=e=>m.querySelectorAll('tbody input[data-i]:not(:disabled)').forEach(c=>c.checked=e.target.checked);
 q('#cycGo').onclick=async()=>{
  const picks=[...m.querySelectorAll('tbody input[data-i]:checked')].map(c=>parts[Number(c.dataset.i)]);
  if(!picks.length)return alert('신규진행할 품번을 체크하세요.');
  const why=(m.querySelector('input[name=cycReason]:checked')||{}).value||'기타';
  const memo=(q('#cycMemo').value||'').trim();
  if(!confirm(`${picks.map(p=>p.part+' ('+p.cur+'차 → '+(p.cur+1)+'차)').join(', ')}\n\n사유: ${why}${memo?' — '+memo:''}\n\n위 품번의 새 차수를 시작합니다. 기존 이력은 이전 차수로 남습니다. 계속할까요?`))return;
  if(!online()){alert('DB 미연결 — 신규진행은 DB 연결 상태에서만 됩니다.');return}
  q('#cycGo').disabled=true;
  try{
   await MESDB.table('part_cycles').upsert(picks.map(p=>({job_no:o.job,category:o.category,part_no:p.part,cycle_no:p.cur+1,reason:why,memo:memo||null,started_by:o.by||null})));
   await load(o.job,o.category);
   close();
   if(o.onDone)await o.onDone(picks.map(p=>p.part),why);
  }catch(e){q('#cycGo').disabled=false;alert('신규진행 기록 실패: '+String(e.message||e).slice(0,160)+'\n\nsql_v225_cycle.sql 을 Supabase 에 실행했는지 확인하세요.')}
 };
}
window.MESCYCLE={load,cur,reason,hist,rowsOf,lineNo,badge,title,start,close,REASONS,get job(){return JOB},get category(){return CAT}};
})();
