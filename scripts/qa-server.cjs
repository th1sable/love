const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.ttf':'font/ttf'};
http.createServer((request,response)=>{try{const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(response);}catch{response.writeHead(500).end();}}).listen(4173,'127.0.0.1',()=>console.log('QA server: http://127.0.0.1:4173'));
