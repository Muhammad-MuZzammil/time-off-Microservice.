import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class HcmBalanceRecordDto {
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
}

export class BatchSyncHcmBalancesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HcmBalanceRecordDto)
  records: HcmBalanceRecordDto[];

  @Type(() => Boolean)
  @IsBoolean()
  reconcileReadyOn: boolean;
}
