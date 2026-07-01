-- dLocal Go -> Lemon Squeezy migration
ALTER TABLE plans RENAME COLUMN dlocalgo_plan_token TO lemonsqueezy_variant_id;
ALTER TABLE subscriptions RENAME COLUMN dlocalgo_subscription_id TO lemonsqueezy_subscription_id;
