-- Add advanced_reports permission to FREE_USER role
-- so all users can see the reports module in the sidebar
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
VALUES ('role_free', 'perm_advanced_reports');
