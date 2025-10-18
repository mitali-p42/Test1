import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { InterviewService } from './interview.service';
import { Response } from 'express';

// type AuthedRequest = { user: { sub: string; email: string } };
type RequestUser = { id: string; email: string };
type AuthedRequest = { user: RequestUser };
@Controller('interview')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(private readonly service: InterviewService) {}

  // POST /interview/sessions - Create session
  @Post('sessions')
  async createSession(
    @Req() req: AuthedRequest,
    @Body() body: { role: string; interviewType: string; yearsOfExperience?: number },
  ) {
    return this.service.createSession(
      req.user.id,
      body.role,
      body.interviewType,
      body.yearsOfExperience,
    );
  }

  // PATCH /interview/sessions/:id/start - Start session
  @Patch('sessions/:id/start')
  async startSession(@Param('id') sessionId: string) {
    return this.service.startSession(sessionId);
  }

  // GET /interview/sessions/:id - Get session
  @Get('sessions/:id')
  async getSession(@Param('id') sessionId: string) {
    return this.service.getSession(sessionId);
  }

  // 🆕 POST /interview/sessions/:id/next-question - Generate next question with audio
  @Post('sessions/:id/next-question')
  async nextQuestion(
    @Param('id') sessionId: string,
    @Body() body: { yearsOfExperience?: number | string },
    @Res() res: Response,
  ) {
    try {
      const { question, questionNumber, audioBuffer } = await this.service.generateNextQuestion(
        sessionId,
        body.yearsOfExperience || 0,
      );

      // Send JSON metadata + base64 audio
      res.json({
        question,
        questionNumber,
        audioBase64: audioBuffer.toString('base64'),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  // 🆕 POST /interview/sessions/:id/submit-answer - Upload audio answer
  @Post('sessions/:id/submit-answer')
  @UseInterceptors(FileInterceptor('audio'))
  async submitAnswer(
    @Param('id') sessionId: string,
    @Body() body: { questionNumber: string; yearsOfExperience?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No audio file uploaded');
    }

    const { transcript, evaluation } = await this.service.processAnswer(
      sessionId,
      parseInt(body.questionNumber, 10),
      file.buffer,
      body.yearsOfExperience || 0,
    );

    return { transcript, evaluation };
  }

  // PATCH /interview/sessions/:id/complete - Complete session
  @Patch('sessions/:id/complete')
  async completeSession(@Param('id') sessionId: string) {
    return this.service.completeSession(sessionId);
  }

  // 🆕 GET /interview/sessions/:id/qa - Get all QA
  @Get('sessions/:id/qa')
  async getSessionQAs(@Param('id') sessionId: string) {
    return this.service.getSessionQAs(sessionId);
  }
}
