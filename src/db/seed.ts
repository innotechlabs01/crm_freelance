import { db } from '@/db/client';

export default async function seedDatabase(): Promise<void> {
  const proVariantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID
  const enterpriseVariantId = process.env.LEMONSQUEEZY_ENTERPRISE_VARIANT_ID

  // ── Plans ──────────────────────────────────────────────────────
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

  if (proVariantId) {
    planInserts.push({
      sql: `INSERT OR IGNORE INTO plans (id, name, display_name, price, lemonsqueezy_variant_id, max_clients, max_invoices_per_month, features_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [proPlanId, 'professional', 'Professional', 2499, proVariantId, -1, -1, '["create_client","create_invoice","view_basic_dashboard","ai_access","reminders","advanced_reports","cashflow","pdf_branding","payment_tracking","unlimited_clients","unlimited_invoices"]'],
    })
  }

  if (enterpriseVariantId) {
    planInserts.push({
      sql: `INSERT OR IGNORE INTO plans (id, name, display_name, price, lemonsqueezy_variant_id, max_clients, max_invoices_per_month, features_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [enterprisePlanId, 'enterprise', 'Enterprise', 7999, enterpriseVariantId, -1, -1, '["create_client","create_invoice","view_basic_dashboard","ai_access","reminders","advanced_reports","cashflow","pdf_branding","payment_tracking","manage_team","manage_roles","white_label","api_access","unlimited_clients","unlimited_invoices"]'],
    })
  }

  await db.batch(planInserts);

  // ── Roles ──────────────────────────────────────────────────────
  const freeRoleId = crypto.randomUUID();
  const proRoleId = crypto.randomUUID();
  const enterpriseRoleId = crypto.randomUUID();

  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description)
            VALUES (?, ?, ?)`,
      args: [freeRoleId, 'FREE_USER', 'Default role for free plan users'],
    },
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description)
            VALUES (?, ?, ?)`,
      args: [proRoleId, 'PROFESSIONAL_USER', 'Role for professional plan users'],
    },
    {
      sql: `INSERT OR IGNORE INTO roles (id, name, description)
            VALUES (?, ?, ?)`,
      args: [enterpriseRoleId, 'ENTERPRISE_OWNER', 'Role for enterprise plan owners'],
    },
  ]);

  // ── Permissions ────────────────────────────────────────────────
  const permissionNames = [
    'create_client',
    'create_invoice',
    'view_basic_dashboard',
    'ai_access',
    'reminders',
    'advanced_reports',
    'cashflow',
    'pdf_branding',
    'payment_tracking',
    'manage_team',
    'manage_roles',
    'white_label',
    'api_access',
    'unlimited_clients',
    'unlimited_invoices',
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

  // ── Role-Permission assignments ────────────────────────────────
  const freePerms = ['create_client', 'create_invoice', 'view_basic_dashboard'];
  const proPerms = [
    'create_client',
    'create_invoice',
    'view_basic_dashboard',
    'ai_access',
    'reminders',
    'advanced_reports',
    'cashflow',
    'pdf_branding',
    'payment_tracking',
    'unlimited_clients',
    'unlimited_invoices',
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
  }

  await db.batch(rolePermInserts);
}
