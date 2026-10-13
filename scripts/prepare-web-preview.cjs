const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const destination=path.resolve(process.argv[2]||'');
if(!process.argv[2]||!fs.existsSync(path.join(destination,'.openai','hosting.json')))throw new Error('Indica il progetto Sites esistente.');
const target=path.join(destination,'dist');
fs.mkdirSync(target,{recursive:true});
const oldJs=path.join(target,'_expo','static','js','web');
if(fs.existsSync(oldJs))for(const entry of fs.readdirSync(oldJs)){const file=path.join(oldJs,entry);if(fs.statSync(file).isFile()&&entry.startsWith('entry-'))fs.unlinkSync(file);}
fs.cpSync(path.join(root,'dist'),target,{recursive:true,filter:source=>!/[\\/]static[\\/]js[\\/](android|ios)([\\/]|$)/.test(source)&&!source.endsWith('metadata.json')});
const html=fs.readFileSync(path.join(target,'index.html'),'utf8').replace('<html lang="en">','<html lang="it">').replace('You need to enable JavaScript to run this app.','Attiva JavaScript per aprire love.');
fs.writeFileSync(path.join(target,'index.html'),html);
for(const route of ['pagine','insieme','profilo','auth/confirm']){fs.mkdirSync(path.join(target,route),{recursive:true});fs.writeFileSync(path.join(target,route,'index.html'),html);}
console.log('Anteprima web e pagina di conferma preparate.');
