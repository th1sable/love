// Deterministic brand assets: a single yellow heart, without platform-dependent emoji.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '..', 'assets');
const heart = 'M512 748C480 720 282 568 282 424C282 306 427 272 512 380C597 272 742 306 742 424C742 568 544 720 512 748Z';
const curves = [[512,748,480,720,282,568,282,424],[282,424,282,306,427,272,512,380],[512,380,597,272,742,306,742,424],[742,424,742,568,544,720,512,748]];
const polygon=[];
for(const c of curves)for(let n=0;n<128;n++){const t=n/128,u=1-t;polygon.push([u*u*u*c[0]+3*u*u*t*c[2]+3*u*t*t*c[4]+t*t*t*c[6],u*u*u*c[1]+3*u*u*t*c[3]+3*u*t*t*c[5]+t*t*t*c[7]]);}
function crc(buffer){let value=0xffffffff;for(const byte of buffer){value^=byte;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0);}return (value^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([head,name,data,tail]);}
function png(size,background,fill){
  const raw=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++){
    const intersections=[],py=(y+.5)*1024/size;
    for(let j=0;j<polygon.length;j++){const a=polygon[j],b=polygon[(j+1)%polygon.length];if((a[1]>py)!==(b[1]>py))intersections.push(a[0]+(py-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
    intersections.sort((a,b)=>a-b);
    for(let x=0;x<size;x++){const px=(x+.5)*1024/size;let inside=false;for(let i=0;i<intersections.length;i+=2)if(px>=intersections[i]&&px<intersections[i+1])inside=true;const color=inside?fill:background;const offset=y*(size*4+1)+1+x*4;for(let c=0;c<4;c++)raw[offset+c]=color[c];}
  }
  const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
function main() {
  fs.writeFileSync(path.join(root,'icon.png'),png(1024,[250,248,242,255],[245,203,64,255]));
  fs.writeFileSync(path.join(root,'android-icon-foreground.png'),png(1024,[0,0,0,0],[245,203,64,255]));
  fs.writeFileSync(path.join(root,'android-icon-monochrome.png'),png(1024,[0,0,0,0],[0,0,0,255]));
  fs.writeFileSync(path.join(root,'favicon.png'),png(64,[250,248,242,255],[245,203,64,255]));
  console.log('Yellow heart icons generated.');
}
main();
