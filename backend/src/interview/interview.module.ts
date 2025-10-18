import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewSession } from './interview-session.entity';
import { InterviewQA } from './interview-qa.entity';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { AIService } from './ai.service';

@Module({
  imports: [TypeOrmModule.forFeature([InterviewSession, InterviewQA])],
  controllers: [InterviewController],
  providers: [InterviewService, AIService],
  exports: [InterviewService],
})
export class InterviewModule {}