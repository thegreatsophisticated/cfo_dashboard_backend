import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFullSchema1738683847000 implements MigrationInterface {
    name = 'CreateFullSchema1738683847000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ENUM types first
        await queryRunner.query(`
            CREATE TYPE "public"."transactions_transactiontype_enum" AS ENUM('debit', 'credit')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'completed', 'reconciled', 'cancelled')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "public"."transactions_paymentmethod_enum" AS ENUM('cash', 'bank_transfer', 'cheque', 'mobile_money', 'credit_card', 'debit_card', 'other')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "public"."categories_level_enum" AS ENUM('main', 'sub', 'sub_sub')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "public"."categories_categorytype_enum" AS ENUM('asset', 'liability', 'equity', 'revenue', 'expense', 'cost_of_sales')
        `);

        // Create Users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "name" character varying NOT NULL,
                "role" character varying NOT NULL DEFAULT 'user',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
            )
        `);

        // Create Profiles table
        await queryRunner.query(`
            CREATE TABLE "profiles" (
                "id" SERIAL NOT NULL,
                "bio" text,
                "avatar" character varying,
                "phone" character varying,
                "address" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer,
                CONSTRAINT "REL_profiles_userId" UNIQUE ("userId"),
                CONSTRAINT "PK_profiles_id" PRIMARY KEY ("id")
            )
        `);

        // Create Companies table
        await queryRunner.query(`
            CREATE TABLE "companies" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "email" character varying,
                "phone" character varying,
                "address" character varying,
                "taxId" character varying,
                "registrationNumber" character varying,
                "website" character varying,
                "logo" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "PK_companies_id" PRIMARY KEY ("id")
            )
        `);

        // Create Categories table
        await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" SERIAL NOT NULL,
                "code" character varying NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "level" "public"."categories_level_enum" NOT NULL,
                "categoryType" "public"."categories_categorytype_enum" NOT NULL,
                "sortOrder" integer NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "allowTransactions" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "parentId" integer,
                CONSTRAINT "UQ_categories_code" UNIQUE ("code"),
                CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
            )
        `);

        // Create index on category code
        await queryRunner.query(`
            CREATE INDEX "IDX_categories_code" ON "categories" ("code")
        `);

        // Create Transactions table
        await queryRunner.query(`
            CREATE TABLE "transactions" (
                "id" SERIAL NOT NULL,
                "date" date NOT NULL,
                "transactionType" "public"."transactions_transactiontype_enum" NOT NULL,
                "amount" numeric(15,2) NOT NULL,
                "description" character varying NOT NULL,
                "referenceNumber" character varying,
                "paymentMethod" "public"."transactions_paymentmethod_enum" NOT NULL DEFAULT 'cash',
                "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'completed',
                "counterparty" character varying,
                "invoiceNumber" character varying,
                "dueDate" date,
                "taxAmount" numeric(15,2) NOT NULL DEFAULT '0',
                "taxRate" numeric(5,2) NOT NULL DEFAULT '0',
                "totalAmount" numeric(15,2) NOT NULL,
                "reconciledAt" date,
                "notes" text,
                "attachments" json,
                "isRecurring" boolean NOT NULL DEFAULT false,
                "recurringFrequency" character varying,
                "financialYear" integer NOT NULL,
                "financialPeriod" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "companyId" integer NOT NULL,
                "categoryId" integer NOT NULL,
                "createdById" integer NOT NULL,
                "reconciledById" integer,
                CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id")
            )
        `);

        // Create indexes on transactions
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_company_date" ON "transactions" ("companyId", "date")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_company_category" ON "transactions" ("companyId", "categoryId")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_company_type" ON "transactions" ("companyId", "transactionType")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_company_status" ON "transactions" ("companyId", "status")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_financial_period" ON "transactions" ("financialYear", "financialPeriod")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_date" ON "transactions" ("date")
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "profiles" 
            ADD CONSTRAINT "FK_profiles_users" 
            FOREIGN KEY ("userId") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "categories" 
            ADD CONSTRAINT "FK_categories_parent" 
            FOREIGN KEY ("parentId") 
            REFERENCES "categories"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "transactions" 
            ADD CONSTRAINT "FK_transactions_company" 
            FOREIGN KEY ("companyId") 
            REFERENCES "companies"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "transactions" 
            ADD CONSTRAINT "FK_transactions_category" 
            FOREIGN KEY ("categoryId") 
            REFERENCES "categories"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "transactions" 
            ADD CONSTRAINT "FK_transactions_createdBy" 
            FOREIGN KEY ("createdById") 
            REFERENCES "users"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "transactions" 
            ADD CONSTRAINT "FK_transactions_reconciledBy" 
            FOREIGN KEY ("reconciledById") 
            REFERENCES "users"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_reconciledBy"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_createdBy"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_category"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_company"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_parent"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_profiles_users"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_financial_period"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_company_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_company_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_company_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_company_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_categories_code"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TABLE "users"`);

        // Drop ENUM types
        await queryRunner.query(`DROP TYPE "public"."categories_categorytype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."categories_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_paymentmethod_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_transactiontype_enum"`);
    }
}