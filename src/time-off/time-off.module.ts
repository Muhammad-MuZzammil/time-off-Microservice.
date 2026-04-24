import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeOffController } from './time-off.controller';
import { HcmGateway } from './hcm.gateway';
import { LeaveBalance } from './leave-balance.entity';
import { TimeOffRequest } from './time-off.entity';
import { TimeOffService } from './time-off.service';

@Module({
  imports: [TypeOrmModule.forFeature([TimeOffRequest, LeaveBalance])],
  controllers: [TimeOffController],
  providers: [TimeOffService, HcmGateway],
})
export class TimeOffModule {}
