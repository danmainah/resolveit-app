export interface User {
  id: string
  name: string
  email: string
  phone: string
  age: number
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  photo?: string
  role: 'USER' | 'ADMIN' | 'LAWYER' | 'RELIGIOUS_SCHOLAR' | 'SOCIAL_EXPERT'
  isVerified: boolean
  address?: Address
  createdAt: string
  updatedAt: string
}

export interface Address {
  id: string
  street: string
  city: string
  zipCode: string
}

export interface Case {
  id: string
  caseType: 'FAMILY' | 'BUSINESS' | 'CRIMINAL' | 'PROPERTY' | 'OTHER'
  issueDescription: string
  isCourtPending: boolean
  caseNumber?: string
  firNumber?: string
  courtPoliceStation?: string
  status: CaseStatus
  createdAt: string
  updatedAt: string
  plaintiff: User
  defendant?: User
  oppositePartyDetails: OppositeParty
  documents: Document[]
  panel?: Panel
  caseUpdates: CaseUpdate[]
  notifications: Notification[]
}

export type CaseStatus = 
  | 'PENDING'
  | 'AWAITING_RESPONSE'
  | 'ACCEPTED'
  | 'PANEL_CREATED'
  | 'MEDIATION_IN_PROGRESS'
  | 'RESOLVED'
  | 'UNRESOLVED'
  | 'REJECTED'

export interface OppositeParty {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface Document {
  id: string
  filename: string
  filepath: string
  fileType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'OTHER'
  fileSize: number
  uploadedAt: string
}

export interface Panel {
  id: string
  createdAt: string
  members: PanelMember[]
}

export interface PanelMember {
  id: string
  role: 'LAWYER' | 'RELIGIOUS_SCHOLAR' | 'SOCIAL_EXPERT'
  user: User
}

export interface CaseUpdate {
  id: string
  status: CaseStatus
  description: string
  createdAt: string
}

export interface Notification {
  id: string
  type: 'CASE_UPDATE' | 'PANEL_INVITATION' | 'MEDIATION_SCHEDULED' | 'CASE_RESOLVED' | 'SYSTEM'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  case?: {
    id: string
    caseType: string
    status: string
  }
}

export interface ApiResponse<T> {
  message?: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface DashboardStats {
  totalCases: number
  pendingCases: number
  inProgressCases: number
  resolvedCases: number
  unresolvedCases: number
  totalUsers: number
  resolutionRate: string
}

export interface CaseTypeDistribution {
  type: string
  count: number
}

export interface MonthlyTrend {
  month: string
  total: number
  resolved: number
  pending: number
}