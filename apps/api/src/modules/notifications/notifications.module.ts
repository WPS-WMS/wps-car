import { Module } from '@nestjs/common';
import { EmailDispatchService } from './email-dispatch.service';
import { SaleNotificationService } from './sale-notification.service';

@Module({
  providers: [EmailDispatchService, SaleNotificationService],
  exports: [EmailDispatchService, SaleNotificationService],
})
export class NotificationsModule {}
