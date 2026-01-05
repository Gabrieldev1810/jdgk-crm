# Vicidial → CRM Webform Integration - Quick Reference Card

**For: Non-Technical Users & System Administrators**  
**Date:** December 10, 2025  
**Status:** Testing Only

---

## 🚀 QUICK START (5 Minutes)

### Step 1: Copy Your Test URL
Select based on your setup:

**LOCAL (Same Machine):**
```
http://localhost:3000/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--
```

**LAN (Multiple Devices - Replace 192.168.1.100 with YOUR server IP):**
```
http://192.168.1.100:3000/dialer-pop?phone=--A--phone_number--B--&lead_id=--A--lead_id--B--&campaign_id=--A--campaign_id--B--&agent_user=--A--user--B--
```

### Step 2: Paste into Vicidial
1. Login to Vicidial
2. Admin → Campaigns
3. Select your campaign
4. Find "Web Form URL" field
5. **DELETE** any existing content
6. **PASTE** your URL from Step 1
7. Click **SAVE**

### Step 3: Enable Webform
1. In same campaign, find "Webform Enabled"
2. Change to **YES**
3. Find "Webform Open Method"
4. Choose: **Button** (Agent clicks) OR **Auto** (Auto-opens)
5. Click **SAVE**

### Step 4: Test
1. Agent logs into Vicidial
2. Makes a test call (or dials test extension)
3. Clicks "Open Webform" button (if using Button mode)
4. Should see CRM pop-up with call details
5. ✅ **SUCCESS!** Integration is working

---

## 🔍 FIND YOUR SERVER IP (LAN Setup)

**Windows (Press Windows key, type "cmd"):**
```
ipconfig
```
Look for: `IPv4 Address: 192.168.x.x` or `10.x.x.x`

**Mac (Open Terminal):**
```
ifconfig
```
Look for: `inet 192.168.x.x`

**Linux (Open Terminal):**
```
hostname -I
```

---

## 🧪 TEST THE ENDPOINT DIRECTLY

Before asking Vicidial to open it, test in your browser:

1. Open browser
2. Go to: `http://localhost:3000/dialer-pop?phone=%2B1234567890&lead_id=TEST001&campaign_id=test&agent_user=agent1`
3. Should see CRM pop-up window
4. Shows: Phone, Lead ID, Campaign, Agent name
5. ✅ If you see this, endpoint is working

**If page doesn't load:**
- Check CRM is running (look for terminal showing "listening on 3000")
- Check firewall allows port 3000
- Check you're using the correct server IP

---

## 📋 VICIDIAL CONFIGURATION CHECKLIST

### Campaign Settings
- [ ] Webform Enabled: **YES**
- [ ] Web Form URL: **Pasted correctly** (with dynamic variables)
- [ ] Webform Open Method: **Button** or **Auto**
- [ ] Click **SAVE**

### Agent Group Settings
- [ ] Go to Admin → Agent Groups
- [ ] Select agent's group
- [ ] Use Webform: **YES**
- [ ] Click **SAVE**

### Agent User Settings
- [ ] Go to Admin → Users
- [ ] Select test agent
- [ ] Webform Enabled: **YES**
- [ ] Click **SAVE**

### Test Call
- [ ] Agent logs in to Vicidial
- [ ] Loads correct campaign
- [ ] Dials test lead (or test extension like 8000)
- [ ] Call connects
- [ ] Clicks "Open Webform" button
- [ ] CRM pop-up appears ✅

---

## 🌐 SETUP OPTIONS

| Setup | For | Pros | Cons |
|-------|-----|------|------|
| **Local** | Testing on same PC | Fastest, no config needed | Can't test multi-device |
| **LAN** | Office network | Realistic test, multiple agents | Need server IP, firewall rules |
| **ngrok** | Remote agents | Works anywhere, no setup | URL changes on restart |

---

## ⚡ WHAT VICIDIAL VARIABLES DO

These automatically replace when agent makes call:

| Variable | Gets Replaced With | Example |
|----------|-------------------|---------|
| `--A--phone_number--B--` | Caller's phone number | +63912345678 |
| `--A--lead_id--B--` | Lead ID from Vicidial | ACC2024120145AB |
| `--A--campaign_id--B--` | Campaign code | campaign_001 |
| `--A--user--B--` | Agent username | agent_john |

**Example after Vicidial substitution:**
```
http://localhost:3000/dialer-pop?phone=%2B63912345678&lead_id=ACC2024120145AB&campaign_id=campaign_001&agent_user=agent_john
```

---

## 🔧 REMOTE TESTING WITH ngrok (10 Minutes)

