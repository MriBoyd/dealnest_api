import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycService } from './application/services/kyc.service';
import { KycController } from './presentation/kyc.controller';
import { Kyc } from './domain/entities/kyc.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Kyc]), UserModule],
  providers: [KycService],
  exports: [KycService],
  controllers: [KycController],
})
export class KycModule {}
