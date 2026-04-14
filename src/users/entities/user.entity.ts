// import { Category } from "src/category/entities/category.entity";
// import { Company } from "src/company/entities/company.entity";
// import { Profile } from "src/profiles/entities/profile.entity";
// import { Transaction } from "src/transaction/entities/transaction.entity";
// import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// @Entity()
// export class User {
//     @PrimaryGeneratedColumn()
//     id: number;
//     @Column(
//         {
//             nullable: false,
//             type: 'varchar'
//         }
//     )
//     name: string;
//     @Column(
//         {
//             nullable: false,
//             type: 'varchar'
//         }
//     )
//     email: string;
//     @Column(
//         {
//             nullable: false,
//             type: 'varchar',
//             unique: true
//         }
//     )
//      phone: string;
//     @Column({
//         nullable: false,
//         type: 'varchar',
//         unique: true
//     })
//      password: string;

//     @Column({
//         default: 'user',
//         nullable: false,
//         type: 'varchar'
//     })
//     role: string;

//     @OneToOne(() => Profile, (profile) => profile.user, {
//         cascade: ['insert', 'update'],
//         eager: true,
//     } )
//     profile?: Profile;

//     @OneToMany(() => Company, (company) => company.createdBy)
//     companies?: Company[];

//     // Categories created by the user
//     @OneToMany(() => Category, (category) => category.createdBy)
//     categories?: Category[];
//     // transactions created by the user
//     @OneToMany(() => Transaction, (transaction) => transaction.createdBy)
//     transactions?: Transaction[];

//     @CreateDateColumn()
//     createdAt: Date;
//     @UpdateDateColumn()
//     updatedAt: Date;
//     @DeleteDateColumn()
//     deletedAt: Date;
// }

import { Category } from 'src/category/entities/category.entity';
import { Company } from 'src/company/entities/company.entity';
import { Profile } from 'src/profiles/entities/profile.entity';
import { Transaction } from 'src/transaction/entities/transaction.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, type: 'varchar' })
  name: string;

  @Column({ nullable: false, type: 'varchar', unique: true })
  email: string;

  @Column({ nullable: false, type: 'varchar', unique: true })
  phone: string;

  @Column({ nullable: false, type: 'varchar' })
  password: string;

  @Column({ default: 'user', nullable: false, type: 'varchar' })
  role: string;

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: ['insert', 'update'],
    eager: true,
  })
  profile?: Profile;

  // NEW: Many-to-One relationship - User belongs to a Company
  @ManyToOne(() => Company, (company) => company.employees, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @OneToMany(() => Company, (company) => company.createdBy)
  companiesCreated?: Company[];

  @OneToMany(() => Category, (category) => category.createdBy)
  categories?: Category[];

  @OneToMany(() => Transaction, (transaction) => transaction.createdBy)
  transactions?: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
