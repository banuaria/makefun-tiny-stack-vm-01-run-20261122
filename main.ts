// SPDX-License-Identifier: MIT
const fs = require('node:fs'), path = require('node:path');
const spec = {};
function group(ops, width, need, change) {
  for (const op of ops) spec[op] = [width, need, change];
}
group([0,52],0,0,0);
group([1],1,0,1); group([2],4,0,1);
group([3,80,81,83],0,1,-1);
group([4],0,1,1); group([5],0,2,0); group([6],0,2,1);
group([7],0,3,0);
group([16,17,18,19,20,21,22,24,25,26,28,29,30,32,33,34],0,2,-1);
group([23,27,64],0,1,0);
group([48,51],2,0,0); group([49,50],2,1,-1);
group([65],0,2,-2); group([82],0,0,1);
function run(p, input) {
  const s=[], calls=[], mem=new Int32Array(256), out=Buffer.alloc(65536);
  let pc=0, ip=0, used=0, code=0;
  execution: for(let steps=0;;steps++) {
    if(steps===1000000) {code=10;break;}
    if(pc<0 || pc>=p.length) {code=9;break;}
    const op=p[pc++], rule=spec[op];
    if(!rule) {code=5;break;}
    const [width,need,change]=rule;
    if(pc+width>p.length) {code=9;break;}
    let imm=0;
    if(width===1) imm=p.readInt8(pc);
    if(width===4) imm=p.readInt32LE(pc);
    if(width===2) imm=op===51?p.readUInt16LE(pc):p.readInt16LE(pc);
    pc+=width;
    if(s.length<need) {code=2;break;}
    if(s.length+change>256) {code=3;break;}
    let a,b,v;
    if(op>=16 && op<=34 && need===2) {
      b=s.pop(); a=s.pop();
      if(op>=19 && op<=22 && b===0) {code=4;break;}
      switch(op) {
        case 16:v=a+b;break; case 17:v=a-b;break;
        case 18:v=Math.imul(a,b);break; case 19:v=a/b;break;
        case 20:v=a%b;break; case 21:v=(a>>>0)/(b>>>0);break;
        case 22:v=(a>>>0)%(b>>>0);break;
        case 24:v=a&b;break; case 25:v=a|b;break; case 26:v=a^b;break;
        case 28:v=a<<b;break; case 29:v=a>>b;break; case 30:v=a>>>b;break;
        case 32:v=+(a===b);break; case 33:v=+(a<b);break;
        case 34:v=+((a>>>0)<(b>>>0));break;
      }
      s.push(v|0); continue;
    }
    switch(op) {
      case 0:break execution;
      case 1:case 2:s.push(imm);break;
      case 3:s.pop();break;
      case 4:s.push(s[s.length-1]);break;
      case 5:b=s.pop();a=s.pop();s.push(b,a);break;
      case 6:s.push(s[s.length-2]);break;
      case 7:a=s.splice(s.length-3,1)[0];s.push(a);break;
      case 23:s.push(-s.pop()|0);break;
      case 27:s.push(~s.pop());break;
      case 48:pc+=imm;break;
      case 49:case 50:v=s.pop();if((v===0)===(op===49)) pc+=imm;break;
      case 51:if(calls.length===64){code=7;break execution;} calls.push(pc);pc=imm;break;
      case 52:if(!calls.length){code=8;break execution;} pc=calls.pop();break;
      case 64:case 65:
        a=s.pop();if(a<0 || a>255){code=6;break execution;}
        if(op===64)s.push(mem[a]);else mem[a]=s.pop();break;
      case 81:
        if(used===65536){code=11;break execution;}
        out[used++]=s.pop()&255;break;
      case 80:
        b=String(s.pop());
        if(used+b.length>65536){code=11;break execution;}
        used+=out.write(b,used);break;
      case 82:s.push(ip<input.length?input[ip++]:-1);break;
      case 83:code=s.pop()&255;break execution;
    }
  }
  return {stdout:out.subarray(0,used),code};
}
function main() {
  const i=process.env.MAKEFUN_INPUT_DIR??'/input', o=process.env.MAKEFUN_OUTPUT_DIR??'/output';
  for(const id of fs.readdirSync(i).sort()) {
    const r=run(fs.readFileSync(path.join(i,id,'program.bin')),fs.readFileSync(path.join(i,id,'input.bin')));
    fs.mkdirSync(path.join(o,id),{recursive:true});
    fs.writeFileSync(path.join(o,id,'stdout.bin'),r.stdout);
    fs.writeFileSync(path.join(o,id,'exit.txt'),r.code+'\n');
  }
}
module.exports={run};
if(require.main===module)main();
