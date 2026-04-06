CREATE TABLE content_reports (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by_id uuid NOT NULL,
    dream_id uuid NOT NULL,
    reason varchar(255) NOT NULL CHECK (reason IN ('INAPPROPRIATE','SPAM','HARASSMENT','HATE_SPEECH','OTHER')),
    status varchar(50) NOT NULL CHECK (status IN ('PENDING','REVIEWED','RESOLVED','DISMISSED')),
    admin_notes text,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at timestamp(6),
    CONSTRAINT fk_content_reports_reported_by FOREIGN KEY (reported_by_id) REFERENCES users (id),
    CONSTRAINT fk_content_reports_dream FOREIGN KEY (dream_id) REFERENCES dreams (id) ON DELETE CASCADE
);

CREATE INDEX idx_content_reports_status ON content_reports (status);
CREATE INDEX idx_content_reports_created_at ON content_reports (created_at);
CREATE INDEX idx_content_reports_dream ON content_reports (dream_id);
CREATE INDEX idx_content_reports_reported_by ON content_reports (reported_by_id);
