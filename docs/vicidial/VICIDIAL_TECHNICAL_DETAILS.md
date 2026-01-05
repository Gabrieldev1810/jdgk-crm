# Vicidial → CRM Integration - Technical Implementation Details

**Document Type:** Technical Reference  
**Audience:** Developers & IT Technical Staff  
**Status:** Testing Only - December 10, 2025

---

## 📋 IMPLEMENTATION SUMMARY

### What Was Implemented

A screen pop integration between Vicidial and JDGK CRM that enables automatic display of caller account information when agents receive calls.

### Components

1. **Backend Endpoint:** `/dialer-pop` (NestJS)
2. **Query Parameters:** phone, lead_id, campaign_id, agent_user
3. **Response:** Styled HTML pop-up with caller information
4. **Logging:** Access events logged to console/backend logs

### File Modified

- **File:** `backend/src/root.controller.ts`
- **Method:** Added new `@Get('dialer-pop')` handler
- **Route:** GET `/dialer-pop`

---

## 🔧 ENDPOINT IMPLEMENTATION

### Route Definition

```typescript
@Get('dialer-pop')
async dialerPop(
  @Query('phone') phone: string,
  @Query('lead_id') leadId: string,
  @Query('campaign_id') campaignId: string,
  @Query('agent_user') agentUser: string,
  @Res() res: Response
) {
  // Implementation here
}
```

### Request Parameters

| Parameter | Type | Required | Example | Source |
|-----------|------|----------|---------|--------|
| phone | string | No* | +63912345678 | Vicidial call data |
| lead_id | string | No* | ACC2024120145AB | Vicidial lead ID |
| campaign_id | string | Yes | campaign_001 | Vicidial campaign |
| agent_user | string | Yes | agent_john | Vicidial agent |

*At least one of phone or lead_id must be provided

### Response Types

#### Success Response (200 OK)
```
Content-Type: text/html; charset=utf-8
Body: Styled HTML pop-up with embedded JavaScript
```

#### Error Response (400 Bad Request)
```json
{
  "error": "Missing required parameters",
  "message": "Either phone or lead_id must be provided",
  "received": {
    "phone": null,
    "leadId": null,
    "campaignId": "campaign_001",
    "agentUser": "agent_john"
  }
}
```

#### Error Response (500 Internal Server Error)
```json
{
  "error": "Internal server error",
  "message": "Error message details",
  "details": "Full error stack (only in development)"
}
```

---

## 📝 AUDIT LOGGING

Every request is logged with the following information:

```
[DIALER-POP] Incoming request: {
  phone: "+63912345678",
  leadId: "ACC2024120145AB",
  campaignId: "campaign_001",
  agentUser: "agent_john",
  timestamp: "2024-12-10T10:45:30.123Z",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
}
```

### Log Entries Include
- Timestamp (ISO 8601 format)
- Phone number (if provided)
- Lead ID (if provided)
- Campaign ID
- Agent username
- User-Agent (browser info)
- Source IP (can be added)

### Log Location
- **Console:** Visible in backend terminal running `npm run start`
- **File Logs:** Can be configured in logger.service.ts
- **Database:** Can be stored in audit_log table (not yet implemented)

---

## 🎨 HTML RESPONSE STRUCTURE

### Pop-up Window Features

The returned HTML includes:

1. **Responsive Design**
   - Mobile-friendly CSS
   - Works on different screen sizes
   - Centered pop-up with backdrop

2. **Visual Elements**
   - Header with "Account Lookup" title
   - Status badge showing "LIVE"
   - Color-coded info sections
   - Call-to-action buttons

3. **Information Display**
   - Phone number (large, highlighted)
   - Lead/Account ID
   - Campaign ID
   - Agent username (highlighted blue)
   - Timestamp (Asia/Manila timezone)

4. **Interactive Features**
   - [Open Full Account] button (links to full CRM)
   - [Close] button (closes pop-up)
   - Auto-close on 10-minute inactivity (optional)

5. **CSS Styling**
   - Modern glass-morphism design
   - Gradient backgrounds
   - Smooth transitions
   - Accessibility-friendly colors

