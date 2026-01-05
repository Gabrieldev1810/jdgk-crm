# Vicidial → CRM Integration - Visual Workflow & Troubleshooting

**Document Type:** Visual Guide for Non-Technical Users  
**Purpose:** Understand how the integration works with diagrams  
**Last Updated:** December 10, 2025

---

## 📊 INTEGRATION ARCHITECTURE DIAGRAM

### How Everything Connects

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR OFFICE NETWORK                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐          ┌──────────────────┐           │
│  │  Vicidial Server │          │   CRM Server     │           │
│  │  (Port 5060)     │          │  (Port 3000)     │           │
│  └────────┬─────────┘          └────────┬─────────┘           │
│           │                             │                     │
│           │ SIP/VoIP                    │ HTTP                │
│           │                             ▼                     │
│           │                    ┌─────────────────┐            │
│           │                    │  /dialer-pop    │            │
│           │                    │   Endpoint      │            │
│           │                    └─────────────────┘            │
│           │                             ▲                     │
│           │                             │ Returns HTML        │
│           └────────────────────┬────────┘                     │
│                                │                              │
│  ┌────────────────────────────────────────────────┐           │
│  │    Agent PC/Browser                            │           │
│  │  ┌──────────────────────────────────────────┐  │           │
│  │  │  Vicidial Interface                      │  │           │
│  │  │  [Open Webform] ← Agent clicks button    │  │           │
│  │  └──────────┬───────────────────────────────┘  │           │
│  │             │                                  │           │
│  │             ▼                                  │           │
│  │  ┌──────────────────────────────────────────┐  │           │
│  │  │  CRM Pop-up Window                       │  │           │
│  │  │  Phone: +63912345678                     │  │           │
│  │  │  Lead ID: ACC2024120145AB                │  │           │
│  │  │  Account: Juan Dela Cruz                 │  │           │
│  │  │  Balance: ₱50,000.00                     │  │           │
│  │  │  Status: TOUCHED                         │  │           │
│  │  └──────────────────────────────────────────┘  │           │
│  └────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 STEP-BY-STEP CALL FLOW

### What Happens When Agent Clicks "Open Webform"

```
STEP 1: CALL ARRIVES
┌─────────────────────────────────────────┐
│ Phone rings at Vicidial                 │
│ Call is from: +63912345678              │
│ Vicidial Lead ID: ACC2024120145AB       │
│ Campaign: campaign_001                  │
│ Agent receiving: john_agent             │
└─────────────────────────────────────────┘
                    ↓

STEP 2: AGENT SEES WEBFORM BUTTON
┌─────────────────────────────────────────┐
│ Vicidial shows:                         │
│ [Webform] [Record] [Hang Up] buttons    │
│ Agent is on the phone with caller       │
│ Agent clicks: [Webform]                 │
└─────────────────────────────────────────┘
                    ↓

STEP 3: VICIDIAL CONSTRUCTS URL
┌─────────────────────────────────────────┐
│ Vicidial takes the base URL:            │
│ http://localhost:3000/dialer-pop?      │
│ phone=--A--phone_number--B--&...       │
│                                         │
│ And replaces variables:                 │
│ --A--phone_number--B-- → +63912345678  │
│ --A--lead_id--B-- → ACC2024120145AB    │
│ --A--campaign_id--B-- → campaign_001   │
│ --A--user--B-- → john_agent             │
│                                         │
│ Final URL:                              │
│ http://localhost:3000/dialer-pop?      │
│ phone=%2B63912345678&                  │
│ lead_id=ACC2024120145AB&               │
│ campaign_id=campaign_001&               │
│ agent_user=john_agent                   │
└─────────────────────────────────────────┘
                    ↓

STEP 4: BROWSER OPENS NEW WINDOW
┌─────────────────────────────────────────┐
│ Browser makes HTTP GET request          │
│ Sends URL to CRM server at port 3000    │
│ Includes query parameters above         │
└─────────────────────────────────────────┘
                    ↓

STEP 5: CRM SERVER PROCESSES REQUEST
┌─────────────────────────────────────────┐
│ CRM /dialer-pop endpoint receives:      │
│   phone: "+63912345678"                 │
│   lead_id: "ACC2024120145AB"            │
│   campaign_id: "campaign_001"           │
│   agent_user: "john_agent"              │
│                                         │
│ Server logs access:                     │
│   Time: 2024-12-10 10:45:30             │
│   Agent: john_agent                     │
│   Phone: +63912345678                   │
│   Campaign: campaign_001                │
│                                         │
│ (In production: Looks up account)       │
└─────────────────────────────────────────┘
                    ↓

STEP 6: HTML POP-UP RETURNED
┌─────────────────────────────────────────┐
│ CRM sends back formatted HTML           │
│ Browser renders styled pop-up window    │
│ Shows account information:              │
│   - Phone number                        │
│   - Lead ID                             │
│   - Campaign                            │
│   - Agent name                          │
│   - [Open Full Account] button          │
│   - [Close] button                      │
└─────────────────────────────────────────┘
                    ↓

STEP 7: AGENT SEES CRM DATA
┌─────────────────────────────────────────┐
│ Pop-up window opens on agent's screen   │
│ Shows: Juan Dela Cruz                   │
│        Phone: +63912345678              │
│        Account ID: ACC2024120145AB      │
│        Balance: ₱50,000.00              │
│                                         │
│ Agent can now:                          │
│ - See customer info while on call       │
│ - View account history                  │
│ - Update notes                          │
│ - Process collection                    │
└─────────────────────────────────────────┘
                    ↓

STEP 8: CALL COMPLETES
┌─────────────────────────────────────────┐
│ Agent updates account status            │
│ Agent clicks [Close] on pop-up          │
│ Agent processes call outcome            │
│ Vicidial records disposition            │
│ CRM records collection result           │
└─────────────────────────────────────────┘
```

