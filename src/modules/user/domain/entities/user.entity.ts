import { Exclude, Expose } from 'class-transformer';
import { Role } from 'src/common/enums/role.enum';
import { Listing } from 'src/modules/listings/domain/entities/listing.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @Expose()
    email: string;

    @Column({
        type: 'varchar',
        length: 20,
        nullable: true
    })
    @Expose()
    phone_number: string | null;

    @Column({ nullable: true })
    @Expose()
    agent_code?: string;


    @Column({ nullable: true })
    @Exclude()
    password_hash?: string;

    @Column()
    @Expose()
    name: string;

    @Column({
        type: 'enum',
        enum: Role,
    })
    @Expose()
    role: Role;

    @Column({ default: 'am' })
    @Expose()
    preferred_language: string;

    @Column({ type: 'boolean', default: false })
    @Expose()
    is_email_verified: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @Exclude()
    email_verification_token: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    @Exclude()
    email_verification_expires: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    @Exclude()
    last_verification_email_sent: Date | null;


    @Column({
        type: 'enum',
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    })
    @Expose()
    kyc_status: string;

    @OneToMany(() => Listing, (listing) => listing.owner)
    @Exclude()
    listings: Listing[];

    @CreateDateColumn()
    @Expose()
    created_at: Date;

    @UpdateDateColumn()
    @Expose()
    updated_at: Date;
    @Column({
        type: 'enum',
        enum: ['none', 'basic', 'verified', 'certified'],
        default: 'none',
    })
    verification_status: "none" | "basic" | "verified" | "certified";
}
