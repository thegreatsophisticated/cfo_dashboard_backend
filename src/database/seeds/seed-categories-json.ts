import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../../app.module';
import {
  Category,
  CategoryLevel,
  CategoryType,
} from '../../category/entities/category.entity';
import { User } from '../../users/entities/user.entity';

interface CategoryRow {
  mainCode: string;
  mainName: string;
  subCode: string | null;
  subName: string | null;
  subSubCode: string | null;
  subSubName: string | null;
}

async function seedCategoriesFromJson() {
  console.log('🌱 Starting category seeding from JSON...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const categoryRepository = dataSource.getRepository(Category);
  const userRepository = dataSource.getRepository(User);

  try {
    // Get or create a system user for seeding
    let systemUser = await userRepository.findOne({
      where: { email: 'system@irebe.com' },
    });

    if (!systemUser) {
      systemUser = userRepository.create({
        name: 'System',
        email: 'system@irebe.com',
        phone: '0000000000',
        password: 'system', // Hash this in production
        role: 'admin',
      });
      await userRepository.save(systemUser);
      console.log('✅ Created system user');
    }

    // Read JSON file (place this in your project root)
    const jsonPath = path.join(__dirname, '../../categories-seed-data.json');

    if (!fs.existsSync(jsonPath)) {
      console.log('❌ JSON file not found at:', jsonPath);
      console.log('Please download the categories-import.json file I created');
      console.log(
        'And place it in your project root as categories-seed-data.json',
      );
      process.exit(1);
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const categories: CategoryRow[] = jsonData.categories;

    console.log(`📊 Found ${categories.length} rows to process`);

    // Helper function to determine category type
    const getCategoryType = (code: string): CategoryType => {
      const firstDigit = code.charAt(0);
      switch (firstDigit) {
        case '1':
          return CategoryType.EQUITY;
        case '2':
          return CategoryType.ASSET;
        case '3':
          return CategoryType.LIABILITY;
        case '4':
          return CategoryType.REVENUE;
        case '5':
        case '6':
          return CategoryType.EXPENSE;
        case '7':
          return CategoryType.COST_OF_SALES;
        default:
          return CategoryType.EQUITY;
      }
    };

    const stats = {
      mainCreated: 0,
      subCreated: 0,
      subSubCreated: 0,
      skipped: 0,
    };

    const createdMain = new Map<string, Category>();
    const createdSub = new Map<string, Category>();

    // Process each row
    for (const row of categories) {
      const { mainCode, mainName, subCode, subName, subSubCode, subSubName } =
        row;

      if (!mainCode) continue;

      const categoryType = getCategoryType(mainCode);

      // Create Main Category
      if (!createdMain.has(mainCode)) {
        let mainCategory = await categoryRepository.findOne({
          where: { code: mainCode },
        });

        if (!mainCategory) {
          mainCategory = categoryRepository.create({
            code: mainCode,
            name: mainName,
            level: CategoryLevel.MAIN,
            categoryType,
            allowTransactions: false,
            isActive: true,
            sortOrder: parseInt(mainCode) || 0,
            createdBy: systemUser,
          });

          await categoryRepository.save(mainCategory);
          createdMain.set(mainCode, mainCategory);
          stats.mainCreated++;
          console.log(`✅ Main: ${mainCode} - ${mainName}`);
        } else {
          createdMain.set(mainCode, mainCategory);
        }
      }

      // Create Sub Category
      if (subCode && !createdSub.has(subCode)) {
        let subCategory = await categoryRepository.findOne({
          where: { code: subCode },
        });

        if (!subCategory) {
          const mainCategory = createdMain.get(mainCode);

          subCategory = categoryRepository.create({
            code: subCode,
            name: subName,
            level: CategoryLevel.SUB,
            categoryType,
            parent: mainCategory,
            allowTransactions: false,
            isActive: true,
            sortOrder: parseInt(subCode) || 0,
            createdBy: systemUser,
          });

          await categoryRepository.save(subCategory);
          createdSub.set(subCode, subCategory);
          stats.subCreated++;
          console.log(`  ✅ Sub: ${subCode} - ${subName}`);
        } else {
          createdSub.set(subCode, subCategory);
        }
      }

      // Create Sub-Sub Category
      if (subSubCode) {
        const existingSubSub = await categoryRepository.findOne({
          where: { code: subSubCode },
        });

        if (!existingSubSub) {
          const subCategory = createdSub.get(subCode);

          if (subCategory) {
            const subSubCategory = categoryRepository.create({
              code: subSubCode,
              name: subSubName,
              level: CategoryLevel.SUB_SUB,
              categoryType,
              parent: subCategory,
              allowTransactions: true,
              isActive: true,
              sortOrder: parseInt(subSubCode) || 0,
              createdBy: systemUser,
            });

            await categoryRepository.save(subSubCategory);
            stats.subSubCreated++;
            console.log(`    ✅ SubSub: ${subSubCode} - ${subSubName}`);
          }
        }
      }
    }

    console.log('\n🎉 Seeding completed!');
    console.log('📊 Statistics:');
    console.log(`   Main categories: ${stats.mainCreated}`);
    console.log(`   Sub categories: ${stats.subCreated}`);
    console.log(`   Sub-sub categories: ${stats.subSubCreated}`);
    console.log(`   Skipped: ${stats.skipped}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the seeder
seedCategoriesFromJson()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
