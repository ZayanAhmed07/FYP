import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import { User } from '../modules/user/user.model';
import { Consultant } from '../models/consultant.model';
import bcrypt from 'bcryptjs';

// Connect to database manually
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ExpertRaah';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

const categories = ['Education', 'Business', 'Legal'];

const skillsByCategory = {
  Education: [
    'Curriculum Development',
    'Student Counseling',
    'Career Guidance',
    'University Admissions',
    'Study Abroad Planning',
    'Educational Technology',
    'Academic Assessment',
    'Learning Strategies',
    'Special Education',
    'Educational Leadership',
  ],
  Business: [
    'Business Strategy',
    'Financial Planning',
    'Market Research',
    'Operations Management',
    'Digital Marketing',
    'Sales Management',
    'Project Management',
    'Business Development',
    'Risk Management',
    'Supply Chain',
  ],
  Legal: [
    'Contract Law',
    'Corporate Law',
    'Intellectual Property',
    'Labor Law',
    'Tax Law',
    'Civil Litigation',
    'Criminal Law',
    'Real Estate Law',
    'Family Law',
    'Compliance & Regulatory',
  ],
};

const experienceLevels = [
  '5-7 years',
  '8-10 years',
  '10-15 years',
  '15-20 years',
  '20+ years',
];

const educationLevels = [
  "Bachelor's Degree",
  "Master's Degree",
  'MBA',
  'PhD',
  'Law Degree (LLB/JD)',
  'Professional Certifications',
];

// Pakistani cities only
const pakistaniCities = [
  'Rawalpindi',
  'Islamabad',
  'Karachi',
  'Lahore',
];

// Pakistani first and last names
const pakistaniFirstNames = {
  male: [
    'Muhammad', 'Ali', 'Ahmed', 'Hassan', 'Hussain', 'Umar', 'Bilal', 'Hamza', 'Imran', 'Faisal',
    'Kamran', 'Tariq', 'Rashid', 'Khalid', 'Saad', 'Zain', 'Fahad', 'Sohail', 'Naveed', 'Adnan',
    'Wasim', 'Asad', 'Junaid', 'Shahid', 'Aamir', 'Waqar', 'Salman', 'Farhan', 'Danish', 'Rizwan'
  ],
  female: [
    'Fatima', 'Ayesha', 'Zainab', 'Maryam', 'Khadija', 'Sara', 'Noor', 'Hira', 'Amna', 'Sana',
    'Aisha', 'Rabia', 'Asma', 'Hina', 'Sidra', 'Mahnoor', 'Aliza', 'Nimra', 'Mehwish', 'Bushra',
    'Sadia', 'Uzma', 'Samina', 'Shaista', 'Nadia', 'Farah', 'Saima', 'Amber', 'Rubab', 'Laiba'
  ]
};

const pakistaniLastNames = [
  'Khan', 'Ahmed', 'Ali', 'Shah', 'Malik', 'Hussain', 'Raza', 'Abbas', 'Haider', 'Akhtar',
  'Butt', 'Chaudhry', 'Sheikh', 'Siddiqui', 'Abbasi', 'Qureshi', 'Rizvi', 'Naqvi', 'Mirza', 'Baig',
  'Bhatti', 'Cheema', 'Gondal', 'Janjua', 'Awan', 'Warraich', 'Chattha', 'Dar', 'Laghari', 'Ansari'
];

function generatePakistaniName(): { firstName: string; lastName: string } {
  const gender = faker.helpers.arrayElement(['male', 'female']);
  const firstName = faker.helpers.arrayElement(pakistaniFirstNames[gender]);
  const lastName = faker.helpers.arrayElement(pakistaniLastNames);
  return { firstName, lastName };
}

