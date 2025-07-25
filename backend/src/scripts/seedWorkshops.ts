import { seedAll } from '../utils/seedWorkshops';

async function main() {
  try {
    await seedAll();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

main();