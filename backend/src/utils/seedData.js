require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Customer = require('../models/Customer');
const Bike = require('../models/Bike');
const Service = require('../models/Service');
const Payment = require('../models/Payment');

const seedData = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<username>')) {
    console.error('❌ MONGODB_URI not configured in .env. Please set it before seeding.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas for seeding');

    // Clear existing data
    await User.deleteMany();
    await Customer.deleteMany();
    await Bike.deleteMany();
    await Service.deleteMany();
    await Payment.deleteMany();
    console.log('🧹 Cleared existing database collections');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Workshop Admin',
      email: 'admin@bikeworkshop.com',
      password: adminPassword,
      role: 'admin',
      phone: '+91 98765 43210',
      workshopName: 'SpeedyWheels Bike Workshop',
      address: '108 Workshop Road, Auto Hub, Bangalore - 560001',
      gstNumber: '29ABCDE1234F1Z5',
    });
    console.log('👤 Admin user created (admin@bikeworkshop.com / admin123)');

    // Seed Customers & Bikes
    const c1 = await Customer.create({
      name: 'Vikram Sharma',
      mobile: '9845012345',
      email: 'vikram.sharma@example.com',
      address: '#45, 4th Cross, Indiranagar, Bangalore',
    });

    const b1 = await Bike.create({
      customer: c1._id,
      brand: 'Royal Enfield',
      model: 'Classic 350 Reborn',
      registrationNumber: 'KA 03 MX 4521',
      currentKilometre: 14500,
      year: 2022,
      fuelType: 'Petrol',
      color: 'Halcyon Green',
    });

    const b2 = await Bike.create({
      customer: c1._id,
      brand: 'Honda',
      model: 'Activa 6G',
      registrationNumber: 'KA 03 NM 8812',
      currentKilometre: 8200,
      year: 2023,
      fuelType: 'Petrol',
      color: 'Pearl Siren Blue',
    });

    c1.bikes = [b1._id, b2._id];
    await c1.save();

    const c2 = await Customer.create({
      name: 'Priya Sundaram',
      mobile: '9731298765',
      email: 'priya.s@example.com',
      address: 'Plot 12, Koramangala 5th Block, Bangalore',
    });

    const b3 = await Bike.create({
      customer: c2._id,
      brand: 'TVS',
      model: 'Jupiter 125',
      registrationNumber: 'KA 01 HY 9945',
      currentKilometre: 11400,
      year: 2022,
      fuelType: 'Petrol',
      color: 'Titanium Grey',
    });

    c2.bikes = [b3._id];
    await c2.save();

    const c3 = await Customer.create({
      name: 'Arjun Das',
      mobile: '9900112233',
      email: 'arjun.das@example.com',
      address: 'Flat 302, Green Glen Layout, Bellandur, Bangalore',
    });

    const b4 = await Bike.create({
      customer: c3._id,
      brand: 'KTM',
      model: 'Duke 390',
      registrationNumber: 'KA 51 EK 1290',
      currentKilometre: 22800,
      year: 2021,
      fuelType: 'Petrol',
      color: 'Electronic Orange',
    });

    c3.bikes = [b4._id];
    await c3.save();

    // Create Services
    const s1 = await Service.create({
      jobCardNumber: 'JC-2026-0001',
      customer: c1._id,
      bike: b1._id,
      serviceDate: new Date(),
      serviceType: 'General Service',
      customerComplaints: ['Front brake squeaking sound', 'Engine oil change due'],
      workPerformed: 'Motul 15W50 fill, brake pads replaced, full water wash and chain lube.',
      spareParts: [
        { name: 'Motul 15W50 Engine Oil', quantity: 1, unitPrice: 1250, total: 1250 },
        { name: 'Brake Pads Set', quantity: 1, unitPrice: 750, total: 750 },
      ],
      labourCharges: [
        { description: 'General Service Labour', amount: 850 },
        { description: 'Brake Bleeding', amount: 250 },
      ],
      discount: 200,
      taxRate: 18,
      taxAmount: 522,
      totalAmount: 3422,
      paidAmount: 2000,
      pendingBalance: 1422,
      currentKilometre: 14500,
      nextServiceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      nextServiceKilometre: 19500,
      status: 'In Progress',
      paymentStatus: 'Partial',
      assignedMechanic: 'Ramesh Senior Mechanic',
    });

    const s2 = await Service.create({
      jobCardNumber: 'JC-2026-0002',
      customer: c2._id,
      bike: b3._id,
      serviceDate: new Date(),
      serviceType: 'Inspection & Washing',
      customerComplaints: ['Cold start issue', 'Tyre air check'],
      workPerformed: 'Spark plug cleaned, air filter cleaned, battery checked.',
      spareParts: [{ name: 'NGK Spark Plug', quantity: 1, unitPrice: 160, total: 160 }],
      labourCharges: [{ description: 'Inspection & Tune-up', amount: 350 }],
      discount: 10,
      taxRate: 18,
      taxAmount: 90,
      totalAmount: 590,
      paidAmount: 590,
      pendingBalance: 0,
      currentKilometre: 11400,
      nextServiceDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      nextServiceKilometre: 14000,
      status: 'Ready',
      paymentStatus: 'Paid',
      assignedMechanic: 'Ramesh Senior Mechanic',
    });

    // Create Payments
    await Payment.create({
      invoiceNumber: 'INV-2026-0001',
      service: s1._id,
      customer: c1._id,
      totalAmount: 3422,
      amountPaid: 2000,
      paymentType: 'Advance',
      paymentMethod: 'UPI',
      transactionReference: 'UPI-TXN-112233',
      pendingBalance: 1422,
    });

    await Payment.create({
      invoiceNumber: 'INV-2026-0002',
      service: s2._id,
      customer: c2._id,
      totalAmount: 590,
      amountPaid: 590,
      paymentType: 'Final',
      paymentMethod: 'UPI',
      transactionReference: 'UPI-TXN-998877',
      pendingBalance: 0,
    });

    console.log('🎉 Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedData();