function generateConsultantBio(category: string, skills: string[]): string {
  const templates = {
    Education: [
      `Experienced education consultant with expertise in ${skills[0]} and ${skills[1]}. Passionate about helping students achieve their academic goals through personalized guidance and strategic planning.`,
      `Dedicated educational professional specializing in ${skills[0]}. Proven track record of guiding students through complex academic decisions and career pathways with compassionate, results-driven approach.`,
      `Education specialist with deep knowledge in ${skills[0]}, ${skills[1]}, and ${skills[2]}. Committed to empowering learners with the skills and knowledge needed for success in today's competitive landscape.`,
    ],
    Business: [
      `Strategic business consultant specializing in ${skills[0]} and ${skills[1]}. Help organizations optimize operations, increase revenue, and achieve sustainable growth through data-driven insights.`,
      `Seasoned business advisor with expertise in ${skills[0]}. Partner with companies to navigate challenges, capitalize on opportunities, and build resilient business models for long-term success.`,
      `Results-oriented business consultant focusing on ${skills[0]}, ${skills[1]}, and ${skills[2]}. Transform business challenges into opportunities through innovative strategies and practical solutions.`,
    ],
    Legal: [
      `Accomplished legal consultant with specialization in ${skills[0]} and ${skills[1]}. Provide comprehensive legal guidance to individuals and businesses navigating complex regulatory environments.`,
      `Experienced legal professional focusing on ${skills[0]}. Deliver strategic legal solutions that protect clients' interests while ensuring compliance with evolving regulations and industry standards.`,
      `Trusted legal advisor with expertise in ${skills[0]}, ${skills[1]}, and ${skills[2]}. Committed to providing clear, practical legal counsel that empowers clients to make informed decisions.`,
    ],
  };

  const categoryTemplates = templates[category as keyof typeof templates];
  return faker.helpers.arrayElement(categoryTemplates);
}

async function seedConsultants() {
  try {
    await connectDB();
    console.log('🌱 Starting consultant seeding...');

    // Clear existing consultants (optional - comment out if you want to keep existing)
    // await User.deleteMany({ accountType: 'consultant' });
    // await Consultant.deleteMany({});
    // console.log('🗑️  Cleared existing consultants');

    const consultantsToCreate = 50; // Create 50 diverse consultants
    const createdConsultants = [];

    for (let i = 0; i < consultantsToCreate; i++) {
      const category = faker.helpers.arrayElement(categories);
      const { firstName, lastName } = generatePakistaniName();
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${faker.number.int({ min: 1, max: 999 })}@gmail.com`;
      const city = faker.helpers.arrayElement(pakistaniCities);

      // Select 4-6 random skills from category
      const categorySkills = skillsByCategory[category as keyof typeof skillsByCategory];
      const numSkills = faker.number.int({ min: 4, max: 6 });
      const skills = faker.helpers.arrayElements(categorySkills, numSkills);

      // Generate hourly rate for Pakistan (PKR to USD range: $15-60/hr)
      const hourlyRate = faker.number.int({
        min: 15,
        max: 60,
      });

      const bio = generateConsultantBio(category, skills);

      // Create User
      const hashedPassword = await bcrypt.hash('Consultant123!', 10);
      const user = await User.create({
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        accountType: 'consultant',
        emailVerified: true,
        profileImage: faker.image.avatar(),
        isActive: true,
      });

      // Create Consultant Profile
      const consultant = await Consultant.create({
        userId: user._id,
        title: `${category} Consultant`,
        bio,
        specialization: [category],
        hourlyRate,
        experience: faker.helpers.arrayElement(experienceLevels),
        skills,
        education: faker.helpers.arrayElement(educationLevels),
        languages: ['English', 'Urdu'], // Pakistani consultants speak both
        location: {
          country: 'Pakistan',
          city,
        },
        remoteWork: faker.datatype.boolean(0.6),  // 60% available for remote work
        availability: faker.helpers.arrayElement([
          'available',
          'limited',
          'unavailable',
        ]),
        rating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
        totalReviews: faker.number.int({ min: 5, max: 100 }),
        completedProjects: faker.number.int({ min: 0, max: 200 }),
        responseTime: faker.number.int({ min: 1, max: 24 }), // hours
        isVerified: faker.datatype.boolean(0.8), // 80% verified
        badges: faker.helpers.arrayElements(
          ['Top Rated', 'Rising Talent', 'Verified Expert', 'Quick Responder'],
          faker.number.int({ min: 0, max: 2 })
        ),
      });

      createdConsultants.push({
        name: user.name,
        email: user.email,
        category,
        skills: skills.slice(0, 3).join(', '),
      });

      if ((i + 1) % 10 === 0) {
        console.log(`✅ Created ${i + 1}/${consultantsToCreate} consultants`);
      }
    }

    console.log('\n🎉 Consultant seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`Total consultants created: ${consultantsToCreate}`);
    console.log(`\nSample consultants:`);
    console.table(createdConsultants.slice(0, 10));

    console.log('\n🔐 Default password for all consultants: Consultant123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding consultants:', error);
    process.exit(1);
  }
}

// Run the seed function
seedConsultants();
