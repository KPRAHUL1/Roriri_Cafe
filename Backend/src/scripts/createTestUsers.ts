// // scripts/createTestUsers.ts
//  // adjust path as needed

// import { db } from "../shared/lib/db";

// async function createTestUsers() {
//   try {
//     console.log('🧪 Creating test users...');

//     const testUsers  = [
//       {
//         userId: 'EMPJOH123456',
//         qrCode: 'EMPJOH123456',
//         name: 'John Doe',
//         email: 'john.doe@company.com',
//         phone: '9876543210',
//         userType: 'Employee',
//         status: 'Active',
//         balance: 450.75,
//         department: 'Engineering'
//       },
//       {
//         userId: 'STUJANE789012',
//         qrCode: 'STUJANE789012',
//         name: 'Jane Smith',
//         email: 'jane.smith@college.edu',
//         phone: '9876543211',
//         userType: 'Student',
//         status: 'Active',
//         balance: 280.50,
//         department: 'Computer Science'
//       },
//       {
//         userId: 'STFMIKE345678',
//         qrCode: 'STFMIKE345678',
//         name: 'Mike Johnson',
//         email: 'mike.johnson@company.com',
//         phone: '9876543212',
//         userType: 'Staff',
//         status: 'Active',
//         balance: 320.00,
//         department: 'Administration'
//       },
//       {
//         userId: 'VISSARAH901234',
//         qrCode: 'VISSARAH901234',
//         name: 'Sarah Wilson',
//         email: 'sarah.wilson@visitor.com',
//         phone: '9876543213',
//         userType: 'Visitor',
//         status: 'Active',
//         balance: 100.00,
//         department: 'Guest'
//       }
//     ];

//     for (const userData of testUsers) {
//       const existingUser = await db.user.findFirst({
//         where: {
//           OR: [
//             { userId: userData.userId },
//             { email: userData.email },
//             { qrCode: userData.qrCode }
//           ]
//         }
//       });

//       if (!existingUser) {
//         const newUser = await db.user.create({
//           data: userData
//         });
//         console.log(`✅ Created user: ${newUser.name} (${newUser.userId})`);
//       } else {
//         console.log(`⚠️  User already exists: ${userData.name} (${userData.userId})`);
//       }
//     }

//     console.log('🎉 Test users creation completed!');
    
//     // Show all users
//     const allUsers = await db.user.findMany({
//       select: {
//         userId: true,
//         qrCode: true,
//         name: true,
//         email: true,
//         status: true,
//         balance: true
//       }
//     });
    
//     console.log('\n📊 All users in database:');
//     console.table(allUsers);
    
//   } catch (error) {
//     console.error('❌ Error creating test users:', error);
//   } finally {
//     await db.$disconnect();
//   }
// }

// // Run the script
// createTestUsers();