import{n as e}from"./rolldown-runtime-CbXtAM7H.js";import{bn as t}from"./vendor-DFpeOyWE.js";import{i as n}from"./stable-DHpuHiGc.js";import{t as r}from"./useMediaQuery--1_aAR9p.js";var i=e(t(),1);function a(e,t){let[n,a]=(0,i.useState)(()=>new Set(window.matchMedia(r).matches?t.wideOpen??e:t.phoneOpen)),o=(0,i.useCallback)(e=>n.has(e),[n]),s=(0,i.useCallback)((e,t)=>{a(n=>{if(n.has(e)===t)return n;let r=new Set(n);return t?r.add(e):r.delete(e),r})},[]);return{isOpen:o,setOpen:s,reveal:(0,i.useCallback)((e,t)=>{s(e,!0),requestAnimationFrame(()=>{let n=(t?document.getElementById(t):null)??document.getElementById(e);n&&(((n.matches(`[role="radiogroup"]`)?n.querySelector(`[role="radio"][tabindex="0"]`):null)??n).focus({preventScroll:!0}),n.scrollIntoView({block:`center`}))})},[s])}}function o(e,t,n=`text/plain`){s(new Blob([e],{type:n}),t)}function s(e,t){let n=URL.createObjectURL(e);try{c(n,t)}finally{URL.revokeObjectURL(n)}}function c(e,t){let n=document.createElement(`a`);n.href=e,n.download=t,document.body.appendChild(n),n.click(),document.body.removeChild(n)}function l(e,t,n){return u([e],t,n)}function u(e,t,r){if(e.length===0)return!1;let i=window.open(``,`_blank`);if(!i)return!1;let a=`${r.widthIn}in`,o=`${r.heightIn}in`,s=e.map((t,n)=>`<img class="sheet${n<e.length-1?` page-break`:``}" src="${t}" />`).join(`
`);return i.document.write(`
    <html>
      <head>
        <title>${t}</title>
        <style>
          body { margin: 0; padding: 12px; text-align: center; background: ${n.gray[900]}; }
          img.sheet { max-width: 100%; height: auto; display: block; margin: 0 auto 12px auto; }
          @media print {
            @page { margin: 0; size: ${a} ${o}; }
            body { margin: 0; padding: 0; background: #fff; }
            img.sheet { display: block; width: ${a}; height: ${o}; max-width: none; object-fit: contain; margin: 0; }
            img.page-break { break-after: page; page-break-after: always; }
          }
        </style>
      </head>
      <body>
        ${s}
        <script>
          (function() {
            var imgs = Array.prototype.slice.call(document.querySelectorAll('img.sheet'));
            var remaining = imgs.length;
            function done() {
              remaining--;
              if (remaining <= 0) window.print();
            }
            imgs.forEach(function(img) {
              if (img.complete) done();
              else {
                img.addEventListener('load', done);
                img.addEventListener('error', done);
              }
            });
          })();
        <\/script>
      </body>
    </html>
  `),i.document.close(),!0}export{a,u as i,c as n,l as r,o as t};