---

## 🔗 URL STRUCTURE BREAKDOWN

Understanding what each part does:

```
http://localhost:3000/dialer-pop?phone=+63912345678&lead_id=ACC2024120145AB&campaign_id=campaign_001&agent_user=john_agent
│      │         │   │ │           │      │           │      │            │         │            │       │
│      │         │   │ │           │      │           │      └────────┬───┘        │            │       │
│      │         │   │ │           │      │           └──────────────┼────────────┼────────────┤
│      │         │   │ │           │      │                          │            │            │
│      │         │   │ │           │      └──────────────┬───────────┼────────────┼────────────┤
│      │         │   │ │           └──────────┬──────────┘           │            │            │
└──────┼─────────┼───┼─┘                      │                      │            │            │
Protocol Server  Port Endpoint        Query String (key=value&key=value)
                                      │           │            │            │
                                      │           │            │            └── Agent Username
                                      │           │            └── Campaign ID
                                      │           └── Lead ID (Account ID)
                                      └── Phone Number

KEY PARTS:
──────────────────────────────────────────────────────────────────

Protocol: http://
  → For testing (use https:// in production)

Server: localhost
  → Your CRM server address
  → Local: localhost
  → LAN: 192.168.1.100
  → Remote: your-ngrok-url.ngrok.io

Port: 3000
  → CRM API port (default)
  → Your IT team may use different port

Endpoint: /dialer-pop
  → The specific service that handles screen pop
  → Receives query parameters
  → Returns HTML pop-up

Query Parameters (after ?)
  → Phone: The caller's phone number
  → Lead ID: Unique account identifier
  → Campaign ID: Campaign code
  → Agent User: Who answered the call
  → All come from Vicidial automatically
```

---

## 🧪 TESTING FLOWCHART

Follow this decision tree to test:

