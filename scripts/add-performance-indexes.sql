-- Performance optimization script for NGDI Metadata Portal
-- Task 49.1: Add Database Indexes for Performance
-- This script adds GIN indexes on JSONB fields and composite indexes for common search patterns

-- Enable the extension for JSONB GIN operations if not already enabled
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- JSONB GIN Indexes for metadata_records table
-- These indexes will significantly improve performance for JSON field queries

-- Core spatial and temporal information indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_spatial_info_gin 
ON metadata_records USING gin (spatial_info);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_temporal_info_gin 
ON metadata_records USING gin (temporal_info);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_location_info_gin 
ON metadata_records USING gin (location_info);

-- Technical and quality information indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_technical_details_gin 
ON metadata_records USING gin (technical_details_info);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_data_quality_gin 
ON metadata_records USING gin (data_quality_info);

-- Distribution and processing information indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_distribution_info_gin 
ON metadata_records USING gin (distribution_info);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_processing_info_gin 
ON metadata_records USING gin (processing_info);

-- Constraints and metadata reference indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_constraints_info_gin 
ON metadata_records USING gin (constraints_info);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_metadata_ref_gin 
ON metadata_records USING gin (metadata_reference_info);

-- Fundamental datasets and additional info indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_fundamental_datasets_gin 
ON metadata_records USING gin (fundamental_datasets_info);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_additional_info_gin 
ON metadata_records USING gin (additional_info);

-- Other JSONB fields that might be queried
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_geometry_gin 
ON metadata_records USING gin (geometry);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_point_of_contact_gin 
ON metadata_records USING gin (point_of_contact);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_process_steps_gin 
ON metadata_records USING gin (process_steps);

