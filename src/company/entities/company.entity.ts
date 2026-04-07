// import { Transaction, TransactionType } from "src/transaction/entities/transaction.entity";
// import { User } from "src/users/entities/user.entity";

// import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// @Entity('companies')
// export class Company {
//     @PrimaryGeneratedColumn()
//     id: number;

//     @Column()
//     name: string;

//     @Column({ nullable: true })
//     description: string;

//     @Column({ nullable: true })
//     employeeCount: number;

//     @Column({ nullable: true })
//     establishedDate: Date;

//     @Column()
//     companyType: string;

//     @Column({ nullable: true })
//     industry: string;

//     @Column({ nullable: true })
//     email: string;

//     @Column({ nullable: true })
//     phoneNumber: string;

//     @Column({ nullable: true })
//     website: string;

//     @Column({ nullable: true })
//     taxId: string;

//     @Column({ nullable: true })
//     registrationNumber: string;

//     @Column({
//         default: true,

//     })
//     isActive: boolean;

//     @Column({ nullable: true })
//     annualRevenue: number;

//     @Column({ nullable: true })
//     ceo: string;

//     @Column({ nullable: true })
//     notes: string;

//     @CreateDateColumn()
//     createdAt: Date;

//     @UpdateDateColumn()
//     updatedAt: Date;

//     @DeleteDateColumn()
//     deletedAt: Date;

//     // many-to-one relationship with user
//     @ManyToOne(() => User, (user) => user.companies,)
//     createdBy?: User;

//     @OneToMany(() => Transaction, (transaction) => transaction.company)
//     transactions: Transaction [];

// }


import { Transaction } from "src/transaction/entities/transaction.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('companies')
export class Company {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    employeeCount: number;

    @Column({ nullable: true })
    establishedDate: Date;

    @Column()
    companyType: string;

    @Column({ nullable: true })
    industry: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    website: string;

    @Column({ nullable: true })
    taxId: string;

    @Column({ nullable: true })
    registrationNumber: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    annualRevenue: number;

    @Column({ nullable: true })
    ceo: string;

    @Column({ nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    // User who created this company
    @ManyToOne(() => User, (user) => user.companiesCreated)
    createdBy?: User;

    // NEW: Users employed by this company
    @OneToMany(() => User, (user) => user.company)
    employees?: User[];

    @OneToMany(() => Transaction, (transaction) => transaction.company)
    transactions: Transaction[];
}