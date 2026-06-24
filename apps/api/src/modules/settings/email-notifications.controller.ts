import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UpsertEmailNotificationDto } from './dto/upsert-email-notification.dto';
import { UpdateEmailNotificationRecipientsDto } from './dto/update-email-notification-recipients.dto';
import { EmailNotificationsService } from './email-notifications.service';

@Controller('settings/email-notifications')
export class EmailNotificationsController {
  constructor(private readonly emailNotificationsService: EmailNotificationsService) {}

  @Get()
  @Permissions('settings:read')
  getConfiguration() {
    return this.emailNotificationsService.getConfiguration();
  }

  @Put('recipients')
  @Permissions('settings:update')
  updateRecipients(@Body() dto: UpdateEmailNotificationRecipientsDto) {
    return this.emailNotificationsService.updateRecipients(dto);
  }

  @Put(':code')
  @Permissions('settings:update')
  upsertType(@Param('code') code: string, @Body() dto: UpsertEmailNotificationDto) {
    return this.emailNotificationsService.upsertType(code, dto);
  }
}
