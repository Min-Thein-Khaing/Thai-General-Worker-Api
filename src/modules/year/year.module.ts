import { Module } from '@nestjs/common';
import { YearController } from './year.controller.js';
import { YearService } from './providers/year.service.js';

@Module({
  controllers: [YearController],
  providers: [YearService],
})
export class YearModule {}
