import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TimeOffStatus } from '../common/enums/time-off-status.enum';

@Entity({ name: 'time_off_requests' })
export class TimeOffRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id', type: 'varchar', length: 50 })
  employeeId: string;

  @Column({ name: 'location_id', type: 'varchar', length: 50, default: 'DEFAULT' })
  locationId: string;

  @Column({ name: 'leave_type', type: 'varchar', length: 50, default: 'ANNUAL' })
  leaveType: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'requested_days', type: 'int', default: 0 })
  requestedDays: number;

  @Column({ type: 'varchar', length: 20, default: TimeOffStatus.PENDING })
  status: TimeOffStatus;

  @Column({ name: 'review_comment', type: 'text', nullable: true })
  reviewComment?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
