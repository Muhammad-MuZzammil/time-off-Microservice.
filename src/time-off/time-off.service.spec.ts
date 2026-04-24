import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeOffStatus } from '../common/enums/time-off-status.enum';
import { HcmGateway } from './hcm.gateway';
import { LeaveBalance } from './leave-balance.entity';
import { TimeOffRequest } from './time-off.entity';
import { TimeOffService } from './time-off.service';

describe('TimeOffService', () => {
  let service: TimeOffService;
  let repository: jest.Mocked<Repository<TimeOffRequest>>;
  let balanceRepository: jest.Mocked<Repository<LeaveBalance>>;
  let hcmGateway: jest.Mocked<HcmGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeOffService,
        {
          provide: getRepositoryToken(TimeOffRequest),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LeaveBalance),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: HcmGateway,
          useValue: {
            validateRealtimeRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TimeOffService);
    repository = module.get(getRepositoryToken(TimeOffRequest));
    balanceRepository = module.get(getRepositoryToken(LeaveBalance));
    hcmGateway = module.get(HcmGateway);
    hcmGateway.validateRealtimeRequest.mockResolvedValue({ accepted: true });
  });

  it('creates a time-off request with pending status', async () => {
    const createdRequest = {
      id: 1,
      employeeId: 'EMP-101',
      locationId: 'LOC-1',
      leaveType: 'ANNUAL',
      startDate: '2026-05-01',
      endDate: '2026-05-03',
      reason: 'Family event',
      status: TimeOffStatus.PENDING,
    } as TimeOffRequest;

    const existingBalance = {
      employeeId: 'EMP-101',
      locationId: 'LOC-1',
      leaveType: 'ANNUAL',
      readyOnBalance: 10,
      hcmBalance: 10,
    } as LeaveBalance;
    const savedBalance = { ...existingBalance, readyOnBalance: 7 } as LeaveBalance;

    balanceRepository.findOne.mockResolvedValue(existingBalance);
    balanceRepository.save.mockResolvedValue(savedBalance);
    repository.create.mockReturnValue(createdRequest);
    repository.save.mockResolvedValue(createdRequest);

    const result = await service.create({
      employeeId: 'EMP-101',
      locationId: 'LOC-1',
      leaveType: 'ANNUAL',
      startDate: '2026-05-01',
      endDate: '2026-05-03',
      reason: 'Family event',
    });

    expect(result.status).toBe(TimeOffStatus.PENDING);
    expect(repository.create).toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ requestedDays: 3 }));
    expect(repository.save).toHaveBeenCalledWith(createdRequest);
    expect(balanceRepository.save).toHaveBeenCalledWith(expect.objectContaining({ readyOnBalance: 7 }));
  });

  it('rejects invalid date ranges', async () => {
    await expect(
      service.create({
        employeeId: 'EMP-101',
        locationId: 'LOC-1',
        leaveType: 'ANNUAL',
        startDate: '2026-06-10',
        endDate: '2026-06-05',
        reason: 'Vacation',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects create when ReadyOn and HCM are out of sync', async () => {
    balanceRepository.findOne.mockResolvedValue({
      employeeId: 'EMP-101',
      locationId: 'LOC-1',
      leaveType: 'ANNUAL',
      readyOnBalance: 9,
      hcmBalance: 10,
    } as LeaveBalance);

    await expect(
      service.create({
        employeeId: 'EMP-101',
        locationId: 'LOC-1',
        leaveType: 'ANNUAL',
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        reason: 'Vacation',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('syncs HCM balance and reconciles ReadyOn by delta', async () => {
    balanceRepository.findOne.mockResolvedValue({
      employeeId: 'EMP-101',
      locationId: 'LOC-1',
      leaveType: 'ANNUAL',
      readyOnBalance: 8,
      hcmBalance: 10,
    } as LeaveBalance);

    await service.syncHcmBalance({
      employeeId: 'EMP-101',
      locationId: 'LOC-1',
      leaveType: 'ANNUAL',
      hcmBalance: 12,
    });

    expect(balanceRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: 'EMP-101',
        locationId: 'LOC-1',
        leaveType: 'ANNUAL',
        hcmBalance: 12,
        readyOnBalance: 10,
      }),
    );
  });

  it('restores reserved days when request is rejected', async () => {
    repository.findOne.mockResolvedValue({
      id: 1,
      employeeId: 'EMP-101',
      locationId: 'LOC-1',
      leaveType: 'ANNUAL',
      requestedDays: 2,
      status: TimeOffStatus.PENDING,
    } as TimeOffRequest);
    balanceRepository.findOne.mockResolvedValue({
      employeeId: 'EMP-101',
      locationId: 'LOC-1',
      leaveType: 'ANNUAL',
      readyOnBalance: 8,
      hcmBalance: 8,
    } as LeaveBalance);
    repository.save.mockImplementation(async (value) => value as TimeOffRequest);

    await service.updateStatus(1, { status: TimeOffStatus.REJECTED, reviewComment: 'No coverage' });

    expect(balanceRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: 'EMP-101',
        locationId: 'LOC-1',
        leaveType: 'ANNUAL',
        readyOnBalance: 10,
      }),
    );
  });

  it('does not allow reviewing a non-pending request', async () => {
    repository.findOne.mockResolvedValue({
      id: 1,
      employeeId: 'EMP-101',
      locationId: 'LOC-1',
      leaveType: 'ANNUAL',
      requestedDays: 2,
      status: TimeOffStatus.APPROVED,
    } as TimeOffRequest);

    await expect(service.updateStatus(1, { status: TimeOffStatus.REJECTED })).rejects.toThrow(
      BadRequestException,
    );
  });
});
