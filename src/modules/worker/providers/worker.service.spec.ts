import { BadRequestException } from '@nestjs/common';
import { WorkerService } from './worker.service.js';
import type { WorkerCreateDto } from '../dto/worker-create.dto.js';

describe('WorkerService', () => {
  const uploadService = {
    uploadWorkerImage: vi.fn(),
    deleteFile: vi.fn(),
    deleteWorkerImage: vi.fn(),
  };

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('calculates the remaining balance when creating a worker', async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const values = vi.fn().mockReturnValue({ returning });
    const db = {
      insert: vi.fn().mockReturnValue({ values }),
    };
    const service = new WorkerService(db as never, uploadService as never);

    await service.create(
      {
        userId: 'user-id',
        managerId: 'manager-id',
        yearId: 'year-id',
        companyId: 'company-id',
        gender: 'MALE',
        total: 9000,
        deposit: 1000,
      } satisfies WorkerCreateDto,
    );

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 9000,
        deposit: 1000,
        balance: 8000,
      }),
    );
  });

  it('rejects a deposit above the total before inserting the worker', async () => {
    const insert = vi.fn();
    const service = new WorkerService(
      { insert } as never,
      uploadService as never,
    );

    await expect(
      service.create({
        userId: 'user-id',
        managerId: 'manager-id',
        yearId: 'year-id',
        companyId: 'company-id',
        gender: 'MALE',
        total: 9000,
        deposit: 9001,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(insert).not.toHaveBeenCalled();
  });

  it('recalculates the balance when the deposit changes', async () => {
    const limit = vi.fn().mockResolvedValue([
      { imageUrl: null, total: 9000, deposit: 1000 },
    ]);
    const from = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ limit }),
    });
    const set = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'worker-id' }]),
      }),
    });
    const db = {
      select: vi.fn().mockReturnValue({ from }),
      update: vi.fn().mockReturnValue({ set }),
    };
    const service = new WorkerService(db as never, uploadService as never);

    await service.update('worker-id', { deposit: 2000 });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 9000,
        deposit: 2000,
        balance: 7000,
      }),
    );
  });

  it('returns all-worker financial totals to an admin', async () => {
    const summary = {
      workerCount: 2,
      total: 18000,
      deposit: 3000,
      balance: 15000,
    };
    const where = vi.fn().mockResolvedValue([summary]);
    const from = vi.fn().mockReturnValue({ where });
    const db = { select: vi.fn().mockReturnValue({ from }) };
    const service = new WorkerService(db as never, uploadService as never);

    await expect(
      service.getFinancialSummary({
        id: 'admin-id',
        email: 'admin@example.com',
        role: 'ADMIN',
      }),
    ).resolves.toEqual({ scope: 'ALL', ...summary });

    expect(where).toHaveBeenCalledWith(undefined);
  });

  it('limits manager financial totals to their own workers', async () => {
    const workerFilter = vi.fn().mockResolvedValue([
      { workerCount: 1, total: 9000, deposit: 1000, balance: 8000 },
    ]);
    const workerFrom = vi.fn().mockReturnValue({ where: workerFilter });
    const managerLimit = vi.fn().mockResolvedValue([{ id: 'manager-id' }]);
    const managerWhere = vi
      .fn()
      .mockReturnValue({ limit: managerLimit });
    const managerFrom = vi.fn().mockReturnValue({ where: managerWhere });
    const select = vi
      .fn()
      .mockReturnValueOnce({ from: managerFrom })
      .mockReturnValueOnce({ from: workerFrom });
    const service = new WorkerService({ select } as never, uploadService as never);

    await expect(
      service.getFinancialSummary({
        id: 'manager-user-id',
        email: 'manager@example.com',
        role: 'MANAGER',
      }),
    ).resolves.toEqual({
      scope: 'MANAGER',
      workerCount: 1,
      total: 9000,
      deposit: 1000,
      balance: 8000,
    });

    expect(managerWhere).toHaveBeenCalledOnce();
    expect(workerFilter).toHaveBeenCalledOnce();
  });

  it('returns report reminders exactly 7 days before the report date in Thailand', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T17:30:00.000Z'));

    const workers = [
      { id: 'due-in-seven-days', reportDate: '2026-10-09' },
    ];
    const where = vi.fn().mockResolvedValue(workers);
    const from = vi.fn().mockReturnValue({ where });
    const db = {
      select: vi.fn().mockReturnValue({ from }),
    };
    const service = new WorkerService(db as never, uploadService as never);

    const reminders = await service.findReportNotifications();

    expect(reminders).toEqual([
      {
        worker: workers[0],
        reportDate: '2026-10-09',
        daysUntilReport: 7,
      },
    ]);
    expect(where).toHaveBeenCalledOnce();
  });
});
