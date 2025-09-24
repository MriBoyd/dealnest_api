import { Role } from 'src/common/enums/role.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, name: 'phone_number', length: 15, nullable: true })
    phone_number: string | null;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'password_hash', nullable: true })
    password_hash: string | null;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: Role,
    })
    role: Role;

    @Column({ default: 'am' })
    preferred_language: string;

    @Column({ type: 'boolean', default: false })
    is_email_verified: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email_verification_token: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    email_verification_expires: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    last_verification_email_sent: Date | null;


    @Column({
        type: 'enum',
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    })
    kyc_status: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
