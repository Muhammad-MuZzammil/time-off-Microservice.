import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTimeOffDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  locationId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  leaveType: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
