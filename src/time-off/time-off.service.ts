import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeOffStatus } from '../common/enums/time-off-status.enum';
import { BatchSyncHcmBalancesDto } from './dto/batch-sync-hcm-balances.dto';
import { CreateTimeOffDto } from './dto/create-time-off.dto';
import { LeaveBalanceDimensionsDto } from './dto/leave-balance-dimensions.dto';
import { SyncHcmBalanceDto } from './dto/sync-hcm-balance.dto';
import { UpsertLeaveBalanceDto } from './dto/upsert-leave-balance.dto';
import { UpdateTimeOffStatusDto } from './dto/update-time-off-status.dto';
import { HcmGateway } from './hcm.gateway';
import { LeaveBalance } from './leave-balance.entity';
import { TimeOffRequest } from './time-off.entity';

@Injectable()
export class TimeOffService {
  constructor(
    @InjectRepository(TimeOffRequest)
    private readonly repository: Repository<TimeOffRequest>,
    @InjectRepository(LeaveBalance)
    private readonly balanceRepository: Repository<LeaveBalance>,
    private readonly hcmGateway: HcmGateway,
  ) {}

  async create(dto: CreateTimeOffDto): Promise<TimeOffRequest> {
    this.validateDateRange(dto.startDate, dto.endDate);
    const requestedDays = this.calculateRequestedDays(dto.startDate, dto.endDate);
    const balance = await this.ensureSyncedBalance(dto.employeeId, dto.locationId, dto.leaveType);

    if (balance.hcmBalance < requestedDays) {
      throw new BadRequestException(
        `Insufficient leave balance in HCM. Required: ${requestedDays}, available: ${balance.hcmBalance}.`,
      );
    }
    const hcmValidation = await this.hcmGateway.validateRealtimeRequest({
      employeeId: dto.employeeId,
      locationId: dto.locationId,
      leaveType: dto.leaveType,
      requestedDays,
      hcmBalance: balance.hcmBalance,
    });
    if (!hcmValidation.accepted) {
      throw new BadRequestException(hcmValidation.message ?? 'HCM rejected this request');
    }

    balance.readyOnBalance -= requestedDays;
    await this.balanceRepository.save(balance);

    const request = this.repository.create({
      ...dto,
      requestedDays,
      status: TimeOffStatus.PENDING,
    });

    return this.repository.save(request);
  }

  async findAll(status?: TimeOffStatus): Promise<TimeOffRequest[]> {
    return this.repository.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<TimeOffRequest> {
    const request = await this.repository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Time off request with id ${id} not found`);
    }
    return request;
  }

  async updateStatus(id: number, dto: UpdateTimeOffStatusDto): Promise<TimeOffRequest> {
    if (dto.status === TimeOffStatus.PENDING) {
      throw new BadRequestException('Status cannot be set back to PENDING');
    }

    const request = await this.findOne(id);
    if (request.status !== TimeOffStatus.PENDING) {
      throw new BadRequestException('Only PENDING requests can be reviewed');
    }

    const balance = await this.ensureSyncedBalance(
      request.employeeId,
      request.locationId,
      request.leaveType,
    );
    if (dto.status === TimeOffStatus.REJECTED) {
      balance.readyOnBalance += request.requestedDays;
      await this.balanceRepository.save(balance);
    }

    request.status = dto.status;
    request.reviewComment = dto.reviewComment ?? null;

    return this.repository.save(request);
  }

  async getBalance(employeeId: string, dimensions: LeaveBalanceDimensionsDto): Promise<LeaveBalance> {
    const locationId = dimensions.locationId ?? 'DEFAULT';
    const leaveType = dimensions.leaveType ?? 'ANNUAL';
    return this.getOrCreateBalance(employeeId, locationId, leaveType);
  }

  async upsertBalance(employeeId: string, dto: UpsertLeaveBalanceDto): Promise<LeaveBalance> {
    const balance = await this.getOrCreateBalance(employeeId, dto.locationId, dto.leaveType);
    balance.readyOnBalance = dto.readyOnBalance;
    balance.hcmBalance = dto.hcmBalance;
    return this.balanceRepository.save(balance);
  }

  async syncHcmBalance(dto: SyncHcmBalanceDto): Promise<LeaveBalance> {
    const balance = await this.getOrCreateBalance(dto.employeeId, dto.locationId, dto.leaveType);
    const delta = dto.hcmBalance - balance.hcmBalance;
    const shouldReconcile = dto.reconcileReadyOn ?? true;

    balance.hcmBalance = dto.hcmBalance;
    if (shouldReconcile) {
      balance.readyOnBalance += delta;
      if (balance.readyOnBalance < 0) {
        throw new BadRequestException('Reconciliation would result in a negative ReadyOn balance');
      }
    }

    return this.balanceRepository.save(balance);
  }

  async batchSyncHcmBalances(dto: BatchSyncHcmBalancesDto): Promise<{ updated: number }> {
    for (const record of dto.records) {
      await this.syncHcmBalance({
        employeeId: record.employeeId,
        locationId: record.locationId,
        leaveType: record.leaveType,
        hcmBalance: record.hcmBalance,
        reconcileReadyOn: dto.reconcileReadyOn,
      });
    }
    return { updated: dto.records.length };
  }

  private validateDateRange(startDate: string, endDate: string): void {
    if (new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException('endDate must be greater than or equal to startDate');
    }
  }

  private calculateRequestedDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const millisInDay = 24 * 60 * 60 * 1000;
    return Math.floor((end.getTime() - start.getTime()) / millisInDay) + 1;
  }

  private async getOrCreateBalance(
    employeeId: string,
    locationId: string,
    leaveType: string,
  ): Promise<LeaveBalance> {
    const existing = await this.balanceRepository.findOne({
      where: { employeeId, locationId, leaveType },
    });
    if (existing) {
      return existing;
    }

    const seeded = this.balanceRepository.create({
      employeeId,
      locationId,
      leaveType,
      readyOnBalance: 0,
      hcmBalance: 0,
    });
    return this.balanceRepository.save(seeded);
  }

  private async ensureSyncedBalance(
    employeeId: string,
    locationId: string,
    leaveType: string,
  ): Promise<LeaveBalance> {
    const balance = await this.getOrCreateBalance(employeeId, locationId, leaveType);
    if (balance.readyOnBalance !== balance.hcmBalance) {
      throw new ConflictException(
        'ReadyOn and HCM balances are out of sync. Sync HCM before processing this action.',
      );
    }
    return balance;
  }
}
