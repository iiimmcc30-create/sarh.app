import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import type { OfficialServiceCategory } from '../dto/official-services.dto';

const DEFAULT_SERVICES: Array<{
  title: string;
  description: string;
  category: OfficialServiceCategory;
  icon: string;
  externalUrl: string;
}> = [
  {
    title: 'إصدار سجل مربي',
    description:
      'خدمة مقدمة من وزارة البيئة والمياه والزراعة تمكن هذه الخدمة المواطنين من ملاك الحيوانات لطلب إصدار سجل مربي.',
    category: 'veterinary',
    icon: 'document-text-outline',
    externalUrl:
      'https://anaam.mewa.gov.sa/anaam/ClinicRequestCardIssues/index?ClinicTypeId=fVfSs82hxvWEJfDm0UT+SA==',
  },
  {
    title: 'طلب موعد زيارة عيادة بيطرية',
    description:
      'خدمة مقدمة من وزارة البيئة والمياه والزراعة تمكن هذه الخدمة المواطنين الحاصلين على سجل مربي من تقديم طلب موعد زيارة العيادة البيطرية التابعة لهم.',
    category: 'veterinary',
    icon: 'medical-outline',
    externalUrl:
      'https://naama.sa/services/details/443c9549-acdd-4a2a-a13a-2f878921c556',
  },
  {
    title: 'موعد التحصينات',
    description:
      'خدمة مقدمة من وزارة البيئة والمياه والزراعة تمكن هذه الخدمة المواطنين من ملاك الحيوانات من طلب موعد من العيادة التابعة لتحصين المواشي.',
    category: 'veterinary',
    icon: 'shield-checkmark-outline',
    externalUrl:
      'https://naama.sa/services/details/167e9681-249e-4101-b714-aeacecd22a06',
  },
  {
    title: 'طلب ترقيم الماشية',
    description:
      'خدمة مقدمة من وزارة البيئة والمياه والزراعة تسمح للمستفيدين بطلب ترقيم الماشية إلكترونياً.',
    category: 'livestock',
    icon: 'barcode-outline',
    externalUrl:
      'https://ui.naama.sa/livestocknumbering/livestock-numbering/enduser/livestock-numbering',
  },
  {
    title: 'إدارة بيانات الماشية',
    description:
      'خدمة إلكترونية مقدمة من وزارة البيئة والمياه والزراعة تمكن ملاك الماشية في المملكة من تحديث بيانات الماشية الخاصة بهم.',
    category: 'livestock',
    icon: 'list-outline',
    externalUrl:
      'https://ui.naama.sa/livestocknumbering/livestock-numbering/enduser/livestock-data-management',
  },
  {
    title: 'حجز موعد مسلخ',
    description:
      'خدمة مقدمة من وزارة البيئة والمياه والزراعة للحجز الإلكتروني للذبح في المسالخ، وتمكن المستفيدين أفراد أو أصحاب الملاحم من الحجز المسبق.',
    category: 'slaughter',
    icon: 'cut-outline',
    externalUrl: 'https://web.naama.sa/slaughter/appointment/termsconditions',
  },
];

@Injectable()
export class OfficialServicesRepository implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.service.count();
    if (count > 0) return;
    await this.prisma.service.createMany({
      data: DEFAULT_SERVICES.map((s) => ({ ...s, active: true })),
    });
  }

  findActive() {
    return this.prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findAll() {
    return this.prisma.service.findMany({
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.service.findUnique({ where: { id } });
  }

  create(data: Prisma.ServiceCreateInput) {
    return this.prisma.service.create({ data });
  }

  update(id: string, data: Prisma.ServiceUpdateInput) {
    return this.prisma.service.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }
}
