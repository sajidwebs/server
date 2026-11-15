// Source: PAMSForce_Seeding_Document.md, PRODUCT_MASTER_SPECIFICATION.md,
// PAMSForce_Master_Data_Segregation_Document.md and the portal workflow guide.
// Only prior seed-owned placeholders are renamed; unrelated client records are preserved.
const db = require('./config/database');

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

// Historical generated-record manifest, retained solely for precise cleanup.
// Do not recreate these records: company masters must come from the company.
module.exports = { headquarters };
if (require.main === module) {
  console.log('Regional demonstration expansion is disabled. Enter company-approved data through master screens.');
  db.close();
}
