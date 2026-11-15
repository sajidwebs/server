// Explicit operator action only. Never run at server startup.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const db = require('./config/database');
const M = require('./models');
const { headquarters } = require('./seed-business-masters');
const { hashPassword } = require('./utils/password');
const keepCodes = new Set(['BBSR-CEN', 'KOL-CEN-A', 'DEL-CEN-A']);
const staff = [
  ['sourav.mukherjee', 'National Manager', 'NSM', null, 'KOL-CEN'],
  ['rohan.mehra', 'Regional Manager', 'RBM', 'sourav.mukherjee', 'DEL-CEN'],
  ['ranjit.malik', 'Area Manager', 'ABM', 'rohan.mehra', 'BBSR'],
  ['prakash.mohanty', 'Field Representative', 'MR', 'ranjit.malik', 'BBSR']
];
const oldStaff = new Set(['ananya.behera', 'priyanka.ghosh', 'pooja.arora']);
const untouched = r => new Date(r.updatedAt) < new Date('2026-11-15T09:10:00Z');

async function minimize(apply = false) {
  const names = ['User','Headquarter','Territory','Patch','PatchHeadquarter','Doctor','Chemist','Stockist','Hospital','SVL'];
  const snapshot = {};
  for (const name of names) snapshot[name] = await M[name].findAll({raw:true});
  const remove = Object.fromEntries(names.map(n=>[n,new Set()]));
  for (const [,code,name,,,,,,,routes] of headquarters) {
    const hq = snapshot.Headquarter.find(h=>h.code===code && h.name===name && untouched(h));
    if (!hq) continue;
    if (!['BBSR','KOL-CEN','DEL-CEN'].includes(code)) {
      remove.Headquarter.add(hq.id);
      for(const [model,field,suffix] of [['Stockist','stockist_name','Pharma Distributors'],['Hospital','hospital_name','Health Centre']])
        snapshot[model].filter(r=>r.hq_id===hq.id && r[field]===`${name} ${suffix}` && untouched(r)).forEach(r=>remove[model].add(r.id));
    }
    for(const [routeCode,routeName,area,first,last] of routes) {
      if(keepCodes.has(routeCode)) continue;
      const t=snapshot.Territory.find(r=>r.code===routeCode && r.name===routeName && r.hq_id===hq.id && untouched(r));
      const p=snapshot.Patch.find(r=>r.patch_name===`${area} Route` && r.hq_id===hq.id && untouched(r));
      if(t)remove.Territory.add(t.id); if(p)remove.Patch.add(p.id);
      for(const [model,email] of [['Doctor',`${first}.${last}.${routeCode}`.toLowerCase()+'@pamsforce.com'],['Chemist',`pharmacy.${routeCode.toLowerCase()}@pamsforce.com`]])
        snapshot[model].filter(r=>r.email===email && r.hq_id===hq.id && untouched(r)).forEach(r=>remove[model].add(r.id));
    }
  }
  snapshot.SVL.filter(r=>remove.Doctor.has(r.doctor_id) && untouched(r)).forEach(r=>remove.SVL.add(r.id));
  snapshot.PatchHeadquarter.filter(r=>(remove.Patch.has(r.patch_id)||remove.Headquarter.has(r.hq_id)) && untouched(r)).forEach(r=>remove.PatchHeadquarter.add(r.id));
  snapshot.User.filter(r=>oldStaff.has(r.username) && r.email===`${r.username}@pamsforce.com` && !r.isActive && !r.lastLogin).forEach(r=>remove.User.add(r.id));
  const planned=Object.fromEntries(names.map(n=>[n,[...remove[n]]]));
  if(!apply){console.log('Generated record removal plan:',JSON.stringify(planned));return planned;}
  fs.mkdirSync(path.join(__dirname,'backups'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'backups',`before-minimal-demo-${Date.now()}.json`),JSON.stringify(snapshot,null,2));
  const credentials=[]; const preserved=[]; const deleted={};
  await db.transaction(async transaction=>{
    await db.query('SELECT pg_advisory_xact_lock(724631906)',{transaction});
    const accounts = new Map(snapshot.User.map(u=>[u.username,u]));
    for(const [username,role,employeeType,manager,hqCode] of staff){
      const user=accounts.get(username); if(!user)throw new Error(`Missing requested demonstration account ${username}`);
      // Never reset credentials or role of an account already used by a person.
      if(user.lastLogin)continue;
      const hq=snapshot.Headquarter.find(h=>h.code===hqCode);
      const territory=snapshot.Territory.find(t=>t.hq_id===hq?.id && keepCodes.has(t.code));
      const values={role,employeeType,reportingTo:manager?accounts.get(manager).id:null,assigned_manager_id:manager?accounts.get(manager).id:null,hq_id:hq?.id,territory_id:territory?.id,isActive:true};
      if(!user.isActive){const password=crypto.randomBytes(18).toString('base64url');values.password=await hashPassword(password);credentials.push({email:user.email,designation:employeeType,password});}
      await M.User.update(values,{where:{id:user.id},transaction});
    }
    // Check EVERY incoming database foreign key before deletion, including CASCADE
    // and SET NULL. Operational references therefore prevent any destructive cascade.
    const [fks]=await db.query(`SELECT c.conrelid::regclass::text AS source, a.attname AS column, c.confrelid::regclass::text AS target
      FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
      WHERE c.contype='f' AND array_length(c.conkey,1)=1`,{transaction});
    const quote = s => '"'+s.replaceAll('"','""')+'"';
    for(const name of ['SVL','PatchHeadquarter','Doctor','Chemist','Stockist','Hospital','User','Territory','Patch','Headquarter']){
      deleted[name]=0;
      for(const id of remove[name]){
        const table=M[name].getTableName();let referenced=false;
        for(const fk of fks.filter(f=>f.target.replace(/^public\./,'')===table)){
          const [rows]=await db.query(`SELECT 1 FROM ${fk.source.split('.').map(quote).join('.')} WHERE ${quote(fk.column)}=:id LIMIT 1`,{replacements:{id},transaction});
          if(rows.length){referenced=true;break;}
        }
        if(referenced){preserved.push({model:name,id,reason:'Referenced by retained records'});continue;}
        await M[name].destroy({where:{id},transaction});deleted[name]++;
      }
    }
  });
  if(credentials.length) fs.writeFileSync(path.join(__dirname,'backups',`demonstration-logins-${Date.now()}.json`),JSON.stringify({note:'Demonstration assignments only. Change passwords before assigning to staff.',accounts:credentials},null,2),{mode:0o600});
  console.log('Minimal demonstration data:',JSON.stringify({deleted,preserved,credentialsCreated:credentials.length}));
  return {deleted,preserved};
}
module.exports={minimize,staff,keepCodes};
if(require.main===module)minimize(process.argv.includes('--apply')).catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.close());
