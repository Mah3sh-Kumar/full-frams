# Scripts Archive

This folder contains old SQL scripts and helper files that have been superseded by the consolidated database schema.

## Archived Files

These scripts were used during development to fix various database issues:

- `fix-*.sql` - Various database fix scripts
- `*teacher*.sql` - Teacher-related database fixes
- `*student*.sql` - Student-related database fixes
- `*.sh` / `*.bat` - Shell scripts for running migrations
- `*.md` - Documentation for manual fixes

## Current Approach

All database migrations have been consolidated into:
- `supabase/complete_database.sql` - Complete database schema
- `supabase/migrations/archive/` - Individual migration history

For new deployments, use the consolidated schema file instead of these individual scripts.

## Archived Date

March 9, 2026
