type HcmValidationPayload = {
    employeeId: string;
    locationId: string;
    leaveType: string;
    requestedDays: number;
    hcmBalance: number;
};
type HcmValidationResult = {
    accepted: boolean;
    code?: 'INVALID_DIMENSIONS' | 'INSUFFICIENT_BALANCE';
    message?: string;
};
export declare class HcmGateway {
    validateRealtimeRequest(payload: HcmValidationPayload): Promise<HcmValidationResult>;
}
export {};
