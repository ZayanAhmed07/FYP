/**
 * Sync Consultant Earnings to Wallets
 * One-time migration script to populate wallet balances from consultant earnings
 */

import mongoose from 'mongoose';
import { Consultant } from '../models/consultant.model';
import Wallet from '../models/wallet.model';
import { User } from '../modules/user/user.model';
import { env } from '../config/env';

const syncConsultantWallets = async () => {
  try {
    console.log('🔄 Starting wallet synchronization...');
    
    // Connect to database
    await mongoose.connect(env.mongodbUri!);
    console.log('✅ Connected to MongoDB');

    // Get all consultants (without populate to avoid User schema issue)
    const consultants = await Consultant.find({});
    console.log(`📊 Found ${consultants.length} consultants`);

    let synced = 0;
    let created = 0;
    let skipped = 0;

    for (const consultant of consultants) {
      if (!consultant.userId) {
        console.log(`⚠️  Skipping consultant ${consultant._id} - no userId`);
        skipped++;
        continue;
      }

      const userId = consultant.userId;
      const totalEarnings = consultant.totalEarnings || 0;

      // Check if wallet exists
      let wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        // Create new wallet
        wallet = await Wallet.create({
          userId,
          availableBalance: totalEarnings,
          pendingBalance: 0,
          totalEarnings,
          totalWithdrawn: 0,
          withdrawalMethods: [],
          transactions: [{
            type: 'deposit',
            description: 'Initial balance from consultant earnings',
            amount: totalEarnings,
            date: new Date(),
          }],
        });
        console.log(`✨ Created wallet for consultant ${consultant._id} - Balance: Rs ${totalEarnings}`);
        created++;
      } else {
        // Update existing wallet if earnings don't match
        if (wallet.totalEarnings !== totalEarnings) {
          const difference = totalEarnings - wallet.totalEarnings;
          wallet.availableBalance += difference;
          wallet.totalEarnings = totalEarnings;
          
          if (difference > 0) {
            wallet.transactions.push({
              type: 'deposit',
              description: 'Sync adjustment from consultant earnings',
              amount: difference,
              date: new Date(),
            } as any);
          }
          
          await wallet.save();
          console.log(`🔄 Updated wallet for consultant ${consultant._id} - Added: Rs ${difference}`);
          synced++;
        } else {
          console.log(`✓ Wallet for consultant ${consultant._id} already in sync`);
        }
      }
    }

    console.log('\n📈 Synchronization Summary:');
    console.log(`   Created: ${created} wallets`);
    console.log(`   Synced: ${synced} wallets`);
    console.log(`   Skipped: ${skipped} consultants`);
    console.log(`   Total: ${consultants.length} consultants processed`);
    console.log('\n✅ Synchronization complete!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing wallets:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
syncConsultantWallets();
