-- Add lemonsqueezy columns (in case table was created without them)
ALTER TABLE plans ADD COLUMN lemonsqueezy_variant_id TEXT;
ALTER TABLE subscriptions ADD COLUMN lemonsqueezy_subscription_id TEXT;
