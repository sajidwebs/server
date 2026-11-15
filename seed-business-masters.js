// Source: PAMSForce_Seeding_Document.md, PRODUCT_MASTER_SPECIFICATION.md,
// PAMSForce_Master_Data_Segregation_Document.md and the portal workflow guide.
// Only prior seed-owned placeholders are renamed; unrelated client records are preserved.
const db = require('./config/database');
const M = require('./models');

const headquarters = [
  ['OD-BBS', 'BBSR', 'Bhubaneswar', 'Odisha', 'Khordha', 'EAST', 'Regional Office', 'Prafulla Das', 'MARKET_EXP', [
    ['BBSR-CEN', 'Bhubaneswar Central', 'Saheed Nagar', 'Sambit', 'Patnaik'],
    ['BBSR-EST', 'Bhubaneswar East', 'Patia', 'Subhasis', 'Mishra'],
    ['BBSR-WST', 'Bhubaneswar West', 'Nayapalli', 'Pratibha', 'Mohanty']]],
  ['OD-CTC', 'CTC', 'Cuttack', 'Odisha', 'Cuttack', 'EAST', 'Branch Office', 'Sagar Das', 'COVERAGE', [
    ['CTC-CIT', 'Cuttack City', 'Badambadi', 'Sasmita', 'Das'],
    ['CTC-NOR', 'Cuttack North', 'College Square', 'Debasis', 'Sahoo']]],
  ['WB-KOL', 'KOL-CEN', 'Kolkata Central', 'West Bengal', 'Kolkata', 'EAST', 'Regional Office', 'Subrata Ghosh', 'MARKET_EXP', [
    ['KOL-CEN-A', 'Kolkata Central Zone A', 'Bhowanipore', 'Anirban', 'Chatterjee'],
    ['KOL-CEN-B', 'Kolkata Central Zone B', 'Gariahat', 'Madhumita', 'Sen']]],
  ['WB-DGP', 'KOL-EST', 'Kolkata East', 'West Bengal', 'Kolkata', 'EAST', 'Branch Office', 'Dulal Mondal', 'COVERAGE', [
    ['KOL-EST-A', 'Kolkata East Zone A', 'Salt Lake', 'Sayan', 'Banerjee'],
    ['KOL-EST-B', 'Kolkata East Zone B', 'Kankurgachi', 'Ishita', 'Basu']]],
  [null, 'KOL-WST', 'Kolkata West', 'West Bengal', 'Kolkata', 'EAST', 'Branch Office', 'Arup Sarkar', 'COVERAGE', [
    ['KOL-WST-A', 'Kolkata West Zone A', 'Shyambazar', 'Arindam', 'Roy']]],
  ['DL-ND', 'DEL-CEN', 'Delhi Central', 'Delhi', 'New Delhi', 'NORTH', 'Regional Office', 'Rajesh Kumar', 'MARKET_EXP', [
    ['DEL-CEN-A', 'Delhi Central Zone A', 'Connaught Place', 'Aarav', 'Sharma'],
    ['DEL-CEN-B', 'Delhi Central Zone B', 'Chanakyapuri', 'Neha', 'Malhotra']]],
  [null, 'DEL-EST', 'Delhi East', 'Delhi', 'East Delhi', 'NORTH', 'Branch Office', 'Priya Sharma', 'COVERAGE', [
    ['DEL-EST-A', 'Delhi East Zone A', 'Preet Vihar', 'Rajat', 'Gupta'],
    ['DEL-EST-B', 'Delhi East Zone B', 'Mayur Vihar', 'Ritu', 'Saxena']]],
  ['DL-DWK', 'DEL-WST', 'Delhi West', 'Delhi', 'West Delhi', 'NORTH', 'Branch Office', 'Amit Singh', 'COVERAGE', [
    ['DEL-WST-A', 'Delhi West Zone A', 'Janakpuri', 'Vivek', 'Kapoor'],
    ['DEL-WST-B', 'Delhi West Zone B', 'Rajouri Garden', 'Kavita', 'Bhatia']]]
];

