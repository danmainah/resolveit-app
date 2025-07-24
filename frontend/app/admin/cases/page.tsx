'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Search, 
  Filter, 
  Eye, 
  Users, 
  Play, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  FileText
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Case {
  id: string
  caseType: string
  status: string
  oppositePartyResponse: string
  issueDescription: string
  createdAt: string
  plaintiff: {
    id: string
    name: string
    email: string
    phone: string
  }
  defendant?: {
    id: string
    name: string
    email: string
    phone: string
  }
  oppositePartyDetails?: {
    name: string
    email?: string
    phone?: string
    address?: string
  }
  panel?: {
    id: string
    members: Array<{
      id: string
      role: string
      user: {
        id: string
        name: string
        role: string
      }
    }>
  }
  _count: {
    documents: number
    caseUpdates: number
  }
}

interface CasesResponse {
  cases: Case[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  AWAITING_RESPONSE: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  PANEL_CREATED: 'bg-purple-100 text-purple-800',
  MEDIATION_IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  RESOLVED: 'bg-green-100 text-green-800',
  UNRESOLVED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-800'
}

export default function AdminCasesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    page: 1,
    limit: 20
  })
  
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [showMediationModal, setShowMediationModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)

  const { data: casesData, isLoading } = useQuery<CasesResponse>(
    ['admin-cases', filters],
    async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString())
      })
      
      const response = await api.get(`/admin/cases?${params}`)
      return response.data
    },
    {
      keepPreviousData: true
    }
  )

  // Mutations for case actions
  const contactOppositePartyMutation = useMutation(
    async ({ caseId, message }: { caseId: string; message: string }) => {
      await api.post(`/admin/cases/${caseId}/contact-opposite-party`, { message })
    },
    {
      onSuccess: () => {
        toast.success('Opposite party contacted successfully')
        queryClient.invalidateQueries('admin-cases')
        setShowContactModal(false)
      },
      onError: () => {
        toast.error('Failed to contact opposite party')
      }
    }
  )

  const updateResponseMutation = useMutation(
    async ({ caseId, response, defendantId }: { caseId: string; response: string; defendantId?: string }) => {
      await api.patch(`/admin/cases/${caseId}/opposite-party-response`, { response, defendantId })
    },
    {
      onSuccess: () => {
        toast.success('Response updated successfully')
        queryClient.invalidateQueries('admin-cases')
        setShowResponseModal(false)
      },
      onError: () => {
        toast.error('Failed to update response')
      }
    }
  )

  const startMediationMutation = useMutation(
    async ({ caseId, scheduledDate }: { caseId: string; scheduledDate: string }) => {
      await api.post(`/admin/cases/${caseId}/start-mediation`, { scheduledDate })
    },
    {
      onSuccess: () => {
        toast.success('Mediation started successfully')
        queryClient.invalidateQueries('admin-cases')
        setShowMediationModal(false)
      },
      onError: () => {
        toast.error('Failed to start mediation')
      }
    }
  )

  const resolveCaseMutation = useMutation(
    async ({ caseId, resolution, resolutionDetails }: { caseId: string; resolution: string; resolutionDetails: string }) => {
      await api.post(`/admin/cases/${caseId}/resolve`, { resolution, resolutionDetails })
    },
    {
      onSuccess: () => {
        toast.success('Case resolved successfully')
        queryClient.invalidateQueries('admin-cases')
        setShowResolveModal(false)
      },
      onError: () => {
        toast.error('Failed to resolve case')
      }
    }
  )

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'AWAITING_RESPONSE':
        return <MessageSquare className="h-4 w-4" />
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4" />
      case 'PANEL_CREATED':
        return <Users className="h-4 w-4" />
      case 'MEDIATION_IN_PROGRESS':
        return <Play className="h-4 w-4" />
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4" />
      case 'UNRESOLVED':
        return <XCircle className="h-4 w-4" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getAvailableActions = (case_: Case) => {
    const actions = []
    
    switch (case_.status) {
      case 'PENDING':
        actions.push({
          label: 'Contact Opposite Party',
          action: () => {
            setSelectedCase(case_)
            setShowContactModal(true)
          },
          color: 'btn-primary'
        })
        break
        
      case 'AWAITING_RESPONSE':
        actions.push({
          label: 'Update Response',
          action: () => {
            setSelectedCase(case_)
            setShowResponseModal(true)
          },
          color: 'btn-secondary'
        })
        break
        
      case 'ACCEPTED':
        if (!case_.panel) {
          actions.push({
            label: 'Create Panel',
            action: () => {
              // Navigate to panel creation
              window.location.href = `/admin/cases/${case_.id}/panel`
            },
            color: 'btn-primary'
          })
        }
        break
        
      case 'PANEL_CREATED':
        actions.push({
          label: 'Start Mediation',
          action: () => {
            setSelectedCase(case_)
            setShowMediationModal(true)
          },
          color: 'btn-primary'
        })
        break
        
      case 'MEDIATION_IN_PROGRESS':
        actions.push({
          label: 'Resolve Case',
          action: () => {
            setSelectedCase(case_)
            setShowResolveModal(true)
          },
          color: 'btn-success'
        })
        break
    }
    
    return actions
  }

  if (user?.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Management</h1>
          <p className="text-gray-600">Manage and track all dispute resolution cases</p>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cases..."
                  className="input pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="AWAITING_RESPONSE">Awaiting Response</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PANEL_CREATED">Panel Created</option>
                <option value="MEDIATION_IN_PROGRESS">Mediation in Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="UNRESOLVED">Unresolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Type
              </label>
              <select
                className="input"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="FAMILY">Family</option>
                <option value="BUSINESS">Business</option>
                <option value="CRIMINAL">Criminal</option>
                <option value="PROPERTY">Property</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per Page
              </label>
              <select
                className="input"
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', e.target.value)}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-8"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : casesData?.cases.map((case_) => (
                  <tr key={case_.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {case_.caseType} Case
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {case_.issueDescription}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {case_.plaintiff.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          vs {case_.defendant?.name || case_.oppositePartyDetails?.name || 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[case_.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusIcon(case_.status)}
                        <span className="ml-1">{case_.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <FileText className="h-4 w-4 mr-1" />
                        {case_._count.documents}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(case_.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.location.href = `/admin/cases/${case_.id}`}
                          className="btn-secondary btn-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {getAvailableActions(case_).map((action, index) => (
                          <button
                            key={index}
                            onClick={action.action}
                            className={`${action.color} btn-sm`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {casesData && casesData.pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1).toString())}
                  disabled={filters.page <= 1}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleFilterChange('page', Math.min(casesData.pagination.pages, filters.page + 1).toString())}
                  disabled={filters.page >= casesData.pagination.pages}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(filters.page - 1) * filters.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(filters.page * filters.limit, casesData.pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{casesData.pagination.total}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {[...Array(casesData.pagination.pages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handleFilterChange('page', (i + 1).toString())}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          filters.page === i + 1
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals would go here - Contact, Response, Mediation, Resolve */}
        {/* For brevity, I'm not including the full modal implementations */}
      </div>
    </DashboardLayout>
  )
}