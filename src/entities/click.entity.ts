import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class Click extends BaseEntity {
  @ManyToOne('Url', 'clicks')
  url: any;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  referer: string;
}
