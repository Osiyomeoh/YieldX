import { Test, TestingModule } from '@nestjs/testing';
import { RiskService } from './risk.service';

describe('RiskService', () => {
  let service: RiskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskService],
    }).compile();

    service = module.get<RiskService>(RiskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
