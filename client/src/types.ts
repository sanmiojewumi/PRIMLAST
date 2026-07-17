export interface User {
  id: number;
  name: string;
  email: string;
  role: 'client' | 'operations_officer' | 'compliance_officer' | 'admin' | 'supervisor';
  status: 'active' | 'pending';
  permissions?: any;
  created_at?: string;
}

export type ServiceType = 
  | 'company_incorporation' 
  | 'business_registration' 
  | 'incorporated_trustee' 
  | 'annual_returns' 
  | 'post_incorporation' 
  | 'compliance'
  | 'other_services';

export type ApplicationStatus = 
  | 'submitted' 
  | 'under_review' 
  | 'add_info_required' 
  | 'processing' 
  | 'completed' 
  | 'rejected';

export interface Application {
  id: number;
  client_id: number;
  client_name?: string;
  service_type: ServiceType;
  status: ApplicationStatus;
  assigned_to: number | null;
  assignee_name?: string;
  details: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  application_id: number;
  user_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  is_approved: number; // 0 or 1
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  sender_name?: string;
  sender_role?: string;
  receiver_id: number;
  application_id: number;
  message_text: string;
  file_url?: string;
  filename?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name?: string;
  user_role?: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalClients: number;
  totalApplications: number;
  completedApplications: number;
  pendingApplications: number;
}

export interface ServiceTypeStat {
  service_type: ServiceType;
  count: number;
}

export interface StatusStat {
  status: ApplicationStatus;
  count: number;
}

export interface MonthStat {
  month: string;
  count: number;
}

export interface AdminStats {
  metrics: DashboardMetrics;
  byServiceType: ServiceTypeStat[];
  byStatus: StatusStat[];
  monthlySubmissions: MonthStat[];
  recentAudits: AuditLog[];
}
