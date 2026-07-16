import { db } from '@/db/client';

export default async function seedDatabase(): Promise<void> {
  const starterMonthlyPriceId = process.env.PADDLE_STARTER_MONTHLY_PRICE_ID
  const starterAnnualPriceId = process.env.PADDLE_STARTER_ANNUAL_PRICE_ID
  const starterProductId = process.env.PADDLE_STARTER_PRODUCT_ID

  const proMonthlyPriceId = process.env.PADDLE_PRO_MONTHLY_PRICE_ID
  const proAnnualPriceId = process.env.PADDLE_PRO_ANNUAL_PRICE_ID
  const proProductId = process.env.PADDLE_PRO_PRODUCT_ID

  const eliteMonthlyPriceId = process.env.PADDLE_ELITE_MONTHLY_PRICE_ID
  const eliteAnnualPriceId = process.env.PADDLE_ELITE_ANNUAL_PRICE_ID
  const eliteProductId = process.env.PADDLE_ELITE_PRODUCT_ID

  const freePlanId = crypto.randomUUID();
  const starterPlanId = crypto.randomUUID();
  const proPlanId = crypto.randomUUID();
  const elitePlanId = crypto.randomUUID();

  const planStatements = [
    {
      sql: `INSERT OR IGNORE INTO plans (id, name, display_name, price, max_clients, max_invoices_per_month, features_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [freePlanId, 'free', 'Free', 0, 1, 3, '["create_client","create_invoice","view_basic_dashboard"]'],
    },
  ]

  if (starterMonthlyPriceId) {
    planStatements.push({
      sql: `INSERT INTO plans (id, name, display_name, price, paddle_price_id, paddle_product_id, max_clients, max_invoices_per_month, features_json, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON CONFLICT(name) DO UPDATE SET
            paddle_price_id=excluded.paddle_price_id,
            paddle_product_id=excluded.paddle_product_id,
            price=excluded.price,
            display_name=excluded.display_name,
            max_clients=excluded.max_clients,
            max_invoices_per_month=excluded.max_invoices_per_month,
            features_json=excluded.features_json,
            is_active=1`,
      args: [starterPlanId, 'starter', 'Starter', 9900, starterMonthlyPriceId, starterProductId || '', 5, 50, '["create_client","create_invoice","view_basic_dashboard","reminders","basic_reports"]'],
    })
  }

  if (proMonthlyPriceId) {
    planStatements.push({
      sql: `INSERT INTO plans (id, name, display_name, price, paddle_price_id, paddle_product_id, max_clients, max_invoices_per_month, features_json, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON CONFLICT(name) DO UPDATE SET
            paddle_price_id=excluded.paddle_price_id,
            paddle_product_id=excluded.paddle_product_id,
            price=excluded.price,
            display_name=excluded.display_name,
            max_clients=excluded.max_clients,
            max_invoices_per_month=excluded.max_invoices_per_month,
            features_json=excluded.features_json,
            is_active=1`,
      args: [proPlanId, 'pro', 'Pro', 34900, proMonthlyPriceId, proProductId || '', 50, 500, '["create_client","create_invoice","view_basic_dashboard","ai_access","reminders","advanced_reports","cashflow","pdf_branding","payment_tracking","unlimited_clients","unlimited_invoices"]'],
    })
  }

  if (eliteMonthlyPriceId) {
    planStatements.push({
      sql: `INSERT INTO plans (id, name, display_name, price, paddle_price_id, paddle_product_id, max_clients, max_invoices_per_month, features_json, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON CONFLICT(name) DO UPDATE SET
            paddle_price_id=excluded.paddle_price_id,
            paddle_product_id=excluded.paddle_product_id,
            price=excluded.price,
            display_name=excluded.display_name,
            max_clients=excluded.max_clients,
            max_invoices_per_month=excluded.max_invoices_per_month,
            features_json=excluded.features_json,
            is_active=1`,
      args: [elitePlanId, 'elite', 'Elite', 19900, eliteMonthlyPriceId, eliteProductId || '', -1, -1, '["create_client","create_invoice","view_basic_dashboard","ai_access","reminders","advanced_reports","cashflow","pdf_branding","payment_tracking","manage_team","manage_roles","white_label","api_access","unlimited_clients","unlimited_invoices"]'],
    })
  }

  await db.batch(planStatements);

  // Upsert roles (keep existing IDs, just ensure they exist)
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
      args: [crypto.randomUUID(), 'FREE_USER', 'Default role for free plan users'],
    },
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
      args: [crypto.randomUUID(), 'STARTER_USER', 'Role for starter plan users'],
    },
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
      args: [crypto.randomUUID(), 'PRO_USER', 'Role for pro plan users'],
    },
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
      args: [crypto.randomUUID(), 'ELITE_OWNER', 'Role for elite plan owners'],
    },
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
      args: [crypto.randomUUID(), 'SUPERADMIN', 'Super administrador del sistema'],
    },
  ]);

  // Upsert permissions (keep existing IDs, just ensure they exist)
  const permissionNames = [
    'create_client', 'create_invoice', 'view_basic_dashboard',
    'ai_access', 'reminders', 'advanced_reports', 'cashflow',
    'pdf_branding', 'payment_tracking', 'manage_team', 'manage_roles',
    'white_label', 'api_access', 'unlimited_clients', 'unlimited_invoices',
  ];

  const permInserts = permissionNames.map((name) => ({
    sql: `INSERT OR IGNORE INTO permissions (id, name) VALUES (?, ?)`,
    args: [crypto.randomUUID(), name],
  }));
  await db.batch(permInserts);

  // Resolve actual IDs from the database (migration 006 may have used different IDs)
  const roleRows = (await db.execute('SELECT id, name FROM roles')).rows as unknown as { id: string; name: string }[];
  const roleMap = Object.fromEntries(roleRows.map(r => [r.name, r.id]));

  const permRows = (await db.execute('SELECT id, name FROM permissions')).rows as unknown as { id: string; name: string }[];
  const permMap = Object.fromEntries(permRows.map(r => [r.name, r.id]));

  const freeRoleId = roleMap['FREE_USER'];
  const starterRoleId = roleMap['STARTER_USER'];
  const proRoleId = roleMap['PRO_USER'];
  const eliteRoleId = roleMap['ELITE_OWNER'];
  const superadminRoleId = roleMap['SUPERADMIN'];

  const freePerms = ['create_client', 'create_invoice', 'view_basic_dashboard'];
  const starterPerms = [
    'create_client', 'create_invoice', 'view_basic_dashboard',
    'reminders', 'basic_reports',
  ];
  const proPerms = [
    'create_client', 'create_invoice', 'view_basic_dashboard',
    'ai_access', 'reminders', 'advanced_reports', 'cashflow',
    'pdf_branding', 'payment_tracking', 'unlimited_clients', 'unlimited_invoices',
  ];

  const rolePermInserts: { sql: string; args: string[] }[] = [];

  if (freeRoleId) {
    for (const perm of freePerms) {
      const permId = permMap[perm];
      if (permId) {
        rolePermInserts.push({
          sql: `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          args: [freeRoleId, permId],
        });
      }
    }
  }

  if (starterRoleId) {
    for (const perm of starterPerms) {
      const permId = permMap[perm];
      if (permId) {
        rolePermInserts.push({
          sql: `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          args: [starterRoleId, permId],
        });
      }
    }
  }

  if (proRoleId) {
    for (const perm of proPerms) {
      const permId = permMap[perm];
      if (permId) {
        rolePermInserts.push({
          sql: `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          args: [proRoleId, permId],
        });
      }
    }
  }

  if (eliteRoleId) {
    for (const perm of permissionNames) {
      const permId = permMap[perm];
      if (permId) {
        rolePermInserts.push({
          sql: `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          args: [eliteRoleId, permId],
        });
      }
    }
  }

  if (superadminRoleId) {
    for (const perm of permissionNames) {
      const permId = permMap[perm];
      if (permId) {
        rolePermInserts.push({
          sql: `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          args: [superadminRoleId, permId],
        });
      }
    }
  }

  await db.batch(rolePermInserts);
}
