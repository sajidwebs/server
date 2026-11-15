const assert=require('node:assert/strict');
const db=require('./config/database');
const M=require('./models');
const catalog=require('./sync-company-catalog');
const organization=require('./sync-organization-masters');
async function main(){
  assert.ok(['localhost','127.0.0.1'].includes(db.config.host));assert.match(db.config.database,/test|crud/i);
  await catalog();await organization();
  assert.equal(await M.Division.count({where:{code:'PAMSFORCE'}}),0);
  const divisions=await M.Division.findAll({where:{status:'active'},raw:true});
  assert.ok(divisions.some(d=>d.division_name==='Task force'));assert.ok(divisions.some(d=>d.division_name==='General'));
  const osteo=await M.Product.findOne({where:{name:'OSTEOSWIFT'}});
  const original=osteo.division_id;
  const general=divisions.find(d=>d.division_name==='General');
  await osteo.update({division_id:general.id});
  try {await catalog();await osteo.reload();assert.equal(osteo.division_id,general.id,'A manual division assignment must survive repeat imports')}
  finally {await osteo.update({division_id:original})}
  const repeated=await organization();assert.equal(repeated.userCreated,false);
  const ranjit=await M.User.findOne({where:{email:'ranjit.malik@pamsforce.com'}});
  assert.equal(ranjit.firstName,'Ranjit');assert.equal(ranjit.lastName,'Malik');assert.equal(ranjit.employeeType,null);assert.equal(ranjit.role,'user');assert.equal(ranjit.isActive,false);
  assert.equal(await M.User.count({where:{username:'ranjit.malik'}}),1);
  console.log('PASS: documented divisions replace Pamsforce, manual allocations survive repeat sync, Ranjit is unique with no designation or elevated role, and organization import is repeatable.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.close());
