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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveBalance = void 0;
const typeorm_1 = require("typeorm");
let LeaveBalance = class LeaveBalance {
    id;
    employeeId;
    locationId;
    leaveType;
    readyOnBalance;
    hcmBalance;
    lastSyncedAt;
};
exports.LeaveBalance = LeaveBalance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LeaveBalance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'employee_id', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], LeaveBalance.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'location_id', type: 'varchar', length: 50, default: 'DEFAULT' }),
    __metadata("design:type", String)
], LeaveBalance.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'leave_type', type: 'varchar', length: 50, default: 'ANNUAL' }),
    __metadata("design:type", String)
], LeaveBalance.prototype, "leaveType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ready_on_balance', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], LeaveBalance.prototype, "readyOnBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hcm_balance', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], LeaveBalance.prototype, "hcmBalance", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_synced_at' }),
    __metadata("design:type", Date)
], LeaveBalance.prototype, "lastSyncedAt", void 0);
exports.LeaveBalance = LeaveBalance = __decorate([
    (0, typeorm_1.Entity)({ name: 'leave_balances' }),
    (0, typeorm_1.Unique)('uq_leave_balance_dimension', ['employeeId', 'locationId', 'leaveType'])
], LeaveBalance);
//# sourceMappingURL=leave-balance.entity.js.map