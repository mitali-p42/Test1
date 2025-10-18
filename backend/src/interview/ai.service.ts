import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AIService {
  private groq: Groq;
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    const groqKey = this.config.get<string>('GROQ_API_KEY');
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');

    if (!groqKey) console.warn('⚠️  GROQ_API_KEY not set');
    if (!openaiKey) console.warn('⚠️  OPENAI_API_KEY not set');

    this.groq = new Groq({ apiKey: groqKey || 'dummy' });
    this.openai = new OpenAI({ apiKey: openaiKey || 'dummy' });
  }

  // 🎤 STT: Transcribe audio using Groq Whisper
  async transcribeAudio(audioBuffer: Buffer, filename: string = 'audio.webm'): Promise<string> {
    try {
      // Groq expects a File-like object
      const tempPath = path.join('/tmp', filename);
      fs.writeFileSync(tempPath, audioBuffer);

      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(tempPath),
        model: 'whisper-large-v3-turbo',
        language: 'en',
        response_format: 'text',
      });

      // Clean up temp file
      fs.unlinkSync(tempPath);

      return typeof transcription === 'string' ? transcription : transcription.text || '';
    } catch (error: any) {
      console.error('Groq STT error:', error.message);
      throw new Error('Transcription failed');
    }
  }

  // 🤖 LLM: Generate interview question using Groq Llama
  async generateQuestion(
    role: string,
    interviewType: string,
    yearsOfExperience: number | string,
    questionNumber: number,
  ): Promise<string> {
    try {
      const prompt = `You are an expert technical interviewer conducting a ${interviewType} interview for a ${role} position.

The candidate has ${yearsOfExperience} years of experience.

Generate interview question #${questionNumber} (out of 5):
- Tailor difficulty to their experience level
- Focus on ${interviewType} aspects relevant to ${role}
- Make it conversational and engaging
- Keep it under 50 words

Return ONLY the question text, no numbering.`;

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert interviewer. Generate one clear, focused question.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 150,
      });

      const question = completion.choices[0]?.message?.content?.trim();
      return question || `Tell me about your experience as a ${role}.`;
    } catch (error: any) {
      console.error('Groq LLM error:', error.message);
      return `Question ${questionNumber}: Describe a challenging project from your ${role} experience.`;
    }
  }

  // 🎯 LLM: Evaluate answer using Groq Llama
  async evaluateAnswer(
    question: string,
    answer: string,
    role: string,
    yearsOfExperience: number | string,
  ): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }> {
    try {
      const prompt = `You are evaluating a ${role} interview answer from a candidate with ${yearsOfExperience} years of experience.

Question: ${question}
Answer: ${answer}

Provide evaluation as JSON:
{
  "score": <0-100>,
  "feedback": "<2-3 sentences>",
  "strengths": ["<point 1>", "<point 2>"],
  "improvements": ["<suggestion 1>", "<suggestion 2>"]
}`;

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an interview evaluator. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);

      return {
        score: result.score || 70,
        feedback: result.feedback || 'Good answer.',
        strengths: result.strengths || [],
        improvements: result.improvements || [],
      };
    } catch (error: any) {
      console.error('Groq evaluation error:', error.message);
      return {
        score: 70,
        feedback: 'Answer received and noted.',
        strengths: ['Clear communication'],
        improvements: ['Could provide more detail'],
      };
    }
  }

  // 🔊 TTS: Convert text to speech using OpenAI
  async textToSpeech(text: string): Promise<Buffer> {
    try {
      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy', // or: echo, fable, onyx, nova, shimmer
        input: text,
        speed: 1.0,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer;
    } catch (error: any) {
      console.error('OpenAI TTS error:', error.message);
      throw new Error('Text-to-speech failed');
    }
  }
}