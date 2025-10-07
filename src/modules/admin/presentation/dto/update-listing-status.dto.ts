import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminActionType } from '../../domain/entities/admin-action.entity';

export class UpdateListingStatusDto {
  @IsEnum(AdminActionType)
  action_type: AdminActionType;

  @IsOptional()
  @IsString()
  notes?: string;
}
