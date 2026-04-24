import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TimeOffStatus } from '../../common/enums/time-off-status.enum';

export class UpdateTimeOffStatusDto {
  @IsEnum(TimeOffStatus)
  status: TimeOffStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewComment?: string;
}
