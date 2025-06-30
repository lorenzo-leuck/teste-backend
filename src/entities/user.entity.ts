import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;
  
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 10 })
  limit: number;

  @Column({ default: 0 })
  usage: number;

  @OneToMany('Url', 'user')
  urls: any[];
}
