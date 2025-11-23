import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateReportDto {

    @IsUUID()
    reportedListingId: string;

    @IsString()
    reason: string;
}
