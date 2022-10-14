import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { ConfigService } from '@nestjs/config';
import { MessageModule } from './message/message.module';

@Module({
  imports: [AuthModule, PrismaModule, UserModule, ChatModule, MessageModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, ConfigService],
  exports: [PrismaService, ConfigService],
})
export class AppModule {}
