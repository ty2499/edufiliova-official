import { sql } from '../server/db';

async function runWhatsAppMigration() {
  console.log('🚀 Running WhatsApp tables migration (without foreign keys)...\n');

  try {
    // WhatsApp Conversations table (no foreign keys)
    await sql`
      CREATE TABLE IF NOT EXISTS whatsapp_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        whatsapp_phone TEXT NOT NULL UNIQUE,
        user_id UUID,
        current_flow TEXT,
        flow_state JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ whatsapp_conversations table created');

    // WhatsApp Message Logs table
    await sql`
      CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID,
        whatsapp_phone TEXT NOT NULL,
        direction TEXT NOT NULL,
        message_type TEXT NOT NULL,
        message_content JSONB,
        message_id TEXT,
        status TEXT DEFAULT 'sent',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ whatsapp_message_logs table created');

    // Daily Quiz Questions table
    await sql`
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
      )
    `;
    console.log('✅ daily_quiz_questions table created');

    // Quiz Responses table
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL,
        user_id UUID NOT NULL,
        user_answer TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        response_time_seconds INTEGER,
        streak INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ quiz_responses table created');

    // WhatsApp Payment Intents table
    await sql`
      CREATE TABLE IF NOT EXISTS whatsapp_payment_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL,
        user_id UUID,
        course_id UUID,
        subscription_tier TEXT,
        amount NUMERIC(10, 2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        payment_method TEXT,
        status TEXT DEFAULT 'pending',
        stripe_payment_intent_id TEXT,
        payment_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      )
    `;
    console.log('✅ whatsapp_payment_intents table created');

    // WhatsApp Vouchers table
    await sql`
      CREATE TABLE IF NOT EXISTS whatsapp_vouchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        template TEXT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        is_redeemed BOOLEAN DEFAULT false,
        redeemed_by UUID,
        redeemed_at TIMESTAMP,
        purchased_via_whatsapp BOOLEAN DEFAULT false,
        whatsapp_phone TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      )
    `;
    console.log('✅ whatsapp_vouchers table created');

    // Create indexes
    console.log('\n📊 Creating indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(whatsapp_phone)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user ON whatsapp_conversations(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_conversation ON whatsapp_message_logs(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_phone ON whatsapp_message_logs(whatsapp_phone)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_quiz_responses_user ON quiz_responses(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_quiz_responses_question ON quiz_responses(question_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_whatsapp_payment_intents_conversation ON whatsapp_payment_intents(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_whatsapp_vouchers_code ON whatsapp_vouchers(code)`;
    
    console.log('✅ All indexes created');

    console.log('\n🎉 WhatsApp tables migration completed successfully!');
    console.log('\n✅ Your WhatsApp Bot is now ready to receive messages!');
    console.log('\nTry sending a message to your WhatsApp number now.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runWhatsAppMigration();
