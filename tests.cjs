// SPDX-License-Identifier: MIT
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {run}=require('./main.ts');
const push=v=>{const b=Buffer.alloc(5);b[0]=2;b.writeInt32LE(v,1);return [...b]};
function check(p,code,text='',input=[]) {const r=run(Buffer.from(p),Buffer.from(input));assert.equal(r.code,code);assert.deepEqual(r.stdout,Buffer.from(text));}
check([0],0);check([],9);check([255],5);check([2,0],9);check([49],9);
for(const op of [3,4,5,6,7,16,23,27,49,50,64,65,80,81,83])check([op,0,0],2);
check([...push(65),81,255],5,'A');
for(const op of [19,20,21,22])check([...push(1),...push(0),op],4);
check([...push(-1),64],6);check([52],8);check([51,0,0],7);
check([48,253,255],10);check([48,0,0],9);
check(Array(257).fill([1,0]).flat(),3);
check([1,255,80,82,80,82,80,82,83],255,'-1255-1',[255]);
function binary(a,b,op,want){check([...push(a),...push(b),op,80,0],0,String(want));}
for(const row of [[2147483647,1,16,-2147483648],[2147483647,2147483647,18,1],[-2147483648,-1,19,-2147483648],[-2147483648,-1,20,0],[-7,3,20,-1],[-1,2,21,2147483647],[-1,3,22,0],[-1,0,34,0],[-1,32,30,-1],[-1,-1,30,1]])binary(...row);
check([1,65,81,48,250,255],11,'A'.repeat(65536));
check([1,1,1,2,1,3,7,80,80,80,0],0,'132');
check([51,4,0,0,1,65,81,52],0,'A');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tinyvm-'));
try {
 const i=path.join(dir,'in'),o=path.join(dir,'out');fs.mkdirSync(path.join(i,'case'),{recursive:true});
 fs.writeFileSync(path.join(i,'case','program.bin'),Buffer.from([1,65,81,0]));fs.writeFileSync(path.join(i,'case','input.bin'),'');
 for(let n=0;n<2;n++) {const r=spawnSync(process.execPath,['main.ts'],{env:{...process.env,MAKEFUN_INPUT_DIR:i,MAKEFUN_OUTPUT_DIR:o}});assert.equal(r.status,0,String(r.stderr));assert.equal(fs.readFileSync(path.join(o,'case','stdout.bin'),'utf8'),'A');assert.equal(fs.readFileSync(path.join(o,'case','exit.txt'),'utf8'),'0\n');}
} finally {fs.rmSync(dir,{recursive:true,force:true});}
console.log('VM semantics and repeatable filesystem protocol passed');
