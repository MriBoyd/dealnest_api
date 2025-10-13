import { IsUUID, IsString, IsNumber, IsDateString, IsIn } from 'class-validator';

export class CreateAdSlotDto {
    @IsUUID()
    listing_id: string;

    @IsIn(['banner', 'featured'])
    type: 'banner' | 'featured';

    @IsDateString()
    start_date: string;

    @IsDateString()
    end_date: string;

    @IsNumber()
    price: number;
}
