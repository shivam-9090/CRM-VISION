import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleCalendarConnectDto {
  @ApiProperty({
    example: '4/0AY0e-g7...',
    description: 'Authorization code from Google OAuth flow',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class GoogleCalendarWebhookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resourceState: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resourceUri: string;
}
