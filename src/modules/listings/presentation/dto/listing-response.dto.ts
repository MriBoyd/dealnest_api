import { User } from 'src/modules/user/domain/entities/user.entity';
import { ListingStatus, ListingVerificationLevel } from '../../domain/entities/listing.entity';
import { Vertical } from '../../domain/enums/vertical.enum';

export class ListingResponseDto {
	id: string;
	vertical: Vertical;
	title: string;
	description?: string;
	price: number;
	currency: string;
	location?: {
		city?: string;
		subcity?: string;
		lat?: number;
		lon?: number;
	};
	available_from?: Date;
	square_meters?: number;
	amenities?: string[];
	pet_policy?: string;
	nearby?: string[];
	extra_costs?: { name: string; amount: number }[];
	media_group_id?: string;
	status: ListingStatus;
	verification_level: ListingVerificationLevel;
	created_at: Date;
	updated_at: Date;
	owner_id: string;
}
