"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeOffService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const time_off_status_enum_1 = require("../common/enums/time-off-status.enum");
const hcm_gateway_1 = require("./hcm.gateway");
const leave_balance_entity_1 = require("./leave-balance.entity");
const time_off_entity_1 = require("./time-off.entity");
let TimeOffService = class TimeOffService {
    repository;
    balanceRepository;
    hcmGateway;
    constructor(repository, balanceRepository, hcmGateway) {
        this.repository = repository;
        this.balanceRepository = balanceRepository;
        this.hcmGateway = hcmGateway;
    }
    async create(dto) {
        this.validateDateRange(dto.startDate, dto.endDate);
        const requestedDays = this.calculateRequestedDays(dto.startDate, dto.endDate);
        const balance = await this.ensureSyncedBalance(dto.employeeId, dto.locationId, dto.leaveType);
        if (balance.hcmBalance < requestedDays) {
            throw new common_1.BadRequestException(`Insufficient leave balance in HCM. Required: ${requestedDays}, available: ${balance.hcmBalance}.`);
        }
        const hcmValidation = await this.hcmGateway.validateRealtimeRequest({
            employeeId: dto.employeeId,
            locationId: dto.locationId,
            leaveType: dto.leaveType,
            requestedDays,
            hcmBalance: balance.hcmBalance,
        });
        if (!hcmValidation.accepted) {
            throw new common_1.BadRequestException(hcmValidation.message ?? 'HCM rejected this request');
        }
        balance.readyOnBalance -= requestedDays;
        await this.balanceRepository.save(balance);
        const request = this.repository.create({
            ...dto,
            requestedDays,
            status: time_off_status_enum_1.TimeOffStatus.PENDING,
        });
        return this.repository.save(request);
    }
    async findAll(status) {
        return this.repository.find({
            where: status ? { status } : {},
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const request = await this.repository.findOne({ where: { id } });
        if (!request) {
            throw new common_1.NotFoundException(`Time off request with id ${id} not found`);
        }
        return request;
    }
    async updateStatus(id, dto) {
        if (dto.status === time_off_status_enum_1.TimeOffStatus.PENDING) {
            throw new common_1.BadRequestException('Status cannot be set back to PENDING');
        }
        const request = await this.findOne(id);
        if (request.status !== time_off_status_enum_1.TimeOffStatus.PENDING) {
            throw new common_1.BadRequestException('Only PENDING requests can be reviewed');
        }
        const balance = await this.ensureSyncedBalance(request.employeeId, request.locationId, request.leaveType);
        if (dto.status === time_off_status_enum_1.TimeOffStatus.REJECTED) {
            balance.readyOnBalance += request.requestedDays;
            await this.balanceRepository.save(balance);
        }
        request.status = dto.status;
        request.reviewComment = dto.reviewComment ?? null;
        return this.repository.save(request);
    }
    async getBalance(employeeId, dimensions) {
        const locationId = dimensions.locationId ?? 'DEFAULT';
        const leaveType = dimensions.leaveType ?? 'ANNUAL';
        return this.getOrCreateBalance(employeeId, locationId, leaveType);
    }
    async upsertBalance(employeeId, dto) {
        const balance = await this.getOrCreateBalance(employeeId, dto.locationId, dto.leaveType);
        balance.readyOnBalance = dto.readyOnBalance;
        balance.hcmBalance = dto.hcmBalance;
        return this.balanceRepository.save(balance);
    }
    async syncHcmBalance(dto) {
        const balance = await this.getOrCreateBalance(dto.employeeId, dto.locationId, dto.leaveType);
        const delta = dto.hcmBalance - balance.hcmBalance;
        const shouldReconcile = dto.reconcileReadyOn ?? true;
        balance.hcmBalance = dto.hcmBalance;
        if (shouldReconcile) {
            balance.readyOnBalance += delta;
            if (balance.readyOnBalance < 0) {
                throw new common_1.BadRequestException('Reconciliation would result in a negative ReadyOn balance');
            }
        }
        return this.balanceRepository.save(balance);
    }
    async batchSyncHcmBalances(dto) {
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
    validateDateRange(startDate, endDate) {
        if (new Date(endDate) < new Date(startDate)) {
            throw new common_1.BadRequestException('endDate must be greater than or equal to startDate');
        }
    }
    calculateRequestedDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const millisInDay = 24 * 60 * 60 * 1000;
        return Math.floor((end.getTime() - start.getTime()) / millisInDay) + 1;
    }
    async getOrCreateBalance(employeeId, locationId, leaveType) {
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
    async ensureSyncedBalance(employeeId, locationId, leaveType) {
        const balance = await this.getOrCreateBalance(employeeId, locationId, leaveType);
        if (balance.readyOnBalance !== balance.hcmBalance) {
            throw new common_1.ConflictException('ReadyOn and HCM balances are out of sync. Sync HCM before processing this action.');
        }
        return balance;
    }
};
exports.TimeOffService = TimeOffService;
exports.TimeOffService = TimeOffService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(time_off_entity_1.TimeOffRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(leave_balance_entity_1.LeaveBalance)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        hcm_gateway_1.HcmGateway])
], TimeOffService);
//# sourceMappingURL=time-off.service.js.map