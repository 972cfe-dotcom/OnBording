const { Pool } = require('pg');

// Fixed configuration - hardcoded so Netlify can't mess it up
const DATABASE_CONFIG = {
  connectionString: 'postgresql://neondb_owner:npg_lOh28bqVrHYC@ep-curly-heart-aeh5ihpv-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&search_path=hr',
  ssl: { rejectUnauthorized: false }
};

async function fixAndTest() {
  console.log('🔧 תיקון והגדרה של המערכת...\n');
  
  try {
    // Test database connection
    console.log('1️⃣ בודק חיבור למסד נתונים...');
    const pool = new Pool(DATABASE_CONFIG);
    const result = await pool.query('SELECT current_schema(), count(*) as table_count FROM information_schema.tables WHERE table_schema = \'hr\'');
    
    console.log('✅ חיבור למסד נתונים הצליח!');
    console.log(`   📋 Schema: ${result.rows[0].current_schema}`);
    console.log(`   📋 Tables: ${result.rows[0].table_count}`);
    
    // Update all function files with hardcoded config
    console.log('\n2️⃣ מעדכן את כל קבצי הפונקציות...');
    
    const functions = [
      'auth-register.js',
      'auth-login.js', 
      'auth-verify.js',
      'create-admin.js',
      'users-api.js',
      'employees-api.js',
      'documents-api.js',
      'reports-api.js',
      'db-setup.js',
      'db.js'
    ];
    
    const fs = require('fs').promises;
    
    for (const funcFile of functions) {
      try {
        const filePath = `./functions/${funcFile}`;
        let content = await fs.readFile(filePath, 'utf8');
        
        // Replace Pool configuration with hardcoded values
        const oldPoolPattern = /const pool = new Pool\(\{[\s\S]*?\}\);/g;
        const newPoolConfig = `const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_lOh28bqVrHYC@ep-curly-heart-aeh5ihpv-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&search_path=hr',
  ssl: { rejectUnauthorized: false }
});`;
        
        if (content.match(oldPoolPattern)) {
          content = content.replace(oldPoolPattern, newPoolConfig);
          
          // Also replace environment variable references with hardcoded values
          content = content.replace(/process\.env\.DATABASE_URL/g, "'postgresql://neondb_owner:npg_lOh28bqVrHYC@ep-curly-heart-aeh5ihpv-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&search_path=hr'");
          content = content.replace(/process\.env\.JWT_SECRET \|\| '[^']*'/g, "'hr-system-jwt-secret-key-2024-secure-token'");
          content = content.replace(/process\.env\.NODE_ENV/g, "'production'");
          
          await fs.writeFile(filePath, content);
          console.log(`   ✅ עודכן: ${funcFile}`);
        }
      } catch (error) {
        console.log(`   ⚠️  לא נמצא או שגיאה: ${funcFile}`);
      }
    }
    
    // Create initial admin users
    console.log('\n3️⃣ יוצר משתמשי מערכת ראשוניים...');
    
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    
    // Check if admin exists
    const existingAdmin = await pool.query('SELECT user_id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    
    if (existingAdmin.rows.length === 0) {
      // Create admin user
      const adminPassword = await bcrypt.hash('Admin123!', saltRounds);
      const adminResult = await pool.query(
        `INSERT INTO users (username, email, password_hash, role, is_active) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING user_id, username`,
        ['admin', 'admin@hr-system.com', adminPassword, 'admin', true]
      );
      
      // Create admin employee
      await pool.query(
        `INSERT INTO employees (user_id, first_name, last_name, email, phone, id_number, employee_number, department, position) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          adminResult.rows[0].user_id, 
          'מנהל', 
          'מערכת', 
          'admin@hr-system.com', 
          '050-1234567',
          '123456789',
          '2024001',
          'הנהלה',
          'מנהל מערכת'
        ]
      );
      
      console.log('✅ משתמש אדמין נוצר בהצלחה!');
      console.log('   👤 שם משתמש: admin');
      console.log('   🔑 סיסמה: Admin123!');
    } else {
      console.log('✅ משתמש אדמין כבר קיים');
    }
    
    await pool.end();
    
    console.log('\n🎉 ההתקנה הושלמה בהצלחה!');
    console.log('\n📋 הצעדים הבאים:');
    console.log('1. הרץ: git add . && git commit -m "Fix hardcoded config" && git push');
    console.log('2. המתן 2-3 דקות לפריסה');
    console.log('3. היכנס לאתר עם: admin / Admin123!');
    
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
    console.error(error);
  }
}

// Run if called directly
if (require.main === module) {
  fixAndTest();
}

module.exports = { fixAndTest };