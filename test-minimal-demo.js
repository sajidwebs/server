const assert=require('node:assert/strict');const db=require('./config/database');const M=require('./models');const {minimize,staff}=require('./minimize-demo-data');
(async()=>{
if(process.env.DB_HOST!=='127.0.0.1'||!process.env.DB_NAME?.includes('test'))throw Error('Isolated test database required');
const old='2026-11-15T08:00:00Z';
for(const [code,name] of [['BBSR','Bhubaneswar'],['KOL-CEN','Kolkata Central'],['DEL-CEN','Delhi Central']])await M.Headquarter.findOrCreate({where:{code},defaults:{name,type:'Regional Office',state:'Odisha'}});
for(const [username] of staff)await M.User.findOrCreate({where:{username},defaults:{firstName:username.split('.')[0],lastName:username.split('.')[1],email:username+'@pamsforce.com',password:'unused-test-password',isActive:false}});
const h=await M.Headquarter.findOne({where:{code:'BBSR'}});
await db.query(`UPDATE headquarters SET name='Bhubaneswar', "updatedAt"=:old WHERE id=:id`,{replacements:{old,id:h.id}});
await M.Patch.destroy({where:{patch_name:'Patia Route'}});const p=await M.Patch.create({patch_name:'Patia Route',state:'Odisha',hq_id:h.id});await p.update({updatedAt:old},{silent:true});
await db.query('UPDATE patches SET updated_at=:old WHERE id=:id',{replacements:{old,id:p.id}});
await minimize(true);assert.equal(await M.Patch.findByPk(p.id),null);
for(const [username,role,designation,manager] of staff){const u=await M.User.findOne({where:{username}});assert.equal(u.role,role);assert.equal(u.employeeType,designation);assert.equal(u.isActive,true);if(manager)assert.equal(u.reportingTo,(await M.User.findOne({where:{username:manager}})).id);}
const customer=await M.Patch.create({patch_name:'Company approved route',state:'Odisha',hq_id:h.id});await minimize(true);assert.ok(await M.Patch.findByPk(customer.id));await customer.destroy();console.log('PASS: generated patch removed; company record preserved; four distinct roles and reporting chain configured.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.close());

