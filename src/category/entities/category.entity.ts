// import { Transaction } from "src/transaction/entities/transaction.entity";
// import { User } from "src/users/entities/user.entity";

import { Transaction } from '../../transaction/entities/transaction.entity';
import { User } from '../../users/entities/user.entity';

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';

export enum CategoryLevel {
  MAIN = 'main', // Level 1: e.g., "Capital", "Retained Earnings"
  SUB = 'sub', // Level 2: e.g., "Share Capital", "General Reserves"
  SUB_SUB = 'sub_sub', // Level 3: e.g., "Issued Subscribed & Paid Up Share Capital"
}

export enum CategoryType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
  COST_OF_SALES = 'cost_of_sales',
}

@Entity('categories')
@Tree('materialized-path')
@Index(['code'])
@Index(['level'])
@Index(['categoryType'])
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  // Unique category code (e.g., 100, 1000, 100010)
  @Column({ unique: true, nullable: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Category hierarchy level
  @Column({
    type: 'enum',
    enum: CategoryLevel,
    default: CategoryLevel.MAIN,
  })
  level: CategoryLevel;

  // Category type for financial reporting
  @Column({
    type: 'enum',
    enum: CategoryType,
    nullable: true,
  })
  categoryType: CategoryType;

  // For ordering within same level
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  // Track if this category can have transactions directly
  // Usually only leaf categories (sub_sub) should allow transactions
  @Column({ default: false })
  allowTransactions: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Tree structure for parent-child relationships
  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category;

  // Relationships
  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions: Transaction[];

  @ManyToOne(() => User, (user) => user.categories, { nullable: true })
  createdBy: User;

  // Virtual property to get full path
  getFullPath(): string {
    const paths: string[] = [this.name];
    let current = this.parent;

    while (current) {
      paths.unshift(current.name);
      current = current.parent;
    }

    return paths.join(' > ');
  }

  // Virtual property to determine if this is a leaf node (can accept transactions)
  isLeafCategory(): boolean {
    return this.level === CategoryLevel.SUB_SUB || this.allowTransactions;
  }
}
