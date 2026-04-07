// import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
// import { UsersService } from './users.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { FilterUserDto } from './dto/filter-user.dto';

// @Controller('users')
// export class UsersController {
//   constructor(private readonly usersService: UsersService) {}

//   @Post('create')
//   create(@Body() createUserDto: CreateUserDto) {
//     return this.usersService.createUser(createUserDto);
//   }

//   @Get()
//   findAll(@Query() filterDto: FilterUserDto) {
//     console.log('Filtering users with criteria:', filterDto);
//     return this.usersService.findAll(filterDto);
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.usersService.findUserByID(parseInt(id));
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
//     return this.usersService.updateUser(parseInt(id), updateUserDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.usersService.deleteUser(parseInt(id));
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
  HttpStatus
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
    console.log('Filtering users with criteria:', filterDto);
    return this.usersService.findAll(filterDto);
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
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  /**
   * Assign a user to a company
   * Use this endpoint to assign a company after user creation
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
   * Sets the company relationship to null
   */
  @Patch(':id/remove-company')
  removeCompany(@Param('id', ParseIntPipe) userId: number) {
    return this.usersService.removeUserFromCompany(userId);
  }

  /**
   * Get all users belonging to a specific company
   */
  @Get('company/:companyId')
  getUsersByCompany(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.usersService.findUsersByCompany(companyId);
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