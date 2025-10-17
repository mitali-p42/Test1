// src/interview-profile/interview-profile.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'interview_profiles' })
export class InterviewProfile {
  @PrimaryGeneratedColumn('uuid', { name: 'interview_id' })
  interviewId!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column({ name: 'email', type: 'text' })
  email!: string;

  @Column({ name: 'role', type: 'text', nullable: true })
  role!: string | null;

  @Column({ name: 'interview_type', type: 'text', nullable: true })
  interviewType!: string | null;

  @Column({
    name: 'years_of_experience',
    type: 'numeric',
    nullable: true,
    transformer: {
      to: (v?: number | null) => v,
      from: (v: string | null) => (v == null ? null : Number(v)),
    },
  })
  yearsOfExperience!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
