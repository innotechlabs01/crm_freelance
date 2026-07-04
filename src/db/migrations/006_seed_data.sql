-- Seed data: Plans, Roles, Permissions, Role-Permissions
-- This migration replaces the /api/seed endpoint by embedding all seed data directly.
-- All statements use INSERT OR IGNORE for idempotency.

-- Plans (dummy variant IDs; set real values via env-configurable UPDATE or admin panel)
INSERT OR IGNORE INTO plans (id, name, display_name, price, max_clients, max_invoices_per_month, features_json)
VALUES ('plan_free', 'free', 'Free', 0, 1, 3, '["create_client","create_invoice","view_basic_dashboard"]');

INSERT OR IGNORE INTO plans (id, name, display_name, price, max_clients, max_invoices_per_month, features_json)
VALUES ('plan_pro', 'professional', 'Professional', 2499, -1, -1, '["create_client","create_invoice","view_basic_dashboard","ai_access","reminders","advanced_reports","cashflow","pdf_branding","payment_tracking","unlimited_clients","unlimited_invoices"]');

INSERT OR IGNORE INTO plans (id, name, display_name, price, max_clients, max_invoices_per_month, features_json)
VALUES ('plan_enterprise', 'enterprise', 'Enterprise', 7999, -1, -1, '["create_client","create_invoice","view_basic_dashboard","ai_access","reminders","advanced_reports","cashflow","pdf_branding","payment_tracking","manage_team","manage_roles","white_label","api_access","unlimited_clients","unlimited_invoices"]');

-- Roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES ('role_free', 'FREE_USER', 'Default role for free plan users');
INSERT OR IGNORE INTO roles (id, name, description) VALUES ('role_pro', 'PROFESSIONAL_USER', 'Role for professional plan users');
INSERT OR IGNORE INTO roles (id, name, description) VALUES ('role_enterprise', 'ENTERPRISE_OWNER', 'Role for enterprise plan owners');
INSERT OR IGNORE INTO roles (id, name, description) VALUES ('role_superadmin', 'SUPERADMIN', 'Super administrador del sistema');

-- Permissions
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_create_client', 'create_client');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_create_invoice', 'create_invoice');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_view_basic_dashboard', 'view_basic_dashboard');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_ai_access', 'ai_access');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_reminders', 'reminders');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_advanced_reports', 'advanced_reports');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_cashflow', 'cashflow');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_pdf_branding', 'pdf_branding');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_payment_tracking', 'payment_tracking');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_manage_team', 'manage_team');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_manage_roles', 'manage_roles');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_white_label', 'white_label');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_api_access', 'api_access');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_unlimited_clients', 'unlimited_clients');
INSERT OR IGNORE INTO permissions (id, name) VALUES ('perm_unlimited_invoices', 'unlimited_invoices');

-- Role-Permission assignments: FREE_USER
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_free', 'perm_create_client');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_free', 'perm_create_invoice');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_free', 'perm_view_basic_dashboard');

-- Role-Permission assignments: PROFESSIONAL_USER
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_pro', 'perm_create_client');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_pro', 'perm_create_invoice');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_pro', 'perm_view_basic_dashboard');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_pro', 'perm_ai_access');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_pro', 'perm_reminders');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_pro', 'perm_advanced_reports');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_pro', 'perm_cashflow');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_pro', 'perm_pdf_branding');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_pro', 'perm_payment_tracking');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_pro', 'perm_unlimited_clients');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_pro', 'perm_unlimited_invoices');

-- Role-Permission assignments: ENTERPRISE_OWNER (all permissions)
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_create_client');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_create_invoice');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_view_basic_dashboard');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_ai_access');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_reminders');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_advanced_reports');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_cashflow');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_pdf_branding');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_payment_tracking');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_manage_team');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_manage_roles');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_white_label');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_api_access');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_unlimited_clients');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_enterprise', 'perm_unlimited_invoices');

-- Role-Permission assignments: SUPERADMIN (all permissions)
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_create_client');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_create_invoice');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_view_basic_dashboard');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_ai_access');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_reminders');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_advanced_reports');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_cashflow');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_pdf_branding');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_payment_tracking');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_manage_team');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_manage_roles');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_white_label');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_api_access');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_unlimited_clients');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES ('role_superadmin', 'perm_unlimited_invoices');
