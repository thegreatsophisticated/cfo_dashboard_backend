// import { Injectable, Inject, forwardRef, NotFoundException, ConflictException, InternalServerErrorException } from "@nestjs/common";
// import { CreateUserDto } from "./dto/create-user.dto";
// import { UpdateUserDto } from "./dto/update-user.dto";
// import { FilterUserDto } from "./dto/filter-user.dto";
// import { Repository, Like, FindOptionsWhere } from 'typeorm';
// import { User } from "./entities/user.entity";
// import { InjectRepository } from "@nestjs/typeorm";
// import { Profile } from "src/profiles/entities/profile.entity";
// import { HashingProvider } from "src/auth/provider/hashing.provider";

// @Injectable()
// export class UsersService {

//   constructor(
//     @InjectRepository(User)
//     private userRepository: Repository<User>,

//     @InjectRepository(Profile)
//     private profileRepository: Repository<Profile>,

//     private readonly hashingProvider: HashingProvider,
//   ) {}

//   // find all users with filtering and pagination
//   public async findAll(filters?: FilterUserDto) {
//     const where: FindOptionsWhere<User> = {};

//     if (filters?.name && filters.name.trim() !== '') {
//       where.name = Like(`%${filters.name.trim()}%`);
//     }

//     if (filters?.id && filters.id.trim() !== '') {
//       where.id = parseInt(filters.id);
//     }

//     const page = filters?.page || 1;
//     const limit = filters?.limit || 10;

//     const [data, total] = await this.userRepository.findAndCount({
//       where,
//       skip: (page - 1) * limit,
//       take: limit,
//       relations: ['profile'],
//     });

//     return {
//       data,
//       meta: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     };
//   }

//   // create user
//   public async createUser(createUserDto: CreateUserDto) {
//     // check both email and phone columns separately
//     const existingUser = await this.userRepository.findOne({
//       where: [
//         { email: createUserDto.email },
//         { phone: createUserDto.phone },
//       ],
//     });

//     if (existingUser) {
//       throw new ConflictException('User with this email or phone already exists');
//     }

//     // create and save profile if provided
//     let profile = null;
//     if (createUserDto.profile) {
//       profile = this.profileRepository.create(createUserDto.profile);
//       await this.profileRepository.save(profile);
//     }

//     // create and save user
//     const newUser = this.userRepository.create({
//       ...createUserDto,
//       password: await this.hashingProvider.hashPassword(createUserDto.password),
//       profile,
//     });
//     await this.userRepository.save(newUser);

//     // Remove password from response
//     const { password, ...userWithoutPassword } = newUser;

//     return {
//       status: 201,
//       message: 'User created successfully',
//       user: userWithoutPassword,
//     };
//   }

//   // update user
//   public async updateUser(id: number, updateUserDto: UpdateUserDto) {
//     const user = await this.userRepository.findOne({
//       where: { id },
//       relations: ['profile'],
//     });

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     // Check if email or phone already exists for another user
//     if (updateUserDto.email || updateUserDto.phone) {
//       const existingUser = await this.userRepository.findOne({
//         where: [
//           { email: updateUserDto.email },
//           { phone: updateUserDto.phone },
//         ],
//       });

//       if (existingUser && existingUser.id !== id) {
//         throw new ConflictException('User with this email or phone already exists');
//       }
//     }

//     // Update basic user fields
//     if (updateUserDto.name) user.name = updateUserDto.name;
//     if (updateUserDto.email) user.email = updateUserDto.email;
//     if (updateUserDto.phone) user.phone = updateUserDto.phone;
//     if (updateUserDto.role) user.role = updateUserDto.role;

//     // Update or create profile
//     if (updateUserDto.profile) {
//       if (user.profile) {
//         // Update existing profile
//         Object.assign(user.profile, updateUserDto.profile);
//         await this.profileRepository.save(user.profile);
//       } else {
//         // Create new profile
//         const newProfile = this.profileRepository.create(updateUserDto.profile);
//         await this.profileRepository.save(newProfile);
//         user.profile = newProfile;
//       }
//     }

//     await this.userRepository.save(user);

//     // Remove password from response
//     const { password, ...userWithoutPassword } = user;

//     return {
//       status: 200,
//       message: 'User updated successfully',
//       user: userWithoutPassword,
//     };
//   }

//   // delete user
//   public async deleteUser(id: number) {
//     const user = await this.userRepository.findOneBy({ id });

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     // Soft delete
//     await this.userRepository.softDelete(id);

//     return {
//       status: 200,
//       message: 'User deleted successfully',
//     };
//   }

//   // find user by id
//   public async findUserByID(id: number) {
//     const user = await this.userRepository.findOne({
//       where: { id },
//       relations: ['profile'],
//     });

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     // Remove password from response
//     const { password, ...userWithoutPassword } = user;

//     return {
//       status: 200,
//       message: 'Successful user retrieval',
//       user: userWithoutPassword,
//     };
//   }

//   // find user by email or phone
//   public async findByEmailOrPhone(emailOrPhone: string) {
//     return await this.userRepository.findOne({
//       where: [
//         { email: emailOrPhone },
//         { phone: emailOrPhone },
//       ],
//       relations: ['profile'],
//     });
//   }
// }

