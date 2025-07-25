'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { FileText, Clock, CheckCircle, XCircle, Eye, Calendar, Users, MessageSquare, Scale } from 'lucide-react'
import { api } from '@/lib/api'

interface Case {
  id: string
  caseType: string
  issueDescription: string
  status: string
  oppositePartyResponse: string
  isCourtPending: boolean
  caseNumber?: string
  firNumber?: string
  courtPoliceStation?: string
  createdAt: string
  updatedAt: string
  plaintiff: {
    id: string
    name: string
    email: string
  }
  defendant?: {
    id: string
    name: string
    email: string
  }
  oppositePartyDetails?: {
    name: string
    email?: string
    phone?: string
    address?: string
  }
  documents: Array<{
    id: string
    filename: string
    fileType: string
  }>
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
  caseUpdates: Array<{
    id: string
    status: string
    description: string
    createdAt: string
  }>
}

const statusConfig = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  AWAITING_RESPONSE: { color: 'bg-blue-100 text-blue-800', icon: MessageSquare, label: 'Awaiting Response' },
  ACCEPTED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepted' },
  PANEL_CREATED: { color: 'bg-purple-100 text-purple-800', icon: Users, label: 'Panel Created' },
  MEDIATION_IN_PROGRESS: { color: 'bg-indigo-100 text-indigo-800', icon: Scale, label: 'Mediation in Progress' },
  RESOLVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Resolved' },
  UNRESOLVED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Unresolved' },
  REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' }
}

const caseTypeConfig = {
  FAMILY: { label: 'Family Dispute', color: 'bg-pink-100 text-pink-800' },
  BUSINESS: { label: 'Business Dispute', color: 'bg-blue-100 text-blue-800' },
  CRIMINAL: { label: 'Criminal Matter', color: 'bg-red-100 text-red-800' },
  PROPERTY: { label: 'Property Dispute', color: 'bg-green-100 text-green-800' },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-800' }
}

export default function MyCasesPage() {
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const { user } = useAuth()

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      setLoading(true)
      const response = await api.get('/cases/my-cases')
      
      if (response.data) {
        setCases(response.data.cases || [])
        setPagination(response.data.pagination || pagination)
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCases = cases.filter(case_ => 
    filter === 'ALL' || case_.status === filter
  )

  const getOppositePartyName = (case_: Case) => {
    if (case_.defendant) {
      return case_.defendant.name
    }
    if (case_.oppositePartyDetails) {
      return case_.oppositePartyDetails.name
    }
    return 'Unknown'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pagination.total} total case{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex space-x-2">
            {['ALL', 'PENDING', 'AWAITING_RESPONSE', 'ACCEPTED', 'PANEL_CREATED', 'MEDIATION_IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status === 'ALL' ? 'All' : statusConfig[status as keyof typeof statusConfig]?.label || status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredCases.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cases found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'ALL' ? 'You haven\'t registered any cases yet.' : `No ${filter.toLowerCase().replace('_', ' ')} cases found.`}
            </p>
            {filter === 'ALL' && (
              <button
                onClick={() => router.push('/cases/register')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Register New Case
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((case_) => {
              const statusInfo = statusConfig[case_.status as keyof typeof statusConfig] || statusConfig.PENDING
              const caseTypeInfo = caseTypeConfig[case_.caseType as keyof typeof caseTypeConfig] || caseTypeConfig.OTHER
              const StatusIcon = statusInfo.icon
              
              return (
                <div key={case_.id} className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${caseTypeInfo.color}`}>
                          {caseTypeInfo.label}
                        </span>
                        {case_.isCourtPending && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Court Pending
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        vs {getOppositePartyName(case_)}
                      </h3>
                    </div>
                    <button 
                      onClick={() => router.push(`/cases/${case_.id}`)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{case_.issueDescription}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      {case_.documents.length > 0 && (
                        <span className="flex items-center mr-3">
                          <FileText className="w-3 h-3 mr-1" />
                          {case_.documents.length}
                        </span>
                      )}
                      {case_.panel && (
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          Panel
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(case_.createdAt).toLocaleDateString()}
                    </div>
                    {case_.caseUpdates.length > 0 && (
                      <span className="text-xs">
                        Last update: {new Date(case_.caseUpdates[0].createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                disabled={pagination.page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={pagination.page === pagination.pages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}