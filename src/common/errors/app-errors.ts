import { ConflictException, ForbiddenException, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';

export const unauthorizedError = (message = 'Missing or expired session token'): UnauthorizedException =>
  new UnauthorizedException({ code: 'UNAUTHORIZED', message });

export const forbiddenError = (message = 'Only the room creator can delete this room'): ForbiddenException =>
  new ForbiddenException({ code: 'FORBIDDEN', message });

export const roomNotFoundError = (roomId: string): NotFoundException =>
  new NotFoundException({ code: 'ROOM_NOT_FOUND', message: `Room with id ${roomId} does not exist` });

export const roomNameTakenError = (): ConflictException =>
  new ConflictException({ code: 'ROOM_NAME_TAKEN', message: 'A room with this name already exists' });

export const messageTooLongError = (message = 'Message content must not exceed 1000 characters'): UnprocessableEntityException =>
  new UnprocessableEntityException({ code: 'MESSAGE_TOO_LONG', message });