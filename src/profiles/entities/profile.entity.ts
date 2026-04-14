import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    nullable: true,
    type: 'varchar',
  })
  gender: string;
  @Column({
    nullable: true,
    type: 'varchar',
  })
  maritalStatus: string;
  // position
  @Column({
    nullable: true,
    type: 'varchar',
  })
  position: string;
  // dob
  @Column({
    nullable: true,
    type: 'date',
  })
  dateOfBirth: Date;
  // profile image /binary
  @Column({
    nullable: true,
    type: 'bytea',
  })
  profileImage: Buffer;

  // one to one relation with user
  @OneToOne(() => User, (user) => user.profile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;
}
