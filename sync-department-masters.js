// Explicit import of named master values; never imports example people, rates or transactions.
const fs = require('node:fs');
const path = require('node:path');
const db = require('./config/database');
const M = require('./models');
const plan = {
  DoctorClass: [['Regular Prescriber','RP'],['Irregular Prescriber','IRP']],
  DoctorCategory: [['Core','CORE'],['A','A'],['B','B'],['C','C'],['Sampark Doctor','SAMP'],['Group B','GRPB']],
  DoctorSpecialty: [['General Surgeon','GS'],['Orthopedic','ORTH'],['Medicine','MED'],['Cardiologist','CARD'],['Gynecologist','GYN']],
  InputType: [['Promotional','PROMO'],['Sample','SAMPLE'],['Gift','GIFT'],['Digital','DIGITAL']],
  ExpenseType: [['Daily Allowance','DA'],['Travel Allowance','TA']]
};
const fields = {DoctorClass:'class_name',DoctorCategory:'category_name',DoctorSpecialty:'specialty_name',InputType:'type_name',ExpenseType:'expense_type'};
async function syncDepartmentMasters() {
  const names = [...Object.keys(plan),'InputMaster','CallAverageSetup','CoverageSetup'];
  const snapshot = {};
  for(const name of names) snapshot[name]=await M[name].findAll({raw:true});
  const dir=path.join(__dirname,'backups'); fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,`before-department-import-${Date.now()}.json`),JSON.stringify(snapshot,null,2));
  const result={created:[],retiredAutomaticPolicies:[]};
  await db.transaction(async transaction=>{
    await db.query('SELECT pg_advisory_xact_lock(724631904)',{transaction});
    const admin=await M.User.findOne({where:{role:'admin',isActive:true},transaction});
    if(!admin) throw new Error('An active administrator is required');
    for(const [model,rows] of Object.entries(plan)) for(const [name,short] of rows) {
      // Equivalent clinical terms must not create duplicate specialty choices.
      const aliases={Orthopedic:'Orthopedics',Medicine:'General Medicine',Cardiologist:'Cardiology',Gynecologist:'Gynecology'};
      if(model==='DoctorSpecialty' && await M[model].findOne({where:{[fields[model]]:aliases[name]||name},transaction})) continue;
      const [,created]=await M[model].findOrCreate({where:{[fields[model]]:name},defaults:{short_name:short,created_by:admin.id},transaction});
      if(created) result.created.push(`${model}: ${name}`);
    }
    const type=await M.InputType.findOne({where:{type_name:'Promotional'},transaction});
    for(const [name,short] of [['Visual Aid','VA'],['Leave Behind Literature','LBL'],['Reminder Card','RC'],['Product Brochure','BROCHURE']]) {
      const [,created]=await M.InputMaster.findOrCreate({where:{input_name:name},defaults:{short_name:short,input_type_id:type.id,created_by:admin.id},transaction});
      if(created) result.created.push(`InputMaster: ${name}`);
    }
    // Only untouched rows produced by the removed GET seed qualify. Preserve admin-authored policies.
    const callDefaults={MR:[20,11,8,3],TBM:[18,10,7,3],ABM:[15,8,5,3],RBM:[12,6,4,2],ZBM:[10,5,3,2],NSM:[8,4,2,2]};
    for(const name of ['CallAverageSetup','CoverageSetup']) for(const row of await M[name].findAll({transaction})) {
      const raw=row.get({plain:true});
      if(raw.created_by!==null || raw.effective_from!=='2026-01-01' || raw.effective_to!==null || !raw.isActive) continue;
      if(+new Date(raw.created_at)!==+new Date(raw.updated_at)) continue;
      let matches=false;
      if(name==='CallAverageSetup') {
        const v=callDefaults[raw.designation];
        matches=!!v && ['min_field_working_days','daily_calls','doctor_calls','chemist_calls'].every((k,i)=>Number(raw[k])===v[i]) && Number(raw.monthly_calls)===v[0]*v[1] && Number(raw.quarterly_calls)===v[0]*v[1]*3 && Number(raw.yearly_calls)===v[0]*v[1]*12 && Number(raw.warning_threshold)===90 && Number(raw.alert_threshold)===70;
      } else {
        const doctor=raw.entity_type==='Doctor', chemist=raw.entity_type==='Chemist';
        matches=!!callDefaults[raw.designation] && (doctor||chemist) && raw.doctor_list_type===(doctor?'Core':null) && Number(raw.monthly_coverage)===(doctor?90:100) && Number(raw.quarterly_coverage)===100 && Number(raw.yearly_coverage)===100 && Number(raw.warning_level)===(doctor?90:100) && Number(raw.alert_level)===(doctor?70:90) && raw.warning_color==='warning' && raw.alert_color==='danger';
      }
      if(matches) { await row.update({isActive:false},{transaction}); result.retiredAutomaticPolicies.push(`${name}:${row.id}`); }
    }
  });
  console.log('Department master import:',JSON.stringify(result));
  return result;
}
module.exports=syncDepartmentMasters;
if(require.main===module) {
  if(!process.argv.includes('--apply')) console.log('Preview:',JSON.stringify(plan),'plus four promotional input names; retire only untouched automatic example policies. Pass --apply.');
  else syncDepartmentMasters().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.close());
}
