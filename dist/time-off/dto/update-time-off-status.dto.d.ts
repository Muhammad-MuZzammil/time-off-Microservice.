import { TimeOffStatus } from '../../common/enums/time-off-status.enum';
export declare class UpdateTimeOffStatusDto {
    status: TimeOffStatus;
    reviewComment?: string;
}
