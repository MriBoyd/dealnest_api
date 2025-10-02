import { IsEnum } from 'class-validator';
import { ListingStatus } from '../../domain/enums/listing-status.enum';

export class UpdateListingStatusDto {
	@IsEnum(ListingStatus, {
		message: 'status must be one of: pending_verification, approved, rejected',
	})
	status: ListingStatus;
}
