CREATE TABLE "cars_car_files" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"car_id" varchar(64) NOT NULL,
	"file_type" varchar(256) NOT NULL,
	"file_name" varchar(256) NOT NULL,
	"file_size" integer,
	"file_url" varchar(512) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cars_car_images" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"car_id" varchar(64) NOT NULL,
	"image_url" varchar(512) NOT NULL,
	"image_type" varchar(256) NOT NULL,
	"image_size" integer,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cars_car_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"car_id" varchar(64) NOT NULL,
	"session_id" varchar(256) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(256) NOT NULL,
	"user_agent" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cars_cars" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"brand" varchar(256),
	"model" varchar(256),
	"year" integer,
	"color" varchar(256),
	"mileage" integer,
	"fuel" varchar(256),
	"transmission" varchar(256),
	"price" numeric(10, 2),
	"hash" varchar(256),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cars_gas_log" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"car_id" varchar(64) NOT NULL,
	"date" timestamp NOT NULL,
	"trip" integer,
	"odometer" integer,
	"gallons" numeric(10, 2),
	"price_per_gallon" numeric(10, 2),
	"total_price" numeric(10, 2),
	"notes" text,
	"fuel_type" varchar(256),
	"gps_latitude" numeric(10, 6),
	"gps_longitude" numeric(10, 6),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cars_maintenance_files" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"maintenance_log_id" varchar(64) NOT NULL,
	"file_type" varchar(256) NOT NULL,
	"file_name" varchar(256) NOT NULL,
	"file_size" integer,
	"file_url" varchar(512) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cars_maintenance_log" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"car_id" varchar(64) NOT NULL,
	"date" timestamp NOT NULL,
	"mileage" integer,
	"description" text,
	"system" varchar(256) NOT NULL,
	"service" varchar(256) NOT NULL,
	"cost" numeric(10, 2),
	"notes" text,
	"parts" text,
	"labor" text,
	"total" numeric(10, 2),
	"status" varchar(256),
	"type" varchar(256),
	"technician" varchar(256),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cars_maintenance_parts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"maintenance_log_id" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"part_number" varchar(256),
	"description" text,
	"price" integer,
	"quantity" integer NOT NULL,
	"total" integer
);
--> statement-breakpoint
CREATE TABLE "cars_wishlist" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"car_id" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"url" varchar(512),
	"image_url" varchar(512),
	"system" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cars_car_files" ADD CONSTRAINT "fk_car_files_cars" FOREIGN KEY ("car_id") REFERENCES "public"."cars_cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars_car_images" ADD CONSTRAINT "fk_car_images_cars" FOREIGN KEY ("car_id") REFERENCES "public"."cars_cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars_car_sessions" ADD CONSTRAINT "fk_car_sessions_cars" FOREIGN KEY ("car_id") REFERENCES "public"."cars_cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars_gas_log" ADD CONSTRAINT "fk_gas_log_cars" FOREIGN KEY ("car_id") REFERENCES "public"."cars_cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars_maintenance_files" ADD CONSTRAINT "fk_maintenance_files_maintenance_log" FOREIGN KEY ("maintenance_log_id") REFERENCES "public"."cars_maintenance_log"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars_maintenance_log" ADD CONSTRAINT "fk_maintenance_log_cars" FOREIGN KEY ("car_id") REFERENCES "public"."cars_cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars_maintenance_parts" ADD CONSTRAINT "fk_maintenance_parts_maintenance_log" FOREIGN KEY ("maintenance_log_id") REFERENCES "public"."cars_maintenance_log"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars_wishlist" ADD CONSTRAINT "fk_wishlist_cars" FOREIGN KEY ("car_id") REFERENCES "public"."cars_cars"("id") ON DELETE no action ON UPDATE no action;