async function main() {
  if (!process.argv.includes('--apply')) {
    console.log('Document-aligned master plan:', headquarters.map(row => `${row[1]}: ${row[2]}`).join(', '));
    console.log('Pass --apply to create masters and rename prior seed placeholders.');
    return;
  }
  const changes = { created: {}, renamed: {} };
  await db.transaction(async transaction => {
    await db.query('SELECT pg_advisory_xact_lock(724631902)', { transaction });
    const admin = await M.User.findOne({ where: { role: 'admin', isActive: true }, transaction });
    if (!admin) throw new Error('An active administrator is required.');
    const owner = { created_by: admin.id };
    const ensure = async (modelName, where, values = {}, legacyWhere) => {
      const model = M[modelName];
      const existing = await model.findOne({ where, transaction });
      const legacy = legacyWhere ? await model.findOne({ where: legacyWhere, transaction }) : null;
      if (existing && legacy && existing.id !== legacy.id) {
        throw new Error(`Both canonical and legacy ${modelName} exist. Review references before merging.`);
      }
      if (legacy) {
        await legacy.update({ ...values, ...where }, { transaction });
        changes.renamed[modelName] = (changes.renamed[modelName] || 0) + 1;
        return legacy;
      }
      if (existing) return existing;
      const row = await model.create({ ...owner, ...values, ...where }, { transaction });
      changes.created[modelName] = (changes.created[modelName] || 0) + 1;
      return row;
    };

    const classes = [];
    for (const [name, short] of [['Class A', 'A'], ['Class B', 'B'], ['Class C', 'C'], ['Regular Prescriber', 'RP']]) {
      classes.push(await ensure('DoctorClass', { class_name: name }, { short_name: short }, name === 'Class C' ? { class_name: 'Sample Regular' } : null));
    }
    const categories = [];
    for (const [name, short] of [['Consultant', 'CONS'], ['General Practitioner', 'GP'], ['Specialist', 'SPEC'], ['Sampark Doctor', 'SAMP']]) {
      categories.push(await ensure('DoctorCategory', { category_name: name }, { short_name: short }, name === 'General Practitioner' ? { category_name: 'Sample Clinic' } : null));
    }
    const specialties = [];
    for (const [name, short] of [['General Medicine', 'GENMED'], ['Cardiology', 'CARD'], ['Orthopedics', 'ORTH'], ['Pediatrics', 'PED'], ['Gynecology', 'GYNO'], ['Dermatology', 'DERM'], ['Neurology', 'NEURO'], ['Gastroenterology', 'GI']]) {
      specialties.push(await ensure('DoctorSpecialty', { specialty_name: name }, { short_name: short }));
    }
    const qualifications = [];
    for (const name of ['MBBS', 'MD', 'MS', 'DM', 'MCh', 'DNB', 'Diploma']) {
      qualifications.push(await ensure('DoctorQualification', { qualification_name: name }, { short_name: name === 'Diploma' ? 'Dip' : name }));
    }
    // Product masters come exclusively from the official company catalogue.
    for (const [oldKey, code, name, state, district, zone, type, manager, reason, routes] of headquarters) {
      const region = zone === 'EAST' ? 'East Region' : 'North Region';
      const city = code.startsWith('KOL') ? 'Kolkata' : code === 'DEL-CEN' ? 'New Delhi' : code.startsWith('DEL') ? 'Delhi' : name;
      const hq = await ensure('Headquarter', { code }, {
        name, state, stateType: state === 'Delhi' ? 'Union Territory' : 'State', zone,
        region, type, manager, reason, city, address: `${name}, ${state}`, createdBy: admin.id
      }, oldKey ? { code: `SAMPLE-${oldKey}` } : null);
      for (const [index, [routeCode, routeName, area, firstName, lastName]] of routes.entries()) {
        const oldSuffix = oldKey && index < 2 ? `${oldKey}-${index + 1}` : null;
        const territory = await ensure('Territory', { code: routeCode }, {
          name: routeName, hq_id: hq.id, state, stateType: hq.stateType, zone, region, district,
          description: `Coverage route for ${area}, ${city}`, createdBy: admin.id
        }, oldSuffix ? { code: `SAMPLE-${oldSuffix}` } : null);
        const legacyPatch = oldSuffix ? await M.Patch.findOne({ where: { hq_id: hq.id, patch_name: { [require('sequelize').Op.like]: '% Sample Patch' } }, order: [['id', 'ASC']], transaction }) : null;
        const patch = await ensure('Patch', { patch_name: `${area} Route`, hq_id: hq.id }, { state }, legacyPatch ? { id: legacyPatch.id } : null);
        await ensure('PatchHeadquarter', { patch_id: patch.id, hq_id: hq.id });
        const emailKey = `${firstName}.${lastName}.${routeCode}`.toLowerCase();
        const doctor = await ensure('Doctor', { email: `${emailKey}@pamsforce.com` }, {
          firstName, lastName, hq_id: hq.id, territory_id: territory.id, patch_id: patch.id, state,
          class_id: classes[index % 3].id, category_id: categories[index % 3].id,
          specialty_id: specialties[index % 2].id, specialty: specialties[index % 2].specialty_name,
          qualification_id: qualifications[index % 2].id, registration_number: null,
          full_address: `${area}, ${city}, ${state}`, address: `${area}, ${city}, ${state}`,
          location: area, visit_time: '10:00-13:00', visit_day: index % 2 ? 'Thursday' : 'Monday',
          patients_per_week: 60, approval_status: 'approved', current_approval_level: 0
        }, oldSuffix ? { registration_number: `SAMPLE-DR-${oldSuffix}` } : null);
        await ensure('Chemist', { email: `pharmacy.${routeCode.toLowerCase()}@pamsforce.com` }, {
          name: `${area} Medical Hall`, location: area, owner_name: `${firstName} ${lastName}`,
          address: `${area}, ${city}, ${state}`, hq_id: hq.id, territory_id: territory.id,
          patch_id: patch.id, state, dl_number: null, createdBy: admin.id
        }, oldSuffix ? { email: `sample.chemist.${oldSuffix.toLowerCase()}@example.invalid` } : null);
        await ensure('SVL', { doctor_id: doctor.id, hq_id: hq.id }, { visit_frequency: 'Monthly', priority: index + 1, year: 2026 });
      }
      const territory = await M.Territory.findOne({ where: { code: routes[0][0] }, transaction });
      const links = { hq_id: hq.id, territory_id: territory.id, state, contact_person: manager, address: `${name}, ${state}` };
      const oldCity = oldKey === 'WB-DGP' ? 'Durgapur' : oldKey === 'DL-DWK' ? 'Dwarka' : oldKey === 'WB-KOL' ? 'Kolkata' : city;
      await ensure('Stockist', { stockist_name: `${name} Pharma Distributors` }, links, oldKey ? { stockist_name: `${oldCity} Sample Distributors` } : null);
      await ensure('Hospital', { hospital_name: `${name} Health Centre` }, links, oldKey ? { hospital_name: `${oldCity} Sample Health Centre` } : null);
      // Keep previously seeded staff inactive; no invented credentials or account activation.
      if (oldKey) {
        const user = await M.User.findOne({ where: { email: `sample.rep.${oldKey.toLowerCase()}@example.invalid` }, transaction });
        if (user) {
          await user.update({ email: `${user.firstName}.${user.lastName}@pamsforce.com`.toLowerCase(),
            username: `${user.firstName}.${user.lastName}`.toLowerCase(), employeeId: `MR-${code}`,
            hq_id: hq.id, territory_id: territory.id }, { transaction });
          changes.renamed.User = (changes.renamed.User || 0) + 1;
        }
      }
    }
  });
  await require('./sync-company-catalog')();
  console.log('Document-aligned master data committed:', JSON.stringify(changes));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.close());
