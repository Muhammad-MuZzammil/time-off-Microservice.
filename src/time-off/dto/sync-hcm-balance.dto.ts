import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SyncHcmBalanceDto {
  @IsString()
  @MaxLength(50)
  employeeId: string;

  @IsString()
  @MaxLength(50)
  locationId: string;

  @IsString()
  @MaxLength(50)
  leaveType: string;

  @IsNumber()
  @Min(0)
  hcmBalance: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reconcileReadyOn?: boolean;
}
