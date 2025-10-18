// src/typeorm.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './users/user.entity';
import { InterviewProfile } from './interview-profile/interview-profile.entity';
import { InterviewSession } from './interview/interview-session.entity';  // 👈 NEW
import { InterviewQA } from './interview/interview-qa.entity';  

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: config.get<string>('DATABASE_URL')!,
  applicationName: 'nest-api',
  logging: ['error', 'warn'],          // add 'schema' if you want to see DDL attempts
  synchronize: false,                  // DO NOT let TypeORM alter tables
  migrationsRun: false,
  autoLoadEntities: false,             // avoid loading a duplicate/old User entity
  entities: [User, InterviewProfile, InterviewSession, InterviewQA],  // explicitly list entities we want
});
