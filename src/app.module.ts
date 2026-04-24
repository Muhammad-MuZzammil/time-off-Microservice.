import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeaveBalance } from './time-off/leave-balance.entity';
import { TimeOffModule } from './time-off/time-off.module';
import { TimeOffRequest } from './time-off/time-off.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH ?? 'data/time-off.sqlite',
      entities: [TimeOffRequest, LeaveBalance],
      synchronize: true,
    }),
    TimeOffModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
