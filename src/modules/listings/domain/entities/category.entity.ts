import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Listing } from './listing.entity';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    slug: string; // e.g., 'real-estate-for-sale'

    // Self-referencing: Parent Category
    @ManyToOne(() => Category, (category) => category.children, { nullable: true })
    @JoinColumn({ name: 'parent_id' })
    parent: Category;

    // Self-referencing: Child Categories
    @OneToMany(() => Category, (category) => category.parent)
    children: Category[];

    @OneToMany(() => Listing, (listing) => listing.category)
    listings: Listing[];
}