import { sql } from '../server/db';

async function fixWhatsAppTable() {
  console.log('🔧 Adding missing column to whatsapp_conversations table...\n');

  try {
    // Add the missing last_message_at column
    await sql`
      ALTER TABLE whatsapp_conversations 
      ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP DEFAULT NOW()
    `;
    
    console.log('✅ Added last_message_at column to whatsapp_conversations table');
    console.log('\n🎉 WhatsApp table fixed successfully!');
    console.log('✅ Your WhatsApp Bot should now work correctly!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to fix table:', error);
    process.exit(1);
  }
}

fixWhatsAppTable();
