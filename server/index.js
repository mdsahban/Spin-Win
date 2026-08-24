import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import { adminStatsHandler } from './routes/adminStats.js';
import { getCustomerHistoryHandler } from './routes/getCustomerHistory.js';
import { getPublicCampaignHandler } from './routes/getPublicCampaign.js';
import { processSpinHandler } from './routes/processSpin.js';
import { verifyCustomerHandler } from './routes/verifyCustomer.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// --- CORS ---
// In production, lock this to your actual frontend domain.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. curl, mobile apps during dev)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50kb' }));

// --- Supabase admin client (service role — bypasses RLS for backend operations) ---
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Auth middleware for admin-only routes ---
// Verifies the Supabase JWT sent by the frontend and confirms the user is admin.
const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    // Validate the JWT using Supabase's built-in getUser (verifies signature)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });

    // Look up the user's role in the public.users table
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admins only' });
    }
    req.user = { ...user, role: 'admin' };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// --- Routes ---
// Public endpoints (no auth needed for spin flow)
app.post('/api/getPublicCampaign', getPublicCampaignHandler);
app.post('/api/verifyCustomer', verifyCustomerHandler);
app.post('/api/processSpin', processSpinHandler);
app.post('/api/getCustomerHistory', getCustomerHistoryHandler);

// Protected admin endpoints
app.post('/api/adminStats', requireAdmin, adminStatsHandler);

// --- Health check ---
app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// --- Global error handler ---
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`✅ Server listening on http://localhost:${port}`);
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
    console.warn('⚠️  WARNING: SUPABASE_URL is not set. Configure server/.env before using live data.');
  }
});
