import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class Url extends BaseEntity {
  @Column({ length: 6, unique: true })
  shortCode: string;

  @Column()
  originalUrl: string;

  @Column({ default: 0 })
  clickCount: number;

  @Column({ nullable: true })
  expiresAt: Date;

  @ManyToOne('User', 'urls', { nullable: true })
  user: any | null;

  @OneToMany('Click', 'url')
  clicks: any[];
}
