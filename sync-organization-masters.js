const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Op } = require('sequelize');
const db = require('./config/database');
const M = require('./models');
const { hashPassword } = require('./utils/password');

async function syncOrganizationMasters() {
  const snapshot = {};
  for(const name of ['Headquarter','Territory','Patch','PatchHeadquarter']) snapshot[name]=await M[name].findAll({raw:true});
  const dir=path.join(__dirname,'backups');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,`before-organization-masters-${Date.now()}.json`),JSON.stringify(snapshot,null,2));
  const result={userCreated:false,territoriesUpdated:[],patchMappingsCreated:[],headquarters:snapshot.Headquarter.length,territories:snapshot.Territory.length,patches:snapshot.Patch.length};
  await db.transaction(async transaction=>{
    await db.query('SELECT pg_advisory_xact_lock(724631905)',{transaction});
    const matches=await M.User.findAll({where:{[Op.or]:[{email:'ranjit.malik@pamsforce.com'},{username:'ranjit.malik'},{firstName:'Ranjit',lastName:'Malik'}]},transaction});
    if(matches.length>1)throw new Error('Multiple Ranjit Malik accounts match; reconcile identities before importing.');
    if(!matches.length){
      await M.User.create({firstName:'Ranjit',lastName:'Malik',fullName:'Ranjit Malik',username:'ranjit.malik',email:'ranjit.malik@pamsforce.com',role:'user',employeeType:null,role_id:null,hq_id:null,territory_id:null,isActive:false,password:await hashPassword(crypto.randomBytes(32).toString('hex'))},{transaction});
      result.userCreated=true;
    }
    const hqs=new Map(snapshot.Headquarter.map(hq=>[hq.id,hq]));
    for(const territory of await M.Territory.findAll({transaction})){
      const hq=hqs.get(territory.hq_id);if(!hq)continue;
      const changes={};
      for(const field of ['zone','state','stateType','region','district']) if(!territory[field]&&hq[field])changes[field]=hq[field];
      if(Object.keys(changes).length){await territory.update(changes,{transaction});result.territoriesUpdated.push(territory.code)}
    }
    for(const patch of snapshot.Patch){
      if(!patch.isActive||!patch.hq_id||!hqs.get(patch.hq_id)?.isActive)continue;
      const [,created]=await M.PatchHeadquarter.findOrCreate({where:{patch_id:patch.id,hq_id:patch.hq_id},defaults:{isActive:true,created_by:patch.created_by},transaction});
      if(created)result.patchMappingsCreated.push(patch.patch_name);
    }
  });
  console.log('Organization masters synchronized:',JSON.stringify(result));return result;
}
module.exports=syncOrganizationMasters;
if(require.main===module){
  if(!process.argv.includes('--apply'))console.log('Add Ranjit Malik if absent (designation unassigned, inactive pending account setup); fill missing territory geography from its assigned HQ; restore missing primary patch/HQ mappings. Pass --apply.');
  else syncOrganizationMasters().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.close());
}
