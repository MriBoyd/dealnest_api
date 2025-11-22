
import { Test, TestingModule } from '@nestjs/testing';
import { KycService } from '../../application/services/kyc.service';
import { DataSource } from 'typeorm';
import { User } from '../../../user/domain/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Kyc } from '../../domain/entities/kyc.entity';

describe('KycService', () => {
  let service: KycService;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        {
          provide: getRepositoryToken(Kyc),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn().mockImplementation(fn => fn({})),
          },
        },
      ],
    }).compile();

    service = module.get<KycService>(KycService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadDocs', () => {
    it('should call transaction and save KYC docs', async () => {
      const user = { id: 'user-id' } as any;
      const files = {
        gov_id_front: { originalname: 'front.png', mimetype: 'image/png', buffer: Buffer.from('front') },
        gov_id_back: { originalname: 'back.png', mimetype: 'image/png', buffer: Buffer.from('back') },
        selfie: { originalname: 'selfie.png', mimetype: 'image/png', buffer: Buffer.from('selfie') },
      };
      // Mock transaction
      dataSource.transaction = jest.fn().mockImplementation(async (fn) => {
        const em = {
          findOne: jest.fn().mockResolvedValue(undefined),
          create: jest.fn().mockImplementation((_entity, obj) => ({ ...obj })),
          save: jest.fn().mockImplementation((_entity, obj) => obj),
        };
        return fn(em);
      });
      const result = await service.uploadDocs(user, files);
      expect(result.user).toBe(user);
      expect(result.gov_id_front_filename).toBe('front.png');
      expect(result.gov_id_back_filename).toBe('back.png');
      expect(result.selfie_filename).toBe('selfie.png');
    });
  });

  describe('getStatus', () => {
    it('should return status and notes if KYC exists', async () => {
      const user = { id: 'user-id' } as any;
      const kyc = { kyc_status: 'PENDING', kyc_notes: 'test', user };
      service['kycRepo'] = { findOne: jest.fn().mockResolvedValue(kyc) } as any;
      const result = await service.getStatus(user);
      expect(result).toEqual({ status: 'PENDING', notes: 'test' });
    });
    it('should throw if KYC not found', async () => {
      const user = { id: 'user-id' } as any;
      service['kycRepo'] = { findOne: jest.fn().mockResolvedValue(undefined) } as any;
      await expect(service.getStatus(user)).rejects.toThrow();
    });
  });
});
