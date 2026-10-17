function e(e,n,r=`text/plain`){t(new Blob([e],{type:r}),n)}function t(e,t){let r=URL.createObjectURL(e);try{n(r,t)}finally{URL.revokeObjectURL(r)}}function n(e,t){let n=document.createElement(`a`);n.href=e,n.download=t,document.body.appendChild(n),n.click(),document.body.removeChild(n)}function r(e,t,n){let r=window.open(``,`_blank`);if(!r)return!1;let i=`${n.widthIn}in`,a=`${n.heightIn}in`;return r.document.write(`
    <html>
      <head>
        <title>${t}</title>
        <style>
          body { margin: 0; padding: 0; text-align: center; }
          img { max-width: 100%; height: auto; }
          @media print {
            @page { margin: 0; size: ${i} ${a}; }
            body { margin: 0; }
            img { display: block; width: ${i}; height: ${a}; max-width: none; }
          }
        </style>
      </head>
      <body><img src="${e}" onload="window.print();"></body>
    </html>
  `),r.document.close(),!0}export{r as i,e as n,n as r,t};