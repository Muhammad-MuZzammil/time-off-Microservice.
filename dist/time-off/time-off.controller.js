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
exports.TimeOffController = void 0;
const common_1 = require("@nestjs/common");
const time_off_status_enum_1 = require("../common/enums/time-off-status.enum");
const batch_sync_hcm_balances_dto_1 = require("./dto/batch-sync-hcm-balances.dto");
const create_time_off_dto_1 = require("./dto/create-time-off.dto");
const leave_balance_dimensions_dto_1 = require("./dto/leave-balance-dimensions.dto");
const sync_hcm_balance_dto_1 = require("./dto/sync-hcm-balance.dto");
const upsert_leave_balance_dto_1 = require("./dto/upsert-leave-balance.dto");
const update_time_off_status_dto_1 = require("./dto/update-time-off-status.dto");
const time_off_service_1 = require("./time-off.service");
let TimeOffController = class TimeOffController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findAll(status) {
        return this.service.findAll(status);
    }
    getBalance(employeeId, dimensions) {
        return this.service.getBalance(employeeId, dimensions);
    }
    upsertBalance(employeeId, dto) {
        return this.service.upsertBalance(employeeId, dto);
    }
    syncHcmBalance(dto) {
        return this.service.syncHcmBalance(dto);
    }
    batchSyncHcmBalances(dto) {
        return this.service.batchSyncHcmBalances(dto);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    updateStatus(id, dto) {
        return this.service.updateStatus(id, dto);
    }
};
exports.TimeOffController = TimeOffController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_time_off_dto_1.CreateTimeOffDto]),
    __metadata("design:returntype", void 0)
], TimeOffController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TimeOffController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('balances/:employeeId'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, leave_balance_dimensions_dto_1.LeaveBalanceDimensionsDto]),
    __metadata("design:returntype", void 0)
], TimeOffController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Patch)('balances/:employeeId'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_leave_balance_dto_1.UpsertLeaveBalanceDto]),
    __metadata("design:returntype", void 0)
], TimeOffController.prototype, "upsertBalance", null);
__decorate([
    (0, common_1.Post)('balances/sync-hcm'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sync_hcm_balance_dto_1.SyncHcmBalanceDto]),
    __metadata("design:returntype", void 0)
], TimeOffController.prototype, "syncHcmBalance", null);
__decorate([
    (0, common_1.Post)('balances/sync-hcm-batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [batch_sync_hcm_balances_dto_1.BatchSyncHcmBalancesDto]),
    __metadata("design:returntype", void 0)
], TimeOffController.prototype, "batchSyncHcmBalances", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TimeOffController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_time_off_status_dto_1.UpdateTimeOffStatusDto]),
    __metadata("design:returntype", void 0)
], TimeOffController.prototype, "updateStatus", null);
exports.TimeOffController = TimeOffController = __decorate([
    (0, common_1.Controller)('time-off-requests'),
    __metadata("design:paramtypes", [time_off_service_1.TimeOffService])
], TimeOffController);
//# sourceMappingURL=time-off.controller.js.map