import {
  Controller,
  Get,
  NotFoundException,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join, normalize } from 'path';
import type { Request, Response } from 'express';
import { SkipTenant } from '../../common/decorators/skip-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { StorageService } from '../../infrastructure/storage/storage.service';

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Get('*')
  @SkipTenant()
  serveFile(
    @Req() req: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const safePath = this.resolveSafePath(this.extractRelativePath(req));
    this.assertTenantAccess(safePath, user);

    const absolutePath = join(this.storage.getUploadRoot(), safePath);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    const ext = safePath.slice(safePath.lastIndexOf('.')).toLowerCase();
    res.setHeader('Content-Type', MIME_BY_EXT[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    return new StreamableFile(createReadStream(absolutePath));
  }

  private extractRelativePath(req: Request): string {
    const pathname = (req.originalUrl ?? req.url).split('?')[0];
    const marker = '/files/';
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    return decodeURIComponent(pathname.slice(markerIndex + marker.length));
  }

  private resolveSafePath(relativePath: string): string {
    const normalized = normalize(relativePath).replace(/\\/g, '/');
    if (
      !normalized ||
      normalized.startsWith('..') ||
      normalized.includes('/../') ||
      normalized === '..'
    ) {
      throw new NotFoundException('Arquivo não encontrado');
    }
    return normalized;
  }

  private assertTenantAccess(relativePath: string, user: AuthenticatedUser) {
    const tenantSegment = relativePath.split('/')[0];
    if (!tenantSegment) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    if (user.role === 'MODERATOR') {
      return;
    }

    if (!user.tenantId || user.tenantId !== tenantSegment) {
      throw new NotFoundException('Arquivo não encontrado');
    }
  }
}
