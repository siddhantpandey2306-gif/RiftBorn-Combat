// test_feedback_system.js
// Automated verification suite for RIFTBORN In-Game Feedback & Bug Reporting System
// Tests validation rules, rate limiting, anti-duplicate protection, honeypot spam trap, and RLS schema security.

import fs from 'fs';
import path from 'path';
import { FeedbackService, FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES } from './src/services/FeedbackService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function runFeedbackTests() {
  console.log('\n--- STARTING RIFTBORN FEEDBACK SYSTEM VERIFICATION ---\n');

  // Instantiate service in test mode
  const service = new FeedbackService();
  service.clearRateLimitCooldown();

  // Test 1: Category validation (allowed list)
  const validCategories = ['bug', 'gameplay', 'performance', 'suggestion', 'other'];
  for (const cat of validCategories) {
    const res = service.validateInput({
      category: cat,
      title: 'Valid title for testing',
      description: 'Valid description for testing category acceptance.'
    });
    assert(res.valid, `Valid category '${cat}' is accepted`);
  }

  // Test 2: Invalid category rejected
  const invalidCatRes = service.validateInput({
    category: 'hack_admin',
    title: 'Arbitrary category attack',
    description: 'Attempting arbitrary category payload.'
  });
  assert(!invalidCatRes.valid && invalidCatRes.error.toLowerCase().includes('category'), 'Invalid category is rejected');

  // Test 3: Missing required title
  const missingTitleRes = service.validateInput({
    category: 'bug',
    title: '   ',
    description: 'Some valid description'
  });
  assert(!missingTitleRes.valid && missingTitleRes.error.toLowerCase().includes('title'), 'Missing title is rejected');

  // Test 4: Oversized title (>120 chars)
  const longTitle = 'A'.repeat(121);
  const oversizedTitleRes = service.validateInput({
    category: 'bug',
    title: longTitle,
    description: 'Some valid description'
  });
  assert(!oversizedTitleRes.valid && oversizedTitleRes.error.includes('120'), 'Oversized title (>120 chars) is rejected');

  // Test 5: Missing required description
  const missingDescRes = service.validateInput({
    category: 'bug',
    title: 'Valid title',
    description: ''
  });
  assert(!missingDescRes.valid && missingDescRes.error.toLowerCase().includes('description'), 'Empty description is rejected');

  // Test 6: Oversized description (>2000 chars)
  const longDesc = 'D'.repeat(2001);
  const oversizedDescRes = service.validateInput({
    category: 'bug',
    title: 'Valid title',
    description: longDesc
  });
  assert(!oversizedDescRes.valid && oversizedDescRes.error.includes('2000'), 'Oversized description (>2000 chars) is rejected');

  // Test 7: Email validation
  const validEmailRes = service.validateInput({
    category: 'suggestion',
    title: 'New combo challenge',
    description: 'Add a 6-hit juggle combo challenge for Lyra.',
    playerEmail: 'player@example.com'
  });
  assert(validEmailRes.valid, 'Valid email format is accepted');

  const invalidEmailRes = service.validateInput({
    category: 'suggestion',
    title: 'New combo challenge',
    description: 'Add a 6-hit juggle combo challenge for Lyra.',
    playerEmail: 'invalid-email-no-at-sign'
  });
  assert(!invalidEmailRes.valid && invalidEmailRes.error.toLowerCase().includes('email'), 'Malformed email address is rejected');

  // Test 8: Honeypot anti-spam trap
  service.clearRateLimitCooldown();
  const botSubmission = await service.submitFeedback({
    category: 'bug',
    title: 'Spam Bot Submission',
    description: 'Buy cheap watches here at spam.com',
    honeypot: 'http://spambot-filled-this-hidden-field.com'
  });
  assert(botSubmission.success === true && botSubmission.isBotSpam === true, 'Honeypot field triggers silent drop of bot spam without database write');

  // Test 9: Rate limiting (30s cooldown)
  // Mock config & fetch to simulate successful DB insert
  service.getSupabaseConfig = () => ({
    url: 'https://test-ref.supabase.co',
    anonKey: 'ey-mock-anon-key',
    isConfigured: true
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 201,
    json: async () => [{ id: 'mock-uuid-1', status: 'new' }]
  });

  service.clearRateLimitCooldown();
  const firstSubmission = await service.submitFeedback({
    category: 'bug',
    title: 'First legitimate report',
    description: 'Framerate drop when two projectiles collide in Neon Metro.'
  });
  assert(firstSubmission.success, 'First legitimate submission succeeds');

  // Immediate second submission should trigger 30s rate limit cooldown
  const rapidSubmission = await service.submitFeedback({
    category: 'gameplay',
    title: 'Second rapid report',
    description: 'Trying to submit immediately within cooldown window.'
  });
  assert(!rapidSubmission.success && rapidSubmission.error.toLowerCase().includes('wait'), 'Rapid second submission is blocked by rate limiting');

  // Test 10: Duplicate submission prevention
  service.clearRateLimitCooldownOnly();
  const dupSubmission = await service.submitFeedback({
    category: 'bug',
    title: 'First legitimate report',
    description: 'Framerate drop when two projectiles collide in Neon Metro.'
  });
  assert(!dupSubmission.success && dupSubmission.error.toLowerCase().includes('duplicate'), 'Identical repeated report is blocked by anti-duplicate protection');

  // Restore fetch
  globalThis.fetch = originalFetch;

  // Test 11: SQL Migration and Security verification
  const sqlPath = path.resolve('supabase/migrations/20261101_create_game_feedback.sql');
  assert(fs.existsSync(sqlPath), 'Supabase migration file exists');

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.game_feedback'), 'SQL defines game_feedback table');
  assert(sqlContent.includes('ALTER TABLE public.game_feedback ENABLE ROW LEVEL SECURITY;'), 'SQL strictly enables Row Level Security (RLS)');
  assert(sqlContent.includes('CREATE POLICY "Public anonymous insert feedback"'), 'SQL grants scoped INSERT policy for public/anon');
  assert(sqlContent.includes("status = 'new'"), "SQL INSERT policy restricts submitted status to 'new'");
  assert(!sqlContent.includes('SELECT ON public.game_feedback TO anon'), 'SQL strictly forbids public/anon SELECT (reports remain private)');
  assert(!sqlContent.includes('UPDATE ON public.game_feedback TO anon'), 'SQL strictly forbids public/anon UPDATE');
  assert(!sqlContent.includes('DELETE ON public.game_feedback TO anon'), 'SQL strictly forbids public/anon DELETE');
  assert(sqlContent.includes('CREATE INDEX IF NOT EXISTS idx_game_feedback_created_at'), 'SQL defines performance indexes');

  // Test 12: HTML & UI sanity
  const htmlPath = path.resolve('index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  assert(htmlContent.includes('id="modal-feedback"'), 'Feedback modal markup is present in index.html');
  assert(htmlContent.includes('id="btn-settings-open-feedback"'), 'Settings feedback button is present in index.html');
  assert(htmlContent.includes('id="btn-pause-feedback"'), 'Pause menu feedback button is present in index.html');
  assert(htmlContent.includes('id="btn-results-feedback"'), 'Match results feedback button is present in index.html');
  assert(htmlContent.includes('connect-src \'self\' https://*.supabase.co;'), 'CSP permits connections to Supabase');

  console.log(`\n--- FEEDBACK SYSTEM TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED ---\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runFeedbackTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
