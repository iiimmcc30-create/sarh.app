import { Injectable } from '@nestjs/common';
import { throwApi } from '../common/exceptions/api.exception';
import {
  CreateEditorialStoryDto,
  UpdateEditorialStoryDto,
} from './dto/editorial-stories.dto';
import { EditorialStoriesRepository } from './repositories/editorial-stories.repository';

@Injectable()
export class EditorialStoriesService {
  constructor(private readonly repo: EditorialStoriesRepository) {}

  listPublic() {
    return this.repo.findPublic();
  }

  listAll() {
    return this.repo.findAll();
  }

  async create(dto: CreateEditorialStoryDto) {
    return this.repo.create({
      titleAr: dto.titleAr,
      bodyAr: dto.bodyAr,
      imageUrl: dto.imageUrl,
      duration: dto.duration ?? 20,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      publishedAt: new Date(),
    });
  }

  async update(id: string, dto: UpdateEditorialStoryDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throwApi(404, 'not_found', 'الستوري غير موجود');

    return this.repo.update(id, {
      ...(dto.titleAr !== undefined ? { titleAr: dto.titleAr } : {}),
      ...(dto.bodyAr !== undefined ? { bodyAr: dto.bodyAr } : {}),
      ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throwApi(404, 'not_found', 'الستوري غير موجود');
    await this.repo.softDelete(id);
    return { deleted: true };
  }
}
