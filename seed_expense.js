// Expense Master & User Role Seed Data
// Based on User Master and Expense Master document requirements
const { User, Role, Permission, RolePermission, ExpenseType, TravelMode, StandardFareChart, Expense, ExpenseAddition, Headquarter, Territory } = require('./models');
const { hashPassword } = require('./utils/password');

async function seedExpenseAndRoles() {
  try {
    console.log('🌱 Starting Expense Master & User Role seeding...\n');

    const hashedPassword = await hashPassword('admin123');

    // ==================== 1. ROLES (User Master) ====================
    console.log('👤 Creating roles...');
    const roles = await Role.bulkCreate([
      { role_name: 'Admin', short_name: 'Admin', description: 'Full system control', hierarchy_level: 10, status: 'active' },
      { role_name: 'HR', short_name: 'HR', description: 'Salary & employee management', hierarchy_level: 8, status: 'active' },
      { role_name: 'NSM', short_name: 'NSM', description: 'National Sales Manager', hierarchy_level: 6, status: 'active' },
      { role_name: 'RBM', short_name: 'RBM', description: 'Regional Business Manager', hierarchy_level: 4, status: 'active' },
      { role_name: 'ABM', short_name: 'ABM', description: 'Area Business Manager', hierarchy_level: 3, status: 'active' },
      { role_name: 'TBM', short_name: 'TBM', description: 'Territory Business Manager', hierarchy_level: 2, status: 'active' },
      { role_name: 'MR', short_name: 'MR', description: 'Medical Representative - Field user', hierarchy_level: 1, status: 'active' },
      { role_name: 'Billing User', short_name: 'Billing', description: 'Invoice handling', hierarchy_level: 2, status: 'active' }
    ]);
    console.log(`✅ Created ${roles.length} roles`);

    // ==================== 2. PERMISSIONS (RBAC) ====================
    console.log('🔐 Creating permissions...');
    const permissions = await Permission.bulkCreate([
      { module: 'Doctor Call', action: 'view', description: 'View doctor calls' },
      { module: 'Doctor Call', action: 'create', description: 'Create doctor calls' },
      { module: 'Expense Entry', action: 'view', description: 'View expense entries' },
      { module: 'Expense Entry', action: 'create', description: 'Create expense entries' },
      { module: 'Expense Approval', action: 'approve', description: 'Approve expenses' },
      { module: 'User Master', action: 'view', description: 'View users' },
      { module: 'User Master', action: 'create', description: 'Create users' },
      { module: 'Product Master', action: 'view', description: 'View products' },
      { module: 'Product Master', action: 'create', description: 'Create/edit products' },
      { module: 'Reports', action: 'view', description: 'View reports' },
      { module: 'Sales', action: 'view', description: 'View sales data' },
      { module: 'Sales', action: 'create', description: 'Create sales entries' },
      { module: 'Chemist Call', action: 'view', description: 'View chemist calls' },
      { module: 'Chemist Call', action: 'create', description: 'Create chemist calls' }
    ]);
    console.log(`✅ Created ${permissions.length} permissions`);

    // ==================== 3. ROLE-PERMISSION ASSIGNMENTS ====================
    console.log('🔗 Assigning role permissions...');
    // Admin gets all permissions
    const adminPerms = permissions.map(p => ({ role_id: roles[0].id, permission_id: p.id }));
    // MR gets: Doctor Call view/create, Expense view/create, Chemist view/create
    const mrPermIds = [1, 2, 3, 4, 12, 13].map(i => ({ role_id: roles[6].id, permission_id: permissions[i-1].id }));
    // ABM gets: all MR perms + Expense approval + Reports
    const abmPermIds = [1, 2, 3, 4, 5, 10, 11, 12, 13, 14].map(i => ({ role_id: roles[4].id, permission_id: permissions[i-1].id }));
    // RBM gets: all ABM perms + User view
    const rbmPermIds = [1, 2, 3, 4, 5, 6, 10, 11, 12, 13, 14].map(i => ({ role_id: roles[3].id, permission_id: permissions[i-1].id }));
    await RolePermission.bulkCreate([...adminPerms, ...mrPermIds, ...abmPermIds, ...rbmPermIds]);
    console.log('✅ Role permissions assigned');

    // ==================== 4. UPDATE USERS WITH ROLES ====================
    console.log('👥 Updating users with differentiated roles...');
    
    // Get HQ map
    const hqs = await Headquarter.findAll();
    const hqMap = {};
    hqs.forEach(hq => { hqMap[hq.name] = hq.id; });

    // Get territory map
    const territories = await Territory.findAll();

    // Update existing users with roles from User Master document
    const userUpdates = [
      { email: 'admin@pamsforce.com', role: 'admin', employeeType: 'Admin', employeeId: '001ADM', username: 'admin', mobileNumber: '9999999999', role_id: roles[0].id, hq_id: hqMap['Mumbai Head Office'] },
      { email: 'hussain.syed@company.com', role: 'admin', employeeType: 'Admin', employeeId: '001HSY', username: 'hussain', mobileNumber: '9876543210', role_id: roles[0].id, hq_id: hqMap['Mumbai Head Office'] },
      { email: 'rajesh.kumar@company.com', role: 'Area Manager', employeeType: 'ABM', employeeId: '001RJK', username: 'rajesh', mobileNumber: '9876543211', role_id: roles[4].id, hq_id: hqMap['Bhubaneswar'] },
      { email: 'priya.sharma@company.com', role: 'Regional Manager', employeeType: 'RBM', employeeId: '001PRS', username: 'priya', mobileNumber: '9876543212', role_id: roles[3].id, hq_id: hqMap['Delhi Central'] },
      { email: 'amit.patel@company.com', role: 'Field Representative', employeeType: 'MR', employeeId: '001AMP', username: 'amit', mobileNumber: '9876543213', role_id: roles[6].id, hq_id: hqMap['Bhubaneswar'] },
      { email: 'sneha.reddy@company.com', role: 'Field Representative', employeeType: 'MR', employeeId: '001SNR', username: 'sneha', mobileNumber: '9876543214', role_id: roles[6].id, hq_id: hqMap['Hyderabad Central'] }
    ];

    for (const update of userUpdates) {
      await User.update(
        { 
          role: update.role, 
          employeeType: update.employeeType, 
          employeeId: update.employeeId, 
          username: update.username, 
          mobileNumber: update.mobileNumber, 
          role_id: update.role_id, 
          hq_id: update.hq_id,
          fullName: update.email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ')
        },
        { where: { email: update.email } }
      );
    }
    console.log(`✅ Updated ${userUpdates.length} users with roles`);

    // Add more users with specific roles from the document
    const additionalUsers = await User.bulkCreate([
      { firstName: 'Ranjit', lastName: 'Malik', fullName: 'Ranjit Malik', username: 'ranjit', email: 'ranjit.malik@company.com', password: hashedPassword, mobileNumber: '9876543220', role: 'Area Manager', employeeType: 'ABM', employeeId: '001RNJ', role_id: roles[4].id, hq_id: hqMap['Bhubaneswar'] || 1, isActive: true },
      { firstName: 'Subham', lastName: 'Das', fullName: 'Subham Das', username: 'subham', email: 'subham.das@company.com', password: hashedPassword, mobileNumber: '9876543221', role: 'Field Representative', employeeType: 'MR', employeeId: '001SBD', role_id: roles[6].id, hq_id: hqMap['Bhubaneswar'] || 1, isActive: true },
      { firstName: 'Rajesh', lastName: 'Panda', fullName: 'Rajesh Panda', username: 'rajeshp', email: 'rajesh.panda@company.com', password: hashedPassword, mobileNumber: '9876543222', role: 'Field Representative', employeeType: 'MR', employeeId: '001RJP', role_id: roles[6].id, hq_id: hqMap['Cuttack'] || 1, isActive: true },
      { firstName: 'Amit', lastName: 'Sahoo', fullName: 'Amit Sahoo', username: 'amits', email: 'amit.sahoo@company.com', password: hashedPassword, mobileNumber: '9876543223', role: 'Field Representative', employeeType: 'MR', employeeId: '001AMS', role_id: roles[6].id, hq_id: hqMap['Mumbai Central'] || 1, isActive: true },
      { firstName: 'Kavita', lastName: 'Singh', fullName: 'Kavita Singh', username: 'kavita', email: 'kavita.singh@company.com', password: hashedPassword, mobileNumber: '9876543224', role: 'admin', employeeType: 'HR', employeeId: '001KVS', role_id: roles[1].id, hq_id: hqMap['Mumbai Head Office'] || 1, isActive: true },
      { firstName: 'Deepak', lastName: 'Sharma', fullName: 'Deepak Sharma', username: 'deepak', email: 'deepak.sharma@company.com', password: hashedPassword, mobileNumber: '9876543225', role: 'National Manager', employeeType: 'NSM', employeeId: '001DKS', role_id: roles[2].id, hq_id: hqMap['Mumbai Head Office'] || 1, isActive: true },
      { firstName: 'Vikram', lastName: 'Joshi', fullName: 'Vikram Joshi', username: 'vikram', email: 'vikram.joshi@company.com', password: hashedPassword, mobileNumber: '9876543226', role: 'user', employeeType: 'Billing User', employeeId: '001VKJ', role_id: roles[7].id, hq_id: hqMap['Mumbai Head Office'] || 1, isActive: true }
    ], { ignoreDuplicates: true });
    console.log(`✅ Created ${additionalUsers.length} additional users`);

    // Set reporting hierarchy
    const allUsers = await User.findAll();
    const userMap = {};
    allUsers.forEach(u => { userMap[u.username] = u.id; });

    // MRs report to ABMs, ABMs to RBMs, etc.
    await User.update({ reportingTo: userMap['rajesh'], assigned_manager_id: userMap['rajesh'] }, { where: { username: 'amit' } });
    await User.update({ reportingTo: userMap['rajesh'], assigned_manager_id: userMap['rajesh'] }, { where: { username: 'subham' } });
    await User.update({ reportingTo: userMap['rajesh'], assigned_manager_id: userMap['rajesh'] }, { where: { username: 'rajeshp' } });
    await User.update({ reportingTo: userMap['priya'], assigned_manager_id: userMap['priya'] }, { where: { username: 'rajesh' } });
    await User.update({ reportingTo: userMap['deepak'], assigned_manager_id: userMap['deepak'] }, { where: { username: 'priya' } });
    await User.update({ reportingTo: userMap['deepak'], assigned_manager_id: userMap['deepak'] }, { where: { username: 'rajesh' } });
    await User.update({ reportingTo: userMap['admin'], assigned_manager_id: userMap['admin'] }, { where: { username: 'deepak' } });
    console.log('✅ Reporting hierarchy set');

    // ==================== 5. EXPENSE TYPES (from document) ====================
    console.log('💰 Creating expense types...');
    const expenseTypes = await ExpenseType.bulkCreate([
      { expense_type: 'Daily Allowance', short_name: 'DA', description: 'Daily allowance for field work', status: 'active' },
      { expense_type: 'Travel Allowance', short_name: 'TA', description: 'Travel allowance based on distance', status: 'active' },
      { expense_type: 'Out-station Allowance', short_name: 'OA', description: 'Allowance for out-station travel', status: 'active' },
      { expense_type: 'Hill Station Allowance', short_name: 'HA', description: 'Additional allowance for hill station areas', status: 'active' },
      { expense_type: 'Meeting Allowance', short_name: 'MA', description: 'Allowance for attending meetings', status: 'active' },
      { expense_type: 'Mobile Allowance', short_name: 'MobA', description: 'Monthly mobile expense allowance', status: 'active' },
      { expense_type: 'Stationary Allowance', short_name: 'StnA', description: 'Monthly stationary expense allowance', status: 'active' },
      { expense_type: 'Accommodation', short_name: 'Accom', description: 'Hotel/lodging expense', status: 'active' },
      { expense_type: 'Miscellaneous', short_name: 'Misc', description: 'Other miscellaneous expenses', status: 'active' }
    ]);
    console.log(`✅ Created ${expenseTypes.length} expense types`);

    // ==================== 6. TRAVEL MODES (from document) ====================
    console.log('🚌 Creating travel modes...');
    const travelModes = await TravelMode.bulkCreate([
      { travel_type: 'Bus', short_name: 'BUS', description: 'Bus travel - show entry amount', requires_distance: false, status: 'active' },
      { travel_type: 'Train 3rd Class', short_name: 'Train', description: 'Train 3rd class ticket - show entry amount', requires_distance: false, status: 'active' },
      { travel_type: 'Own Vehicle', short_name: 'Own', description: 'Personal vehicle - calculate TA from distance and fare rate', requires_distance: true, status: 'active' },
      { travel_type: 'Auto', short_name: 'Auto', description: 'Auto rickshaw - show entry amount', requires_distance: false, status: 'active' },
      { travel_type: 'Taxi/Cab', short_name: 'Taxi', description: 'Taxi or cab - show entry amount', requires_distance: false, status: 'active' },
      { travel_type: 'Flight', short_name: 'Flight', description: 'Air travel - show entry amount', requires_distance: false, status: 'active' }
    ]);
    console.log(`✅ Created ${travelModes.length} travel modes`);

    // ==================== 7. STANDARD FARE CHART (from document mock data) ====================
    console.log('📊 Creating standard fare charts...');
    
    // Get user IDs for Ranjit Malik and Subham
    const ranjitUser = await User.findOne({ where: { username: 'ranjit' } });
    const subhamUser = await User.findOne({ where: { username: 'subham' } });

    const fareCharts = await StandardFareChart.bulkCreate([
      {
        employee_name: 'Ranjit Malik',
        employee_id: ranjitUser?.id,
        designation: 'ABM',
        hq_type: 'Metro',
        employee_status: 'Confirmed',
        da: 300.00,
        ex_allowance: 400.00,
        outstation_allowance: 600.00,
        hill_station_allowance: 0.00,
        meeting_allowance: 0.00,
        accommodation: 0.00,
        fare_per_km: 2.50,
        fare_0_to_70km: 2.00,
        fare_70_to_100km: 2.50,
        fare_above_100km: 3.00,
        mobile_allowance: 1000.00,
        stationary_allowance: 500.00,
        effective_from: '2026-03-01',
        is_active: true
      },
      {
        employee_name: 'Subham Das',
        employee_id: subhamUser?.id,
        designation: 'MR',
        hq_type: 'Non-Metro',
        employee_status: 'Probation',
        da: 250.00,
        ex_allowance: 300.00,
        outstation_allowance: 500.00,
        hill_station_allowance: 0.00,
        meeting_allowance: 0.00,
        accommodation: 0.00,
        fare_per_km: 2.00,
        fare_0_to_70km: 2.00,
        fare_70_to_100km: 2.50,
        fare_above_100km: 3.00,
        mobile_allowance: 500.00,
        stationary_allowance: 300.00,
        effective_from: '2026-03-01',
        is_active: true
      },
      {
        employee_name: 'Amit Patel',
        employee_id: allUsers.find(u => u.username === 'amit')?.id,
        designation: 'MR',
        hq_type: 'Non-Metro',
        employee_status: 'Confirmed',
        da: 275.00,
        ex_allowance: 350.00,
        outstation_allowance: 550.00,
        hill_station_allowance: 0.00,
        meeting_allowance: 100.00,
        accommodation: 0.00,
        fare_per_km: 2.00,
        fare_0_to_70km: 2.00,
        fare_70_to_100km: 2.50,
        fare_above_100km: 3.00,
        mobile_allowance: 500.00,
        stationary_allowance: 300.00,
        effective_from: '2026-03-01',
        is_active: true
      },
      {
        employee_name: 'Sneha Reddy',
        employee_id: allUsers.find(u => u.username === 'sneha')?.id,
        designation: 'MR',
        hq_type: 'Metro',
        employee_status: 'Confirmed',
        da: 300.00,
        ex_allowance: 400.00,
        outstation_allowance: 600.00,
        hill_station_allowance: 0.00,
        meeting_allowance: 0.00,
        accommodation: 0.00,
        fare_per_km: 2.50,
        fare_0_to_70km: 2.00,
        fare_70_to_100km: 2.50,
        fare_above_100km: 3.00,
        mobile_allowance: 1000.00,
        stationary_allowance: 500.00,
        effective_from: '2026-03-01',
        is_active: true
      }
    ]);
    console.log(`✅ Created ${fareCharts.length} fare charts`);

    // ==================== 8. SAMPLE EXPENSE ENTRIES (March 2026) ====================
    console.log('📝 Creating sample expense entries for March 2026...');
    
    const bbsrHq = hqs.find(h => h.code === 'BBSR');
    const bbsrTerritories = territories.filter(t => t.hq_id === bbsrHq?.id);

    const ranjitId = ranjitUser?.id;
    const subhamId = subhamUser?.id;
    const amitId = allUsers.find(u => u.username === 'amit')?.id;

    if (ranjitId && subhamId) {
      // Sample entries from the document: Ranjit Malik's March report
      const ranjitExpenses = await Expense.bulkCreate([
        { user_id: ranjitId, month: '03', year: '2026', date: '2026-03-01', working_status: 'Working', hq_id: bbsrHq?.id, territory_id: bbsrTerritories[0]?.id, doctor_calls: 11, chemist_calls: 6, business_amount: 1000.00, allowance: 300.00, from_place: 'BBSR', to_place: 'Khorda', travel_mode_id: travelModes[2].id, distance_km: 40.00, ta: 200.00, fare_chart_id: fareCharts[0].id, approval_status: 'submitted' },
        { user_id: ranjitId, month: '03', year: '2026', date: '2026-03-02', working_status: 'Working', hq_id: bbsrHq?.id, territory_id: bbsrTerritories[1]?.id, doctor_calls: 9, chemist_calls: 4, business_amount: 800.00, allowance: 300.00, from_place: 'BBSR', to_place: 'Cuttack', travel_mode_id: travelModes[2].id, distance_km: 28.00, ta: 56.00, fare_chart_id: fareCharts[0].id, approval_status: 'submitted' },
        { user_id: ranjitId, month: '03', year: '2026', date: '2026-03-03', working_status: 'Working', hq_id: bbsrHq?.id, territory_id: bbsrTerritories[0]?.id, doctor_calls: 12, chemist_calls: 5, business_amount: 1200.00, allowance: 300.00, from_place: 'BBSR', to_place: 'Puri', travel_mode_id: travelModes[2].id, distance_km: 62.00, ta: 124.00, fare_chart_id: fareCharts[0].id, approval_status: 'draft' },
        { user_id: ranjitId, month: '03', year: '2026', date: '2026-03-04', working_status: 'Leave', hq_id: bbsrHq?.id, doctor_calls: 0, chemist_calls: 0, business_amount: 0, allowance: 0, fare_chart_id: fareCharts[0].id, approval_status: 'draft' },
        { user_id: ranjitId, month: '03', year: '2026', date: '2026-03-05', working_status: 'Working', hq_id: bbsrHq?.id, territory_id: bbsrTerritories[2]?.id, doctor_calls: 8, chemist_calls: 3, business_amount: 600.00, allowance: 300.00, from_place: 'BBSR', to_place: 'Berhampur', travel_mode_id: travelModes[0].id, travel_entry_amount: 450.00, distance_km: 0, ta: 450.00, fare_chart_id: fareCharts[0].id, approval_status: 'draft' }
      ]);

      // Subham's entries (MR - lower DA rate)
      const subhamExpenses = await Expense.bulkCreate([
        { user_id: subhamId, month: '03', year: '2026', date: '2026-03-01', working_status: 'Working', hq_id: bbsrHq?.id, territory_id: bbsrTerritories[0]?.id, doctor_calls: 8, chemist_calls: 3, business_amount: 500.00, allowance: 250.00, from_place: 'BBSR', to_place: 'Nayapalli', travel_mode_id: travelModes[2].id, distance_km: 15.00, ta: 30.00, fare_chart_id: fareCharts[1].id, approval_status: 'submitted' },
        { user_id: subhamId, month: '03', year: '2026', date: '2026-03-02', working_status: 'Working', hq_id: bbsrHq?.id, territory_id: bbsrTerritories[1]?.id, doctor_calls: 10, chemist_calls: 5, business_amount: 750.00, allowance: 250.00, from_place: 'BBSR', to_place: 'Khorda', travel_mode_id: travelModes[2].id, distance_km: 25.00, ta: 50.00, fare_chart_id: fareCharts[1].id, approval_status: 'draft' },
        { user_id: subhamId, month: '03', year: '2026', date: '2026-03-03', working_status: 'Working', hq_id: bbsrHq?.id, territory_id: bbsrTerritories[0]?.id, doctor_calls: 7, chemist_calls: 2, business_amount: 400.00, allowance: 250.00, from_place: 'BBSR', to_place: 'Patia', travel_mode_id: travelModes[2].id, distance_km: 10.00, ta: 20.00, fare_chart_id: fareCharts[1].id, approval_status: 'draft' }
      ]);

      // Add some additions/deductions to Ranjit's first entry
      await ExpenseAddition.bulkCreate([
        { expense_id: ranjitExpenses[0].id, type: 'addition', amount: 50.00, reason: 'Extra field work - evening visit' },
        { expense_id: ranjitExpenses[0].id, type: 'deduction', amount: 25.00, reason: 'Late submission penalty' }
      ]);

      console.log(`✅ Created ${ranjitExpenses.length + subhamExpenses.length} expense entries with additions`);
    } else {
      console.log('⚠️  Could not find Ranjit/Subham users, skipping expense entries');
    }

    console.log('\n🎉 Expense Master & User Role seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('  Admin:    admin@pamsforce.com / admin123');
    console.log('  HR:       kavita.singh@company.com / admin123');
    console.log('  NSM:      deepak.sharma@company.com / admin123');
    console.log('  RBM:      priya.sharma@company.com / admin123');
    console.log('  ABM:      rajesh.kumar@company.com / admin123');
    console.log('  ABM:      ranjit.malik@company.com / admin123');
    console.log('  MR:       amit.patel@company.com / admin123');
    console.log('  MR:       subham.das@company.com / admin123');
    console.log('  MR:       sneha.reddy@company.com / admin123');
    console.log('  Billing:  vikram.joshi@company.com / admin123');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
}

module.exports = seedExpenseAndRoles;

// Run directly if called as main
if (require.main === module) {
  const db = require('./config/database');
  db.authenticate()
    .then(() => seedExpenseAndRoles())
    .then(() => { console.log('Done!'); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
}
