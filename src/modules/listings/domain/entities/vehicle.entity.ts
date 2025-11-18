import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Listing } from './listing.entity';

@Entity('vehicle_attributes')
export class VehicleAttribute {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    make: string; // Toyota

    @Column()
    model: string; // Vitz

    @Column()
    year: number;

    @Column({ name: 'mileage_km', nullable: true })
    mileageKm: number;

    @Column({ nullable: true })
    transmission: string; // Manual, Auto

    @Column({ name: 'fuel_type', nullable: true })
    fuelType: string; // Benzine, Diesel

    @Column({ nullable: true })
    color: string;

    @Column({ nullable: true })
    condition: string; // New, Used

    // Link back to Listing
    @OneToOne(() => Listing, (listing) => listing.vehicleAttributes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'listing_id' })
    listing: Listing;
}