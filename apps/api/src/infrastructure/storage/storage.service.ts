import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { join, isAbsolute, resolve } from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { assertBufferMatchesMime } from '../../common/utils/file-content.util';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const THUMB_MAX_WIDTH = 480;

@Injectable()
export class StorageService {
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    const configuredDir = this.config.get<string>('upload.dir') ?? './uploads';
    this.uploadDir = isAbsolute(configuredDir)
      ? configuredDir
      : resolve(process.cwd(), configuredDir);
  }

  getUploadRoot(): string {
    return this.uploadDir;
  }

  async saveVehiclePhoto(
    tenantId: string,
    vehicleId: string,
    file: Express.Multer.File,
  ): Promise<{
    fileName: string;
    filePath: string;
    thumbnailPath: string | null;
    relativePath: string;
  }> {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    try {
      assertBufferMatchesMime(file.buffer, file.mimetype);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Arquivo inválido',
      );
    }

    const ext = this.extFromMime(file.mimetype);
    const storedId = uuidv4();
    const fileName = `${storedId}${ext}`;
    const relativeDir = join(tenantId, 'vehicles', vehicleId);
    const absoluteDir = join(this.uploadDir, relativeDir);
    await mkdir(absoluteDir, { recursive: true });

    const absolutePath = join(absoluteDir, fileName);
    await writeFile(absolutePath, file.buffer);

    const filePath = join(relativeDir, fileName).replace(/\\/g, '/');
    const thumbnailPath = await this.generateThumbnail(
      file.buffer,
      absoluteDir,
      relativeDir.replace(/\\/g, '/'),
      storedId,
    );

    return {
      fileName: file.originalname || fileName,
      filePath,
      thumbnailPath,
      relativePath: `/files/${filePath}`,
    };
  }

  async saveVehicleCostReceipt(
    tenantId: string,
    costId: string,
    file: Express.Multer.File,
  ): Promise<{ fileName: string; filePath: string; relativePath: string }> {
    return this.saveFile(tenantId, ['vehicle-costs', costId], file, file.originalname);
  }

  async saveGenericFile(
    tenantId: string,
    pathSegments: string[],
    file: Express.Multer.File,
  ): Promise<{ fileName: string; filePath: string; relativePath: string }> {
    return this.saveFile(tenantId, pathSegments, file, file.originalname);
  }

  private async saveFile(
    tenantId: string,
    pathSegments: string[],
    file: Express.Multer.File,
    originalName: string,
  ): Promise<{ fileName: string; filePath: string; relativePath: string }> {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    try {
      assertBufferMatchesMime(file.buffer, file.mimetype);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Arquivo inválido',
      );
    }

    const ext = this.extFromMime(file.mimetype);
    if (ext === '.bin') {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

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
      relativePath: `/files/${relativePath}`,
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

  async deleteFiles(relativePaths: Array<string | null | undefined>): Promise<void> {
    await Promise.all(
      relativePaths
        .filter((path): path is string => Boolean(path))
        .map((path) => this.deleteFile(path)),
    );
  }

  private async generateThumbnail(
    buffer: Buffer,
    absoluteDir: string,
    relativeDir: string,
    storedId: string,
  ): Promise<string | null> {
    try {
      const thumbFileName = `${storedId}_thumb.webp`;
      await sharp(buffer)
        .rotate()
        .resize({ width: THUMB_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(join(absoluteDir, thumbFileName));

      return join(relativeDir, thumbFileName).replace(/\\/g, '/');
    } catch {
      return null;
    }
  }

  async saveExportBuffer(
    tenantId: string,
    jobId: string,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<{ filePath: string; relativePath: string }> {
    const ext = this.extFromExportMime(mimeType, fileName);
    const storedName = `${jobId}${ext}`;
    const relativeDir = join(tenantId, 'exports');
    const absoluteDir = join(this.uploadDir, relativeDir);
    await mkdir(absoluteDir, { recursive: true });

    const absolutePath = join(absoluteDir, storedName);
    await writeFile(absolutePath, buffer);

    const filePath = join(relativeDir, storedName).replace(/\\/g, '/');
    return {
      filePath,
      relativePath: `/files/${filePath}`,
    };
  }

  async readFile(relativeFilePath: string): Promise<Buffer> {
    const absolutePath = join(this.uploadDir, relativeFilePath);
    return readFile(absolutePath);
  }

  private extFromExportMime(mimeType: string, fileName: string): string {
    if (mimeType === 'application/pdf') return '.pdf';
    if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return '.xlsx';
    }

    const fromName = fileName.match(/\.[a-z0-9]+$/i)?.[0];
    return fromName ?? '.bin';
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
