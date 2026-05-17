/**
 * Seed Script: Create 20 Pakistani Consultants with Complete Profile Data
 * 
 * This script creates 20 verified consultant profiles with:
 * - Realistic Pakistani names
 * - Locations: Rawalpindi, Islamabad, Lahore, Karachi
 * - Specializations: LEGAL, EDUCATION, BUSINESS
 * - Complete profile data matching VerifyIdentityPage requirements
 */

import mongoose from 'mongoose';
import { User } from '../modules/user/user.model';
import { Consultant } from '../models/consultant.model';
import bcrypt from 'bcryptjs';

// Connect to database manually
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ExpertRaah';

// Mock base64 image (1x1 transparent PNG)
const MOCK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}


// Consultant data - 20 Pakistani consultants with complete profile data
const consultantProfiles = [
  // Legal Consultants (5)
  {
    name: 'Ahmed Hassan Khan',
    email: 'ahmed.hassan@expertrah.com',
    city: 'Islamabad',
    specialization: 'LEGAL',
    title: 'Senior Corporate Law Specialist',
    bio: 'Over 10 years of experience in corporate law, mergers & acquisitions, and business compliance. Helped 200+ companies navigate complex legal frameworks in Pakistan. LLB from Punjab University and LLM from London School of Economics.',
    hourlyRate: 5000,
    experience: '10+ years',
    skills: ['Corporate Law', 'Contract Drafting', 'M&A', 'Business Compliance', 'Legal Advisory', 'Dispute Resolution'],
  },
  {
    name: 'Fatima Siddiqui',
    email: 'fatima.siddiqui@expertrah.com',
    city: 'Karachi',
    specialization: 'LEGAL',
    title: 'Family Law & Property Rights Attorney',
    bio: 'Specialized in family law, property rights, and inheritance matters. Advocate High Court with 8 years of experience. Successfully represented clients in 500+ cases with a 90% success rate.',
    hourlyRate: 4000,
    experience: '8 years',
    skills: ['Family Law', 'Property Rights', 'Inheritance Law', 'Civil Litigation', 'Legal Consultation', 'Court Representation'],
  },
  {
    name: 'Muhammad Asif Malik',
    email: 'asif.malik@expertrah.com',
    city: 'Lahore',
    specialization: 'LEGAL',
    title: 'Criminal Defense & Constitutional Law Expert',
    bio: 'Senior advocate with expertise in criminal defense and constitutional law. LLB from Lahore University of Management Sciences. Handled high-profile cases and provided legal counsel to government agencies.',
    hourlyRate: 5500,
    experience: '12+ years',
    skills: ['Criminal Law', 'Constitutional Law', 'Trial Advocacy', 'Legal Research', 'Defense Strategy', 'Appeals'],
  },
  {
    name: 'Ayesha Tariq',
    email: 'ayesha.tariq@expertrah.com',
    city: 'Rawalpindi',
    specialization: 'LEGAL',
    title: 'Intellectual Property & Trademark Lawyer',
    bio: 'IP law specialist with focus on trademark registration, copyright protection, and patent law. Assisted 100+ startups and established businesses in protecting their intellectual property.',
    hourlyRate: 4500,
    experience: '7 years',
    skills: ['IP Law', 'Trademark Registration', 'Copyright Law', 'Patent Law', 'Brand Protection', 'Legal Drafting'],
  },
  {
    name: 'Bilal Ahmed Syed',
    email: 'bilal.syed@expertrah.com',
    city: 'Karachi',
    specialization: 'LEGAL',
    title: 'Tax Law & Financial Compliance Consultant',
    bio: 'Tax attorney specializing in FBR compliance, tax planning, and financial regulations. Helped businesses save millions through strategic tax planning and audit representation.',
    hourlyRate: 4800,
    experience: '9 years',
    skills: ['Tax Law', 'FBR Compliance', 'Tax Planning', 'Financial Law', 'Audit Representation', 'Corporate Taxation'],
  },

  // Education Consultants (5)
  {
    name: 'Dr. Sana Iqbal',
    email: 'sana.iqbal@expertrah.com',
    city: 'Islamabad',
    specialization: 'EDUCATION',
    title: 'Higher Education & University Admissions Advisor',
    bio: 'PhD in Education from Cambridge University. Specialized in university admissions counseling, scholarship applications, and study abroad guidance. Helped 1000+ students secure admissions in top universities worldwide.',
    hourlyRate: 3500,
    experience: '15+ years',
    skills: ['University Admissions', 'Scholarship Guidance', 'Study Abroad', 'Career Counseling', 'Academic Planning', 'Test Preparation'],
  },
  {
    name: 'Usman Ghani',
    email: 'usman.ghani@expertrah.com',
    city: 'Lahore',
    specialization: 'EDUCATION',
    title: 'STEM Education & Career Development Coach',
    bio: 'Masters in Computer Science from LUMS. Specialized in STEM education, coding bootcamps, and tech career guidance. Former software engineer turned educator helping students transition into tech careers.',
    hourlyRate: 3000,
    experience: '8 years',
    skills: ['STEM Education', 'Career Coaching', 'Programming Mentorship', 'Tech Career Guidance', 'Resume Building', 'Interview Preparation'],
  },
  {
    name: 'Zainab Nasir',
    email: 'zainab.nasir@expertrah.com',
    city: 'Rawalpindi',
    specialization: 'EDUCATION',
    title: 'Primary & Secondary Education Specialist',
    bio: 'B.Ed and M.Ed from Allama Iqbal Open University. 12 years of experience in curriculum development, teaching methodologies, and student assessment. Trained 500+ teachers across Pakistan.',
    hourlyRate: 2500,
    experience: '12 years',
    skills: ['Curriculum Development', 'Teaching Methods', 'Student Assessment', 'Educational Psychology', 'Teacher Training', 'Classroom Management'],
  },
  {
    name: 'Hassan Raza',
    email: 'hassan.raza@expertrah.com',
    city: 'Karachi',
    specialization: 'EDUCATION',
    title: 'MBA & Business School Admissions Consultant',
    bio: 'MBA from IBA Karachi with GMAT score of 750. Expert in MBA admissions, GMAT/GRE prep, and business school applications. Successfully placed students in Harvard, Stanford, and Wharton.',
    hourlyRate: 4000,
    experience: '6 years',
    skills: ['MBA Admissions', 'GMAT Prep', 'GRE Prep', 'Essay Writing', 'Application Strategy', 'Business School Guidance'],
  },
  {
    name: 'Maria Khan',
    email: 'maria.khan@expertrah.com',
    city: 'Islamabad',
    specialization: 'EDUCATION',
    title: 'Special Education & Learning Disabilities Expert',
    bio: 'Specialized in special education, autism spectrum disorders, and learning disabilities. Trained in Applied Behavior Analysis (ABA) and individualized education programs (IEP). Helped 300+ children with special needs.',
    hourlyRate: 3200,
    experience: '10 years',
    skills: ['Special Education', 'Learning Disabilities', 'Autism Support', 'IEP Development', 'Behavior Analysis', 'Parent Counseling'],
  },

  // Business Consultants (5)
  {
    name: 'Shahid Mehmood',
    email: 'shahid.mehmood@expertrah.com',
    city: 'Lahore',
    specialization: 'BUSINESS',
    title: 'Business Strategy & Management Consultant',
    bio: 'MBA from LUMS and certified PMP. 15 years of experience in business strategy, operations management, and organizational development. Former McKinsey consultant now helping Pakistani businesses scale.',
    hourlyRate: 6000,
    experience: '15+ years',
    skills: ['Business Strategy', 'Operations Management', 'Strategic Planning', 'Change Management', 'Process Optimization', 'Leadership Development'],
  },
  {
    name: 'Hina Ali',
    email: 'hina.ali@expertrah.com',
    city: 'Karachi',
    specialization: 'BUSINESS',
    title: 'Digital Marketing & E-commerce Specialist',
    bio: 'Google and Facebook certified digital marketer. Built and scaled 50+ e-commerce businesses. Expert in SEO, social media marketing, and online sales funnels. Generated PKR 100M+ in revenue for clients.',
    hourlyRate: 4500,
    experience: '8 years',
    skills: ['Digital Marketing', 'E-commerce', 'SEO', 'Social Media Marketing', 'Google Ads', 'Sales Funnels'],
  },
  {
    name: 'Imran Haider',
    email: 'imran.haider@expertrah.com',
    city: 'Islamabad',
    specialization: 'BUSINESS',
    title: 'Financial Planning & Investment Advisor',
    bio: 'Chartered Financial Analyst (CFA) with expertise in investment portfolio management, financial planning, and wealth management. Managed portfolios worth PKR 5B+ for HNI clients.',
    hourlyRate: 5500,
    experience: '12 years',
    skills: ['Financial Planning', 'Investment Management', 'Portfolio Analysis', 'Wealth Management', 'Risk Assessment', 'Tax-efficient Investing'],
  },
  {
    name: 'Rabia Akram',
    email: 'rabia.akram@expertrah.com',
    city: 'Rawalpindi',
    specialization: 'BUSINESS',
    title: 'HR & Organizational Development Consultant',
    bio: 'CHRP certified with Masters in HR Management. Specialized in talent acquisition, performance management, and HR policy development. Established HR departments for 30+ growing companies.',
    hourlyRate: 3800,
    experience: '10 years',
    skills: ['HR Management', 'Talent Acquisition', 'Performance Management', 'HR Policies', 'Employee Relations', 'Training & Development'],
  },
  {
    name: 'Kamran Javaid',
    email: 'kamran.javaid@expertrah.com',
    city: 'Lahore',
    specialization: 'BUSINESS',
    title: 'Startup & Entrepreneurship Mentor',
    bio: 'Serial entrepreneur who built and exited 3 successful startups. Now mentoring early-stage founders on product-market fit, fundraising, and scaling strategies. Part of Plan9 and LUMS Center for Entrepreneurship.',
    hourlyRate: 4200,
    experience: '11 years',
    skills: ['Startup Strategy', 'Business Model Canvas', 'Fundraising', 'Pitch Deck', 'Product Development', 'Growth Hacking'],
  },

  // Multi-specialization Consultants (5)
  {
    name: 'Saima Rashid',
    email: 'saima.rashid@expertrah.com',
    city: 'Karachi',
    specialization: 'BUSINESS',
    title: 'EdTech Business & Digital Transformation Consultant',
    bio: 'MBA holder specializing in EdTech business models. Founded an EdTech startup that reached 100K students. Expert in educational business models, online course development, and digital transformation strategies.',
    hourlyRate: 4700,
    experience: '9 years',
    skills: ['EdTech', 'Business Development', 'Curriculum Design', 'Online Learning', 'Educational Innovation', 'LMS Implementation'],
  },
  {
    name: 'Adnan Mustafa',
    email: 'adnan.mustafa@expertrah.com',
    city: 'Islamabad',
    specialization: 'LEGAL',
    title: 'Corporate Legal & Compliance Advisor',
    bio: 'LLB and MBA specializing in corporate governance, regulatory compliance, and business law. Advise C-level executives on legal risk management and strategic business decisions.',
    hourlyRate: 5800,
    experience: '13 years',
    skills: ['Corporate Governance', 'Compliance Management', 'Business Law', 'Contract Management', 'Risk Assessment', 'Board Advisory'],
  },
  {
    name: 'Nadia Saleem',
    email: 'nadia.saleem@expertrah.com',
    city: 'Lahore',
    specialization: 'LEGAL',
    title: 'Education Law & Policy Consultant',
    bio: 'LLB with specialization in education law and policy. Work with educational institutions on legal compliance, student rights, and policy development. Advised 50+ schools and universities.',
    hourlyRate: 4300,
    experience: '8 years',
    skills: ['Education Law', 'Policy Development', 'Institutional Compliance', 'Student Rights', 'Academic Regulations', 'Legal Advisory'],
  },
  {
    name: 'Faisal Mahmood',
    email: 'faisal.mahmood@expertrah.com',
    city: 'Rawalpindi',
    specialization: 'BUSINESS',
    title: 'Business Training & Corporate Education Specialist',
    bio: 'Corporate trainer and business educator. Delivered 1000+ training sessions on leadership, sales, and soft skills. Certified in adult learning methodologies and instructional design.',
    hourlyRate: 3600,
    experience: '10 years',
    skills: ['Corporate Training', 'Leadership Development', 'Sales Training', 'Soft Skills', 'Instructional Design', 'Workshop Facilitation'],
  },
  {
    name: 'Amna Baig',
    email: 'amna.baig@expertrah.com',
    city: 'Karachi',
    specialization: 'EDUCATION',
    title: 'Educational Leadership & Institution Development Consultant',
    bio: 'B.Ed degree holder with extensive experience in educational leadership. Expert in curriculum development, institution building, and educational program design. Helped establish 20+ educational institutions across Pakistan.',
    hourlyRate: 5200,
    experience: '14 years',
    skills: ['Legal Compliance', 'Business Strategy', 'Educational Management', 'Strategic Planning', 'Risk Management', 'Organizational Development'],
  },
];

