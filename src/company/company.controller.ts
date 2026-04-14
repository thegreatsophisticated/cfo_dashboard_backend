import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { FilterCompanyDto } from './dto/filter-company.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)  // ← Applied at controller level
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // POST /company/create
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @Request() req,
  ) {
    console.log('Creating company:', createCompanyDto);
    console.log('Authenticated user:', req.user);
    return this.companyService.createCompany(createCompanyDto, req.user);
  }

  // GET /company
  @Get()
  async findAll(@Query() filters: FilterCompanyDto, @Request() req) {
    return this.companyService.findAll(filters, req.user);
  }

  // GET /company/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.companyService.findOne(id, req.user);
  }

  // PATCH /company/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Request() req,
  ) {
    return this.companyService.update(id, updateCompanyDto, req.user);
  }

  // DELETE /company/:id/soft
  @Delete(':id/soft')
  @Roles('admin')
  async softRemove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.companyService.softRemove(id, req.user);
  }

  // DELETE /company/:id
  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.companyService.remove(id, req.user);
  }

  // POST /company/:id/restore
  @Post(':id/restore')
  @Roles('admin')
  async restore(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.companyService.restore(id, req.user);
  }

  // POST /company/:id/employees/:userId
  @Post(':id/employees/:userId')
  async addEmployee(
    @Param('id', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    return this.companyService.addEmployee(companyId, userId, req.user);
  }

  // DELETE /company/:id/employees/:userId
  @Delete(':id/employees/:userId')
  async removeEmployee(
    @Param('id', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    return this.companyService.removeEmployee(companyId, userId, req.user);
  }

  // GET /company/:id/employees
  @Get(':id/employees')
  async getEmployees(
    @Param('id', ParseIntPipe) companyId: number,
    @Request() req,
  ) {
    return this.companyService.getEmployees(companyId, req.user);
  }

  // GET /company/:id/statistics
  @Get(':id/statistics')
  async getStatistics(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.companyService.getStatistics(id, req.user);
  }

  // PATCH /company/:id/toggle-status
  @Patch(':id/toggle-status')
  async toggleActiveStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.companyService.toggleActiveStatus(id, req.user);
  }
}