/* drawboard.js (v209: 가공공정 순서 끌어서 바꾸기) — 부품 그림보드 화면 스크립트
 * 사내외가공 발주(mes_drawboard.js)가 sessionStorage 'mes_drawboard' 에 넣어 준 자료를 읽어 그린다.
 * 문서를 스크립트로 써 넣지 않고(document.write 없음) DOM 만 만든다. */
(function(){
 const $=id=>document.getElementById(id);
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
 let o={};
 try{o=JSON.parse(sessionStorage.getItem('mes_drawboard')||'{}')||{}}catch(e){o={}}
 if(!o.part){try{o=JSON.parse(decodeURIComponent(location.hash.slice(1))||'{}')}catch(e){}}
 /* v206: 오른쪽 버튼은 공정 마스터 전체. 이 부품의 가공계획에 있는 공정은 "계획 n" 표시를 달고, ▶ 전체 순서대로 는 계획 순서로 넣는다 */
 const PLAN=(o.steps||[]);
 let STEPS=(o.all&&o.all.length?o.all:PLAN).map((s,i)=>({idx:i,code:String(s.code||'').trim(),name:s.name||'',inhouse:false,vendor:'',state:'',plan:[]}));
 PLAN.forEach((ps,k)=>{const c=String(ps.code||'').trim();let t=STEPS.find(x=>x.code===c||x.code.toUpperCase()===c.toUpperCase());
  if(!t){t={idx:STEPS.length,code:c,name:ps.name||c,inhouse:false,vendor:'',state:'',plan:[]};STEPS.push(t)}
  t.plan.push(k+1);if(!t.vendor)t.vendor=ps.vendor||'';if(!t.state)t.state=ps.state||'';if(ps.inhouse)t.inhouse=true;if(!t.name)t.name=ps.name||''});
 const PLANSEQ=[];PLAN.forEach(ps=>{const c=String(ps.code||'').trim();const t=STEPS.find(x=>x.code===c||x.code.toUpperCase()===c.toUpperCase());if(t&&!PLANSEQ.includes(t.idx))PLANSEQ.push(t.idx)});
 let SEQ=[];
 document.title='부품 그림보드 '+(o.job||'')+' '+(o.part||'');
 /* 머리글 */
 const meta=$('meta');
 [['제번',(o.job||'')+(o.item?' · '+o.item:'')],['품번',o.part||''],['부품명',o.name||''],['소요수량',o.qty==null?'':String(o.qty)],['작성',o.by||''],['일자',new Date().toISOString().slice(0,10)]]
  .forEach(([k,v])=>{meta.appendChild(el('b',null,k));meta.appendChild(el('span',null,v))});
 $('footL').textContent=(o.job||'')+' · '+(o.part||'')+' '+(o.name||'');
 /* 그림 */
 const fig=$('fig');
 if(o.image){const im=el('img');im.alt=o.part||'';im.addEventListener('load',()=>{if(!ORI_SET)setOri(bestOri(im.naturalWidth,im.naturalHeight))});im.src=o.image;fig.appendChild(im)}
 else fig.appendChild(el('div','none','PartList 에 등록된 부품 그림이 없습니다.'));
 /* 용지 방향: 세로 도면이면 자동 세로. @page 는 스타일을 바꿔 넣어 인쇄 방향을 맞춘다 */
 let ORI='landscape',ORI_SET=false;const pageSt=el('style');document.head.appendChild(pageSt);
 /* 도면 화소 비율로 가로·세로 중 도면이 더 크게 실리는 쪽을 고른다 (머리글 약 48mm 제외한 도면 영역: 가로 285×150, 세로 198×237) */
 function bestOri(w,h){if(!w||!h)return 'landscape';const L=Math.min(285/w,150/h),P=Math.min(198/w,237/h);return P>L*1.02?'portrait':'landscape'}
 function setOri(v){ORI=v;document.body.classList.toggle('portrait',v==='portrait');pageSt.textContent='@page{size:A4 '+v+';margin:6mm}';$('bOri').textContent='용지: '+(v==='portrait'?'세로':'가로')}
 $('bOri').addEventListener('click',()=>{ORI_SET=true;setOri(ORI==='portrait'?'landscape':'portrait')});
 /* 공정 버튼 */
 $('sideTitle').textContent='가공공정 전체 ('+STEPS.length+') · 계획 '+PLANSEQ.length;
 const btns=$('btns');
 if(!STEPS.length)btns.appendChild(el('div','hint','가공계획에 공정이 없습니다.'));
 STEPS.forEach(s=>{const b=el('button','pbtn');b.dataset.i=s.idx;b.type='button';
  const n=el('span','n');n.id='n'+s.idx;b.appendChild(n);
  b.appendChild(el('span','k',s.name||s.code||''));
  if(s.plan.length){b.classList.add('plan');b.appendChild(el('span','p','계획 '+s.plan.join(',')))}
  const hl=el('label','h');hl.title='사내가공이면 체크';const hc=el('input');hc.type='checkbox';hc.checked=!!s.inhouse;hc.addEventListener('click',e=>e.stopPropagation());hc.addEventListener('change',()=>{s.inhouse=hc.checked;draw()});hl.appendChild(hc);hl.appendChild(document.createTextNode('사내'));hl.addEventListener('click',e=>e.stopPropagation());b.appendChild(hl);
  b.appendChild(el('span','v',[s.vendor,s.state].filter(Boolean).join(' · ')));
  b.addEventListener('click',()=>{if(SUPPRESS)return;tg(s.idx)});
  b.addEventListener('pointerdown',e=>{if(e.button||e.target.closest('label'))return;dragStart(e,s.idx,'btn')});btns.appendChild(b)});
 function draw(){
  const st=$('strip');st.textContent='';st.appendChild(el('span','lab','가공공정 순서'));
  if(!SEQ.length)st.appendChild(el('span','empty','오른쪽 공정 버튼을 누르거나 여기로 끌어 오면 순서대로 표시됩니다.'));
  SEQ.forEach((i,k)=>{const s=STEPS[i];if(k)st.appendChild(el('span','arrow','→'));
   const c=el('span','chip'+(s.inhouse?' house':''));c.title='누르면 뺍니다 · 끌어서 순서를 바꿉니다';c.dataset.i=i;
   c.appendChild(el('span','n',String(k+1)));c.appendChild(document.createTextNode(s.name||s.code||''));
   if(s.vendor){c.appendChild(document.createTextNode(' '));c.appendChild(el('small',null,s.vendor))}
   c.addEventListener('click',()=>{if(SUPPRESS)return;tg(i)});
   c.addEventListener('pointerdown',e=>{if(e.button)return;dragStart(e,i,'chip')});st.appendChild(c)});
  STEPS.forEach(s=>{const b=btns.querySelector('.pbtn[data-i="'+s.idx+'"]'),n=$('n'+s.idx);const k=SEQ.indexOf(s.idx);
   if(b)b.classList.toggle('on',k>=0);if(n)n.textContent=k>=0?String(k+1):''});
 }
 function tg(i){const k=SEQ.indexOf(i);if(k>=0)SEQ.splice(k,1);else SEQ.push(i);draw()}
 /* v209: 끌어서 순서 바꾸기 — 순서 칸(chip)을 끌어 다른 자리에 놓으면 순서가 바뀐다.
  *   오른쪽 공정 버튼을 순서 줄로 끌어 오면 놓은 자리에 끼워 넣는다(이미 있으면 그 자리로 옮김).
  *   6px 이상 움직여야 끌기로 보고, 그보다 적으면 예전처럼 클릭(넣기/빼기)이다. 마우스·터치 모두. */
 let DRAG=null,SUPPRESS=false,GHOST=null,MARK=null;
 function dragStart(e,i,src){DRAG={i,src,x0:e.clientX,y0:e.clientY,on:false}}
 function dropIndex(x,y){
  const st=$('strip'),r=st.getBoundingClientRect(),pad=24;
  if(x<r.left-pad||x>r.right+pad||y<r.top-pad||y>r.bottom+pad)return null;
  const cs=[...st.querySelectorAll('.chip')];
  for(let k=0;k<cs.length;k++){const b=cs[k].getBoundingClientRect();
   if(y<b.top)return k;
   if(y<=b.bottom&&x<b.left+b.width/2)return k}
  return cs.length}
 function showMark(k){const st=$('strip');if(!MARK){MARK=el('span','dropmark')}
  if(k==null){MARK.remove();st.classList.remove('dropon');return}
  st.classList.add('dropon');const cs=[...st.querySelectorAll('.chip')];
  const ref=cs[k]?(cs[k].previousElementSibling&&cs[k].previousElementSibling.classList.contains('arrow')?cs[k].previousElementSibling:cs[k]):null;
  if(ref){if(MARK.nextSibling!==ref)st.insertBefore(MARK,ref)}else if(st.lastChild!==MARK)st.appendChild(MARK)}
 function dragEnd(){if(GHOST){GHOST.remove();GHOST=null}if(MARK)MARK.remove();$('strip').classList.remove('dropon');
  document.body.classList.remove('dragging');document.querySelectorAll('.dragsrc').forEach(x=>x.classList.remove('dragsrc'))}
 document.addEventListener('pointermove',e=>{if(!DRAG)return;
  if(!DRAG.on){if(Math.hypot(e.clientX-DRAG.x0,e.clientY-DRAG.y0)<6)return;
   DRAG.on=true;document.body.classList.add('dragging');
   const s=STEPS[DRAG.i];GHOST=el('div','dragghost',(s&&(s.name||s.code))||'');document.body.appendChild(GHOST);
   const srcEl=DRAG.src==='chip'?$('strip').querySelector('.chip[data-i="'+DRAG.i+'"]'):btns.querySelector('.pbtn[data-i="'+DRAG.i+'"]');if(srcEl)srcEl.classList.add('dragsrc')}
  e.preventDefault();
  GHOST.style.left=(e.clientX+12)+'px';GHOST.style.top=(e.clientY+10)+'px';
  showMark(dropIndex(e.clientX,e.clientY))});
 const finish=e=>{if(!DRAG)return;const d=DRAG;DRAG=null;if(!d.on)return;
  SUPPRESS=true;setTimeout(()=>{SUPPRESS=false},0);
  const k0=e&&e.type==='pointerup'?dropIndex(e.clientX,e.clientY):null;dragEnd();
  if(k0==null)return;let k=k0;const cur=SEQ.indexOf(d.i);
  if(cur>=0){if(cur===k||cur+1===k)return;SEQ.splice(cur,1);if(cur<k)k--}
  SEQ.splice(k,0,d.i);draw()};
 document.addEventListener('pointerup',finish);document.addEventListener('pointercancel',finish);
 $('bAll').addEventListener('click',()=>{SEQ=PLANSEQ.slice();draw()});
 $('bClr').addEventListener('click',()=>{SEQ=[];draw()});
 $('bPrint').addEventListener('click',()=>window.print());
 /* v207: 고른 순서를 사내외가공 발주 화면(연 창)으로 보내 가공계획에 적용 */
 $('bApply').addEventListener('click',()=>{
  if(!SEQ.length)return alert('먼저 오른쪽에서 공정을 순서대로 눌러 주세요.');
  const op=window.opener;if(!op||op.closed)return alert('사내외가공 발주 화면이 닫혀 있어 적용할 수 없습니다.');
  const steps=SEQ.map(i=>({code:STEPS[i].code,house:!!STEPS[i].inhouse}));
  if(!confirm(o.part+' 의 가공공정을 아래 순서로 가공계획에 적용합니다.\n\n'+steps.map((x,k)=>(k+1)+'. '+(STEPS[SEQ[k]].name||x.code)+(x.house?' [사내]':'')).join('\n')))return;
  op.postMessage({type:'mes_drawboard_apply',job:o.job||'',part:o.part||'',jo:o.jo==null?null:o.jo,ri:o.ri,steps},location.origin);
  $('bApply').textContent='✔ 적용 보냄';setTimeout(()=>{$('bApply').textContent='▣ 가공계획 적용'},2500);
 });
 $('bClose').addEventListener('click',()=>window.close());
 /* v208: 등록된 이미지만 보기 */
 const ov=$('ov'),ovB=$('ovB');let ovImg=null;
 function ovMode(real){ovB.classList.toggle('real',!!real)}
 $('bImg').addEventListener('click',()=>{
  if(!o.image)return alert('PartList 에 등록된 부품 그림이 없습니다.');
  if(!ovImg){ovImg=el('img');ovImg.alt=o.part||'';ovImg.addEventListener('load',()=>{$('ovS').textContent=' · '+ovImg.naturalWidth+' × '+ovImg.naturalHeight+' px'});ovImg.src=o.image;ovImg.addEventListener('click',()=>ovMode(!ovB.classList.contains('real')));ovB.appendChild(ovImg)}
  $('ovT').textContent='원본 이미지 — '+(o.part||'')+' '+(o.name||'');ovMode(false);ov.classList.add('show')});
 $('ovFit').addEventListener('click',()=>ovMode(false));$('ovReal').addEventListener('click',()=>ovMode(true));
 $('ovClose').addEventListener('click',()=>ov.classList.remove('show'));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')ov.classList.remove('show')});
 draw();
})();
