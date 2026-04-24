import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { TimeOffStatus } from '../common/enums/time-off-status.enum';
import { BatchSyncHcmBalancesDto } from './dto/batch-sync-hcm-balances.dto';
import { CreateTimeOffDto } from './dto/create-time-off.dto';
import { LeaveBalanceDimensionsDto } from './dto/leave-balance-dimensions.dto';
import { SyncHcmBalanceDto } from './dto/sync-hcm-balance.dto';
import { UpsertLeaveBalanceDto } from './dto/upsert-leave-balance.dto';
import { UpdateTimeOffStatusDto } from './dto/update-time-off-status.dto';
import { TimeOffService } from './time-off.service';

@Controller('time-off-requests')
export class TimeOffController {
  constructor(private readonly service: TimeOffService) {}

  @Post()
  create(@Body() dto: CreateTimeOffDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: TimeOffStatus) {
    return this.service.findAll(status);
  }

  @Get('balances/:employeeId')
  getBalance(@Param('employeeId') employeeId: string, @Query() dimensions: LeaveBalanceDimensionsDto) {
    return this.service.getBalance(employeeId, dimensions);
  }

  @Patch('balances/:employeeId')
  upsertBalance(@Param('employeeId') employeeId: string, @Body() dto: UpsertLeaveBalanceDto) {
    return this.service.upsertBalance(employeeId, dto);
  }

  @Post('balances/sync-hcm')
  syncHcmBalance(@Body() dto: SyncHcmBalanceDto) {
    return this.service.syncHcmBalance(dto);
  }

  @Post('balances/sync-hcm-batch')
  batchSyncHcmBalances(@Body() dto: BatchSyncHcmBalancesDto) {
    return this.service.batchSyncHcmBalances(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTimeOffStatusDto) {
    return this.service.updateStatus(id, dto);
  }
}
