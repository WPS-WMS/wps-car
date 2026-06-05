import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = this.config.get<string>('upload.dir') ?? './uploads';
  }

  getUploadRoot(): string {
    return this.uploadDir;
  }

  async saveVehiclePhoto(
    tenantId: string,
    vehicleId: string,
    file: Express.Multer.File,
  ): Promise<{ fileName: string; filePath: string; relativePath: string }> {
    return this.saveFile(tenantId, ['vehicles', vehicleId], file, file.originalname);
  }

  async saveVehicleCostReceipt(
    tenantId: string,
    costId: string,
    file: Express.Multer.File,
  ): Promise<{ fileName: string; filePath: string; relativePath: string }> {
    return this.saveFile(tenantId, ['vehicle-costs', costId], file, file.originalname);
  }

  private async saveFile(
    tenantId: string,
    pathSegments: string[],
    file: Express.Multer.File,
    originalName: string,
  ): Promise<{ fileName: string; filePath: string; relativePath: string }> {
    const ext = extname(originalName) || this.extFromMime(file.mimetype);
    const fileName = `${uuidv4()}${ext}`;
    const relativeDir = join(tenantId, ...pathSegments);
    const absoluteDir = join(this.uploadDir, relativeDir);
    await mkdir(absoluteDir, { recursive: true });

    const absolutePath = join(absoluteDir, fileName);
    await writeFile(absolutePath, file.buffer);

    const relativePath = join(relativeDir, fileName).replace(/\\/g, '/');

    return {
      fileName: originalName || fileName,
      filePath: relativePath,
      relativePath: `/uploads/${relativePath}`,
    };
  }

  async deleteFile(relativeFilePath: string): Promise<void> {
    const absolutePath = join(this.uploadDir, relativeFilePath);
    try {
      await unlink(absolutePath);
    } catch {
      // arquivo já removido
    }
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };
    return map[mime] ?? '.bin';
  }
}
