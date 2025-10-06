import { ExceptionFilter, Catch, NotFoundException, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Check if this is an API request (any non-root path)
    const isApiRequest = request.url !== '/';
    
    if (isApiRequest) {
      // Return JSON response for API requests
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: 404,
        error: 'Not Found',
        message: 'The requested API endpoint does not exist',
        timestamp: new Date().toISOString(),
        path: request.url,
        suggestion: 'Check the API documentation at /docs for available endpoints'
      });
    } else {
      // Serve custom 404 HTML page for web requests
      try {
        const html404Path = join(process.cwd(), 'public', '404.html');
        
        if (existsSync(html404Path)) {
          const html404Content = readFileSync(html404Path, 'utf8');
          response.status(HttpStatus.NOT_FOUND).type('html').send(html404Content);
        } else {
          // Fallback to basic 404 response
          response.status(HttpStatus.NOT_FOUND).json({
            statusCode: 404,
            error: 'Not Found',
            message: 'Page not found',
            timestamp: new Date().toISOString(),
            path: request.url
          });
        }
      } catch (error) {
        // Fallback error response
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: 404,
          error: 'Not Found',
          message: 'Page not found',
          timestamp: new Date().toISOString(),
          path: request.url
        });
      }
    }
  }
}