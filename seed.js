const { User, Doctor, Chemist, Activity, Sale, DayCall, Projection, Business, Notification, Territory, Product, Headquarter, DoctorClass, DoctorCategory, DoctorSpecialty, DoctorQualification } = require('./models');
const { hashPassword } = require('./utils/password');
const sequelize = require('./config/database');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync all models to create tables
    console.log('🗄️ Creating tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Tables created successfully!');
    console.log('🧹 Clearing existing data...');
    await Notification.destroy({ where: {} });
    await Business.destroy({ where: {} });
    await Projection.destroy({ where: {} });
    await DayCall.destroy({ where: {} });
    await Sale.destroy({ where: {} });
    await Activity.destroy({ where: {} });
    await Chemist.destroy({ where: {} });
    await Doctor.destroy({ where: {} });
    await Territory.destroy({ where: {} });
    await Headquarter.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await User.destroy({ where: {} });
    
    // Clear new master data tables
    await DoctorQualification.destroy({ where: {} });
    await DoctorSpecialty.destroy({ where: {} });
    await DoctorCategory.destroy({ where: {} });
    await DoctorClass.destroy({ where: {} });

    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await hashPassword('admin123');
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@pamsforce.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    // Create field representatives
    console.log('👥 Creating field representatives...');
    const fieldReps = await User.bulkCreate([
      {
        firstName: 'Hussain',
        lastName: 'Syed',
        email: 'hussain.syed@company.com',
        password: hashedPassword,
        role: 'user',
        isActive: true
      },
      {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh.kumar@company.com',
        password: hashedPassword,
        role: 'user',
        isActive: true
      },
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@company.com',
        password: hashedPassword,
        role: 'user',
        isActive: true
      },
      {
        firstName: 'Amit',
        lastName: 'Patel',
        email: 'amit.patel@company.com',
        password: hashedPassword,
        role: 'user',
        isActive: true
      },
      {
        firstName: 'Sneha',
        lastName: 'Reddy',
        email: 'sneha.reddy@company.com',
        password: hashedPassword,
        role: 'user',
        isActive: true
      }
    ]);

    // Seed Doctor Classes (Dynamic Data) - MUST BE BEFORE DOCTORS
    console.log('🏷️ Creating doctor classes...');
    const doctorClasses = await DoctorClass.bulkCreate([
      { category_name: 'Regular Prescriber', short_name: 'RP', status: 'active', created_by: adminUser.id },
      { category_name: 'Irregular Prescriber', short_name: 'IRP', status: 'active', created_by: adminUser.id },
      { category_name: 'High Value Prescriber', short_name: 'HVP', status: 'active', created_by: adminUser.id },
      { category_name: 'Low Value Prescriber', short_name: 'LVP', status: 'active', created_by: adminUser.id },
      { category_name: 'Occasional Prescriber', short_name: 'OP', status: 'active', created_by: adminUser.id }
    ]);

    // Seed Doctor Categories (Variable Data) - MUST BE BEFORE DOCTORS
    console.log('📋 Creating doctor categories...');
    const doctorCategories = await DoctorCategory.bulkCreate([
      { category_name: 'Core Doctor', short_name: 'CORE', status: 'active', created_by: adminUser.id },
      { category_name: 'Category A', short_name: 'A', status: 'active', created_by: adminUser.id },
      { category_name: 'Category B', short_name: 'B', status: 'active', created_by: adminUser.id },
      { category_name: 'Category C', short_name: 'C', status: 'active', created_by: adminUser.id },
      { category_name: 'Sampark Doctor', short_name: 'SAMP', status: 'active', created_by: adminUser.id },
      { category_name: 'Group B Doctor', short_name: 'GRP-B', status: 'active', created_by: adminUser.id }
    ]);

    // Seed Doctor Specialties (Constant Data) - MUST BE BEFORE DOCTORS
    console.log('🩺 Creating doctor specialties...');
    const doctorSpecialties = await DoctorSpecialty.bulkCreate([
      { specialty_name: 'General Physician', short_name: 'GP', status: 'active', created_by: adminUser.id },
      { specialty_name: 'Cardiologist', short_name: 'CARD', status: 'active', created_by: adminUser.id },
      { specialty_name: 'Neurologist', short_name: 'NEURO', status: 'active', created_by: adminUser.id },
      { specialty_name: 'Orthopedic', short_name: 'ORTH', status: 'active', created_by: adminUser.id },
      { specialty_name: 'General Surgeon', short_name: 'GS', status: 'active', created_by: adminUser.id },
      { specialty_name: 'Gynecologist', short_name: 'GYNO', status: 'active', created_by: adminUser.id },
      { specialty_name: 'Pediatrician', short_name: 'PED', status: 'active', created_by: adminUser.id },
      { specialty_name: 'Dermatologist', short_name: 'DERM', status: 'active', created_by: adminUser.id },
      { specialty_name: 'Gastroenterologist', short_name: 'GI', status: 'active', created_by: adminUser.id },
      { specialty_name: 'Pulmonologist', short_name: 'PULMO', status: 'active', created_by: adminUser.id },
      { specialty_name: 'Nephrologist', short_name: 'NEPHO', status: 'active', created_by: adminUser.id },
      { specialty_name: 'Urologist', short_name: 'URO', status: 'active', created_by: adminUser.id }
    ]);

    // Seed Doctor Qualifications (Constant Data) - MUST BE BEFORE DOCTORS
    console.log('🎓 Creating doctor qualifications...');
    const doctorQualifications = await DoctorQualification.bulkCreate([
      { qualification_name: 'MBBS', short_name: 'MBBS', status: 'active', created_by: adminUser.id },
      { qualification_name: 'Doctor of Medicine', short_name: 'MD', status: 'active', created_by: adminUser.id },
      { qualification_name: 'Master of Surgery', short_name: 'MS', status: 'active', created_by: adminUser.id },
      { qualification_name: 'Diplomate of National Board', short_name: 'DNB', status: 'active', created_by: adminUser.id },
      { qualification_name: 'Doctor of Philosophy', short_name: 'PhD', status: 'active', created_by: adminUser.id },
      { qualification_name: 'Master of Chirurgiae', short_name: 'MCh', status: 'active', created_by: adminUser.id },
      { qualification_name: 'Bachelor of Ayurvedic Medicine and Surgery', short_name: 'BAMS', status: 'active', created_by: adminUser.id },
      { qualification_name: 'Master in Orthopedic Surgery', short_name: 'MS, Ortho', status: 'active', created_by: adminUser.id },
      { qualification_name: 'Doctor in Medicine', short_name: 'DM', status: 'active', created_by: adminUser.id },
      { qualification_name: 'Post Graduate Diploma in Clinical Cardiology', short_name: 'PGDCC', status: 'active', created_by: adminUser.id }
    ]);

    // Create doctors
    console.log('👨‍⚕️ Creating doctors...');
    const doctors = await Doctor.bulkCreate([
      {
        firstName: 'Dr. Subrat',
        lastName: 'Mohanty',
        specialty_id: 2, // Cardiologist
        category_id: 1, // Core Doctor
        qualification_id: 2, // MD
        specialty: 'Cardiologist',
        location: 'Bhubaneswar, Odisha',
        address: 'Cardiac Care Center, Bhubaneswar',
        phone: '+91-9876543210',
        email: 'subrat.mohanty@email.com',
        isActive: true,
        approval_status: 'approved'
      },
      {
        firstName: 'Dr. Ananya',
        lastName: 'Das',
        specialty_id: 3, // Neurologist
        category_id: 1, // Core Doctor
        qualification_id: 2, // MD
        specialty: 'Neurologist',
        location: 'Cuttack, Odisha',
        address: 'Neuro Institute, Cuttack',
        phone: '+91-9876543211',
        email: 'ananya.das@email.com',
        isActive: true,
        approval_status: 'approved'
      },
      {
        firstName: 'Dr. Ramesh',
        lastName: 'Behera',
        specialty_id: 4, // Orthopedic
        category_id: 2, // Category A
        qualification_id: 8, // MS, Ortho
        specialty: 'Orthopedic',
        location: 'Sambalpur, Odisha',
        address: 'Bone & Joint Hospital, Sambalpur',
        phone: '+91-9876543212',
        email: 'ramesh.behera@email.com',
        isActive: true,
        approval_status: 'approved'
      },
      {
        firstName: 'Dr. Pratibha',
        lastName: 'Patnaik',
        specialty_id: 7, // Pediatrician
        category_id: 2, // Category A
        qualification_id: 2, // MD
        specialty: 'Pediatrician',
        location: 'Puri, Odisha',
        address: 'Children Hospital, Puri',
        phone: '+91-9876543213',
        email: 'pratibha.patnaik@email.com',
        isActive: true,
        approval_status: 'approved'
      },
      {
        firstName: 'Dr. Ashok',
        lastName: 'Sahu',
        specialty_id: 1, // General Physician
        category_id: 3, // Category B
        qualification_id: 1, // MBBS
        specialty: 'General Physician',
        location: 'Rourkela, Odisha',
        address: 'City Clinic, Rourkela',
        phone: '+91-9876543214',
        email: 'ashok.sahu@email.com',
        isActive: true,
        approval_status: 'approved'
      },
      {
        firstName: 'Dr. Priya',
        lastName: 'Nayak',
        specialty_id: 6, // Gynecologist
        category_id: 1, // Core Doctor
        qualification_id: 3, // MS
        specialty: 'Gynecologist',
        location: 'Bhubaneswar, Odisha',
        address: 'Women Care Hospital, Bhubaneswar',
        phone: '+91-9876543215',
        email: 'priya.nayak@email.com',
        isActive: true,
        approval_status: 'approved'
      },
      {
        firstName: 'Dr. Biswajit',
        lastName: 'Dash',
        specialty_id: 8, // Dermatologist
        category_id: 4, // Category C
        qualification_id: 2, // MD
        specialty: 'Dermatologist',
        location: 'Cuttack, Odisha',
        address: 'Skin Care Clinic, Cuttack',
        phone: '+91-9876543216',
        email: 'biswajit.dash@email.com',
        isActive: true,
        approval_status: 'approved'
      },
      {
        firstName: 'Dr. Sanghamitra',
        lastName: 'Panda',
        specialty_id: 9, // Gastroenterologist
        category_id: 2, // Category A
        qualification_id: 9, // DM
        specialty: 'Gastroenterologist',
        location: 'Bhubaneswar, Odisha',
        address: 'GI Center, Bhubaneswar',
        phone: '+91-9876543217',
        email: 'sanghamitra.panda@email.com',
        isActive: true,
        approval_status: 'approved'
      }
    ]);

    // Create chemists
    console.log('🏥 Creating chemists/pharmacies...');
    const chemists = await Chemist.bulkCreate([
      {
        name: 'City Medical Store',
        location: 'Bhubaneswar',
        address: 'Main Road, Bhubaneswar',
        phone: '+91-9876543215',
        email: 'citymedical@email.com',
        isActive: true
      },
      {
        name: 'Apollo Pharmacy',
        location: 'Cuttack',
        address: 'College Square, Cuttack',
        phone: '+91-9876543216',
        email: 'apollo@email.com',
        isActive: true
      },
      {
        name: 'MedPlus Pharmacy',
        location: 'Sambalpur',
        address: 'Station Road, Sambalpur',
        phone: '+91-9876543217',
        email: 'medplus@email.com',
        isActive: true
      },
      {
        name: 'Wellness Pharmacy',
        location: 'Puri',
        address: 'Beach Road, Puri',
        phone: '+91-9876543218',
        email: 'wellness@email.com',
        isActive: true
      },
      {
        name: 'LifeCare Medical',
        location: 'Rourkela',
        address: 'Civil Township, Rourkela',
        phone: '+91-9876543219',
        email: 'lifecare@email.com',
        isActive: true
      }
    ]);

    // Create activities for each user
    console.log('📋 Creating activities...');
    const activities = [];
    const activityTypes = ['Doctor Visit', 'Chemist Visit', 'Conference', 'Training', 'Patient Education'];
    const statuses = ['planned', 'in_progress', 'completed', 'cancelled'];

    for (let i = 0; i < fieldReps.length; i++) {
      const user = fieldReps[i];
      const numActivities = Math.floor(Math.random() * 8) + 5; // 5-12 activities per user

      for (let j = 0; j < numActivities; j++) {
        const activityDate = new Date();
        activityDate.setDate(activityDate.getDate() - Math.floor(Math.random() * 30));

        activities.push({
          userId: user.id,
          title: `${activityTypes[Math.floor(Math.random() * activityTypes.length)]} - ${j + 1}`,
          description: `Activity description for ${user.firstName} ${user.lastName}`,
          date: activityDate.toISOString().split('T')[0],
          startTime: '09:00:00',
          endTime: '17:00:00',
          status: statuses[Math.floor(Math.random() * statuses.length)],
          location: `${doctors[Math.floor(Math.random() * doctors.length)].location} - Visit ${j + 1}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await Activity.bulkCreate(activities);

    // Create sales data
    console.log('💰 Creating sales data...');
    const sales = [];
    const products = [
      { name: 'Paracetamol 500mg', price: 25.50 },
      { name: 'Amoxicillin 250mg', price: 45.00 },
      { name: 'Vitamin D3', price: 120.00 },
      { name: 'Calcium Tablets', price: 85.00 },
      { name: 'Cough Syrup', price: 65.00 }
    ];

    for (let i = 0; i < fieldReps.length; i++) {
      const user = fieldReps[i];
      const numSales = Math.floor(Math.random() * 15) + 10; // 10-25 sales per user

      for (let j = 0; j < numSales; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 50) + 5; // 5-55 units
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 60));

        sales.push({
          userId: user.id,
          productName: product.name,
          quantity: quantity,
          price: product.price,
          totalAmount: quantity * product.price,
          chemistId: chemists[Math.floor(Math.random() * chemists.length)].id,
          date: saleDate.toISOString().split('T')[0],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await Sale.bulkCreate(sales);

    // Create business entries
    console.log('💼 Creating business entries...');
    const businessEntries = [];

    for (let i = 0; i < fieldReps.length; i++) {
      const user = fieldReps[i];
      const numBusiness = Math.floor(Math.random() * 8) + 3; // 3-10 business entries per user

      for (let j = 0; j < numBusiness; j++) {
        const businessDate = new Date();
        businessDate.setDate(businessDate.getDate() - Math.floor(Math.random() * 45));

        businessEntries.push({
          userId: user.id,
          doctorId: doctors[Math.floor(Math.random() * doctors.length)].id,
          productName: products[Math.floor(Math.random() * products.length)].name,
          quantity: Math.floor(Math.random() * 100) + 10,
          amount: Math.floor(Math.random() * 50000) + 10000, // ₹10,000 - ₹60,000
          month: businessDate.getMonth() + 1,
          year: businessDate.getFullYear(),
          date: businessDate.toISOString().split('T')[0],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await Business.bulkCreate(businessEntries);

    // Create projections
    console.log('📈 Creating projections...');
    const projections = [];

    for (let i = 0; i < fieldReps.length; i++) {
      const user = fieldReps[i];

      // Monthly projections for the current year
      for (let month = 1; month <= 12; month++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const projectedQty = Math.floor(Math.random() * 100) + 50; // 50-150 units

        projections.push({
          userId: user.id,
          month: month,
          year: 2024,
          productName: product.name,
          projectedQuantity: projectedQty,
          actualQuantity: Math.floor(Math.random() * projectedQty), // 0 to projected quantity
          projectedAmount: projectedQty * product.price,
          actualAmount: Math.floor(Math.random() * (projectedQty * product.price)), // 0 to projected amount
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await Projection.bulkCreate(projections);

    // Create day calls
    console.log('📞 Creating day calls...');
    const dayCalls = [];

    for (let i = 0; i < fieldReps.length; i++) {
      const user = fieldReps[i];
      const numCalls = Math.floor(Math.random() * 20) + 15; // 15-35 calls per user

      for (let j = 0; j < numCalls; j++) {
        const callDate = new Date();
        callDate.setDate(callDate.getDate() - Math.floor(Math.random() * 90));

        dayCalls.push({
          userId: user.id,
          date: callDate.toISOString().split('T')[0],
          startTime: '09:00:00',
          endTime: '17:00:00',
          location: `${doctors[Math.floor(Math.random() * doctors.length)].location} - Call ${j + 1}`,
          purpose: 'Product promotion and relationship building',
          status: 'planned',
          remarks: `Day call with ${Math.random() > 0.5 ? 'doctor' : 'chemist'} for product promotion`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await DayCall.bulkCreate(dayCalls);

    // Create territories
    console.log('🗺️ Creating territories...');
    const territories = await Territory.bulkCreate([
      {
        name: 'Odisha East',
        code: 'OD-EAST',
        region: 'East India',
        state: 'Odisha',
        district: 'Cuttack, Puri, Kendrapara',
        description: 'Eastern Odisha territory covering coastal districts',
        isActive: true
      },
      {
        name: 'Odisha West',
        code: 'OD-WEST',
        region: 'East India',
        state: 'Odisha',
        district: 'Sambalpur, Rourkela, Jharsuguda',
        description: 'Western Odisha territory covering mining and industrial areas',
        isActive: true
      },
      {
        name: 'West Bengal North',
        code: 'WB-NORTH',
        region: 'East India',
        state: 'West Bengal',
        district: 'Kolkata, Howrah, Hooghly',
        description: 'Northern West Bengal territory covering Kolkata metropolitan area',
        isActive: true
      },
      {
        name: 'Bihar Central',
        code: 'BR-CENTRAL',
        region: 'East India',
        state: 'Bihar',
        district: 'Patna, Gaya, Nalanda',
        description: 'Central Bihar territory covering Patna and surrounding areas',
        isActive: true
      },
      {
        name: 'Jharkhand South',
        code: 'JH-SOUTH',
        region: 'East India',
        state: 'Jharkhand',
        district: 'Ranchi, Jamshedpur, Bokaro',
        description: 'Southern Jharkhand territory covering industrial cities',
        isActive: true
      }
    ]);

    // Create products (sample data inspired by Charak Pharma)
    console.log('💊 Creating products...');
    const charakProducts = await Product.bulkCreate([
      {
        name: 'Charak Pharma Tablet',
        code: 'CHARAK-TAB-001',
        category: 'Tablet',
        subcategory: 'Ayurvedic Medicine',
        brand: 'Charak',
        manufacturer: 'Charak Pharma Pvt. Ltd.',
        description: 'Premium ayurvedic tablet for general wellness',
        composition: 'Herbal extracts, minerals, and natural compounds',
        indications: 'General health, immunity boost, vitality',
        dosage: '1-2 tablets twice daily or as directed by physician',
        packSize: '60 tablets',
        mrp: 150.00,
        ptr: 120.00,
        pts: 100.00,
        hsnCode: '30049011',
        gstRate: 12.00,
        schedule: 'OTC',
        therapeuticClass: 'Ayurvedic Medicine',
        isActive: true
      },
      {
        name: 'Charak Syrup',
        code: 'CHARAK-SYR-002',
        category: 'Syrup',
        subcategory: 'Cough Syrup',
        brand: 'Charak',
        manufacturer: 'Charak Pharma Pvt. Ltd.',
        description: 'Herbal cough syrup for respiratory wellness',
        composition: 'Honey, tulsi, ginger, and other herbal extracts',
        indications: 'Cough, cold, respiratory discomfort',
        dosage: '10-15ml twice daily or as directed by physician',
        packSize: '200ml',
        mrp: 85.00,
        ptr: 68.00,
        pts: 55.00,
        hsnCode: '30049011',
        gstRate: 12.00,
        schedule: 'OTC',
        therapeuticClass: 'Respiratory Medicine',
        isActive: true
      },
      {
        name: 'Charak Capsule',
        code: 'CHARAK-CAP-003',
        category: 'Capsule',
        subcategory: 'Joint Care',
        brand: 'Charak',
        manufacturer: 'Charak Pharma Pvt. Ltd.',
        description: 'Herbal capsules for joint and bone health',
        composition: 'Shallaki, guggul, and other anti-inflammatory herbs',
        indications: 'Joint pain, arthritis, inflammation',
        dosage: '1 capsule twice daily after meals',
        packSize: '60 capsules',
        mrp: 250.00,
        ptr: 200.00,
        pts: 175.00,
        hsnCode: '30049011',
        gstRate: 12.00,
        schedule: 'H',
        therapeuticClass: 'Orthopedic Medicine',
        isActive: true
      },
      {
        name: 'Charak Ointment',
        code: 'CHARAK-OINT-004',
        category: 'Ointment',
        subcategory: 'Pain Relief',
        brand: 'Charak',
        manufacturer: 'Charak Pharma Pvt. Ltd.',
        description: 'Topical ointment for muscular and joint pain relief',
        composition: 'Wintergreen oil, eucalyptus oil, herbal extracts',
        indications: 'Muscular pain, joint pain, sprains',
        dosage: 'Apply gently on affected area 2-3 times daily',
        packSize: '50g tube',
        mrp: 75.00,
        ptr: 60.00,
        pts: 50.00,
        hsnCode: '30049011',
        gstRate: 12.00,
        schedule: 'OTC',
        therapeuticClass: 'Topical Analgesic',
        isActive: true
      },
      {
        name: 'Charak Digestive Tablet',
        code: 'CHARAK-DIG-005',
        category: 'Tablet',
        subcategory: 'Digestive Care',
        brand: 'Charak',
        manufacturer: 'Charak Pharma Pvt. Ltd.',
        description: 'Herbal tablets for digestive health and wellness',
        composition: 'Triphala, ginger, cumin, and digestive herbs',
        indications: 'Indigestion, gas, bloating, constipation',
        dosage: '1-2 tablets after meals or as directed',
        packSize: '60 tablets',
        mrp: 120.00,
        ptr: 96.00,
        pts: 80.00,
        hsnCode: '30049011',
        gstRate: 12.00,
        schedule: 'OTC',
        therapeuticClass: 'Gastrointestinal Medicine',
        isActive: true
      }
    ]);

    // Create headquarters
    console.log('🏢 Creating headquarters...');
    const headquarters = await Headquarter.bulkCreate([
      {
        name: 'Charak Pharma Odisha Branch',
        code: 'CHARAK-ODISHA',
        type: 'Branch Office',
        address: '456 Industrial Area, Rasulgarh',
        city: 'Bhubaneswar',
        state: 'Odisha',
        pincode: '751010',
        phone: '+91-674-2589630',
        email: 'odisha@charakpharma.com',
        manager: 'Priya Sharma',
        region: 'East India',
        zone: 'Eastern Zone',
        territoryCount: 2,
        employeeCount: 25,
        isActive: true
      }
    ]);

    // Create notifications
    console.log('🔔 Creating notifications...');
    const notifications = [];

    for (let i = 0; i < fieldReps.length; i++) {
      const user = fieldReps[i];
      const numNotifications = Math.floor(Math.random() * 5) + 3; // 3-8 notifications per user

      for (let j = 0; j < numNotifications; j++) {
        const notificationDate = new Date();
        notificationDate.setDate(notificationDate.getDate() - Math.floor(Math.random() * 15));

        notifications.push({
          userId: user.id,
          title: `Notification ${j + 1} for ${user.firstName}`,
          message: `This is a sample notification message for ${user.firstName} ${user.lastName}. Activity update ${j + 1}.`,
          type: ['info', 'warning', 'error', 'success'][Math.floor(Math.random() * 4)],
          isRead: Math.random() > 0.5,
          readAt: Math.random() > 0.5 ? notificationDate : null,
          createdAt: notificationDate,
          updatedAt: new Date()
        });
      }
    }

    await Notification.bulkCreate(notifications);

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   👤 Users: ${fieldReps.length + 1} (including admin)`);
    console.log(`   👨‍⚕️ Doctors: ${doctors.length}`);
    console.log(`   🏥 Chemists: ${chemists.length}`);
    console.log(`   🗺️ Territories: 5`);
    console.log(`   🏢 Headquarters: ${headquarters.length}`);
    console.log(`   📦 Products: ${products.length}`);
    console.log(`   🏷️ Doctor Classes: ${doctorClasses.length}`);
    console.log(`   📋 Doctor Categories: ${doctorCategories.length}`);
    console.log(`   🩺 Doctor Specialties: ${doctorSpecialties.length}`);
    console.log(`   🎓 Doctor Qualifications: ${doctorQualifications.length}`);
    console.log(`   💊 Products: 5 (Charak Pharma products)`);
    console.log(`   🏢 Headquarters: 1`);
    console.log(`   📋 Activities: ${activities.length}`);
    console.log(`   💰 Sales: ${sales.length}`);
    console.log(`   💼 Business: ${businessEntries.length}`);
    console.log(`   📈 Projections: ${projections.length}`);
    console.log(`   📞 Day Calls: ${dayCalls.length}`);
    console.log(`   🔔 Notifications: ${notifications.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  sequelize.authenticate()
    .then(() => {
      console.log('🗄️ Database connected successfully');
      return seedDatabase();
    })
    .catch(err => {
      console.error('❌ Database connection failed:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;