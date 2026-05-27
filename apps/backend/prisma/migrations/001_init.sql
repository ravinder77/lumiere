-- Full schema SQL — run against a fresh PostgreSQL database
-- Or use: npx prisma migrate dev --name init

CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED');

CREATE TABLE "users" (
  "id"            TEXT         NOT NULL,
  "email"         TEXT         NOT NULL,
  "name"          TEXT         NOT NULL,
  "password_hash" TEXT         NOT NULL,
  "role"          "Role"       NOT NULL DEFAULT 'CUSTOMER',
  "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "orders" (
  "id"         TEXT            NOT NULL,
  "user_id"    TEXT,
  "cart_id"    TEXT            NOT NULL,
  "items"      JSONB           NOT NULL,
  "subtotal"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discount"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total"      DOUBLE PRECISION NOT NULL,
  "shipping"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status"     "OrderStatus"   NOT NULL DEFAULT 'PENDING',
  "customer"   JSONB           NOT NULL,
  "notes"      TEXT,
  "created_at" TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;

CREATE TABLE "wishlist_items" (
  "id"         TEXT        NOT NULL,
  "user_id"    TEXT        NOT NULL,
  "product_id" TEXT        NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "wishlist_user_product" ON "wishlist_items"("user_id", "product_id");
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE TABLE "product_reviews" (
  "id"         TEXT        NOT NULL,
  "user_id"    TEXT        NOT NULL,
  "product_id" TEXT        NOT NULL,
  "rating"     INTEGER     NOT NULL,
  "title"      TEXT        NOT NULL,
  "body"       TEXT        NOT NULL,
  "verified"   BOOLEAN     NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX "reviews_user_product" ON "product_reviews"("user_id", "product_id");
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at    BEFORE UPDATE ON "users"           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at   BEFORE UPDATE ON "orders"          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reviews_updated_at  BEFORE UPDATE ON "product_reviews" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
