const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export { API_BASE };

// ============ Common Types ============

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type User = {
  user_id: string;
  email: string;
  role: "claimant" | "reviewer" | "senior_reviewer" | "admin";
  account_status: "active" | "deactivated";
  created_at: string;
};

export type Device = {
  device_id: string;
  device_type: string;
  identifier?: {
    identifier_id: string;
    identifier_type: string;
    identifier_value: string;
  };
};

export type CaseStatus =
  | "open"
  | "investigating"
  | "triage_pending"
  | "decided"
  | "closed"
  | "pending"
  | "resolved";

// ============ API Error Handling ============

export class APIError extends Error {
  constructor(
    public status: number,
    public data: any,
    message: string
  ) {
    super(message);
  }
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("amana_token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };

  if (token && !init?.skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new APIError(res.status, data, data?.detail || `HTTP ${res.status}`);
  }

  return data as T;
}

// ============ Authentication ============

export async function register(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }
  );
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }
  );
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/auth/me");
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("amana_token");
  }
}

// ============ Devices ============

export type RegisterDeviceRequest = {
  device_type: string;
  identifier_type: string;
  identifier_value: string;
  acquisition_basis?: string;
};

export type RegisterDeviceResponse = {
  device_id: string;
  device_type: string;
  identifier_id: string;
  claim_id: string;
  association_id: string;
};

