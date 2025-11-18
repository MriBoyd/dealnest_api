import { Test, TestingModule } from '@nestjs/testing';
import { AgentController } from '../../presentation/agent.controller';
import { ListingsService } from '../../../listings/application/services/listings.service';

describe('AgentController', () => {
  let controller: AgentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        {
          provide: ListingsService,
          useValue: { findAll: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AgentController>(AgentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