import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { FilterUserDto } from "./dto/filter-user.dto";
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { User } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Profile } from "src/profiles/entities/profile.entity";
import { HashingProvider } from "src/auth/provider/hashing.provider";
import { Company } from "src/company/entities/company.entity";

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,

    @InjectRepository(Company )
    private companyRepository: Repository<Company>,

    private readonly hashingProvider: HashingProvider,
  ) {}

  // Find all users with filtering and pagination
  public async findAll(filters?: FilterUserDto) {
    const where: FindOptionsWhere<User> = {};

    if (filters?.name && filters.name.trim() !== '') {
      where.name = Like(`%${filters.name.trim()}%`);
    }

    if (filters?.id && filters.id.trim() !== '') {
      where.id = parseInt(filters.id);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;

    const [data, total] = await this.userRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      relations: ['profile', 'company'],
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Create user
  public async createUser(createUserDto: CreateUserDto) {
    // Check both email and phone columns separately
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { phone: createUserDto.phone },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Verify company exists if companyId is provided
    let company = null;
    if (createUserDto.companyId) {
      company = await this.companyRepository.findOne({ 
        where: { id: createUserDto.companyId } 
      });
      
      if (!company) {
        throw new NotFoundException(`Company with ID ${createUserDto.companyId} not found`);
      }
    }

    // Create and save profile if provided
    let profile = null;
    if (createUserDto.profile) {
      profile = this.profileRepository.create(createUserDto.profile);
      await this.profileRepository.save(profile);
    }

    // Create and save user
    const newUser = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      phone: createUserDto.phone,
      role: createUserDto.role,
      password: await this.hashingProvider.hashPassword(createUserDto.password),
      profile,
      company,
    });
    
    await this.userRepository.save(newUser);

    // Fetch user with relations for response
    const savedUser = await this.userRepository.findOne({
      where: { id: newUser.id },
      relations: ['profile', 'company'],
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = savedUser;

    return {
      status: 201,
      message: 'User created successfully',
      user: userWithoutPassword,
    };
  }

  // Update user
  public async updateUser(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'company'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email or phone already exists for another user
    if (updateUserDto.email || updateUserDto.phone) {
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: updateUserDto.email },
          { phone: updateUserDto.phone },
        ],
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this email or phone already exists');
      }
    }

    // Verify company exists if companyId is provided
    if (updateUserDto.companyId !== undefined) {
      if (updateUserDto.companyId === null) {
        // Remove company assignment
        user.company = null;
      } else {
        const company = await this.companyRepository.findOne({ 
          where: { id: updateUserDto.companyId } 
        });
        
        if (!company) {
          throw new NotFoundException(`Company with ID ${updateUserDto.companyId} not found`);
        }
        user.company = company;
      }
    }

    // Update basic user fields
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.phone) user.phone = updateUserDto.phone;
    if (updateUserDto.role) user.role = updateUserDto.role;

    // Update or create profile
    if (updateUserDto.profile) {
      if (user.profile) {
        Object.assign(user.profile, updateUserDto.profile);
        await this.profileRepository.save(user.profile);
      } else {
        const newProfile = this.profileRepository.create(updateUserDto.profile);
        await this.profileRepository.save(newProfile);
        user.profile = newProfile;
      }
    }

    await this.userRepository.save(user);

    // Fetch updated user with relations
    const updatedUser = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'company'],
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    return {
      status: 200,
      message: 'User updated successfully',
      user: userWithoutPassword,
    };
  }

  // Assign user to company
  public async assignUserToCompany(userId: number, companyId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    user.company = company;
    await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = user;

    return {
      status: 200,
      message: 'User assigned to company successfully',
      user: userWithoutPassword,
    };
  }

  // Remove user from company
  public async removeUserFromCompany(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.company = null;
    await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = user;

    return {
      status: 200,
      message: 'User removed from company successfully',
      user: userWithoutPassword,
    };
  }

  // Delete user
  public async deleteUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.softDelete(id);

    return {
      status: 200,
      message: 'User deleted successfully',
    };
  }

  // Find user by id
  public async findUserByID(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'company'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user;

    return {
      status: 200,
      message: 'Successful user retrieval',
      user: userWithoutPassword,
    };
  }

  // Find user by email or phone
  public async findByEmailOrPhone(emailOrPhone: string) {
    return await this.userRepository.findOne({
      where: [
        { email: emailOrPhone },
        { phone: emailOrPhone },
      ],
      relations: ['profile', 'company'],
    });
  }


  // Add this method to your UsersService class

/**
 * Find all users belonging to a specific company
 */
public async findUsersByCompany(companyId: number) {
  // Verify company exists
  const company = await this.companyRepository.findOne({
    where: { id: companyId },
  });

  if (!company) {
    throw new NotFoundException(`Company with ID ${companyId} not found`);
  }

  const users = await this.userRepository.find({
    where: { company: { id: companyId } },
    relations: ['profile', 'company'],
  });

  // Remove passwords from all users
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);

  return {
    status: 200,
    message: 'Users retrieved successfully',
    count: usersWithoutPasswords.length,
    company: {
      id: company.id,
      name: company.name,
    },
    users: usersWithoutPasswords,
  };
}
}