// import { PartialType } from '@nestjs/mapped-types';
// import { CreateUserDto } from './create-user.dto';
// import { IsOptional, IsNumber, Min, MinLength, IsNotEmpty } from 'class-validator';
// import { Type } from 'class-transformer';

// export class UpdateUserDto extends PartialType(CreateUserDto) {
//     @IsNotEmpty({ message: 'ID is required' })
//     id: string;


//     @MinLength(4, { message: 'Name must be at least 4 characters long' })
//     name?: string;

//     @IsOptional()
//     gender?: string;

//     @IsOptional()
//     isMarried?: boolean;
// }
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsInt({ message: 'Company ID must be an integer' })
  @Type(() => Number)
  companyId?: number;
}