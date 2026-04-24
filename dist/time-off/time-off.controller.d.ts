import { TimeOffStatus } from '../common/enums/time-off-status.enum';
import { BatchSyncHcmBalancesDto } from './dto/batch-sync-hcm-balances.dto';
import { CreateTimeOffDto } from './dto/create-time-off.dto';
import { LeaveBalanceDimensionsDto } from './dto/leave-balance-dimensions.dto';
import { SyncHcmBalanceDto } from './dto/sync-hcm-balance.dto';
import { UpsertLeaveBalanceDto } from './dto/upsert-leave-balance.dto';
import { UpdateTimeOffStatusDto } from './dto/update-time-off-status.dto';
import { TimeOffService } from './time-off.service';
export declare class TimeOffController {
    private readonly service;
    constructor(service: TimeOffService);
    create(dto: CreateTimeOffDto): Promise<import("./time-off.entity").TimeOffRequest>;
    findAll(status?: TimeOffStatus): Promise<import("./time-off.entity").TimeOffRequest[]>;
    getBalance(employeeId: string, dimensions: LeaveBalanceDimensionsDto): Promise<import("./leave-balance.entity").LeaveBalance>;
    upsertBalance(employeeId: string, dto: UpsertLeaveBalanceDto): Promise<import("./leave-balance.entity").LeaveBalance>;
    syncHcmBalance(dto: SyncHcmBalanceDto): Promise<import("./leave-balance.entity").LeaveBalance>;
    batchSyncHcmBalances(dto: BatchSyncHcmBalancesDto): Promise<{
        updated: number;
    }>;
    findOne(id: number): Promise<import("./time-off.entity").TimeOffRequest>;
    updateStatus(id: number, dto: UpdateTimeOffStatusDto): Promise<import("./time-off.entity").TimeOffRequest>;
}
