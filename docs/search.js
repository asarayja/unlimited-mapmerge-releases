/* Site search: the icon button in the header opens a search field over the whole page (the text
   in the chosen language, code examples included). Results show the section and a snippet; a
   click opens the collapsed card it is in, scrolls there and flashes the hit.
   Ctrl+K or / opens it, Esc closes it. No libraries, no network. */
(function(){
 var btn=document.getElementById('searchBtn'),box=document.getElementById('siteSearch'),inp=document.getElementById('siteSearchInput'),res=document.getElementById('siteSearchRes');
 if(!btn||!box||!inp||!res)return;
 var MAX=40,index=null,indexLang=null,sel=-1,items=[];
 var t=function(k){var L=window.I18N||{},d=L[curLang()]||L.en||{};return d[k]||(L.en||{})[k]||'';};
 function curLang(){try{var s=localStorage.getItem('ummerge-lang');if(s&&window.I18N&&window.I18N[s])return s;}catch(e){}var c=(document.getElementById('langCode')||{}).textContent||'EN';return c.toLowerCase();}

 // lower case, no accents; æ/ø/å and friends compare as plain letters
 function norm(s){return String(s||'').toLowerCase().replace(/æ/g,'ae').replace(/ø/g,'o').replace(/ß/g,'ss').normalize('NFD').replace(/[̀-ͯ]/g,'');}

 // where a piece of text lives: the card / FAQ entry / section heading it belongs to
 function where(el){
  var parts=[],d=el.closest('details'),s=el.closest('section');
  var h=s&&s.querySelector('h2');if(h&&h.textContent.trim())parts.push(h.textContent.trim());
  if(d){var sm=d.querySelector('summary');if(sm){var st=sm.querySelector('.st');var tx=(st||sm).textContent.trim();if(tx&&tx!==parts[0])parts.push(tx);}}
  else{var c=el.closest('.card,article');var h3=c&&c.querySelector('h3');if(h3&&h3!==el&&h3.textContent.trim())parts.push(h3.textContent.trim());}
  return parts.join(' · ');
 }
 function build(){
  var main=document.getElementById('main')||document.body,out=[];
  var nodes=main.querySelectorAll('[data-i],[data-h],pre code,td,th');
  for(var i=0;i<nodes.length;i++){
   var el=nodes[i];
   var hid=el.closest('[hidden]');if(el.closest('#siteSearch')||(hid&&!hid.classList.contains('area')))continue; // the feature filter's hidden cards still count
   if(el.querySelector('[data-i],[data-h]'))continue; // a container: its children are indexed on their own
   var text=(el.textContent||'').replace(/\s+/g,' ').trim();
   if(text.length<2)continue;
   out.push({el:el,text:text,n:norm(text),where:where(el),code:el.tagName==='CODE'||!!el.closest('pre')});
  }
  index=out;indexLang=curLang();
 }
 function esc(s){return s.replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 // a snippet around the first hit, with the hit marked (positions mapped on the original text)
 function snippet(item,q){
  var nt=item.n,pos=nt.indexOf(q);if(pos<0)pos=0;
  // norm() keeps the length except for æ->ae / ß->ss; map back by counting
  var map=[];for(var i=0;i<item.text.length;i++){var c=norm(item.text[i]);for(var j=0;j<c.length;j++)map.push(i);}
  var a=map[pos]||0,b=(map[pos+q.length-1]||a)+1;
  var s=Math.max(0,a-50),e=Math.min(item.text.length,b+70);
  return (s>0?'…':'')+esc(item.text.slice(s,a))+'<mark>'+esc(item.text.slice(a,b))+'</mark>'+esc(item.text.slice(b,e))+(e<item.text.length?'…':'');
 }
 function search(){
  if(!index||indexLang!==curLang())build();
  var raw=inp.value.trim(),q=norm(raw);res.innerHTML='';sel=-1;items=[];
  if(q.length<2){res.hidden=true;return;}
  var words=q.split(/\s+/).filter(Boolean),hits=[];
  var wordRe=words.map(function(w){return new RegExp('(^|[^a-z0-9])'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));});
  for(var i=0;i<index.length;i++){
   var it=index[i],wn=norm(it.where),inText=0,ok=true,score=0;
   for(var j=0;j<words.length;j++){
    var w=words[j];
    if(it.n.indexOf(w)>-1){inText++;score+=wordRe[j].test(it.n)?3:1;}
    else if(wn.indexOf(w)>-1){score+=1;}
    else{ok=false;break;}
   }
   if(!ok||!inText)continue; // a heading match alone would list every line of that card
   if(words.length>1&&it.n.indexOf(q)>-1)score+=6; // the whole phrase
   if(it.code)score-=1;
   if(it.el.closest('details,.card,article'))score+=1; // a card or FAQ entry beats a jump link with the same words
   it.score=score;it.pos=i;hits.push(it);
  }
  // best matches first, page order between equals
  hits.sort(function(x,y){return (y.score-x.score)||(x.pos-y.pos);});
  // one line per card is enough at the top: drop near-duplicate places beyond three
  var seen={};hits=hits.filter(function(h){if(seen[h.n])return false;seen[h.n]=1;return true;}); // the same text twice (title + tab label)
  var perWhere={};hits=hits.filter(function(h){var k=h.where;perWhere[k]=(perWhere[k]||0)+1;return perWhere[k]<=3;});
  res.hidden=false;
  if(!hits.length){var li=document.createElement('li');li.className='ss-none';li.textContent=t('ss_none');res.appendChild(li);return;}
  var first=words[0];
  hits.slice(0,MAX).forEach(function(it,k){
   var li=document.createElement('li');li.setAttribute('role','option');li.id='ss-'+k;li.tabIndex=-1;
   var w=document.createElement('span');w.className='ss-where';w.textContent=it.where||'';
   var sn=document.createElement('span');sn.className='ss-snip'+(it.code?' ss-code':'');sn.innerHTML=snippet(it,(it.n.indexOf(q)>-1?q:(words.filter(function(w){return it.n.indexOf(w)>-1;})[0]||first)));
   li.appendChild(w);li.appendChild(sn);
   li.addEventListener('click',function(){go(it);});
   li.addEventListener('mousemove',function(){mark(k);});
   res.appendChild(li);items.push(it);
  });
  if(hits.length>MAX){var more=document.createElement('li');more.className='ss-none';more.textContent=t('ss_more').replace('{n}',hits.length-MAX);res.appendChild(more);}
  mark(0);
 }
 function mark(k){var lis=res.querySelectorAll('li[role=option]');lis.forEach(function(l,i){l.classList.toggle('on',i===k);l.setAttribute('aria-selected',i===k?'true':'false');});sel=k;if(lis[k]){inp.setAttribute('aria-activedescendant',lis[k].id);lis[k].scrollIntoView({block:'nearest'});}}
 function go(it){
  close();
  var el=it.el,d=el.closest('details');
  while(d){d.open=true;d=d.parentElement&&d.parentElement.closest('details');}
  var h=el.closest('[hidden]');if(h&&h.classList.contains('area'))h.hidden=false; // the feature filter may hide it
  setTimeout(function(){
   var y=el.getBoundingClientRect().top+window.scrollY-90;window.scrollTo({top:Math.max(0,y),behavior:'smooth'});
   el.classList.remove('ss-flash');void el.offsetWidth;el.classList.add('ss-flash');
   setTimeout(function(){el.classList.remove('ss-flash');},2200);
  },30);
 }
 function open(){box.hidden=false;btn.setAttribute('aria-expanded','true');document.documentElement.classList.add('ss-open');inp.placeholder=t('ss_ph');inp.setAttribute('aria-label',t('ss_ph'));inp.focus();inp.select();if(inp.value)search();}
 function close(){box.hidden=true;btn.setAttribute('aria-expanded','false');document.documentElement.classList.remove('ss-open');res.hidden=true;}
 btn.addEventListener('click',function(e){e.stopPropagation();box.hidden?open():close();});
 document.getElementById('siteSearchClose').addEventListener('click',function(){close();btn.focus();});
 inp.addEventListener('input',search);
 inp.addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'){e.preventDefault();if(items.length)mark((sel+1)%items.length);}
  else if(e.key==='ArrowUp'){e.preventDefault();if(items.length)mark((sel-1+items.length)%items.length);}
  else if(e.key==='Enter'){e.preventDefault();if(items[sel])go(items[sel]);}
  else if(e.key==='Escape'){e.preventDefault();close();btn.focus();}
 });
 document.addEventListener('click',function(e){if(!box.hidden&&!e.target.closest('#siteSearch')&&!e.target.closest('#searchBtn'))close();});
 document.addEventListener('keydown',function(e){
  var typing=/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName||'');
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();box.hidden?open():close();}
  else if(e.key==='/'&&!typing&&box.hidden){e.preventDefault();open();}
 });
 // language change: rebuild on next search; keep labels in the chosen language
 var lb=document.getElementById('langList');if(lb)lb.addEventListener('click',function(){index=null;setTimeout(function(){btn.setAttribute('aria-label',t('ss_btn'));btn.title=t('ss_btn')+' (Ctrl+K)';},0);});
 btn.setAttribute('aria-label',t('ss_btn'));btn.title=t('ss_btn')+' (Ctrl+K)';
})();