async function seedConsultants() {
  try {
    await connectDB();
    console.log('🌱 Starting consultant seeding process...');

    // Default password for all seeded users
    const defaultPassword = 'Expert@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const profile of consultantProfiles) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: profile.email });
        if (existingUser) {
          console.log(`⏭️  Skipping ${profile.name} - User already exists`);
          skipCount++;
          continue;
        }

        // Create User
        const user = await User.create({
          name: profile.name,
          email: profile.email,
          password: hashedPassword,
          accountType: 'consultant',
          profileImage: MOCK_IMAGE,
          isEmailVerified: true,
        });

        console.log(`✅ Created user: ${profile.name} (${profile.email})`);

        // Create Consultant Profile
        const consultant = await Consultant.create({
          userId: user._id,
          title: profile.title,
          bio: profile.bio,
          specialization: [profile.specialization],
          hourlyRate: profile.hourlyRate,
          availability: 'available',
          experience: profile.experience,
          skills: profile.skills,
          location: {
            country: 'Pakistan',
            city: profile.city,
          },
          remoteWork: true,
          idCardFront: MOCK_IMAGE,
          idCardBack: MOCK_IMAGE,
          supportingDocuments: [MOCK_IMAGE],
          isVerified: true, // Auto-verify for seeded consultants
          rating: Math.floor(Math.random() * 2) + 4, // Random rating between 4-5
          averageRating: Number((Math.random() * 1 + 4).toFixed(1)), // 4.0-5.0
          totalReviews: Math.floor(Math.random() * 50) + 10, // 10-60 reviews
          totalProjects: Math.floor(Math.random() * 30) + 5, // 5-35 projects
          totalEarnings: Math.floor(Math.random() * 500000) + 100000, // PKR 100K-600K
        });

        console.log(`✅ Created consultant profile: ${profile.title} in ${profile.city}`);
        console.log(`   📍 Location: ${profile.city}, Pakistan`);
        console.log(`   🎯 Specialization: ${profile.specialization}`);
        console.log(`   💰 Hourly Rate: PKR ${profile.hourlyRate}`);
        console.log(`   ⭐ Rating: ${consultant.averageRating}/5 (${consultant.totalReviews} reviews)`);
        console.log('');

        successCount++;
      } catch (error: any) {
        console.error(`❌ Error creating ${profile.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('📊 SEEDING SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Successfully created: ${successCount} consultants`);
    console.log(`⏭️  Skipped (already exist): ${skipCount} consultants`);
    console.log(`❌ Errors: ${errorCount} consultants`);
    console.log('');
    console.log('📍 Cities distribution:');
    const cityCounts = consultantProfiles.reduce((acc, p) => {
      acc[p.city] = (acc[p.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    Object.entries(cityCounts).forEach(([city, count]) => {
      console.log(`   ${city}: ${count} consultants`);
    });
    console.log('');
    console.log('🎯 Specialization distribution:');
    const specCounts: Record<string, number> = {};
    consultantProfiles.forEach(p => {
      specCounts[p.specialization] = (specCounts[p.specialization] || 0) + 1;
    });
    Object.entries(specCounts).forEach(([spec, count]) => {
      console.log(`   ${spec}: ${count} consultants`);
    });
    console.log('');
    console.log('🔑 Default login credentials:');
    console.log(`   Email: [any consultant email from above]`);
    console.log(`   Password: ${defaultPassword}`);
    console.log('═══════════════════════════════════════════');

    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('💥 Fatal error during seeding:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the seeding function
seedConsultants();