```
START: Want to test Vicidial integration?
│
├─ First Time?
│  │
│  └─ YES → Go to "SETUP PHASE" below
│     NO → Go to "TESTING PHASE" below
│
SETUP PHASE:
│
├─ Step 1: Choose Setup Type
│  │
│  ├─ Same machine? (Local)
│  │  → URL: http://localhost:3000/dialer-pop?phone=...
│  │
│  ├─ Multiple devices on same network? (LAN)
│  │  → Find IP with: ipconfig
│  │  → URL: http://192.168.1.X:3000/dialer-pop?phone=...
│  │
│  └─ Remote agents? (ngrok)
│     → Download ngrok
│     → Run: ngrok http 3000
│     → URL: https://abc123xyz789.ngrok.io/dialer-pop?phone=...
│
├─ Step 2: Verify Endpoint Works
│  │
│  └─ Open in browser: http://localhost:3000/dialer-pop?phone=%2B1234567890&lead_id=TEST1&campaign_id=test&agent_user=agent1
│     │
│     ├─ See pop-up? → YES ✅ Continue
│     │
│     └─ NO → Check:
│        ├─ CRM is running? npm run start
│        ├─ Port 3000 open? Check firewall
│        ├─ Correct URL? Paste carefully
│        └─ STOP - Fix these first

TESTING PHASE:
│
├─ Step 1: Vicidial Configuration
│  │
│  ├─ Paste URL into Campaign → Web Form URL field
│  ├─ Set: Webform Enabled = YES
│  ├─ Set: Webform Open Method = Button or Auto
│  ├─ Save campaign
│  │
│  └─ Set Agent Group:
│     ├─ Use Webform = YES
│     └─ Save
│
├─ Step 2: Agent Setup
│  │
│  └─ Agent User:
│     ├─ Webform Enabled = YES
│     ├─ Belongs to correct group
│     └─ Save
│
├─ Step 3: Make Test Call
│  │
│  ├─ Agent logs into Vicidial
│  ├─ Loads correct campaign
│  ├─ Dials test lead (or test extension)
│  │
│  └─ When call connected:
│     ├─ If "Button" mode: Click [Open Webform] button
│     ├─ If "Auto" mode: Pop-up opens automatically
│     │
│     └─ Check:
│        ├─ Pop-up appears? ✅ YES → NEXT
│        ├─ Shows phone number? ✅ YES → NEXT
│        ├─ Shows agent name? ✅ YES → NEXT
│        │
│        └─ NO? → See Troubleshooting below

RESULTS:
│
├─ All checks passed? ✅
│  └─ INTEGRATION WORKING!
│
└─ Something failed? ❌
   └─ Go to TROUBLESHOOTING FLOWCHART below
```

---

## 🔧 TROUBLESHOOTING FLOWCHART

When something isn't working:

```
Problem: What's not working?
│
├─ Can't open endpoint in browser
│  │
│  └─ Error: "Connection refused" or "Can't connect"
│     │
│     ├─ Is CRM backend running?
│     │  │
│     │  ├─ YES → Continue
│     │  └─ NO → Start it: npm run start in /backend
│     │
│     ├─ Is port 3000 correct?
│     │  │
│     │  ├─ Check firewall allows 3000
│     │  ├─ Windows: Settings → Firewall → Allow app
│     │  └─ Add Node.js to allowed apps
│     │
│     └─ Is IP address correct?
│        ├─ For LAN: Run ipconfig
│        └─ Use IPv4 address shown
│
├─ Endpoint opens but blank page
│  │
│  └─ Parameters not being received correctly
│     │
│     ├─ Check phone number format
│     │  ├─ Should be: +1234567890
│     │  └─ Not: 1234567890 (missing +)
│     │
│     ├─ Check lead_id exists
│     │  ├─ Try with known value
│     │  └─ If still blank, lead_id field empty
│     │
│     ├─ Check browser console for errors
│     │  ├─ Press F12 → Console tab
│     │  ├─ Look for red error messages
│     │  └─ Try different browser
│     │
│     └─ Check CRM logs
│        ├─ Look at backend terminal
│        ├─ Should see /dialer-pop request logged
│        └─ Look for any error messages
│
├─ Browser pop-up blocked
│  │
│  └─ Pop-up window won't open
│     │
│     ├─ Click pop-up blocked icon in address bar
│     └─ Select "Always allow pop-ups from this site"
│
├─ Wrong account shows
│  │
│  └─ Account doesn't match phone number
│     │
│     ├─ Check phone format matches
│     │  └─ +63 vs 0063 difference?
│     │
│     ├─ Verify account exists
│     │  ├─ Login to CRM
│     │  ├─ Go to Account Management
│     │  ├─ Search for phone number
│     │  └─ If not found: Create test account
│     │
│     └─ Try with known test account
│        └─ Use phone you know exists
│
├─ Vicidial won't dial test leads
│  │
│  └─ Need to import test data
│     │
│     ├─ In Vicidial: Admin → Import Leads
│     ├─ Create CSV with phone numbers
│     ├─ Set correct campaign
│     ├─ Set agent
│     └─ Import → Now test
│
├─ ngrok tunnel not working
│  │
│  └─ URL shows offline or 502 error
│     │
│     ├─ Check CRM runs locally first
│     │  └─ Test: http://localhost:3000
│     │
│     ├─ Restart ngrok
│     │  ├─ Close command window
│     │  ├─ Wait 5 seconds
│     │  ├─ Run: ngrok http 3000
│     │  └─ Copy new URL
│     │
│     ├─ Check internet connection
│     │  └─ ngrok needs internet
│     │
│     └─ Free plan limitations
│        ├─ URL changes on restart
│        ├─ 2 hour session limit
│        └─ Consider ngrok Pro for stability
│
└─ Still stuck?
   │
   └─ Gather info and ask for help:
      ├─ Screenshot of error
      ├─ URL you're trying
      ├─ Terminal output (any red errors?)
      ├─ Which setup: Local/LAN/ngrok?
      ├─ CRM is running? (Yes/No)
      └─ Browser being used: Chrome/Firefox/Safari/Edge?
```

