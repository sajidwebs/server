const assert=require('node:assert/strict');
const express=require('express');
const db=require('./config/database');
const M=require('./models');
const {generateToken}=require('./utils/jwt');
const sync=require('./sync-department-masters');
async function main(){
  assert.ok(['localhost','127.0.0.1'].includes(db.config.host));
  assert.match(db.config.database,/test|crud/i);
  const admin=await M.User.findOne({where:{role:'admin'}});
  const token=generateToken({id:admin.id,email:admin.email});
  const app=express(); app.use(express.json());
  app.use('/setup',require('./routes/systemSetup.routes'));
  app.use('/products',require('./routes/product.routes'));
  app.use('/sales',require('./routes/sales.routes'));
  app.use('/approvals',require('./routes/approvals'));
  const server=app.listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const request=async(url,method='GET',body)=>{
    const response=await fetch(base+url,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    const data=await response.json(); assert.ok(response.ok,JSON.stringify(data)); return data;
  };
  let product, automatic, authored, fieldUser, approval;
  try{
    const before=[await M.CallAverageSetup.count(),await M.CoverageSetup.count()];
    await request('/setup/call-average'); await request('/setup/coverage');
    assert.deepEqual([await M.CallAverageSetup.count(),await M.CoverageSetup.count()],before,'GET must not create policies');
    automatic=await M.CallAverageSetup.create({designation:'MR',min_field_working_days:20,daily_calls:11,doctor_calls:8,chemist_calls:3,monthly_calls:220,quarterly_calls:660,yearly_calls:2640,warning_threshold:90,alert_threshold:70,effective_from:'2026-01-01',created_by:null});
    authored=await M.CallAverageSetup.create({designation:'MR',daily_calls:15,effective_from:'2026-01-01',created_by:admin.id});
    await sync(); await automatic.reload(); await authored.reload();
    assert.equal(automatic.isActive,false); assert.equal(authored.isActive,true);
    const created=await request('/products','POST',{name:'Document verification local only',code:`LOCAL-DOC-${Date.now()}`,gstRate:0});
    product=created.product; assert.equal(Number(product.gstRate),0); assert.equal(product.schedule,null);
    await request(`/products/${product.id}`,'PUT',{mrp:125});
    const history=await request(`/products/${product.id}/price-history`);
    assert.ok(history.priceHistory.some(row=>Number(row.mrp)===125));
    await request('/sales/reports');
    const fy='2098-2099';
    for(const value of [10,20]) await db.query('INSERT INTO sales_targets (product_id,financial_year,month,target_value,user_id,created_by) VALUES (:p,:fy,4,:v,:u,:u)',{replacements:{p:product.id,fy,v:value,u:admin.id}});
    await db.query('INSERT INTO sales_targets (product_id,financial_year,month,target_value,user_id,created_by) VALUES (:p,:fy,5,50,:u,:u)',{replacements:{p:product.id,fy,u:admin.id}});
    for(const value of [3,4]) await db.query('INSERT INTO sales_projection_entries (product_id,financial_year,month,projection_value,user_id,created_by) VALUES (:p,:fy,4,:v,:u,:u)',{replacements:{p:product.id,fy,v:value,u:admin.id}});
    for(const value of [4,5]) await db.query('INSERT INTO secondary_sales (product_id,financial_year,month,sale_value,user_id,created_by) VALUES (:p,:fy,4,:v,:u,:u)',{replacements:{p:product.id,fy,v:value,u:admin.id}});
    const query=`financial_year=${fy}&month=4&product_id=${product.id}`;
    const report=await request(`/sales/reports?${query}`);
    assert.equal(report.report[0].target_value,30); assert.equal(report.report[0].projection_value,7); assert.equal(report.report[0].achieved_value,9);
    const dashboard=await request(`/sales/dashboard?${query}`); assert.equal(dashboard.summary.target,30);assert.equal(dashboard.summary.achievementPercent,30);
    const annual=await request(`/sales/reports?financial_year=${fy}&month=all&product_id=${product.id}`);assert.equal(annual.report[0].target_value,80);
    fieldUser=await M.User.create({firstName:'Local',lastName:'Verification',email:`local-doc-${Date.now()}@example.invalid`,password:'Local-only-verification-739',role:'user',isActive:true});
    const fieldToken=generateToken({id:fieldUser.id,email:fieldUser.email});
    const peer=await fetch(`${base}/sales/reports?${query}&user_id=${admin.id}`,{headers:{Authorization:`Bearer ${fieldToken}`}});
    assert.equal(peer.status,200); const peerData=await peer.json();assert.equal(peerData.report[0].target_value,0);
    console.log('PASS: sales totals do not multiply across rows; month/year filters and dashboard agree; a field user cannot see another user sales totals.');
    await fieldUser.update({role:'National Manager'});
    const doctor=await M.Doctor.findOne();
    approval=await M.ApprovalQueue.create({entity_type:'doctor',entity_id:doctor.id,submitted_by:admin.id,submitted_by_role:'TBM',action_type:'create',current_level:4,status:'pending'});
    const approved=await fetch(`${base}/approvals/${approval.id}/approve`,{method:'POST',headers:{Authorization:`Bearer ${fieldToken}`,'Content-Type':'application/json'},body:'{}'});
    const approvalResult=await approved.json();assert.equal(approved.status,200,JSON.stringify(approvalResult));assert.equal(approvalResult.status,'approved');
    console.log('PASS: full designation names are recognized and National Manager approval completes the final level.');
    console.log('PASS: reads do not seed; only untouched automatic policies retire; user policies survive; zero GST preserved; no invented schedule; price history returns recorded changes.');
  }finally{
    if(product){
      for(const table of ['sales_targets','sales_projection_entries','secondary_sales']) await db.query(`DELETE FROM ${table} WHERE product_id=:id`,{replacements:{id:product.id}});
      await M.ProductPriceHistory.destroy({where:{product_id:product.id}});await M.Product.destroy({where:{id:product.id}})
    }
    if(approval){await M.ApprovalHistory.destroy({where:{approval_queue_id:approval.id}});await approval.destroy()}
    if(fieldUser)await fieldUser.destroy();
    if(automatic)await automatic.destroy();if(authored)await authored.destroy();
    await new Promise(r=>server.close(r));
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.close());