export async function registerDevice(
  data: RegisterDeviceRequest
): Promise<RegisterDeviceResponse> {
  return apiFetch<RegisterDeviceResponse>("/devices/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type PublicLookupResponse = {
  effective_status: string;
  explanation: string;
};

export async function lookupDevice(identifier: string): Promise<PublicLookupResponse> {
  return apiFetch<PublicLookupResponse>(
    `/devices/lookup?identifier=${encodeURIComponent(identifier)}`,
    { skipAuth: true }
  );
}

export async function releaseAssociation(deviceId: string): Promise<void> {
  return apiFetch(`/devices/${deviceId}/release`, { method: "POST" });
}

// ============ Theft Reports ============

export type TheftReportRequest = {
  identifier_value: string;
  allegation_category: string;
  description: string;
  incident_period_start?: string;
  incident_period_end?: string;
};

export type TheftReportResponse = {
  case_id: string;
  status: CaseStatus;
};

export async function submitTheftReport(
  data: TheftReportRequest
): Promise<TheftReportResponse> {
  return apiFetch<TheftReportResponse>("/theft-reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============ Investigations ============

export type Investigation = {
  case_id: string;
  device_id: string;
  status: CaseStatus;
  outcome?: string;
  opened_at: string;
  deadline_at: string;
  triage_due_at?: string;
  has_provisional_restriction: boolean;
};

export type TriageRequest = {
  outcome: string;
  reason: string;
  next_review_days?: number;
};

export async function getInvestigationQueue(): Promise<Investigation[]> {
  return apiFetch<Investigation[]>("/investigations/queue");
}

export async function getInvestigation(caseId: string): Promise<Investigation> {
  return apiFetch<Investigation>(`/investigations/${caseId}`);
}

export async function triageInvestigation(
  caseId: string,
  data: TriageRequest
): Promise<void> {
  return apiFetch(`/investigations/${caseId}/triage`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function extendInvestigation(
  caseId: string,
  data: { extension_days: number }
): Promise<void> {
  return apiFetch(`/investigations/${caseId}/extend`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function reopenInvestigation(
  caseId: string,
  data: { reason: string }
): Promise<void> {
  return apiFetch(`/investigations/${caseId}/reopen`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============ Claim Disputes ============

export type ClaimDisputeRequest = {
  identifier_value: string;
  acquisition_basis: string;
  description: string;
};

export type ClaimDisputeResponse = {
  case_id: string;
  deadline_at: string;
};

export async function submitClaimDispute(
  data: ClaimDisputeRequest
): Promise<ClaimDisputeResponse> {
  return apiFetch<ClaimDisputeResponse>("/claim-disputes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type Dispute = {
  case_id: string;
  device_id: string;
  status: CaseStatus;
  outcome?: string;
  opened_at: string;
  deadline_at: string;
};

export async function getDisputeQueue(): Promise<Dispute[]> {
  return apiFetch<Dispute[]>("/claim-disputes/queue");
}

export async function resolveDispute(
  caseId: string,
  data: { outcome: string; reason: string; next_review_days?: number }
): Promise<void> {
  return apiFetch(`/claim-disputes/${caseId}/resolve`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function extendDispute(
  caseId: string,
  data: { extension_days: number }
): Promise<void> {
  return apiFetch(`/claim-disputes/${caseId}/extend`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function releaseDispute(caseId: string): Promise<void> {
  return apiFetch(`/claim-disputes/${caseId}/release`, {
    method: "POST",
  });
}

// ============ Identifier Conflicts ============

export type IdentifierConflictRequest = {
  identifier_value: string;
};

export type IdentifierConflictResponse = {
  case_id: string;
  deadline_at: string;
};

export async function submitIdentifierConflict(
  data: IdentifierConflictRequest
): Promise<IdentifierConflictResponse> {
  return apiFetch<IdentifierConflictResponse>("/identifier-conflicts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type Conflict = {
  case_id: string;
  device_identifier_id: string;
  existing_device_id: string;
  status: CaseStatus;
  outcome?: string;
  opened_at: string;
  deadline_at: string;
};

export async function getConflictQueue(): Promise<Conflict[]> {
  return apiFetch<Conflict[]>("/identifier-conflicts/queue");
}

export async function resolveConflict(
  caseId: string,
  data: { outcome: string; reason: string; next_review_days?: number }
): Promise<void> {
  return apiFetch(`/identifier-conflicts/${caseId}/resolve`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function extendConflict(
  caseId: string,
  data: { extension_days: number }
): Promise<void> {
  return apiFetch(`/identifier-conflicts/${caseId}/extend`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============ Transfers ============

export type TransferInitiateRequest = {
  device_id: string;
  recipient_email: string;
};

export type TransferResponse = {
  transfer_id: string;
  status: string;
  initiated_at: string;
  expires_at: string;
};

export async function initiateTransfer(
  data: TransferInitiateRequest
): Promise<TransferResponse> {
  return apiFetch<TransferResponse>("/transfers/initiate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function acceptTransfer(transferId: string): Promise<void> {
  return apiFetch(`/transfers/${transferId}/accept`, {
    method: "POST",
  });
}

export async function declineTransfer(transferId: string): Promise<void> {
  return apiFetch(`/transfers/${transferId}/decline`, {
    method: "POST",
  });
}

export async function cancelTransfer(transferId: string): Promise<void> {
  return apiFetch(`/transfers/${transferId}/cancel`, {
    method: "POST",
  });
}

// ============ Evidence ============

export type EvidenceUploadResponse = {
  evidence_id: string;
  review_status: string;
  file_size: number;
};

export async function uploadEvidence(
  file: File,
  claimId?: string
): Promise<EvidenceUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (claimId) formData.append("claim_id", claimId);

  const token = typeof window !== "undefined" ? localStorage.getItem("amana_token") : null;
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/evidence/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new APIError(res.status, null, text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<EvidenceUploadResponse>;
}

export async function reviewEvidence(
  evidenceId: string,
  decision: string,
  reason: string
): Promise<void> {
  const formData = new FormData();
  formData.append("decision", decision);
  formData.append("reason", reason);

  const token = typeof window !== "undefined" ? localStorage.getItem("amana_token") : null;
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/evidence/${evidenceId}/review`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new APIError(res.status, null, text || `HTTP ${res.status}`);
  }
}

// ============ Notifications ============

export type Notification = {
  notification_id: string;
  channel: string;
  type: string;
  delivery_status: string;
  created_at: string;
  subject?: string;
  body?: string;
};

export async function getNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>("/notifications");
}

// ============ Account ============

export type LimitedAccessResponse = {
  investigations: Investigation[];
  claim_disputes: Dispute[];
  identifier_conflicts: Conflict[];
  pending_transfers: any[];
};

export async function deactivateAccount(): Promise<void> {
  return apiFetch("/account/deactivate", { method: "POST" });
}

export async function getLimitedCaseAccess(): Promise<LimitedAccessResponse> {
  return apiFetch<LimitedAccessResponse>("/account/limited-case-access");
}

// ============ Reconsiderations ============

export type ReconsiderationRequest = {
  case_type: string;
  case_id: string;
  reason: string;
};

export type ReconsiderationResponse = {
  request_id: string;
  status: string;
};

export async function submitReconsideration(
  data: ReconsiderationRequest
): Promise<ReconsiderationResponse> {
  return apiFetch<ReconsiderationResponse>("/reconsiderations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getReconsiderations(): Promise<any[]> {
  return apiFetch<any[]>("/reconsiderations");
}

export async function decideReconsideration(
  requestId: string,
  data: { outcome: string; reason: string }
): Promise<void> {
  return apiFetch(`/reconsiderations/${requestId}/decide`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
