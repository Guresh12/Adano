-- Run this in your Supabase SQL Editor to support the new activity types
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'client.create';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'client.update';