### HTML Structure

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width">
    <title>CRM Account Pop-up</title>
    <style>
      /* Responsive CSS with gradients, shadows, transitions */
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📞 Account Lookup <span class="status-badge">LIVE</span></h1>
      </div>
      
      <div class="info-section">
        <div class="info-label">Phone Number (From Call)</div>
        <div class="info-value phone">${phone}</div>
      </div>
      
      <!-- More info sections -->
      
      <div class="action-buttons">
        <button class="btn btn-primary">Open Full Account</button>
        <button class="btn btn-secondary">Close</button>
      </div>
      
      <div class="timestamp">Generated: ${timestamp} (PHT)</div>
    </div>
    
    <script>
      // Client-side functionality
    </script>
  </body>
</html>
```

---

## 🔐 SECURITY CONSIDERATIONS

### Current Status (Testing)
- ✅ Handles missing parameters gracefully
- ✅ Returns user-friendly error messages
- ✅ Logs all access attempts
- ✅ Validates query parameters

### For Production Implementation

**Must Add:**

1. **Authentication**
   ```typescript
   // Require JWT token or API key
   @UseGuards(JwtAuthGuard)
   async dialerPop(@Query(...) params) { }
   ```

2. **Authorization**
   ```typescript
   // Verify agent has access to this campaign
   // Verify agent can view this account
   ```

3. **HTTPS/TLS**
   ```
   // Use https:// instead of http://
   // Prevent man-in-the-middle attacks
   ```

4. **Rate Limiting**
   ```typescript
   // Throttle requests per IP/agent
   // Prevent brute force attacks
   @Throttle(100, 60) // 100 requests per 60 seconds
   ```

5. **Input Validation**
   ```typescript
   // Validate phone format
   // Validate lead_id format
   // Validate campaign_id exists
   // Use parameterized queries if querying DB
   ```

6. **CORS Configuration**
   ```typescript
   // Only allow requests from Vicidial domain
   // Don't allow all origins
   ```

7. **IP Whitelisting**
   ```typescript
   // Only Vicidial server IPs allowed
   // Block other sources
   ```

8. **Comprehensive Logging**
   ```typescript
   // Log to persistent audit table
   // Include IP address, timestamp, agent, account
   // Retention policy for compliance
   ```

9. **Error Handling**
   ```typescript
   // Don't expose stack traces to client
   // Log full errors server-side only
   ```

---

## 💾 DATABASE INTEGRATION (Future)

### Recommended Schema for Account Lookup

When moving beyond testing, implement account lookup:

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  account_number VARCHAR(50) UNIQUE,
  phone_number VARCHAR(20),
  lead_id VARCHAR(50) UNIQUE,
  full_name VARCHAR(255),
  current_balance DECIMAL(12,2),
  status VARCHAR(50),
  assigned_agent_id UUID,
  last_contact_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE dialer_pop_logs (
  id UUID PRIMARY KEY,
  phone_number VARCHAR(20),
  lead_id VARCHAR(50),
  campaign_id VARCHAR(50),
  agent_user VARCHAR(100),
  account_id UUID REFERENCES accounts(id),
  accessed_at TIMESTAMP,
  user_agent TEXT,
  source_ip VARCHAR(45),
  response_status INT
);

CREATE INDEX idx_phone_number ON accounts(phone_number);
CREATE INDEX idx_lead_id ON accounts(lead_id);
CREATE INDEX idx_dialer_logs_accessed ON dialer_pop_logs(accessed_at);
```

### Enhanced Endpoint with Database Lookup

