import { pgTable, text, integer, bigint, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(),
  created: text('created').notNull(),
});

export const brands = pgTable('brands', {
  id: text('id').primaryKey(),
  owner: text('owner').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().default(''),
  color: text('color').notNull().default('#c2f970'),
  created: text('created').notNull(),
}, table => [
  index('idx_brands_owner').on(table.owner),
  index('idx_brands_email').on(table.email),
]);

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  brandId: text('brand_id').notNull().references(() => brands.id),
  title: text('title').notNull(),
  caption: text('caption').notNull(),
  platform: text('platform').notNull(),
  format: text('format').notNull(),
  media: text('media').notNull().default('[]'),
  scheduledAt: text('scheduled_at').notNull(),
  status: text('status').notNull(),
  revision: integer('revision').notNull().default(1),
  feedback: text('feedback').notNull().default(''),
  history: text('history').notNull().default('[]'),
  remoteId: text('remote_id'),
  containerId: text('container_id'),
  error: text('error'),
  pollQuestion: text('poll_question'),
  pollOptionA: text('poll_option_a'),
  pollOptionB: text('poll_option_b'),
  created: text('created').notNull(),
}, table => [
  index('idx_posts_brand').on(table.brandId),
  index('idx_posts_due').on(table.status, table.scheduledAt),
]);

export const connections = pgTable('connections', {
  id: text('id').primaryKey(),
  brandId: text('brand_id').notNull().references(() => brands.id),
  provider: text('provider').notNull(),
  accountId: text('account_id').notNull(),
  name: text('name').notNull(),
  token: text('token').notNull(),
  refreshToken: text('refresh_token'),
  expires: bigint('expires', { mode: 'number' }),
  updated: text('updated').notNull(),
}, table => [
  uniqueIndex('idx_connections_brand_provider').on(table.brandId, table.provider),
]);

export const oauth = pgTable('oauth', {
  state: text('state').primaryKey(),
  userId: text('user_id').notNull(),
  brandId: text('brand_id').notNull(),
  provider: text('provider').notNull(),
  expires: bigint('expires', { mode: 'number' }).notNull(),
});

export const metrics = pgTable('metrics', {
  id: text('id').primaryKey(),
  brandId: text('brand_id').notNull(),
  provider: text('provider').notNull(),
  day: text('day').notNull(),
  followers: integer('followers'),
  reach: integer('reach'),
  views: integer('views'),
  interactions: integer('interactions'),
  postMetrics: text('post_metrics').notNull().default('[]'),
}, table => [
  uniqueIndex('idx_metrics_day').on(table.brandId, table.provider, table.day),
]);

export const assets = pgTable('assets', {
  id: text('id').primaryKey(),
  brandId: text('brand_id').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  size: integer('size').notNull(),
  shareKey: text('share_key').notNull(),
});

export const sessions = pgTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expires: bigint('expires', { mode: 'number' }).notNull(),
}, table => [
  index('idx_sessions_user').on(table.userId),
]);

export const invitations = pgTable('invitations', {
  tokenHash: text('token_hash').primaryKey(),
  brandId: text('brand_id').notNull().references(() => brands.id),
  email: text('email').notNull(),
  expires: bigint('expires', { mode: 'number' }).notNull(),
  used: integer('used').notNull().default(0),
});

export const authLimits = pgTable('auth_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  until: bigint('until', { mode: 'number' }).notNull(),
});

export const schedulerLocks = pgTable('scheduler_locks', {
  id: integer('id').primaryKey(),
  token: text('token').notNull(),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
});