### Option A: Simple (Easiest)
1. Download ngrok from [ngrok.com](https://ngrok.com)
2. Sign up for free account
3. Extract ngrok.exe to a folder
4. Open Command Prompt in that folder
5. Run: `ngrok http 3000`
6. Copy the URL it shows: `https://abc123xyz789.ngrok.io`
7. Use this URL in Vicidial webform instead of localhost

### Option B: Keep URL Same (Requires ngrok Pro)
- ngrok free plan: URL changes on restart
- ngrok pro plan ($8/month): Keep same URL always
- Recommended for production testing

---

## ❌ TROUBLESHOOTING

### "Connection Refused" or Won't Load

**Fix:**
1. Check CRM is running
   ```
   Terminal showing: "listening on port 3000"
   ```
2. Check Windows Firewall
   ```
   Settings → Windows Defender Firewall → Allow app through firewall
   Make sure Node.js is allowed
   ```
3. Check correct URL copied
4. For LAN: Verify IP address with `ipconfig`

### Page Opens but No Account Shows

**Fix:**
1. Check query parameters in URL
2. Verify account exists in CRM with that phone number
3. Check browser console (F12) for errors
4. Check CRM backend logs for error messages

### Pop-up Blocked by Browser

**Fix:**
1. Click pop-up blocked icon in address bar
2. Select "Always allow pop-ups from this site"
3. Reload and try again
4. Or disable pop-up blocker in browser settings

### Wrong Account Appears

**Fix:**
1. Check phone number format matches between systems
2. Verify account exists in CRM database
3. Try searching manually in CRM for test number
4. Check lead_id matches (if using lead_id instead of phone)

---

## 📊 INTEGRATION FLOW

```
Agent Receives Call (Vicidial)
          ↓
Vicidial Webform Button Appears
          ↓
Agent Clicks Button
          ↓
Browser Opens with CRM URL
(Phone, Lead ID, Campaign, Agent substituted automatically)
          ↓
CRM Shows Account Details
(Screen Pop Effect)
          ↓
Agent Can View Account Info While On Call
          ↓
Agent Handles Call (Collects, Promises to Pay, etc.)
```

---

## 🔐 IMPORTANT NOTES

⚠️ **This guide is for TESTING ONLY**

Before going to production:
- [ ] Enable HTTPS (not HTTP)
- [ ] Add authentication
- [ ] Whitelist only Vicidial IPs
- [ ] Enable logging for audit trail
- [ ] Test with actual production data
- [ ] Have IT team review security

---

## 📞 PARAMETER REFERENCE

### Query Parameters CRM Expects

| Name | Required | Example | Purpose |
|------|----------|---------|---------|
| phone | No* | +63912345678 | Caller phone number |
| lead_id | No* | ACC2024120145AB | Unique account ID |
| campaign_id | Yes | campaign_001 | Campaign code |
| agent_user | Yes | agent_john | Who answered call |

*At least one of phone or lead_id required

---

## 🧑‍💼 FOR ADMINISTRATORS

### Enable Webform for Multiple Agents

1. Go to Vicidial Admin
2. Campaigns page
3. Bulk edit: Search for campaigns
4. For each campaign:
   - Enable: Webform = YES
   - Paste: URL (once)
5. Then update Agent Groups:
   - Admin → Agent Groups
   - Select each group
   - Webform = YES
   - Save
6. Then update Users:
   - Admin → Users
   - Filter for all agents in group
   - Webform Enabled = YES
   - Save

### Create Test Leads for Vicidial

1. In Vicidial: Admin → Import Leads
2. Create CSV file with columns:
   - phone_number
   - first_name
   - last_name
   - lead_id (optional)
3. Set campaign
4. Set list to test agent
5. Import
6. Now agent can dial these test numbers

---

## ✅ SUCCESS INDICATORS

When integration is working correctly, you will see:

✅ Browser opens automatically when webform button clicked  
✅ CRM pop-up shows the phone number from the call  
✅ CRM pop-up shows agent username  
✅ CRM pop-up shows campaign ID  
✅ Account details display in pop-up  
✅ Pop-up stays open during call  
✅ Pop-up closes when agent closes it  

---

## 📚 DETAILED GUIDE LOCATION

For complete step-by-step instructions, see:  
**File:** `VICIDIAL_WEBFORM_INTEGRATION_GUIDE.md`

---

## 🎯 NEXT STEPS

1. ✅ Copy your test URL (based on setup)
2. ✅ Paste into Vicidial campaign
3. ✅ Enable webform settings
4. ✅ Test with agent
5. ✅ Verify pop-up appears
6. ✅ Confirm account shows correct details

**If all ✅, integration is working!**

---

## 📞 QUICK CONTACTS

- **CRM Backend Issue:** Check logs in backend terminal
- **Vicidial Issue:** Check Vicidial admin documentation
- **Pop-up/Browser Issue:** Check browser console (F12)
- **Network Issue:** Check IP with `ipconfig`, firewall settings

---

**Last Updated:** December 10, 2025  
**Version:** 1.0 (Testing Only)
