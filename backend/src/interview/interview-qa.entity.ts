import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InterviewSession } from './interview-session.entity';

@Entity({ name: 'interview_qa' })
export class InterviewQA {
  @PrimaryGeneratedColumn('uuid', { name: 'qa_id' })
  qaId!: string;

  @Column('uuid', { name: 'session_id' })
  sessionId!: string;

  @ManyToOne(() => InterviewSession)
  @JoinColumn({ name: 'session_id' })
  session!: InterviewSession;

  @Column({ name: 'question_number', type: 'int' })
  questionNumber!: number;

  @Column({ name: 'question', type: 'text' })
  question!: string;

  @Column({ name: 'answer', type: 'text', nullable: true })
  answer!: string | null;

  @Column({ name: 'transcript', type: 'text', nullable: true })
  transcript!: string | null;

  // JSONB column for AI evaluation results
  @Column({ name: 'evaluation', type: 'jsonb', nullable: true })
  evaluation!: {
    score?: number;
    feedback?: string;
    strengths?: string[];
    improvements?: string[];
  } | null;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}