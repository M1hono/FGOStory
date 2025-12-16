/**
 * @fileoverview Overrides module exports for sidebar configuration management.
 * 
 * This module provides a unified interface for all override and synchronization
 * components used in sidebar configuration management. It exports services and
 * utilities for JSON config synchronization, metadata management, file handling,
 * and backup operations that override default sidebar generation behavior.
 * 
 * @module OverridesIndex
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

/**
 * Export the main JSON configuration synchronizer service.
 * Coordinates the synchronization of sidebar configurations with JSON files.
 */
export { JsonConfigSynchronizerService } from './JsonConfigSynchronizerService';

