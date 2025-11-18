import { Module } from '@nestjs/common';
import { AgentController } from './presentation/agent.controller';
import { ListingsModule } from '../listings/listings.module';

@Module({
    controllers: [AgentController],
    imports: [ListingsModule],

})
export class AgentModule { }
