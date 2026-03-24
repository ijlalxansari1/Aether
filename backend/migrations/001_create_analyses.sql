-- backend/migrations/001_create_analyses.sql

CREATE DATABASE IF NOT EXISTS aether_db;
USE aether_db;

CREATE TABLE IF NOT EXISTS analyses (
    id                  VARCHAR(36)   PRIMARY KEY,
    filename            VARCHAR(255)  NOT NULL DEFAULT 'unknown',
    intent              VARCHAR(50)   NOT NULL DEFAULT 'exploratory',
    profile             VARCHAR(50),
    row_count           INT,
    col_count           INT,
    iq_score            FLOAT,
    ethical_risk_level  VARCHAR(20),
    ethical_type        VARCHAR(50),
    ethical_message     TEXT,
    ethical_columns     JSON,
    recommendations     JSON,
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analysis_columns (
    id                  INT           AUTO_INCREMENT PRIMARY KEY,
    analysis_id         VARCHAR(36)   NOT NULL,
    name                VARCHAR(255),
    type                VARCHAR(50),
    missing_percent     FLOAT,
    notes               VARCHAR(100),
    stats               JSON,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);