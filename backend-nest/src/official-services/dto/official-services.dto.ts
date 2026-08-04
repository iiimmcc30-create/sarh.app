import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export const OFFICIAL_SERVICE_CATEGORIES = [
  'veterinary',
  'livestock',
  'slaughter',
] as const;

export type OfficialServiceCategory =
  (typeof OFFICIAL_SERVICE_CATEGORIES)[number];

export class CreateOfficialServiceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description!: string;

  @IsEnum(OFFICIAL_SERVICE_CATEGORIES)
  category!: OfficialServiceCategory;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  icon!: string;

  @IsUrl({ require_protocol: true })
  externalUrl!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateOfficialServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsEnum(OFFICIAL_SERVICE_CATEGORIES)
  category?: OfficialServiceCategory;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  icon?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  externalUrl?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
