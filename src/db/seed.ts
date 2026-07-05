import { db } from '@/db/client';

export default async function seedDatabase(): Promise<void> {
  const proPriceId = process.env.PADDLE_PRO_PRICE_ID
  const enterprisePriceId = process.env.PADDLE_ENTERPRISE_PRICE_ID
  const proProductId = process.env.PADDLE_PRO_PRODUCT_ID
  const enterpriseProductId = process.env.PADDLE_ENTERPRISE_PRODUCT_ID

  const freePlanId = crypto.randomUUID();
  const proPlanId = crypto.randomUUID();
  const enterprisePlanId = crypto.randomUUID();

  const planInserts = [
    {
      sql: `INSERT OR IGNORE INTO plans (id, name, display_name, price, max_clients, max_invoices_per_month, features_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [freePlanId, 'free', 'Free', 0, 1, 3, '["create_client","create_invoice","view_basic_dashboard"]'],
    },
  ]

  if (proPriceId) {
    planInserts.push({
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
      args: [proPlanId, 'professional', 'Professional', 2499, proPriceId, proProductId || '', -1, -1, '["create_client","create_invoice","view_basic_dashboard","ai_access","reminders","advanced_reports","cashflow","pdf_branding","payment_tracking","unlimited_clients","unlimited_invoices"]'],
    })
  }

  if (enterprisePriceId) {
    planInserts.push({
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
      args: [enterprisePlanId, 'enterprise', 'Enterprise', 7999, enterprisePriceId, enterpriseProductId || '', -1, -1, '["create_client","create_invoice","view_basic_dashboard","ai_access","reminders","advanced_reports","cashflow","pdf_branding","payment_tracking","manage_team","manage_roles","white_label","api_access","unlimited_clients","unlimited_invoices"]'],
    })
  }

  await db.batch(planInserts);

  const freeRoleId = crypto.randomUUID();
  const proRoleId = crypto.randomUUID();
  const enterpriseRoleId = crypto.randomUUID();
  const superadminRoleId = crypto.randomUUID();

  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
      args: [freeRoleId, 'FREE_USER', 'Default role for free plan users'],
    },
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
      args: [proRoleId, 'PROFESSIONAL_USER', 'Role for professional plan users'],
    },
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
      args: [enterpriseRoleId, 'ENTERPRISE_OWNER', 'Role for enterprise plan owners'],
    },
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
      args: [superadminRoleId, 'SUPERADMIN', 'Super administrador del sistema'],
    },
  ]);

  const permissionNames = [
    'create_client', 'create_invoice', 'view_basic_dashboard',
    'ai_access', 'reminders', 'advanced_reports', 'cashflow',
    'pdf_branding', 'payment_tracking', 'manage_team', 'manage_roles',
    'white_label', 'api_access', 'unlimited_clients', 'unlimited_invoices',
  ];

  const permissionIds: Record<string, string> = {};
  const permInserts = permissionNames.map((name) => {
    const id = crypto.randomUUID();
    permissionIds[name] = id;
    return {
      sql: `INSERT OR IGNORE INTO permissions (id, name) VALUES (?, ?)`,
      args: [id, name],
    };
  });

  await db.batch(permInserts);

  const freePerms = ['create_client', 'create_invoice', 'view_basic_dashboard'];
  const proPerms = [
    'create_client', 'create_invoice', 'view_basic_dashboard',
    'ai_access', 'reminders', 'advanced_reports', 'cashflow',
    'pdf_branding', 'payment_tracking', 'unlimited_clients', 'unlimited_invoices',
  ];

  const rolePermInserts: { sql: string; args: string[] }[] = [];

  for (const perm of freePerms) {
    rolePermInserts.push({
      sql: `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
      args: [freeRoleId, permissionIds[perm]],
    });
  }
  for (const perm of proPerms) {
    rolePermInserts.push({
      sql: `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
      args: [proRoleId, permissionIds[perm]],
    });
  }
  for (const perm of permissionNames) {
    rolePermInserts.push({
      sql: `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
      args: [enterpriseRoleId, permissionIds[perm]],
    });
    rolePermInserts.push({
      sql: `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
      args: [superadminRoleId, permissionIds[perm]],
    });
  }

  await db.batch(rolePermInserts);
}
