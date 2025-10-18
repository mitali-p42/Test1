import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession, InterviewStatus } from './interview-session.entity';
import { InterviewQA } from './interview-qa.entity';
import { AIService } from './ai.service';

@Injectable()
export class InterviewService {
  constructor(
    @InjectRepository(InterviewSession)
    private readonly sessionRepo: Repository<InterviewSession>,
    @InjectRepository(InterviewQA)
    private readonly qaRepo: Repository<InterviewQA>,
    private readonly aiService: AIService, // 👈 NEW
  ) {}

  async createSession(
    userId: string,
    role: string,
    interviewType: string,
    yearsOfExperience?: number,
  ) {
    const session = this.sessionRepo.create({
      userId,
      role,
      interviewType,
      status: InterviewStatus.PENDING,
      totalQuestions: 5,
      currentQuestionIndex: 0,
    });
    return this.sessionRepo.save(session);
  }

  async startSession(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    session.status = InterviewStatus.IN_PROGRESS;
    session.startedAt = new Date();
    return this.sessionRepo.save(session);
  }

  async getSession(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  // 🆕 Generate next question based on profile
  async generateNextQuestion(
    sessionId: string,
    yearsOfExperience: number | string = 0,
  ): Promise<{ question: string; questionNumber: number; audioBuffer: Buffer }> {
    const session = await this.getSession(sessionId);
    const nextNumber = session.currentQuestionIndex + 1;

    if (nextNumber > session.totalQuestions) {
      throw new Error('Interview completed');
    }

    // Generate question using AI
    const question = await this.aiService.generateQuestion(
      session.role,
      session.interviewType,
      yearsOfExperience,
      nextNumber,
    );

    // Save question to DB
    await this.saveQA(sessionId, nextNumber, question);

    // Generate audio for question
    const audioBuffer = await this.aiService.textToSpeech(question);

    // Update current question index
    session.currentQuestionIndex = nextNumber;
    await this.sessionRepo.save(session);

    return { question, questionNumber: nextNumber, audioBuffer };
  }

  // 🆕 Transcribe and save answer
  async processAnswer(
    sessionId: string,
    questionNumber: number,
    audioBuffer: Buffer,
    yearsOfExperience: number | string = 0,
  ): Promise<{ transcript: string; evaluation: any }> {
    // Transcribe audio
    const transcript = await this.aiService.transcribeAudio(audioBuffer, `answer-${Date.now()}.webm`);

    // Get the question
    const qa = await this.qaRepo.findOne({ where: { sessionId, questionNumber } });
    if (!qa) throw new NotFoundException('Question not found');

    // Get session for role info
    const session = await this.getSession(sessionId);

    // Evaluate answer
    const evaluation = await this.aiService.evaluateAnswer(
      qa.question,
      transcript,
      session.role,
      yearsOfExperience,
    );

    // Update QA record
    qa.answer = transcript;
    qa.transcript = transcript;
    qa.evaluation = evaluation;
    await this.qaRepo.save(qa);

    return { transcript, evaluation };
  }

  async saveQA(
    sessionId: string,
    questionNumber: number,
    question: string,
    answer?: string,
    transcript?: string,
  ) {
    const qa = this.qaRepo.create({
      sessionId,
      questionNumber,
      question,
      answer: answer || null,
      transcript: transcript || null,
    });
    return this.qaRepo.save(qa);
  }

  async updateAnswer(qaId: string, answer: string, transcript?: string) {
    await this.qaRepo.update(qaId, {
      answer,
      transcript: transcript || null,
    });
    return this.qaRepo.findOne({ where: { qaId } });
  }

  async completeSession(sessionId: string) {
    const session = await this.getSession(sessionId);
    session.status = InterviewStatus.COMPLETED;
    session.completedAt = new Date();
    return this.sessionRepo.save(session);
  }

  // 🆕 Get all QA for a session
  async getSessionQAs(sessionId: string) {
    return this.qaRepo.find({
      where: { sessionId },
      order: { questionNumber: 'ASC' },
    });
  }
}