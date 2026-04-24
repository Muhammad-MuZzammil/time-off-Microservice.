import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'time-off-microservice',
      timestamp: new Date().toISOString(),
    };
  }
}
