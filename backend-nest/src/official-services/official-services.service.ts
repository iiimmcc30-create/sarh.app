import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { throwApi } from '../common/exceptions/api.exception';
import {
  CreateOfficialServiceDto,
  UpdateOfficialServiceDto,
} from './dto/official-services.dto';
import { OfficialServicesRepository } from './repositories/official-services.repository';

@Injectable()
export class OfficialServicesService implements OnModuleInit {
  private readonly logger = new Logger(OfficialServicesService.name);

  constructor(private readonly repo: OfficialServicesRepository) {}

  async onModuleInit() {
    await this.ensureMewaUser();
  }

  async ensureMewaUser() {
    const existing = await this.repo.findMewaUser();
    if (existing) {
      if (
        !existing.isActive ||
        !existing.verified ||
        existing.allowPrivateMessages !== false
      ) {
        return this.repo.updateMewaUserFlags(existing.id);
      }
      return existing;
    }

    const passwordHash = await bcrypt.hash(randomBytes(48).toString('hex'), 12);
    const user = await this.repo.createMewaUser({ passwordHash });
    this.logger.log(`MEWA official account created (${user.id})`);
    return user;
  }

  listActive() {
    return this.repo.findActive();
  }

  listAll() {
    return this.repo.findAll();
  }

  async getActiveById(id: string) {
    const service = await this.repo.findById(id);
    if (!service || !service.active) {
      throwApi(404, 'not_found', 'الخدمة غير موجودة');
    }
    return service;
  }

  async getAccount(viewerId?: string) {
    const user = await this.ensureMewaUser();
    const [followersCount, servicesCount, follow] = await Promise.all([
      this.repo.countFollowers(user.id),
      this.repo.countActive(),
      viewerId ? this.repo.findFollow(viewerId, user.id) : Promise.resolve(null),
    ]);

    return {
      id: user.id,
      username: user.username,
      arabicName: user.arabicName,
      displayName: user.displayName,
      bio: user.bio,
      verified: user.verified,
      allowPrivateMessages: user.allowPrivateMessages,
      followersCount,
      servicesCount,
      isFollowing: Boolean(follow),
    };
  }

  async create(dto: CreateOfficialServiceDto) {
    return this.repo.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      icon: dto.icon,
      externalUrl: dto.externalUrl,
      active: dto.active ?? true,
    });
  }

  async update(id: string, dto: UpdateOfficialServiceDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throwApi(404, 'not_found', 'الخدمة غير موجودة');

    return this.repo.update(id, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
      ...(dto.externalUrl !== undefined
        ? { externalUrl: dto.externalUrl }
        : {}),
      ...(dto.active !== undefined ? { active: dto.active } : {}),
    });
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throwApi(404, 'not_found', 'الخدمة غير موجودة');
    await this.repo.delete(id);
    return { deleted: true };
  }
}