---

## 📋 VERIFICATION CHECKLIST

Before saying "Integration Complete", verify ALL:

### Endpoint Tests
- [ ] CRM is running (check terminal for "listening on 3000")
- [ ] Can open http://localhost:3000 in browser
- [ ] Can open /dialer-pop endpoint directly
- [ ] Pop-up shows with test parameters
- [ ] Phone number displays correctly
- [ ] Lead ID displays correctly
- [ ] Campaign ID displays correctly
- [ ] Agent name displays correctly

### Vicidial Configuration
- [ ] Campaign → Webform Enabled = YES
- [ ] Campaign → Web Form URL pasted correctly
- [ ] Campaign → Webform Open Method = Button or Auto
- [ ] Campaign saved
- [ ] Agent Group → Use Webform = YES
- [ ] Agent Group saved
- [ ] Agent User → Webform Enabled = YES
- [ ] Agent User saved

### Live Call Test
- [ ] Agent logged into Vicidial
- [ ] Correct campaign loaded
- [ ] Test lead in Vicidial
- [ ] Call connects successfully
- [ ] Webform button appears (if Button mode)
- [ ] Pop-up opens (if Auto mode)
- [ ] Pop-up shows correct phone
- [ ] Pop-up shows correct agent
- [ ] Can close pop-up
- [ ] Call can continue after pop-up

### All Checks Passed?
✅ YES → **Integration is working!**

---

## 🚀 NEXT STEPS

1. **If Testing Success:** 
   - Try with multiple agents
   - Try with different campaigns
   - Document the setup
   - Train team on using it

2. **If Ready for Production:**
   - Enable HTTPS
   - Add authentication
   - Whitelist Vicidial IPs only
   - Enable comprehensive logging
   - Have IT review security
   - Do load testing
   - Plan disaster recovery

3. **For Advanced Setup:**
   - Custom screen pop templates
   - Integration with CTI (Computer Telephony Integration)
   - Automatic disposition setting
   - Real-time reporting

---

## 📞 SUPPORT MATRIX

| Issue | Where to Check | What to Look For |
|-------|--------|------|
| CRM not starting | Backend terminal | "listening on 3000" message |
| Connection refused | Windows Firewall | Port 3000 allowed for Node.js |
| Blank pop-up | Browser F12 → Console | Red error messages |
| No accounts found | CRM Account Management | Account exists with that phone? |
| Pop-up blocked | Browser address bar | Pop-up blocker notification |
| ngrok not working | ngrok terminal | Says "online" and shows URL |
| Wrong account | CRM logs + database | Phone format matching |

---

## 📊 SUCCESS DIAGRAM

When everything is working:

```
CALLER DIALS AGENT'S NUMBER
         ↓
    VICIDIAL RECEIVES CALL
    Extracts: phone_number, lead_id
         ↓
  AGENT SEES INCOMING CALL
  With caller ID and webform button
         ↓
   AGENT CLICKS WEBFORM BUTTON
         ↓
VICIDIAL CONSTRUCTS SPECIAL URL
  With all call data embedded
         ↓
   BROWSER OPENS CRM POP-UP
   At http://localhost:3000/dialer-pop?phone=...
         ↓
   CRM SERVER RECEIVES REQUEST
   Logs: time, agent, phone, campaign
         ↓
  CRM RETURNS HTML POP-UP
         ↓
 AGENT SEES CUSTOMER INFO
 While still on the call
         ↓
   ✅ SCREEN POP WORKING!
```

---

**This workflow is TESTING ONLY. For production, implement proper security measures.**

**Document Version:** 1.0  
**Last Updated:** December 10, 2025  
**For Non-Technical Users & System Administrators**
