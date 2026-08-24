import { Injectable } from '@nestjs/common';
import { throwApi } from '../common/exceptions/api.exception';
import {
  CreateOfficialServiceDto,
  UpdateOfficialServiceDto,
} from './dto/official-services.dto';
import { OfficialServicesRepository } from './repositories/official-services.repository';

@Injectable()
export class OfficialServicesService {
  constructor(private readonly repo: OfficialServicesRepository) {}

  listActive() {
    return this.repo.findActive();
  }

  listAll() {
    return this.repo.findAll();
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
