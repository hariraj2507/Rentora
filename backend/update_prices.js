const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'db', 'rentora.db'));

const updates = [
  { title: '%Camera%', price: 1200, deposit: 5000 },
  { title: '%Calculator%', price: 150, deposit: 500 },
  { title: '%Headphones%', price: 450, deposit: 2000 },
  { title: '%MacBook%', price: 2500, deposit: 15000 },
  { title: '%Tripod%', price: 250, deposit: 1000 },
  { title: '%Textbook%', price: 100, deposit: 300 },
  { title: '%Vacuum%', price: 500, deposit: 2500 },
  { title: '%Mic%', price: 350, deposit: 1500 }
];

console.log('🚀 Updating item prices to premium campus rates...');

for (const up of updates) {
  db.prepare('UPDATE items SET price_per_day = ?, deposit = ? WHERE title LIKE ?')
    .run(up.price, up.deposit, up.title);
}

// Update some categories to be more specific for AI prediction testing
db.prepare("UPDATE items SET category = 'Photography' WHERE title LIKE '%Camera%'").run();
db.prepare("UPDATE items SET category = 'Audio' WHERE title LIKE '%Headphones%' OR title LIKE '%Mic%'").run();

console.log('✅ Prices updated successfully.');
db.close();