```typescript
@Get('dialer-pop')
async dialerPop(
  @Query('phone') phone: string,
  @Query('lead_id') leadId: string,
  @Query('campaign_id') campaignId: string,
  @Query('agent_user') agentUser: string,
  @Res() res: Response
) {
  // 1. Validate inputs
  // 2. Find account by phone or lead_id
  // 3. Check agent authorization
  // 4. Log access event
  // 5. Return HTML with account details from database
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Production Deployment

Infrastructure:
- [ ] CRM running on HTTPS (SSL/TLS certificate)
- [ ] Vicidial firewall configured to allow requests
- [ ] Rate limiting configured
- [ ] WAF (Web Application Firewall) rules in place
- [ ] Load balancer configured (if needed)
- [ ] Database backup strategy in place

Code:
- [ ] Input validation implemented
- [ ] Error handling doesn't leak information
- [ ] Logging to persistent storage
- [ ] CORS properly restricted
- [ ] Authentication/authorization added
- [ ] IP whitelisting enabled
- [ ] Performance tested (load testing)

Configuration:
- [ ] Environment variables for production
- [ ] Secrets management (API keys, etc.)
- [ ] Feature flags for gradual rollout
- [ ] Monitoring/alerting configured
- [ ] Log retention policies set

Compliance:
- [ ] Data privacy reviewed
- [ ] Audit logging enabled
- [ ] Retention policies defined
- [ ] Backup and recovery tested
- [ ] Documentation updated

---

## 📊 PERFORMANCE METRICS

### Expected Performance
- **Latency:** < 100ms (local request)
- **Response Size:** ~8-12 KB (HTML + CSS + JS)
- **Concurrent Users:** 100+ (depends on server resources)
- **Database Lookup:** < 50ms (with proper indexes)

### Optimization Tips

1. **Cache Account Data**
   ```typescript
   // Cache frequently accessed accounts
   @Cacheable('account', {ttl: 300}) // 5 minutes
   ```

2. **Connection Pooling**
   ```typescript
   // Use connection pools for database
   // Default: 10 connections, max: 20
   ```

3. **CDN for Static Assets**
   ```
   // Serve CSS/JS from CDN
   // Reduces latency for remote agents
   ```

4. **Compress Response**
   ```typescript
   // Enable gzip compression
   // Reduces bandwidth 60-70%
   ```

---

## 🧪 TESTING GUIDE

### Unit Tests (Jest)

```typescript
describe('DialerPopController', () => {
  describe('dialerPop', () => {
    it('should return HTML when valid params provided', async () => {
      const result = await controller.dialerPop(
        '+63912345678',
        'ACC001',
        'campaign_001',
        'agent_john',
        mockResponse
      );
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 400 when phone and lead_id missing', async () => {
      const result = await controller.dialerPop(
        null,
        null,
        'campaign_001',
        'agent_john',
        mockResponse
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
```

### Integration Tests

```typescript
describe('Dialer Pop Integration', () => {
  it('should handle full request flow', async () => {
    const response = await request(app.getHttpServer())
      .get('/dialer-pop')
      .query({
        phone: '+63912345678',
        lead_id: 'ACC001',
        campaign_id: 'campaign_001',
        agent_user: 'agent_john'
      });
    
    expect(response.status).toBe(200);
    expect(response.type).toContain('text/html');
    expect(response.text).toContain('+63912345678');
  });
});
```

### Manual Testing

1. **Browser Test:**
   ```
   http://localhost:3000/dialer-pop?phone=%2B63912345678&lead_id=ACC001&campaign_id=test&agent_user=john
   ```

2. **cURL Test:**
   ```bash
   curl "http://localhost:3000/dialer-pop?phone=%2B63912345678&lead_id=ACC001&campaign_id=test&agent_user=john"
   ```

3. **Postman Test:**
   - Method: GET
   - URL: http://localhost:3000/dialer-pop
   - Params: phone, lead_id, campaign_id, agent_user

---

## 📱 VICIDIAL VARIABLE MAPPING

### How Vicidial Replaces Variables

Vicidial uses custom variable format: `--A--variable_name--B--`

Supported variables in our implementation:
- `--A--phone_number--B--` → Caller's phone number
- `--A--lead_id--B--` → Lead identifier
- `--A--campaign_id--B--` → Campaign code
- `--A--user--B--` → Agent username

### Vicidial API Integration (Optional)

For bi-directional integration:

```typescript
// Call Vicidial API to fetch lead details
async getLeadFromVicidial(leadId: string) {
  const response = await this.httpService
    .get(`http://vicidial-server/api/get_lead?lead_id=${leadId}`)
    .toPromise();
  
  return response.data;
}
```

---

## 🔄 WORKFLOW SEQUENCE

### Complete Request/Response Flow

```
REQUEST:
GET /dialer-pop?phone=%2B63912345678&lead_id=ACC001&campaign_id=campaign_001&agent_user=agent_john
Host: localhost:3000
User-Agent: Mozilla/5.0...
Accept: text/html...

↓ [NestJS Route Handler Processes]

PROCESSING:
1. Extract query parameters
2. Validate parameters (at least one ID provided)
3. Log request to console
4. Construct HTML response
5. Set response headers

↓ [Generate HTML]

RESPONSE:
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 8243
Cache-Control: no-store, no-cache

<!DOCTYPE html>
<html>
  ...styled pop-up with embedded data...
</html>

↓ [Browser Renders]

BROWSER:
- Displays styled pop-up window
- Executes JavaScript
- Shows caller information
- Provides action buttons
```

---

## 🛠️ TROUBLESHOOTING - TECHNICAL

### Common Issues

#### 1. CORS Errors
**Symptom:** Browser console shows "No 'Access-Control-Allow-Origin' header"

**Cause:** Different domain calling the endpoint

**Solution:**
```typescript
@Controller('dialer-pop')
@UseGuards(CorsGuard)
export class DialerPopController {
  // Implementation
}
```

#### 2. Query Parameters Not Received
**Symptom:** Phone number shows as undefined/null

**Cause:** URL encoding issues or parameter names wrong

**Solution:**
```
Correct: http://...?phone=%2B123456789
Wrong:   http://...?phonenumber=123456789

URL encoding:
+ = %2B
space = %20
/ = %2F
```

#### 3. Timeout Errors
**Symptom:** Request takes > 30 seconds, then times out

**Cause:** Database query too slow or network latency

**Solution:**
```typescript
// Set timeout for routes
app.use(timeout('10s')); // 10 seconds
```

#### 4. Memory Leaks
**Symptom:** Server memory usage grows over time

**Cause:** Event listeners not cleaned up

**Solution:**
```typescript
// Always clean up
ngOnDestroy() {
  this.subscription.unsubscribe();
}
```

---

## 📈 MONITORING & OBSERVABILITY

### Metrics to Track

```typescript
// Response time
const startTime = Date.now();
// ... processing ...
const duration = Date.now() - startTime;
console.log(`Request took ${duration}ms`);

// Success rate
dialerPopSuccesses / (dialerPopSuccesses + dialerPopErrors)

// Requests per minute
dialerPopRequests / 60

// Unique agents
SELECT COUNT(DISTINCT agent_user) FROM dialer_pop_logs

// Most accessed accounts
SELECT lead_id, COUNT(*) as access_count
FROM dialer_pop_logs
GROUP BY lead_id
ORDER BY access_count DESC
```

### Logging Strategy

```typescript
// Different log levels
logger.debug('Detailed debug info');
logger.log('General information');
logger.warn('Warning - something unexpected');
logger.error('Error - operation failed');
```

---

## 📚 RELATED DOCUMENTATION

- [Vicidial API Documentation](https://www.vicidial.org/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [RESTful API Best Practices](https://restfulapi.net/)
- [OWASP Security Guidelines](https://owasp.org/)

---

## 📞 TECHNICAL SUPPORT

### Information to Provide When Reporting Issues

1. **Request Details:**
   - URL being called
   - Query parameters
   - Headers sent

2. **Response Details:**
   - HTTP status code
   - Response headers
   - Response body (first 100 chars)

3. **Environment:**
   - OS (Windows/Linux/Mac)
   - Node.js version
   - NestJS version
   - Browser type and version

4. **Logs:**
   - Backend console output
   - Browser console output (F12)
   - Network tab details (F12 → Network)

5. **Reproducibility:**
   - Steps to reproduce
   - Frequency (always/sometimes/once)
   - Related events/changes

---

**Document Version:** 1.0  
**Last Updated:** December 10, 2025  
**Status:** Testing Only - Not for Production Use Without Security Hardening
