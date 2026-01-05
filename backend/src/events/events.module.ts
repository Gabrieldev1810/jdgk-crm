import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { VicidialModule } from '../vicidial/vicidial.module';

@Module({
    imports: [VicidialModule],
    controllers: [EventsController],
    providers: [],
})
export class EventsModule {
    constructor() {
        console.log('✅ EventsModule Initialized');
    }
}
