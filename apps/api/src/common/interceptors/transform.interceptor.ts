import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

/** Envolve respostas que não são paginadas nem já possuem estrutura meta */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (data === undefined || data === null) {
          return { success: true, data: null };
        }
        if (
          typeof data === 'object' &&
          data !== null &&
          ('meta' in data || 'accessToken' in data)
        ) {
          return data;
        }
        return { success: true, data };
      }),
    );
  }
}
