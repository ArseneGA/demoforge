-- Stripe subscription columns on orgs
alter table orgs add column if not exists stripe_subscription_id text;
alter table orgs add column if not exists stripe_price_id text;
