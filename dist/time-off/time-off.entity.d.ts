import { TimeOffStatus } from '../common/enums/time-off-status.enum';
export declare class TimeOffRequest {
    id: number;
    employeeId: string;
    locationId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    requestedDays: number;
    status: TimeOffStatus;
    reviewComment?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
