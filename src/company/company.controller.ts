// import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
// import { CompanyService } from './company.service';
// import { CreateCompanyDto } from './dto/create-company.dto';
// import { UpdateCompanyDto } from './dto/update-company.dto';

// @Controller('company')
// export class CompanyController {
//   constructor(private readonly companyService: CompanyService) {}

//   @Post('create')
//   create(@Body() createCompanyDto: CreateCompanyDto) {
//     return this.companyService.createCompany(createCompanyDto);
//   }

//   @Get()
//   findAll() {
//     return this.companyService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: number) {
//     return this.companyService.findCompanyByID(id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: number, @Body() updateCompanyDto: UpdateCompanyDto) {
//     return this.companyService.update(id, updateCompanyDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: number) {
//     return this.companyService.remove(id);
//   }
// }





// import { 
//   Controller, 
//   Get, 
//   Post, 
//   Body, 
//   Patch, 
//   Param, 
//   Delete, 
//   Query,
//   ParseIntPipe,
//   HttpCode,
//   HttpStatus
// } from '@nestjs/common';
// import { CompanyService } from './company.service';
// import { CreateCompanyDto } from './dto/create-company.dto';
// import { UpdateCompanyDto } from './dto/update-company.dto';
// import { FilterCompanyDto } from './dto/filter-company.dto';

// @Controller('company')
// export class CompanyController {
//   constructor(private readonly companyService: CompanyService) {}

//   /**
//    * Create a new company
//    */
//   @Post('create')
//   @HttpCode(HttpStatus.CREATED)
//   create(@Body() createCompanyDto: CreateCompanyDto) {
//     return this.companyService.createCompany(createCompanyDto);
//   }

//   /**
//    * Get all companies with filtering and pagination
//    */
//   @Get()
//   findAll(@Query() filterDto: FilterCompanyDto) {
//     return this.companyService.findAll(filterDto);
//   }

//   /**
//    * Get a specific company by ID
//    */
//   @Get(':id')
//   findOne(@Param('id', ParseIntPipe) id: number) {
//     return this.companyService.findOne(id);
//   }

//   /**
//    * Get company statistics
//    */
//   @Get(':id/statistics')
//   getStatistics(@Param('id', ParseIntPipe) id: number) {
//     return this.companyService.getStatistics(id);
//   }

//   /**
//    * Get all employees of a company
//    */
//   @Get(':id/employees')
//   getEmployees(@Param('id', ParseIntPipe) id: number) {
//     return this.companyService.getEmployees(id);
//   }

//   /**
//    * Add an employee to a company
//    */
//   @Patch(':id/add-employee/:userId')
//   addEmployee(
//     @Param('id', ParseIntPipe) companyId: number,
//     @Param('userId', ParseIntPipe) userId: number,
//   ) {
//     return this.companyService.addEmployee(companyId, userId);
//   }

//   /**
//    * Remove an employee from a company
//    */
//   @Patch(':id/remove-employee/:userId')
//   removeEmployee(
//     @Param('id', ParseIntPipe) companyId: number,
//     @Param('userId', ParseIntPipe) userId: number,
//   ) {
//     return this.companyService.removeEmployee(companyId, userId);
//   }

//   /**
//    * Toggle company active status
//    */
//   @Patch(':id/toggle-status')
//   toggleStatus(@Param('id', ParseIntPipe) id: number) {
//     return this.companyService.toggleActiveStatus(id);
//   }

//   /**
//    * Update company details
//    */
//   @Patch(':id')
//   update(
//     @Param('id', ParseIntPipe) id: number, 
//     @Body() updateCompanyDto: UpdateCompanyDto
//   ) {
//     return this.companyService.update(id, updateCompanyDto);
//   }

//   /**
//    * Soft delete a company
//    */
//   @Delete(':id/soft')
//   @HttpCode(HttpStatus.OK)
//   softRemove(@Param('id', ParseIntPipe) id: number) {
//     return this.companyService.softRemove(id);
//   }

//   /**
//    * Permanently delete a company
//    */
//   @Delete(':id')
//   @HttpCode(HttpStatus.OK)
//   remove(@Param('id', ParseIntPipe) id: number) {
//     return this.companyService.remove(id);
//   }

//   /**
//    * Restore a soft-deleted company
//    */
//   @Patch(':id/restore')
//   restore(@Param('id', ParseIntPipe) id: number) {
//     return this.companyService.restore(id);
//   }
// }

import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { FilterCompanyDto } from './dto/filter-company.dto';



import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('company')
@UseGuards(JwtAuthGuard , RolesGuard ) // Apply authentication and role guards
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * Create a new company
   * Admin: Can create for anyone
   * User: Can only create for themselves
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.createCompany(createCompanyDto, currentUser);
  }

  /**
   * Get all companies with filtering and pagination
   * Admin: Gets all companies
   * User: Gets only their assigned company
   */
  @Get()
  findAll(
    @Query() filterDto: FilterCompanyDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.findAll(filterDto, currentUser);
  }

  /**
   * Get a specific company by ID
   * Admin: Can view any company
   * User: Can only view their assigned company
   */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.findOne(id, currentUser);
  }

  /**
   * Get company statistics
   * Admin: Can view any company stats
   * User: Can only view their assigned company stats
   */
  @Get(':id/statistics')
  getStatistics(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.getStatistics(id, currentUser);
  }

  /**
   * Get all employees of a company
   * Admin: Can view any company's employees
   * User: Can only view their assigned company's employees
   */
  @Get(':id/employees')
  getEmployees(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.getEmployees(id, currentUser);
  }

  /**
   * Add an employee to a company
   * Admin: Can add to any company
   * User: Can only add to their assigned company
   */
  @Patch(':id/add-employee/:userId')
  addEmployee(
    @Param('id', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.addEmployee(companyId, userId, currentUser);
  }

  /**
   * Remove an employee from a company
   * Admin: Can remove from any company
   * User: Can only remove from their assigned company
   */
  @Patch(':id/remove-employee/:userId')
  removeEmployee(
    @Param('id', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.removeEmployee(companyId, userId, currentUser);
  }

  /**
   * Toggle company active status
   * Admin: Can toggle any company
   * User: Can only toggle their assigned company
   */
  @Patch(':id/toggle-status')
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.toggleActiveStatus(id, currentUser);
  }

  /**
   * Update company details
   * Admin: Can update any company
   * User: Can only update their assigned company
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.update(id, updateCompanyDto, currentUser);
  }

  /**
   * Soft delete a company
   * Admin only
   */
  @Delete(':id/soft')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  softRemove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.softRemove(id, currentUser);
  }

  /**
   * Permanently delete a company
   * Admin only
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.remove(id, currentUser);
  }

  /**
   * Restore a soft-deleted company
   * Admin only
   */
  @Patch(':id/restore')
  @Roles('admin')
  restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.companyService.restore(id, currentUser);
  }
}