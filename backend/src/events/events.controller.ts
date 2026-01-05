import { Controller, Post, Body, Query, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VicidialService } from '../vicidial/vicidial.service';

@ApiTags('Events & Webhooks')
@Controller('events')
export class EventsController {
    constructor(private readonly vicidialService: VicidialService) {
        console.log('✅ EventsController Initialized');
    }

    @Get('ping')
    ping() {
        return { message: 'pong' };
    }

    @Get('vicidial/dispo')
    @ApiOperation({ summary: 'Handle VICIdial Dispo URL Webhook (GET)' })
    async handleDispoGet(@Query() query: any) {
        return this.vicidialService.handleWebhookEvent(query);
    }

    @Post('vicidial/dispo')
    @ApiOperation({ summary: 'Handle VICIdial Dispo URL Webhook (POST)' })
    async handleDispoPost(@Body() body: any, @Query() query: any) {
        const payload = { ...query, ...body };
        return this.vicidialService.handleWebhookEvent(payload);
    }
}
