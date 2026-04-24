import { Injectable } from '@nestjs/common';

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

@Injectable()
export class HcmGateway {
  async validateRealtimeRequest(payload: HcmValidationPayload): Promise<HcmValidationResult> {
    if (!payload.employeeId || !payload.locationId || !payload.leaveType) {
      return {
        accepted: false,
        code: 'INVALID_DIMENSIONS',
        message: 'HCM rejected request due to missing dimensions',
      };
    }

    if (payload.requestedDays > payload.hcmBalance) {
      return {
        accepted: false,
        code: 'INSUFFICIENT_BALANCE',
        message: 'HCM reported insufficient balance',
      };
    }

    return { accepted: true };
  }
}
