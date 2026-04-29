import { BadRequestException, ValidationError, ValidationPipeOptions } from '@nestjs/common';

const firstMessage = (errors: ValidationError[]): string => {
  for (const error of errors) {
    if (error.constraints) {
      const values = Object.values(error.constraints);
      if (values.length > 0) {
        return values[0];
      }
    }

    if (error.children?.length) {
      const nested = firstMessage(error.children);
      if (nested) {
        return nested;
      }
    }
  }

  return 'Validation failed';
};

export const createValidationPipeOptions = (): ValidationPipeOptions => ({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) =>
    new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: firstMessage(errors),
    }),
});