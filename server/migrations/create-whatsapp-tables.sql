-- WhatsApp Conversations table
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_phone TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id),
  current_flow TEXT,
  flow_state JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp Message Logs table
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_conversations(id),
  whatsapp_phone TEXT NOT NULL,
  direction TEXT NOT NULL,
  message_type TEXT NOT NULL,
  message_content JSONB,
  message_id TEXT,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily Quiz Questions table
CREATE TABLE IF NOT EXISTS daily_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Quiz Responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES daily_quiz_questions(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_seconds INTEGER,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp Payment Intents table
CREATE TABLE IF NOT EXISTS whatsapp_payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_conversations(id) NOT NULL,
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  subscription_tier TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  payment_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- WhatsApp Vouchers table
CREATE TABLE IF NOT EXISTS whatsapp_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  template TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_by UUID REFERENCES users(id),
  redeemed_at TIMESTAMP,
  purchased_via_whatsapp BOOLEAN DEFAULT false,
  whatsapp_phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user ON whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_conversation ON whatsapp_message_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_phone ON whatsapp_message_logs(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user ON quiz_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_question ON quiz_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_payment_intents_conversation ON whatsapp_payment_intents(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_vouchers_code ON whatsapp_vouchers(code);
