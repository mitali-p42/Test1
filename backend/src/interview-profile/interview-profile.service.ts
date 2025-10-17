import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewProfile } from './interview-profile.entity';

@Injectable()
export class InterviewProfileService {
  constructor(
    @InjectRepository(InterviewProfile)
    private readonly repo: Repository<InterviewProfile>,
  ) {}

  async getProfileForUser(userId: string) {
    return await this.repo.findOne({ where: { userId } });
  }
}
