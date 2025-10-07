// Alternative auth approach for debugging login issues
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthDebugService {
  constructor(private authService: AuthService) {}

  async loginDebug(email: string, password: string) {
    try {
      console.log('🔍 Debug login attempt:', { email });
      
      // Step 1: Validate user
      const user = await this.authService.validateUser(email, password);
      if (!user) {
        console.log('❌ User validation failed');
        throw new UnauthorizedException('Invalid credentials');
      }
      
      console.log('✅ User validated:', { id: user.id, email: user.email, role: user.role });
      
      // Step 2: Generate tokens
      const authResult = await this.authService.login(user);
      console.log('✅ Tokens generated successfully');
      
      // Step 3: Return simple response (no cookies for now)
      return {
        success: true,
        user: authResult.user,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken, // Include in response for debugging
        message: 'Login successful'
      };
      
    } catch (error) {
      console.log('❌ Login debug failed:', error.message);
      throw error;
    }
  }
}