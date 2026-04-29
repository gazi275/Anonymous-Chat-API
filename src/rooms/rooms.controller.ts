import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentSession } from '../common/decorators/current-session.decorator';
import { SessionGuard } from '../common/guards/session.guard';
import { SessionPayload } from '../sessions/session.types';
import { CreateRoomDto } from './dto/create-room.dto';
import { ListMessagesQueryDto } from './dto/list-messages.query';
import { SendMessageDto } from './dto/send-message.dto';
import { RoomsService } from './rooms.service';

@UseGuards(SessionGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  listRooms(): Promise<{ rooms: Array<{ id: string; name: string; createdBy: string; activeUsers: number; createdAt: string }> }> {
    return this.roomsService.listRooms();
  }

  @Post()
  createRoom(@Body() body: CreateRoomDto, @CurrentSession() session: SessionPayload): Promise<{ id: string; name: string; createdBy: string; activeUsers: number; createdAt: string }> {
    return this.roomsService.createRoom(body.name, session);
  }

  @Get(':id')
  getRoom(@Param('id') roomId: string): Promise<{ id: string; name: string; createdBy: string; activeUsers: number; createdAt: string }> {
    return this.roomsService.getRoom(roomId);
  }

  @Delete(':id')
  deleteRoom(@Param('id') roomId: string, @CurrentSession() session: SessionPayload): Promise<{ deleted: true }> {
    return this.roomsService.deleteRoom(roomId, session);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id') roomId: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<{ messages: Array<{ id: string; roomId: string; username: string; content: string; createdAt: string }>; hasMore: boolean; nextCursor: string | null }> {
    return this.roomsService.getMessages(roomId, query.limit, query.before);
  }

  @Post(':id/messages')
  sendMessage(@Param('id') roomId: string, @Body() body: SendMessageDto, @CurrentSession() session: SessionPayload): Promise<{ id: string; roomId: string; username: string; content: string; createdAt: string }> {
    return this.roomsService.sendMessage(roomId, session, body.content);
  }
}