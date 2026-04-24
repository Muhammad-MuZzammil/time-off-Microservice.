import { Column, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'leave_balances' })
@Unique('uq_leave_balance_dimension', ['employeeId', 'locationId', 'leaveType'])
export class LeaveBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id', type: 'varchar', length: 50 })
  employeeId: string;

  @Column({ name: 'location_id', type: 'varchar', length: 50, default: 'DEFAULT' })
  locationId: string;

  @Column({ name: 'leave_type', type: 'varchar', length: 50, default: 'ANNUAL' })
  leaveType: string;

  @Column({ name: 'ready_on_balance', type: 'float', default: 0 })
  readyOnBalance: number;

  @Column({ name: 'hcm_balance', type: 'float', default: 0 })
  hcmBalance: number;

  @UpdateDateColumn({ name: 'last_synced_at' })
  lastSyncedAt: Date;
}
