import type { Status } from './domain';
export const dayKey=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const dateNumber=(value:string)=>value.split('-').reverse().join('/');
export const dateLabel=(value:string)=>new Date(`${value}T12:00:00`).toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});
export function currentStatus(status:Status|null,date=new Date()):Status|null {
  if(!status||Number.isNaN(Date.parse(status.updatedAt)))return null;
  return dayKey(new Date(status.updatedAt))===dayKey(date)?status:null;
}
export function monthCells(month:string):(string|null)[]{
  const [year,number]=month.split('-').map(Number);
  const offset=(new Date(year,number-1,1).getDay()+6)%7;
  const days=new Date(year,number,0).getDate();
  const cells:(string|null)[]=Array(offset).fill(null);
  for(let n=1;n<=days;n++)cells.push(`${month}-${String(n).padStart(2,'0')}`);
  while(cells.length%7)cells.push(null);
  return cells;
}
export function adjacentMonth(month:string,delta:number){const [y,m]=month.split('-').map(Number);const d=new Date(y,m-1+delta,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
const DAY=86400000;
const utcDate=(year:number,month:number,day:number)=>Date.UTC(year,month,Math.min(day,new Date(Date.UTC(year,month+1,0)).getUTCDate()));
export function relationshipTime(since:string,now=new Date()){
  const [sy,sm,sd]=since.split('-').map(Number);const [ey,em,ed]=dayKey(now).split('-').map(Number);
  const start=utcDate(sy,sm-1,sd),end=utcDate(ey,em-1,ed);
  if(!Number.isFinite(start)||end<start)return null;
  let totalMonths=(ey-sy)*12+em-sm;
  let anchor=utcDate(sy,sm-1+totalMonths,sd);
  if(anchor>end){totalMonths--;anchor=utcDate(sy,sm-1+totalMonths,sd);}
  let anniversary=utcDate(ey,sm-1,sd);if(anniversary<end)anniversary=utcDate(ey+1,sm-1,sd);
  return {years:Math.floor(totalMonths/12),months:totalMonths%12,days:Math.round((end-anchor)/DAY),totalDays:Math.round((end-start)/DAY),nextAnniversaryDays:Math.round((anniversary-end)/DAY)};
}
