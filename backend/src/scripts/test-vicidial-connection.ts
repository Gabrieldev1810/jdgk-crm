
import axios from 'axios';
import * as https from 'https';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const VICIDIAL_URL = process.env.VICIDIAL_NON_AGENT_API_URL || 'https://192.168.1.250/vicidial/non_agent_api.php';
const API_USER = process.env.VICIDIAL_API_USER || '6666';
const API_PASS = process.env.VICIDIAL_API_PASS || '1234';

console.log(`Testing connection to: ${VICIDIAL_URL}`);
console.log(`Using API User: ${API_USER}`);
console.log(`Using API Pass: ${API_PASS}`);

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testConnection() {
  try {
    console.log('\n--- Test 1: Version Check (Correct Creds) ---');
    const r1 = await axios.get(VICIDIAL_URL, {
      params: { source: 'test', user: API_USER, pass: API_PASS, function: 'version' },
      httpsAgent: agent
    });
    console.log('Result:', r1.data);

    console.log('\n--- Test 2: Version Check (WRONG Creds) ---');
    const r2 = await axios.get(VICIDIAL_URL, {
      params: { source: 'test', user: API_USER, pass: 'WRONGPASS', function: 'version' },
      httpsAgent: agent
    });
    console.log('Result:', r2.data);

    console.log('\n--- Test 3: Agent Status (Correct Creds) ---');
    const r3 = await axios.get(VICIDIAL_URL, {
      params: { source: 'test', user: API_USER, pass: API_PASS, function: 'agent_status', agent_user: '1002' },
      httpsAgent: agent
    });
    console.log('Result:', JSON.stringify(r3.data));

    console.log('\n--- Test 5: SET Agent Status (Pause=N / Ready) ---');
    const r5 = await axios.get(VICIDIAL_URL, {
      params: { 
          source: 'test', 
          user: API_USER, 
          pass: API_PASS, 
          function: 'agent_status', 
          agent_user: '1002',
          pause: 'N'
      },
      httpsAgent: agent
    });
    console.log('Result:', JSON.stringify(r5.data));

    console.log('\n--- Test 6: External Pause (RESUME) ---');
    const r6 = await axios.get(VICIDIAL_URL, {
      params: { 
          source: 'test', 
          user: API_USER, 
          pass: API_PASS, 
          function: 'external_pause', 
          agent_user: '1002',
          value: 'RESUME'
      },
      httpsAgent: agent
    });
    console.log('Result:', JSON.stringify(r6.data));

    console.log('\n--- Test 7: Agent API (external_pause) ---');
    const AGENT_API_URL = 'https://192.168.1.250/agc/api.php';
    try {
        const r7 = await axios.get(AGENT_API_URL, {
        params: { 
            source: 'test', 
            user: API_USER, 
            pass: API_PASS, 
            function: 'external_pause', 
            agent_user: '1002',
            value: 'RESUME'
        },
        httpsAgent: agent
        });
        console.log('Result:', JSON.stringify(r7.data));
    } catch (e: any) {
        console.log('Agent API Error:', e.message);
        if (e.response) console.log('Status:', e.response.status);
    }

    console.log('\n--- Test 4: Agent Status (User 1002 / Pass test) ---');
    const r4 = await axios.get(VICIDIAL_URL, {
      params: { source: 'test', user: '1002', pass: 'test', function: 'agent_status', agent_user: '1002' },
      httpsAgent: agent
    });
    console.log('Result:', r4.data);

  } catch (error: any) {
    console.error('Connection Error:', error.message);
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
    }
  }
}

testConnection();