-- Composite indexes for common search patterns
-- Status and organization combination (frequently used in filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_status_org 
ON metadata_records (status, organization_id);

-- Title and status for search results
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_title_status 
ON metadata_records (title, status);

-- Creator and status for user's records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_creator_status 
ON metadata_records (creator_user_id, status);

-- Data type and framework type combination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_data_framework_type 
ON metadata_records (data_type, framework_type);

-- Date-based indexes for temporal queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_created_at 
ON metadata_records (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_updated_at 
ON metadata_records (updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_production_date 
ON metadata_records (production_date DESC);

-- Full-text search indexes using PostgreSQL's built-in capabilities
-- Create a GIN index for full-text search across key text fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_fulltext_search 
ON metadata_records USING gin (
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(abstract, '') || ' ' || 
    COALESCE(keywords::text, '') || ' ' ||
    COALESCE(supplemental_information, '') || ' ' ||
    COALESCE(author, '') || ' ' ||
    COALESCE(data_sources, '') || ' ' ||
    COALESCE(methodology, '')
  )
);

-- Spatial indexes for bounding box queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_bbox_north 
ON metadata_records (bounding_box_north);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_bbox_south 
ON metadata_records (bounding_box_south);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_bbox_east 
ON metadata_records (bounding_box_east);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_bbox_west 
ON metadata_records (bounding_box_west);

-- Composite spatial bounding box index for spatial queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_spatial_bounds 
ON metadata_records (bounding_box_north, bounding_box_south, bounding_box_east, bounding_box_west);

-- Array indexes for keywords (if queries are performed on keywords array)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_records_keywords_gin 
ON metadata_records USING gin (keywords);

-- Indexes for metadata_change_logs table (for audit queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_change_logs_record_id 
ON metadata_change_logs (metadata_record_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_change_logs_user_id 
ON metadata_change_logs (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_change_logs_action_type 
ON metadata_change_logs (action_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_change_logs_created_at 
ON metadata_change_logs (created_at DESC);

-- Composite index for common audit log queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_change_logs_record_created 
ON metadata_change_logs (metadata_record_id, created_at DESC);

-- JSONB GIN index for changed_fields in change logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_change_logs_changed_fields_gin 
ON metadata_change_logs USING gin (changed_fields);

-- Organization table indexes (if not already present)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_name 
ON organizations (name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_type 
ON organizations (type);

-- Index for organization searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_name_type 
ON organizations (name, type);

COMMIT;

-- Performance monitoring queries to verify index usage
-- (These are comments for future reference)

-- To check index usage:
-- SELECT schemaname, tablename, attname, n_distinct, correlation 
-- FROM pg_stats WHERE tablename = 'metadata_records';

-- To check if indexes are being used:
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM metadata_records WHERE spatial_info @> '{"coordinateSystem": "WGS84"}';

-- To monitor index size:
-- SELECT indexname, pg_size_pretty(pg_relation_size(indexname::regclass)) as size 
-- FROM pg_indexes WHERE tablename = 'metadata_records'; 

-- Performance indexes for metadata records search functionality
-- Run this script to improve search query performance

-- Index for text search (title, abstract, purpose)
CREATE INDEX IF NOT EXISTS idx_metadata_records_text_search 
ON metadata_records USING gin((
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(abstract, '') || ' ' || 
    COALESCE(purpose, '')
  )
));

-- Index for keywords array search
CREATE INDEX IF NOT EXISTS idx_metadata_records_keywords 
ON metadata_records USING gin(keywords);

-- Index for organization filtering
CREATE INDEX IF NOT EXISTS idx_metadata_records_organization_id 
ON metadata_records(organization_id);

-- Index for status filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_metadata_records_status 
ON metadata_records(status);

-- Composite index for status + updated_at (common sorting + filtering combination)
CREATE INDEX IF NOT EXISTS idx_metadata_records_status_updated_at 
ON metadata_records(status, updated_at DESC);

-- Index for temporal extent filtering
CREATE INDEX IF NOT EXISTS idx_metadata_records_temporal_info_dates 
ON metadata_records USING gin((temporal_info));

-- More specific temporal indexes if needed frequently
CREATE INDEX IF NOT EXISTS idx_metadata_records_temporal_date_from 
ON metadata_records(((temporal_info ->> 'dateFrom')::date));

CREATE INDEX IF NOT EXISTS idx_metadata_records_temporal_date_to 
ON metadata_records(((temporal_info ->> 'dateTo')::date));

-- Index for framework type filtering
CREATE INDEX IF NOT EXISTS idx_metadata_records_framework_type 
ON metadata_records(framework_type);

-- Index for data type filtering
CREATE INDEX IF NOT EXISTS idx_metadata_records_data_type 
ON metadata_records(data_type);

-- Spatial index for bounding box searches (if PostGIS is available)
-- This requires the spatial_info JSONB to contain proper geometry data
CREATE INDEX IF NOT EXISTS idx_metadata_records_spatial_bbox 
ON metadata_records USING gist(((spatial_info ->> 'boundingBox')::geometry));

-- Composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_metadata_records_search_combo 
ON metadata_records(status, organization_id, updated_at DESC);

-- Index for creator filtering (if needed for user-specific searches)
CREATE INDEX IF NOT EXISTS idx_metadata_records_creator_user_id 
ON metadata_records(creator_user_id);

-- Index for pagination performance
CREATE INDEX IF NOT EXISTS idx_metadata_records_pagination 
ON metadata_records(id, updated_at DESC);

-- Performance indexes for metadata change logs (if search includes activity tracking)
CREATE INDEX IF NOT EXISTS idx_metadata_change_logs_record_id 
ON metadata_change_logs(metadata_record_id);

CREATE INDEX IF NOT EXISTS idx_metadata_change_logs_created_at 
ON metadata_change_logs(created_at DESC);

-- Performance monitoring queries (run these to check index usage)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE tablename = 'metadata_records' 
-- ORDER BY idx_scan DESC;

-- Check query performance
-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT * FROM metadata_records 
-- WHERE status = 'Published' 
-- AND (title ILIKE '%test%' OR abstract ILIKE '%test%')
-- ORDER BY updated_at DESC 
-- LIMIT 10;

-- Maintenance commands (run periodically)
-- ANALYZE metadata_records;
-- REINDEX INDEX CONCURRENTLY idx_metadata_records_text_search; 