export declare class HcmBalanceRecordDto {
    employeeId: string;
    locationId: string;
    leaveType: string;
    hcmBalance: number;
}
export declare class BatchSyncHcmBalancesDto {
    records: HcmBalanceRecordDto[];
    reconcileReadyOn: boolean;
}
