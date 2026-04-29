import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { SessionPayload } from '../../sessions/session.types';

export const CurrentSession = createParamDecorator((_: unknown, context: ExecutionContext): SessionPayload => {
  const request = context.switchToHttp().getRequest<{ session: SessionPayload }>();
  return request.session;
});