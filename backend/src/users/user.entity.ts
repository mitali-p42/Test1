import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  // Your table uses TEXT UNIQUE; keep `type: 'text'` to avoid ALTERs
  @Column({ name: 'email', type: 'text', unique: true })
  email!: string;

  // Map camel property -> snake column
  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
