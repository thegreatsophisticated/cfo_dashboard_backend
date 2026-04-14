import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { FilterCompanyDto } from './dto/filter-company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // CREATE COMPANY
  public async createCompany(
    createCompanyDto: CreateCompanyDto,
    currentUser: User,
  ) {
    // Fetch user directly from repository
    const user = await this.userRepository.findOne({
      where: { id: createCompanyDto.createdBy },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createCompanyDto.createdBy} not found`,
      );
    }

    // Only allow users to create company for themselves, unless they're admin
    if (
      currentUser.role !== 'admin' &&
      currentUser.id !== createCompanyDto.createdBy
    ) {
      throw new ForbiddenException(
        'You can only create companies for yourself',
      );
    }

    // Check if company with same name already exists
    const existingCompany = await this.companyRepository.findOne({
      where: { name: createCompanyDto.name },
    });

    if (existingCompany) {
      throw new ConflictException('Company with this name already exists');
    }

    // Check if email already exists (if provided)
    if (createCompanyDto.email) {
      const companyWithEmail = await this.companyRepository.findOne({
        where: { email: createCompanyDto.email },
      });

      if (companyWithEmail) {
        throw new ConflictException('Company with this email already exists');
      }
    }

    // Create company
    const company = this.companyRepository.create({
      ...createCompanyDto,
      createdBy: user,
    });

    await this.companyRepository.save(company);

    // Fetch with relations
    const savedCompany = await this.companyRepository.findOne({
      where: { id: company.id },
      relations: ['createdBy', 'employees'],
    });

    return {
      status: 201,
      message: 'Company created successfully',
      company: savedCompany,
    };
  }

  // READ ALL WITH FILTERING AND PAGINATION - ROLE-BASED ACCESS
  public async findAll(filters?: FilterCompanyDto, currentUser?: User) {
    console.log('currentUser', currentUser);

    const where: FindOptionsWhere<Company> = {};

    // Apply filters
    if (filters?.name && filters.name.trim() !== '') {
      where.name = Like(`%${filters.name.trim()}%`);
    }

    if (filters?.companyType) {
      where.companyType = filters.companyType;
    }

    if (filters?.industry) {
      where.industry = filters.industry;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // ROLE-BASED FILTERING
    // If user is not admin, only show their assigned company
    if (currentUser && currentUser.role !== 'admin') {
      const user = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['company'],
      });

      if (!user || !user.company) {
        return {
          status: 200,
          message: 'No company assigned to you',
          data: [],
          meta: {
            total: 0,
            page: 1,
            limit: filters?.limit || 10,
            totalPages: 0,
          },
        };
      }

      // Add company filter - only show user's assigned company
      where.id = user.company.id;
    }

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;

    const [data, total] = await this.companyRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      relations: ['createdBy', 'employees'],
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      status: 200,
      message: 'Companies retrieved successfully',
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // READ ONE BY ID - ROLE-BASED ACCESS
  public async findOne(id: number, currentUser?: User) {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['createdBy', 'employees', 'employees.profile'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // If user is not admin, verify they belong to this company
    if (currentUser && currentUser.role !== 'admin') {
      const user = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['company'],
      });

      if (!user || !user.company || user.company.id !== id) {
        throw new ForbiddenException('You can only view your assigned company');
      }
    }

    // Remove passwords from employees
    if (company.employees) {
      company.employees = company.employees.map(
        ({ password, ...employee }) => employee as any,
      );
    }

    return {
      status: 200,
      message: 'Company retrieved successfully',
      company,
    };
  }

  // HELPER METHOD - Find company by ID (simple)
  public async findCompanyByID(id: number) {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['createdBy', 'employees'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  // UPDATE COMPANY - ROLE-BASED ACCESS
  public async update(
    id: number,
    updateCompanyDto: UpdateCompanyDto,
    currentUser?: User,
  ) {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['createdBy', 'employees'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // If user is not admin, verify they belong to this company
    if (currentUser && currentUser.role !== 'admin') {
      const user = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['company'],
      });

      if (!user || !user.company || user.company.id !== id) {
        throw new ForbiddenException(
          'You can only update your assigned company',
        );
      }
    }

    // Check for duplicate name (if updating name)
    if (updateCompanyDto.name && updateCompanyDto.name !== company.name) {
      const existingCompany = await this.companyRepository.findOne({
        where: { name: updateCompanyDto.name },
      });

      if (existingCompany && existingCompany.id !== id) {
        throw new ConflictException('Company with this name already exists');
      }
    }

    // Check for duplicate email (if updating email)
    if (updateCompanyDto.email && updateCompanyDto.email !== company.email) {
      const companyWithEmail = await this.companyRepository.findOne({
        where: { email: updateCompanyDto.email },
      });

      if (companyWithEmail && companyWithEmail.id !== id) {
        throw new ConflictException('Company with this email already exists');
      }
    }

    // If updating createdBy, fetch user from repository (admin only)
    if (updateCompanyDto.createdBy) {
      if (currentUser && currentUser.role !== 'admin') {
        throw new ForbiddenException('Only admins can change company creator');
      }

      const user = await this.userRepository.findOne({
        where: { id: updateCompanyDto.createdBy },
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${updateCompanyDto.createdBy} not found`,
        );
      }

      company.createdBy = user;
    }

    // Update other fields
    const { createdBy, ...updateFields } = updateCompanyDto;
    Object.assign(company, updateFields);

    await this.companyRepository.save(company);

    // Fetch updated company with relations
    const updatedCompany = await this.companyRepository.findOne({
      where: { id },
      relations: ['createdBy', 'employees'],
    });

    return {
      status: 200,
      message: 'Company updated successfully',
      company: updatedCompany,
    };
  }

  // ADD EMPLOYEE TO COMPANY
  public async addEmployee(
    companyId: number,
    userId: number,
    currentUser?: User,
  ) {
    const company = await this.findCompanyByID(companyId);

    // If user is not admin, verify they belong to this company
    if (currentUser && currentUser.role !== 'admin') {
      const user = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['company'],
      });

      if (!user || !user.company || user.company.id !== companyId) {
        throw new ForbiddenException(
          'You can only manage employees in your assigned company',
        );
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user already belongs to a company
    if (user.company) {
      throw new ConflictException(
        `User already belongs to company: ${user.company.name}`,
      );
    }

    // Assign user to company
    user.company = company;
    await this.userRepository.save(user);

    return {
      status: 200,
      message: 'Employee added to company successfully',
      company: await this.findOne(companyId, currentUser),
    };
  }

  // REMOVE EMPLOYEE FROM COMPANY
  public async removeEmployee(
    companyId: number,
    userId: number,
    currentUser?: User,
  ) {
    const company = await this.findCompanyByID(companyId);

    // If user is not admin, verify they belong to this company
    if (currentUser && currentUser.role !== 'admin') {
      const user = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['company'],
      });

      if (!user || !user.company || user.company.id !== companyId) {
        throw new ForbiddenException(
          'You can only manage employees in your assigned company',
        );
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.company || user.company.id !== companyId) {
      throw new ConflictException('User does not belong to this company');
    }

    user.company = null;
    await this.userRepository.save(user);

    return {
      status: 200,
      message: 'Employee removed from company successfully',
    };
  }

  // GET COMPANY EMPLOYEES
  public async getEmployees(companyId: number, currentUser?: User) {
    const company = await this.findCompanyByID(companyId);

    // If user is not admin, verify they belong to this company
    if (currentUser && currentUser.role !== 'admin') {
      const user = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['company'],
      });

      if (!user || !user.company || user.company.id !== companyId) {
        throw new ForbiddenException(
          'You can only view employees in your assigned company',
        );
      }
    }

    const employees = await this.userRepository.find({
      where: { company: { id: companyId } },
      relations: ['profile', 'company'],
    });

    // Remove passwords
    const employeesWithoutPasswords = employees.map(
      ({ password, ...employee }) => employee,
    );

    return {
      status: 200,
      message: 'Employees retrieved successfully',
      count: employeesWithoutPasswords.length,
      company: {
        id: company.id,
        name: company.name,
      },
      employees: employeesWithoutPasswords,
    };
  }

  // GET COMPANY STATISTICS
  public async getStatistics(id: number, currentUser?: User) {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['employees', 'transactions'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // If user is not admin, verify they belong to this company
    if (currentUser && currentUser.role !== 'admin') {
      const user = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['company'],
      });

      if (!user || !user.company || user.company.id !== id) {
        throw new ForbiddenException(
          'You can only view statistics for your assigned company',
        );
      }
    }

    return {
      status: 200,
      message: 'Company statistics retrieved successfully',
      statistics: {
        totalEmployees: company.employees?.length || 0,
        totalTransactions: company.transactions?.length || 0,
        isActive: company.isActive,
        companyAge: this.calculateCompanyAge(company.establishedDate),
      },
    };
  }

  // HELPER: Calculate company age
  private calculateCompanyAge(establishedDate: Date): number | null {
    if (!establishedDate) return null;

    const now = new Date();
    const established = new Date(establishedDate);
    const diffTime = Math.abs(now.getTime() - established.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));

    return diffYears;
  }

  // SOFT DELETE - Admin only
  public async softRemove(id: number, currentUser?: User) {
    if (currentUser && currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete companies');
    }

    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    await this.companyRepository.softDelete(id);

    return {
      status: 200,
      message: 'Company soft deleted successfully',
      id,
    };
  }

  // HARD DELETE - Admin only
  public async remove(id: number, currentUser?: User) {
    if (currentUser && currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete companies');
    }

    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['employees'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // Check if company has employees
    if (company.employees && company.employees.length > 0) {
      throw new ConflictException(
        `Cannot delete company with ${company.employees.length} employee(s). Remove employees first.`,
      );
    }

    await this.companyRepository.delete(id);

    return {
      status: 200,
      message: 'Company deleted successfully',
      id,
    };
  }

  // RESTORE SOFT DELETED COMPANY - Admin only
  public async restore(id: number, currentUser?: User) {
    if (currentUser && currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can restore companies');
    }

    await this.companyRepository.restore(id);

    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['createdBy', 'employees'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return {
      status: 200,
      message: 'Company restored successfully',
      company,
    };
  }

  // TOGGLE COMPANY ACTIVE STATUS
  public async toggleActiveStatus(id: number, currentUser?: User) {
    const company = await this.findCompanyByID(id);

    // If user is not admin, verify they belong to this company
    if (currentUser && currentUser.role !== 'admin') {
      const user = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['company'],
      });

      if (!user || !user.company || user.company.id !== id) {
        throw new ForbiddenException(
          'You can only manage your assigned company',
        );
      }
    }

    company.isActive = !company.isActive;
    await this.companyRepository.save(company);

    return {
      status: 200,
      message: `Company ${company.isActive ? 'activated' : 'deactivated'} successfully`,
      company,
    };
  }
}
