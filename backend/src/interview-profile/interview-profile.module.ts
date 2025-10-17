import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewProfile } from './interview-profile.entity';
import { InterviewProfileService } from './interview-profile.service';
import { InterviewProfileController } from './interview-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InterviewProfile])],
  controllers: [InterviewProfileController],
  providers: [InterviewProfileService],
})
export class InterviewProfileModule {}
