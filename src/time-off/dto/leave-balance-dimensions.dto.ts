import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LeaveBalanceDimensionsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  locationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  leaveType?: string;
}
