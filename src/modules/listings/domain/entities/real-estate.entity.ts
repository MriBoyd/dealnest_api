import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Listing } from './listing.entity';

@Entity('real_estate_attributes')
export class RealEstateAttribute {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'property_type' }) // e.g. Apartment, Villa, Land
    propertyType: string;

    @Column({ type: 'float', name: 'area_sqm', nullable: true })
    areaSqm: number;

    @Column({ nullable: true })
    bedrooms: number;

    @Column({ nullable: true })
    bathrooms: number;

    @Column({ name: 'floor_level', nullable: true })
    floorLevel: number;

    @Column({ default: false })
    furnished: boolean;

    // Link back to Listing
    @OneToOne(() => Listing, (listing) => listing.realEstateAttributes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'listing_id' })
    listing: Listing;
}