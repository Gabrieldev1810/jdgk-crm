# Vicidial → CRM Webform Integration Testing Guide
## No-Code Setup Instructions

**⚠️ TESTING ONLY** - This guide is for development and testing purposes only. For production deployment, implement proper security measures including authentication, HTTPS, IP whitelisting, and audit logging.

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Understanding the Integration](#understanding-the-integration)
3. [Network Setup Options](#network-setup-options)
4. [Vicidial Configuration](#vicidial-configuration)
5. [CRM Endpoint Verification](#crm-endpoint-verification)
6. [Testing Procedures](#testing-procedures)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Test Webform URL (Copy-Paste Ready)

#### For Local Testing (Same Machine)
```
http://localhost:3000/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--
```

#### For LAN Testing (Multiple Devices)
```
http://192.168.1.100:3000/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--
```
*Replace `192.168.1.100` with your CRM server's actual IP address*

#### For Remote Testing (ngrok Tunnel)
```
https://your-ngrok-url.ngrok.io/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--
```
*See [ngrok Setup](#remote-testing-with-ngrok) section below*

---

## Understanding the Integration

### How It Works

```
┌─────────────────────┐
│   Vicidial Server   │
│  (Agent Dials Call) │
└──────────┬──────────┘
           │
           │ (Call Connected)
           │
           ▼
┌──────────────────────────────────────┐
│  Agent Desktop (Vicidial GUI)        │
│  ┌──────────────────────────────┐   │
│  │ Click: Open Webform Button   │   │
│  │      OR                       │   │
│  │ Auto-Open on Call Connection │   │
│  └──────────┬────────────────────┘   │
│             │                         │
│             │ Browser Opens with URL: │
│             │ /dialer-pop?phone=...   │
│             ▼                         │
│  ┌──────────────────────────────┐   │
│  │  CRM Pop-up Window Opens     │   │
│  │  (Same Browser on Agent PC)  │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
           │
           │ HTTP GET Request with Parameters
           │ phone=+63912345678
           │ lead_id=ACC2024120145AB
           │ campaign_id=cam_001
           │ agent_user=agent_john
           │
           ▼
┌─────────────────────────────────────┐
│   JDGK CRM Server (:3000)           │
│  /dialer-pop Endpoint               │
│                                     │
│  1. Receive Parameters              │
│  2. Look Up Account Record          │
│  3. Display Account Details         │
│  4. (Optional) Log Access Event     │
└─────────────────────────────────────┘
```

### Dynamic Variables Explained

Vicidial automatically replaces these placeholders with actual call data:

| Variable | Example | Description |
|----------|---------|-------------|
| `--A--phone_number--B--` | `+63912345678` | Caller's phone number (lead phone) |
| `--A--lead_id--B--` | `ACC2024120145AB` | Unique lead/account identifier in Vicidial |
| `--A--campaign_id--B--` | `campaign_001` | Campaign ID the call belongs to |
| `--A--user--B--` | `agent_john` | Username of agent handling the call |

**Example after substitution:**
```
http://localhost:3000/dialer-pop?phone=%2B63912345678&lead_id=ACC2024120145AB&campaign_id=campaign_001&agent_user=agent_john
```

---

## Network Setup Options

### Option 1: Local Testing (Same Machine)
**Best for:** Initial setup, single machine testing

**Requirements:**
- Vicidial and CRM running on same machine
- CRM server on port 3000 (default)

**Advantages:**
- Fastest setup
- No network configuration needed
- Easiest debugging

**Disadvantages:**
- Can't test multi-device scenarios
- Browser must be on same machine

**Webform URL:**
```
http://localhost:3000/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--
```

**Setup Steps:**
1. Both servers running on same PC
2. Use `localhost:3000` in Vicidial webform
3. Test immediately

---

### Option 2: LAN Testing (Multiple Devices)
**Best for:** Testing across office network

**Requirements:**
- CRM server on accessible network IP
- Agents on same local network
- Firewall allows port 3000

**Advantages:**
- Test realistic network scenario
- Multiple agents can test simultaneously
- Better performance simulation

**Disadvantages:**
- Need to know server IP
- Network configuration required
- Firewall rules needed

**Find Your CRM Server IP:**

**On Windows (CRM Server):**
```
Command Prompt: ipconfig
Look for "IPv4 Address" under your network adapter
Example: 192.168.1.100
```

**On Mac/Linux (CRM Server):**
```
Terminal: ifconfig
Look for "inet" address
Example: 192.168.1.100
```

**Webform URL (Replace IP with your actual IP):**
```
http://192.168.1.100:3000/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--
```

**Setup Steps:**
1. Find CRM server IP using command above
2. Test connectivity: Open browser, go to `http://192.168.1.100:3000`
3. Should see CRM login page
4. If not reachable:
   - Check server is running: `npm run start` in backend folder
   - Check firewall: Allow port 3000 in Windows Firewall
   - Check if agent PC is on same network
5. Use confirmed IP in Vicidial webform URL

**Firewall Configuration (Windows):**
1. Windows Settings → Privacy & Security → Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find Node.js or your app, check "Private"
4. Test again from agent PC

---

### Option 3: Remote Testing (ngrok Tunnel)
**Best for:** Remote agents, cloud testing, quick demos

**Requirements:**
- ngrok free account (ngrok.com)
- Internet connection
- 5 minutes to set up

**Advantages:**
- Works from anywhere in the world
- No firewall/port forwarding needed
- Easy to share with remote users

**Disadvantages:**
- ngrok URL changes on restart (free plan)
- Slightly higher latency
- Requires ngrok account/service

**Step-by-Step ngrok Setup:**

**Step 1: Download ngrok**
1. Go to [ngrok.com](https://ngrok.com)
2. Click "Sign Up" (free tier available)
3. Download ngrok for your OS (Windows/Mac/Linux)
4. Extract to a folder you remember

**Step 2: Start ngrok Tunnel**

**On Windows:**
```
Open Command Prompt in ngrok folder:
ngrok http 3000
```

**On Mac/Linux:**
```
Open Terminal:
./ngrok http 3000
```

**You will see:**
```
Session Status    online
Account           <your-account>
Version           3.x.x
Region            us
Forwarding        https://abc123xyz789.ngrok.io -> http://localhost:3000
```

**Copy the ngrok URL:** `https://abc123xyz789.ngrok.io`

**Step 3: Create Webform URL**

Use ngrok URL with your dynamic variables:
```
https://abc123xyz789.ngrok.io/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--
```

**Step 4: Keep ngrok Running**
- Don't close the ngrok command prompt
- When you restart ngrok, URL changes (get new URL and update Vicidial)
- For persistent URLs, upgrade to ngrok paid plan

**⚠️ Important Notes:**
- Free ngrok URLs change every time you restart
- Keep a note of your current ngrok URL
- Tell remote agents the current URL before testing
- Pro Tip: Use ngrok authtoken to keep URL constant (ngrok pro plan)

---

## Vicidial Configuration

### Step 1: Access Vicidial Admin Panel

1. Open Vicidial web interface in browser
2. Login with admin credentials
3. Navigate to: **Admin** → **Campaigns**
4. Select or create the campaign to configure

### Step 2: Enable Webform in Campaign

1. In Campaign Edit screen, find **"Lead Web Form"** section
2. Change **"Webform Enabled"** from `NO` to `YES`
3. Find the **"Web Form URL"** field (usually labeled "URL" or "Web Form URL")
4. **CLEAR** any existing content
5. **PASTE** your test URL:
   - Local: `http://localhost:3000/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--`
   - LAN: `http://192.168.1.100:3000/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--`
   - Remote: `https://abc123xyz789.ngrok.io/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--`

### Step 3: Choose Webform Launch Method

Vicidial offers two ways to open the webform:

#### Option A: Agent Button (Manual Click)
1. Find **"Webform Open Method"** or similar setting
2. Select **"Button"** or **"Manual"**
3. Agent will see "Open Webform" button on their screen
4. Agent clicks button when needed
5. CRM pop-up opens in browser

**Pros:** Agent controls when to look at CRM
**Cons:** Manual step during call

#### Option B: Auto-Open on Call Connection
1. Find **"Webform Open Method"** setting
2. Select **"Auto"** or **"Automatic on Dial"**
3. When call connects, browser automatically opens pop-up
4. CRM record appears instantly (screen pop effect)

**Pros:** Instant screen pop, no manual action
**Cons:** Pop-up might interrupt agent's workflow

### Step 4: Agent Group Permissions

1. Go to **Admin** → **Agent Groups**
2. Select the agent group
3. Find **"Use Webform"** or **"Webform Access"** permission
4. Set to **"YES"** or check the checkbox
5. Make sure agents belong to this group
6. Click **SAVE**

### Step 5: Save Campaign Configuration

1. After making all changes, scroll to bottom
2. Click **"SAVE"** button
3. You should see confirmation: "Campaign updated successfully"

### Step 6: Verify Agent User Permissions

1. Go to **Admin** → **Users**
2. Select the test agent user
3. Find **"Webform Enabled"** field
4. Ensure it's set to **"YES"**
5. Verify agent is in correct group (from Step 4)
6. Click **SAVE**

---

## CRM Endpoint Verification

### What the `/dialer-pop` Endpoint Does

The endpoint located at `/dialer-pop` in your CRM should:

1. **Accept Query Parameters:**
   - `phone` - Phone number of caller
   - `lead_id` - Account/Lead ID
   - `campaign_id` - Campaign code
   - `agent_user` - Username of agent

2. **Search for Account:**
   - Look up account by phone number OR lead_id
   - Match against Account Management database

3. **Display Account Record:**
   - Show account name, phone, balance, status
   - Display call history if available
   - Show assigned agent

4. **Optional: Log Access Event**
   - Record timestamp
   - Record which agent accessed which account
   - Useful for audit trail

### Pre-Testing Checklist

Before testing webform integration, verify:

**☐ Checklist:**
- [ ] CRM backend running: `npm run start` in `/backend` folder
- [ ] CRM frontend running on port 3000
- [ ] Test accounts exist in CRM database
- [ ] `/dialer-pop` endpoint is implemented
- [ ] Endpoint accepts query parameters
- [ ] Endpoint returns HTML pop-up or account details
- [ ] No authentication blocking the endpoint (or allow unauthenticated access for testing)

### Test the Endpoint Directly

Before testing from Vicidial, test the endpoint in browser:

**Step 1: Use a Test Account**
- Find an account in your CRM Account Management
- Note: Phone number (e.g., +63912345678)
- Note: Account ID (e.g., ACC2024120145AB)

**Step 2: Open Browser and Test URL**

**Local Test:**
```
http://localhost:3000/dialer-pop?phone=%2B63912345678&lead_id=ACC2024120145AB&campaign_id=TEST001&agent_user=agent_john
```

**LAN Test:**
```
http://192.168.1.100:3000/dialer-pop?phone=%2B63912345678&lead_id=ACC2024120145AB&campaign_id=TEST001&agent_user=agent_john
```

Note: `%2B` is URL encoding for `+` symbol in phone number

**Step 3: Expected Result**
- Page loads
- Account record displays
- Shows account name, details, balance, status
- OR if modal: pop-up window opens with account details

**Step 4: If Page Doesn't Load**
- Check CRM backend is running
- Check port 3000 is accessible
- Check browser console (F12) for errors
- Check CRM logs for error messages

---

## Testing Procedures

### Full Integration Test Checklist

#### Pre-Test Setup (15 minutes)

1. **CRM Server Running**
   ```
   Backend: Terminal in /backend folder
   Command: npm run start
   Status: Should show "Connected to PostgreSQL" and "listening on port 3000"
   ```

2. **Test Account Created**
   - Login to CRM
   - Go to Account Management
   - Create test account or note existing one
   - Record: Phone, Account ID, Name

3. **Vicidial Campaign Configured**
   - Campaign has webform enabled
   - Webform URL pasted correctly
   - Agent has webform permissions

4. **Network Verified**
   - For Local: Both services on same machine
   - For LAN: CRM IP accessible from agent PC
   - For Remote: ngrok tunnel active

#### Test Scenario 1: Manual Button Click

**Procedure:**
1. Login to Vicidial as test agent
2. Load test campaign
3. Dial a test phone number (or use VICIdial test extension)
4. When call connects, look for **"Open Webform"** button
5. Click the button
6. Browser should open new window with CRM pop-up
7. Verify account record appears with correct phone number

**Expected Result:** ✅ Account displays with phone number from call

**Troubleshooting if Failed:**
- Button not showing? Check webform enabled in campaign
- Window doesn't open? Check pop-up blocker settings
- Wrong account? Check phone number matches in both systems

#### Test Scenario 2: Auto Screen Pop

**Procedure:**
1. Configure campaign for "Auto Webform" (if supported)
2. Login to Vicidial as test agent
3. Dial a test number
4. When call connects (do NOT click button)
5. Browser should automatically open CRM pop-up
6. Verify account appears instantly

**Expected Result:** ✅ CRM pop-up auto-opens with account details

**Troubleshooting if Failed:**
- Pop-up not opening? Check browser pop-up blocker
- Check webform method is set to "Auto" in campaign
- Check agent group has webform enabled

#### Test Scenario 3: Multiple Agents

**Procedure (if testing with team):**
1. Configure campaign in Vicidial
2. Have 2+ agents login to Vicidial
3. Each agent dials a different call
4. Each opens webform from their call
5. Verify each gets their own account details

**Expected Result:** ✅ Each agent sees correct account for their call

**Troubleshooting if Failed:**
- Check agent_user parameter is passed correctly
- Verify each agent is in correct group
- Check agent usernames match between systems

#### Test Scenario 4: Logging & Audit Trail

**Procedure (if logging implemented):**
1. Make several test calls
2. Open webform for each call
3. Check CRM logs or database
4. Verify entries recorded with:
   - Timestamp
   - Agent username
   - Phone number
   - Lead ID

**Expected Result:** ✅ Audit log shows all webform accesses

**Troubleshooting if Failed:**
- Check if logging is implemented
- Verify database table exists
- Check log file location

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Connection Refused" or Page Won't Load

**Symptoms:**
- Browser shows "Unable to connect" or "Connection refused"
- Error happens with localhost, LAN IP, or ngrok URL

**Solutions:**

1. **Check CRM Backend is Running:**
   ```
   Terminal: cd c:\Users\Gab\OneDrive\Desktop\my projects\jdgk-crm\backend
   Command: npm run start
   Should show: "listening on port 3000" and "Connected to PostgreSQL"
   ```

2. **Check Port 3000 is Not Blocked:**
   - Windows: Settings → Windows Defender Firewall → Allow app through firewall
   - Allow Node.js or your backend service
   - Restart CRM if changed

3. **Check Correct URL:**
   - Should include `/dialer-pop` endpoint
   - Should have correct IP or domain
   - Syntax should match exactly

4. **For LAN: Check IP Address:**
   ```
   Command Prompt: ipconfig
   Find: IPv4 Address (not 127.0.0.1, should be 192.168.x.x or 10.x.x.x)
   ```

5. **For ngrok: Check Tunnel is Running:**
   - ngrok command prompt should show "online"
   - If says "offline", restart ngrok
   - Get new URL from ngrok output

---

#### Issue 2: Page Loads but No Account Shows

**Symptoms:**
- URL opens successfully
- Page is blank or shows generic message
- No account details appear

**Solutions:**

1. **Check Query Parameters:**
   - Verify phone number format
   - Verify lead_id exists in CRM database
   - Try manually constructing URL with known data:
   ```
   http://localhost:3000/dialer-pop?phone=%2B1234567890&lead_id=TEST001&campaign_id=campaign_001&agent_user=test_agent
   ```

2. **Verify Test Account Exists:**
   - Login to CRM
   - Go to Account Management
   - Search for account with that phone number
   - If not found, create test account first

3. **Check CRM Logs:**
   - Look at backend terminal for errors
   - Should show `/dialer-pop` request received
   - Look for error messages

4. **Browser Console:**
   - Press F12 to open Developer Tools
   - Check Console tab for JavaScript errors
   - Check Network tab to see API responses
   - Check if response is 200 OK or error code

---

#### Issue 3: Pop-up Blocked by Browser

**Symptoms:**
- Nothing happens when clicking "Open Webform"
- Browser shows pop-up blocked notification
- Small icon appears in address bar

**Solutions:**

1. **Unblock Pop-ups for Your Domain:**
   - Click pop-up blocked icon in address bar
   - Select "Always allow pop-ups from [domain]"
   - Reload page and try again

2. **Or Disable Pop-up Blocker:**
   - Chrome: Settings → Privacy and security → Site settings → Pop-ups and redirects → Allow
   - Firefox: Preferences → Privacy → Permissions → Pop-up windows → Allow

3. **Change Settings Before Testing:**
   - Configure this on agent PC before large testing
   - Document the change for users

---

#### Issue 4: Dynamic Variables Not Working

**Symptoms:**
- Phone number shows as "--A--phone_number--B--" (literal text, not actual number)
- Parameters not being replaced by Vicidial

**Solutions:**

1. **Verify Vicidial Variable Format:**
   - Vicidial may use different syntax
   - Common formats: `--A--xxx--B--`, `[xxx]`, `{xxx}`
   - Check Vicidial documentation for your version

2. **Check Campaign Data Mapping:**
   - Go to Campaign → Advanced Settings
   - Verify "phone_number" field maps to lead phone
   - Verify "lead_id" field exists in Vicidial database
   - Verify "campaign_id" is campaign code
   - Verify "user" is agent username field

3. **Contact Vicidial Support:**
   - Ask which variable format they support
   - Ask which fields are available to pass
   - Get correct URL format from them

4. **Fallback: Manual Entry**
   - If automatic variable replacement fails
   - Use static test URL with fake data first
   - Confirm CRM endpoint works
   - Then troubleshoot Vicidial variable passing

---

#### Issue 5: "Must have a value prop that is not an empty string" Error

**Symptoms:**
- Error appears in browser console
- Campaign dropdown or select field not working
- Page may not load or field broken

**Solutions:**

1. **This is a frontend bug, not integration issue**
   - Backend/webform integration still works
   - The error is in Campaign selector in CRM
   - Try refreshing page

2. **If error repeats:**
   - Clear browser cache (Ctrl+Shift+Delete)
   - Try different browser
   - Check CRM frontend for updates

3. **Doesn't affect webform testing:**
   - You can still use webform from Vicidial
   - Error is only in admin interface
   - Frontend will be fixed in next version

---

#### Issue 6: ngrok URL Not Working

**Symptoms:**
- ngrok tunnel shows "online" but URL returns 502 Bad Gateway
- or connection times out
- or shows "Tunnel closed" message

**Solutions:**

1. **Verify CRM is Accessible Locally:**
   - First test: `http://localhost:3000` in same machine
   - Should load CRM
   - If fails, CRM not running or port wrong

2. **Check ngrok Syntax:**
   - Should be: `ngrok http 3000`
   - Not: `ngrok http localhost:3000`
   - Not: `ngrok start my-tunnel`
   - Simple `ngrok http PORT_NUMBER` format

3. **Restart ngrok:**
   - Close ngrok command prompt
   - Wait 5 seconds
   - Restart: `ngrok http 3000`
   - You'll get new URL
   - Update URL everywhere

4. **Check Internet Connection:**
   - ngrok needs internet to function
   - Test with: `ping google.com`
   - If no internet, ngrok won't work

5. **ngrok Free Plan Limits:**
   - Session lasts 2 hours max
   - URL changes on restart
   - Limited bandwidth
   - Upgrade to Pro for persistent URLs

---

#### Issue 7: Vicidial Not Finding Test Lead

**Symptoms:**
- Vicidial shows "No lead" or "Invalid lead"
- Can't dial the test number
- Campaign won't load test data

**Solutions:**

1. **Import Test Leads:**
   - In Vicidial: Admin → Import Leads
   - Create or upload CSV with test phone numbers
   - Assign to test campaign
   - Assign to test user (agent)

2. **Verify Lead Data:**
   - Go to Vicidial: Leads → List Leads
   - Search for your test phone number
   - Verify it shows under correct campaign
   - Verify assigned to test agent

3. **Check Campaign Status:**
   - Campaign must be "ACTIVE" not "INACTIVE"
   - Campaign must have leads in it
   - Campaign must be assigned to agent

4. **Dial Test Extension:**
   - Some Vicidial systems support test calls
   - Dial "8000" or "9000" internally
   - This generates test call
   - Useful if no real leads yet

---

### Quick Diagnosis Tool

**If something isn't working, check in this order:**

1. **Is CRM Running?**
   ```
   Can you open http://localhost:3000 in browser?
   YES → Continue to #2
   NO → Start CRM: npm run start in /backend
   ```

2. **Is Endpoint Accessible?**
   ```
   Can you open the /dialer-pop URL directly?
   YES → Continue to #3
   NO → Check firewall, port, URL syntax
   ```

3. **Does Endpoint Return Account?**
   ```
   Does page show account details or just blank page?
   YES → Backend is working, check Vicidial config
   NO → Check query parameters, check account exists in database
   ```

4. **Is Vicidial Configured?**
   ```
   Is webform enabled in campaign?
   Is URL pasted exactly?
   Is agent in correct group?
   YES → Ready to test
   NO → Go to Vicidial Configuration section above
   ```

5. **Run Test Call**
   ```
   Can you open webform from Vicidial?
   YES → SUCCESS! Integration working
   NO → Check pop-up blocker, check browser console, check CRM logs
   ```

---

## Network Diagram Reference

### Local Setup
```
┌─────────────────────────────────┐
│  Your Computer                  │
│  ┌───────────────────────────┐  │
│  │ Vicidial Server           │  │
│  │ (Port 5060/5061)          │  │
│  └────────────┬──────────────┘  │
│               │                  │
│               ▼                  │
│  ┌───────────────────────────┐  │
│  │ Browser with Agent GUI    │  │
│  │ Webform Button            │  │
│  └────────────┬──────────────┘  │
│               │                  │
│               │ HTTP Request     │
│               ▼                  │
│  ┌───────────────────────────┐  │
│  │ CRM Server (localhost:3000)
│  │ /dialer-pop Endpoint      │  │
│  │ Returns Account Details   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### LAN Setup
```
┌─────────────────────────────────┐  ┌──────────────────────────────┐
│  Vicidial Server PC             │  │  Agent PC (Same Network)     │
│  192.168.1.50                   │  │  192.168.1.101               │
└─────────────────────────────────┘  └──────────────┬───────────────┘
                                                    │
                                                    │ HTTP Request
                                                    ▼
                                      ┌──────────────────────────────┐
                                      │  Browser on Agent PC         │
                                      │  Opens CRM at:               │
                                      │  http://192.168.1.100:3000   │
                                      │  /dialer-pop?phone=...       │
                                      └──────────────────────────────┘
                                                    │
                                                    │ (Same Network)
                                                    ▼
                                      ┌──────────────────────────────┐
                                      │  CRM Server (192.168.1.100)  │
                                      │  Port 3000                   │
                                      │  Returns Account Details     │
                                      └──────────────────────────────┘
```

### Remote Setup (ngrok)
```
┌──────────────────────────────────────┐
│  Your CRM (Anywhere)                 │
│  - Backend running on :3000          │
│  - ngrok tunnel running              │
│  - Public URL: abc123.ngrok.io       │
└────────────────┬─────────────────────┘
                 │
                 │ ngrok Tunnel
                 │
         ┌───────▼────────┐
         │  INTERNET      │
         └────────┬────────┘
                  │
                  ▼
    ┌─────────────────────────────────┐
    │ Remote Agent PC                 │
    │ (Different Location)            │
    │ Browser opens:                  │
    │ https://abc123.ngrok.io/...     │
    │                                 │
    │ Vicidial Webform Button         │
    │ Auto-opens CRM window           │
    └─────────────────────────────────┘
```

---

## Production Readiness Checklist

**⚠️ Before Going Live, Ensure:**

- [ ] HTTPS enabled (not HTTP)
- [ ] Authentication/authorization on endpoint
- [ ] IP whitelisting (only Vicidial servers allowed)
- [ ] Audit logging implemented
- [ ] Rate limiting to prevent abuse
- [ ] Data validation on all parameters
- [ ] Error handling doesn't expose sensitive info
- [ ] CORS properly configured
- [ ] Secure token/API key if applicable
- [ ] Tested with production Vicidial instance
- [ ] Load testing performed
- [ ] Disaster recovery plan
- [ ] Documentation updated
- [ ] Team trained on integration

---

## Quick Reference

### All Test URLs at a Glance

```
LOCAL (Same Machine):
http://localhost:3000/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--

LAN (Multiple Devices):
http://192.168.1.100:3000/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--

REMOTE (ngrok):
https://abc123xyz789.ngrok.io/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--
```

### Key Files to Check

- **CRM Backend:** `backend/src/main.ts` (should be running on :3000)
- **Dialer Pop Endpoint:** `backend/src/root.controller.ts` or similar
- **CRM Frontend:** `frontend/src/pages/` folder

### Important Ports

| Service | Port | Purpose |
|---------|------|---------|
| CRM Backend API | 3000 | Test webform requests |
| CRM Frontend | 3001 (or same) | Login to CRM admin |
| Vicidial | 5060/5061 | SIP/VoIP (default) |
| ngrok (local) | 4040 | ngrok web UI (if running) |

---

## Support & Next Steps

### If Still Having Issues

1. **Check all three connections work:**
   - Vicidial → Agent Browser (internal)
   - Agent Browser → CRM Server (HTTP)
   - Account lookup works (database query)

2. **Test in isolation:**
   - First: test CRM endpoint manually
   - Second: test from Vicidial with dummy URL
   - Third: test full integration

3. **Enable debugging:**
   - Check browser console (F12)
   - Check CRM backend logs
   - Enable Vicidial webform logging if available

4. **Ask for help:**
   - Have ready: CRM logs, Vicidial configuration, test URL used, error messages
   - Document exact steps taken
   - List what worked and what didn't

---

**Last Updated:** December 10, 2025  
**For Testing Only** - Not suitable for production without security hardening

