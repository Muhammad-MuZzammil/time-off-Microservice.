import { IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class UpsertLeaveBalanceDto {
  @IsString()
  @MaxLength(50)
  locationId: string;

  @IsString()
  @MaxLength(50)
  leaveType: string;

  @IsNumber()
  @Min(0)
  readyOnBalance: number;

  @IsNumber()
  @Min(0)
  hcmBalance: number;
}
