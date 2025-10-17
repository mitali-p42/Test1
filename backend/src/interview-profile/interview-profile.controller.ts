// src/interview-profile/interview-profile.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { InterviewProfileService } from './interview-profile.service';

type RequestUser = { sub: string; email: string }; // what JwtStrategy.validate() returns
type AuthedRequest = { user: RequestUser };

@Controller('interview-profile')
export class InterviewProfileController {
  constructor(private readonly service: InterviewProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: AuthedRequest) {
    const profile = await this.service.getProfileForUser(req.user.sub);
    return {
      role: profile?.role ?? '—',
      interviewType: profile?.interviewType ?? '—',
      yearsOfExperience: profile?.yearsOfExperience ?? '—',
    };
  }
}
