import { leadService } from './src/services/lead.service';
import { supabaseAdmin } from './src/config';

async function testAutoAssign() {
  console.log('--- Starting Auto-Assign Test ---');
  
  // 1. You might need to manually ensure you have an RM in Auth for this to work
  // This script assumes there's at least one active user with role_name 'rm' and status 'active' in Auth
  
  const leadId = '631897d2-3be9-450f-90e6-34c44e97677a'; // Use valid lead ID from your DB
  
  try {
    const result = await leadService.autoAssignLead(leadId);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testAutoAssign();
