import { Type } from 'class-transformer';
import { IsArray, IsIn, IsString, ValidateNested } from 'class-validator';
import {
  EMAIL_NOTIFICATION_ROLES,
  EmailNotificationRole,
} from '../constants/email-notification-recipients';
import { EMAIL_NOTIFICATION_TYPE_CODES } from '../constants/email-notification-types';

class EmailNotificationRecipientRuleDto {
  @IsString()
  @IsIn(EMAIL_NOTIFICATION_TYPE_CODES)
  code!: string;

  @IsArray()
  @IsIn(EMAIL_NOTIFICATION_ROLES, { each: true })
  roles!: EmailNotificationRole[];
}

export class UpdateEmailNotificationRecipientsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailNotificationRecipientRuleDto)
  rules!: EmailNotificationRecipientRuleDto[];
}
