import { Test, TestingModule } from '@nestjs/testing';
import { FraudService } from './fraud.service';

describe('FraudService', () => {
  let service: FraudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FraudService],
    }).compile();

    service = module.get<FraudService>(FraudService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
