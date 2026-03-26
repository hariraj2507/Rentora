const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'rentora.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
    seedData();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      major TEXT DEFAULT '',
      trust_score INTEGER DEFAULT 80,
      avatar TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      price_per_day REAL NOT NULL,
      deposit REAL NOT NULL DEFAULT 0,
      category TEXT DEFAULT 'Other',
      condition TEXT DEFAULT 'Good',
      image_url TEXT DEFAULT '',
      owner_id TEXT NOT NULL,
      available INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      renter_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_rental REAL NOT NULL,
      deposit REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT DEFAULT 'card',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES items(id),
      FOREIGN KEY (renter_id) REFERENCES users(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      reviewee_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (reviewee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      message_text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS rental_requests (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      renter_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES items(id),
      FOREIGN KEY (renter_id) REFERENCES users(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS agreements (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      renter_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      price REAL NOT NULL,
      deposit REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      terms_accepted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES items(id),
      FOREIGN KEY (renter_id) REFERENCES users(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );
  `);

  // Migration: Ensure necessary columns exist in bookings
  try {
    db.exec("ALTER TABLE bookings ADD COLUMN payment_method TEXT DEFAULT 'card'");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE bookings ADD COLUMN escrow_status TEXT DEFAULT 'held'");
  } catch (e) {}

  // Schema Fix: Remove foreign key constraint from agreements (allows linking to rental_requests)
  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='agreements'").get();
    if (tableInfo && tableInfo.sql.includes('FOREIGN KEY (booking_id) REFERENCES bookings(id)')) {
      console.log('🔄 Recreating agreements table to remove foreign key constraint...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS agreements_new (
          id TEXT PRIMARY KEY,
          booking_id TEXT NOT NULL,
          item_id TEXT NOT NULL,
          renter_id TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          price REAL NOT NULL,
          deposit REAL NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          terms_accepted INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (item_id) REFERENCES items(id),
          FOREIGN KEY (renter_id) REFERENCES users(id),
          FOREIGN KEY (owner_id) REFERENCES users(id)
        );
      `);
      
      const count = db.prepare('SELECT COUNT(*) as count FROM agreements').get().count;
      if (count > 0) {
        db.exec('INSERT OR IGNORE INTO agreements_new SELECT * FROM agreements');
      }
      
      db.exec('DROP TABLE IF EXISTS agreements');
      db.exec('ALTER TABLE agreements_new RENAME TO agreements');
      console.log('✅ Agreements table migrated successfully');
    }
  } catch (e) {
    console.log('Migration note: agreements table update process handled');
  }
}


function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) return;

  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  // Seed users
  const users = [
    { id: uuidv4(), name: 'David Chen', email: 'david@stanford.edu', password: 'password123', major: 'Electrical Engineering', trust_score: 98 },
    { id: uuidv4(), name: 'Sarah Mitchell', email: 'sarah@mit.edu', password: 'password123', major: 'Biology', trust_score: 95 },
    { id: uuidv4(), name: 'Alex Johnson', email: 'alex@harvard.edu', password: 'password123', major: 'Computer Science', trust_score: 92 },
    { id: uuidv4(), name: 'Emily Rivera', email: 'emily@stanford.edu', password: 'password123', major: 'Mechanical Engineering', trust_score: 88 },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, major, trust_score, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=4f46e5&color=fff`;
    insertUser.run(u.id, u.name, u.email, hash, u.major, u.trust_score, avatar);
  }

  // Seed items
  const items = [
    { id: uuidv4(), title: 'Sony A7III Mirrorless Camera + 28-70mm Lens', description: 'Perfect for video projects or high-res photography. Includes battery, charger, and 64GB SD card.', price_per_day: 45, deposit: 150, category: 'Electronics', condition: 'Excellent', image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', owner_id: users[0].id },
    { id: uuidv4(), title: 'TI-84 Plus CE Edition Calculator', description: 'Graphing calculator, great for calculus and statistics courses.', price_per_day: 8, deposit: 40, category: 'Academic', condition: 'Good', image_url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&q=80', owner_id: users[1].id },
    { id: uuidv4(), title: 'Sony WH-1000XM4 Headphones', description: 'Industry-leading noise cancellation. 30-hour battery life. Ideal for library study sessions.', price_per_day: 12, deposit: 60, category: 'Electronics', condition: 'Excellent', image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80', owner_id: users[0].id },
    { id: uuidv4(), title: 'MacBook Pro 14" M3 Pro', description: 'High-performance laptop for video editing, coding, and design projects.', price_per_day: 55, deposit: 300, category: 'Electronics', condition: 'Excellent', image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', owner_id: users[2].id },
    { id: uuidv4(), title: 'DSLR Tripod (Manfrotto)', description: 'Professional tripod with fluid head. Supports up to 8kg.', price_per_day: 6, deposit: 25, category: 'Equipment', condition: 'Good', image_url: 'https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=800&q=80', owner_id: users[0].id },
    { id: uuidv4(), title: 'Organic Chemistry Textbook (8th Ed)', description: 'Bruice Organic Chemistry 8th Edition. Clean, no highlights.', price_per_day: 3, deposit: 15, category: 'Books', condition: 'Good', image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80', owner_id: users[3].id },
    { id: uuidv4(), title: 'Roomba 980 Vacuum', description: 'Keep the dorm clean with zero effort. Great for weekend rentals.', price_per_day: 15, deposit: 100, category: 'Equipment', condition: 'Excellent', image_url: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=800&q=80', owner_id: users[1].id },
    { id: uuidv4(), title: 'Blue Yeti USB Mic', description: 'Professional podcast and streaming microphone.', price_per_day: 10, deposit: 50, category: 'Electronics', condition: 'Like New', image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80', owner_id: users[2].id },
  ];

  const insertItem = db.prepare(`
    INSERT INTO items (id, title, description, price_per_day, deposit, category, condition, image_url, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of items) {
    insertItem.run(item.id, item.title, item.description, item.price_per_day, item.deposit, item.category, item.condition, item.image_url, item.owner_id);
  }

  // Seed some bookings for demo user Alex (users[2])
  // 1. One completed rental (Alex rented from David)
  const b1Id = uuidv4();
  db.prepare(`
    INSERT INTO bookings (id, item_id, renter_id, owner_id, start_date, end_date, total_rental, deposit, status, escrow_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'released', datetime('now', '-10 days'))
  `).run(b1Id, items[0].id, users[2].id, users[0].id, '2026-03-10', '2026-03-12', 90, 150);

  // 2. One active rental (Alex is currently renting Sarah's calculator)
  const b2Id = uuidv4();
  db.prepare(`
    INSERT INTO bookings (id, item_id, renter_id, owner_id, start_date, end_date, total_rental, deposit, status, escrow_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'held')
  `).run(b2Id, items[1].id, users[2].id, users[1].id, '2026-03-24', '2026-03-28', 32, 40);

  // 3. One pending rental (Emily wants to rent Alex's MacBook)
  const b3Id = uuidv4();
  db.prepare(`
    INSERT INTO bookings (id, item_id, renter_id, owner_id, start_date, end_date, total_rental, deposit, status, escrow_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'held')
  `).run(b3Id, items[3].id, users[3].id, users[2].id, '2026-04-01', '2026-04-03', 110, 300);

  console.log('✅ Database seeded with users, items, and active/completed demo bookings');
}

module.exports = { getDb };
