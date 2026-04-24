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
export declare class TimeOffService {
    private readonly repository;
    private readonly balanceRepository;
    private readonly hcmGateway;
    constructor(repository: Repository<TimeOffRequest>, balanceRepository: Repository<LeaveBalance>, hcmGateway: HcmGateway);
    create(dto: CreateTimeOffDto): Promise<TimeOffRequest>;
    findAll(status?: TimeOffStatus): Promise<TimeOffRequest[]>;
    findOne(id: number): Promise<TimeOffRequest>;
    updateStatus(id: number, dto: UpdateTimeOffStatusDto): Promise<TimeOffRequest>;
    getBalance(employeeId: string, dimensions: LeaveBalanceDimensionsDto): Promise<LeaveBalance>;
    upsertBalance(employeeId: string, dto: UpsertLeaveBalanceDto): Promise<LeaveBalance>;
    syncHcmBalance(dto: SyncHcmBalanceDto): Promise<LeaveBalance>;
    batchSyncHcmBalances(dto: BatchSyncHcmBalancesDto): Promise<{
        updated: number;
    }>;
    private validateDateRange;
    private calculateRequestedDays;
    private getOrCreateBalance;
    private ensureSyncedBalance;
}
