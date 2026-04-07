import { Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { response } from 'express';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>) { }

  create(createProfileDto: CreateProfileDto) {
    if (createProfileDto.dateOfBirth && createProfileDto.dateOfBirth > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }

  }

  public async findAllProfiles() {

    const profiles = await this.profileRepository.find({
      relations: ['user'],
    });


   console.log('Profiles fetched:', profiles);
    return {
      status: 'success',
      statusCode: 200,
      message: 'Profiles fetched successfully',
      profiles,
    };

  }

  findOne(id: number) {
    return `This action returns a #${id} profile`;
  }

  update(id: number, updateProfileDto: UpdateProfileDto) {
    return `This action updates a #${id} profile`;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
