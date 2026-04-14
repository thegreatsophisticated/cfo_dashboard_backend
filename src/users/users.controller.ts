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
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user
   * Optionally assign to a company by including companyId in the request body
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  /**
   * Get all users with optional filtering and pagination
   */
  @Get()
  findAll(@Query() filterDto: FilterUserDto) {
    return this.usersService.findAll(filterDto);
  }

  /**
   * Get all users belonging to a specific company
   * NOTE: Must be declared BEFORE @Get(':id') to avoid route conflict
   */
  @Get('company/:companyId')
  getUsersByCompany(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.usersService.findUsersByCompany(companyId);
  }

  /**
   * Get a specific user by ID
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findUserByID(id);
  }

  /**
   * Update user details
   * Can also update company assignment by including companyId
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  /**
   * Assign a user to a company
   * NOTE: Must be declared BEFORE @Patch(':id') to avoid route conflict
   */
  @Patch(':id/assign-company/:companyId')
  assignCompany(
    @Param('id', ParseIntPipe) userId: number,
    @Param('companyId', ParseIntPipe) companyId: number,
  ) {
    return this.usersService.assignUserToCompany(userId, companyId);
  }

  /**
   * Remove a user from their company
   * NOTE: Must be declared BEFORE @Patch(':id') to avoid route conflict
   */
  @Patch(':id/remove-company')
  removeCompany(@Param('id', ParseIntPipe) userId: number) {
    return this.usersService.removeUserFromCompany(userId);
  }

  /**
   * Soft delete a user
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
