import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  exports: [PrismaService],
  imports: [ConfigModule.forRoot()],
  providers: [PrismaService],
})
export class PrismaModule {}
