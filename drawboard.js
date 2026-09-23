/* drawboard.js (v205) — 부품 그림보드 화면 스크립트
 * 사내외가공 발주(mes_drawboard.js)가 sessionStorage 'mes_drawboard' 에 넣어 준 자료를 읽어 그린다.
 * 문서를 스크립트로 써 넣지 않고(document.write 없음) DOM 만 만든다. */
(function(){
 const $=id=>document.getElementById(id);
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
 let o={};
 try{o=JSON.parse(sessionStorage.getItem('mes_drawboard')||'{}')||{}}catch(e){o={}}
 if(!o.part){try{o=JSON.parse(decodeURIComponent(location.hash.slice(1))||'{}')}catch(e){}}
 const STEPS=(o.steps||[]).map((s,i)=>Object.assign({idx:i},s));
 let SEQ=[];
 document.title='부품 그림보드 '+(o.job||'')+' '+(o.part||'');
 /* 머리글 */
 const meta=$('meta');
 [['제번',(o.job||'')+(o.item?' · '+o.item:'')],['품번',o.part||''],['부품명',o.name||''],['소요수량',o.qty==null?'':String(o.qty)],['작성',o.by||''],['일자',new Date().toISOString().slice(0,10)]]
  .forEach(([k,v])=>{meta.appendChild(el('b',null,k));meta.appendChild(el('span',null,v))});
 $('footL').textContent=(o.job||'')+' · '+(o.part||'')+' '+(o.name||'');
 /* 그림 */
 const fig=$('fig');
 if(o.image){const im=el('img');im.alt=o.part||'';im.addEventListener('load',()=>{if(im.naturalHeight>im.naturalWidth*1.15&&!ORI_SET)setOri('portrait')});im.src=o.image;fig.appendChild(im)}
 else fig.appendChild(el('div','none','PartList 에 등록된 부품 그림이 없습니다.'));
 /* 용지 방향: 세로 도면이면 자동 세로. @page 는 스타일을 바꿔 넣어 인쇄 방향을 맞춘다 */
 let ORI='landscape',ORI_SET=false;const pageSt=el('style');document.head.appendChild(pageSt);
 function setOri(v){ORI=v;document.body.classList.toggle('portrait',v==='portrait');pageSt.textContent='@page{size:A4 '+v+';margin:6mm}';$('bOri').textContent='용지: '+(v==='portrait'?'세로':'가로')}
 $('bOri').addEventListener('click',()=>{ORI_SET=true;setOri(ORI==='portrait'?'landscape':'portrait')});
 /* 공정 버튼 */
 $('sideTitle').textContent='가공공정 ('+STEPS.length+')';
 const btns=$('btns');
 if(!STEPS.length)btns.appendChild(el('div','hint','가공계획에 공정이 없습니다.'));
 STEPS.forEach(s=>{const b=el('button','pbtn');b.dataset.i=s.idx;b.type='button';
  const n=el('span','n');n.id='n'+s.idx;b.appendChild(n);
  b.appendChild(el('span','k','공정'+(s.idx+1)+' '+(s.name||s.code||'')));
  if(s.inhouse)b.appendChild(el('span','h','사내'));
  b.appendChild(el('span','v',[s.vendor,s.state].filter(Boolean).join(' · ')));
  b.addEventListener('click',()=>tg(s.idx));btns.appendChild(b)});
 function draw(){
  const st=$('strip');st.textContent='';st.appendChild(el('span','lab','가공공정 순서'));
  if(!SEQ.length)st.appendChild(el('span','empty','오른쪽 공정 버튼을 누르는 순서대로 여기에 표시됩니다.'));
  SEQ.forEach((i,k)=>{const s=STEPS[i];if(k)st.appendChild(el('span','arrow','→'));
   const c=el('span','chip'+(s.inhouse?' house':''));c.title='누르면 뺍니다';
   c.appendChild(el('span','n',String(k+1)));c.appendChild(document.createTextNode(s.name||s.code||''));
   if(s.vendor){c.appendChild(document.createTextNode(' '));c.appendChild(el('small',null,s.vendor))}
   c.addEventListener('click',()=>tg(i));st.appendChild(c)});
  STEPS.forEach(s=>{const b=btns.querySelector('.pbtn[data-i="'+s.idx+'"]'),n=$('n'+s.idx);const k=SEQ.indexOf(s.idx);
   if(b)b.classList.toggle('on',k>=0);if(n)n.textContent=k>=0?String(k+1):''});
 }
 function tg(i){const k=SEQ.indexOf(i);if(k>=0)SEQ.splice(k,1);else SEQ.push(i);draw()}
 $('bAll').addEventListener('click',()=>{SEQ=STEPS.map(s=>s.idx);draw()});
 $('bClr').addEventListener('click',()=>{SEQ=[];draw()});
 $('bPrint').addEventListener('click',()=>window.print());
 $('bClose').addEventListener('click',()=>window.close());
 draw();
})();
