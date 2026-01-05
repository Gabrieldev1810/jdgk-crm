import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Please provide a user ID');
    process.exit(1);
  }

  console.log(`Cleaning up data for user ${userId}...`);

  // 1. Delete dependent records that enforce foreign key constraints (non-nullable relations)
  
  // Delete Calls (agentId is mandatory)
  const calls = await prisma.call.deleteMany({ where: { agentId: userId } });
  console.log(`Deleted ${calls.count} calls`);

  // Delete Upload Batches (uploadedById is mandatory)
  // Note: UploadErrors cascade delete from UploadBatch, so we don't need to delete them manually
  const uploads = await prisma.uploadBatch.deleteMany({ where: { uploadedById: userId } });
  console.log(`Deleted ${uploads.count} uploads`);
  
  // Delete Account Actions (agentId is mandatory)
  const actions = await prisma.accountAction.deleteMany({ where: { agentId: userId } });
  console.log(`Deleted ${actions.count} account actions`);

  console.log('-----------------------------------');
  console.log('Cleanup complete. You can now delete the user via the API/UI.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
