'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Download,
  Eye,
  Users,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Scale
} from 'lucide-react'
import { api } from '@/lib/api'

interface CaseDetails {
  id: string
  caseType: string
  issueDescription: string
  status: string
  oppositePartyResponse: string
  isCourtPending: boolean
  caseNumber?: string
  firNumber?: string
  courtPoliceStation?: string
  mediationStartDate?: string
  mediationEndDate?: string
  resolutionDetails?: string
  createdAt: string
  updatedAt: string
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
  documents: Array<{
    id: string
    filename: string
    filepath: string
    fileType: string
    fileSize: number
    uploadedAt: string
  }>
  panel?: {
    id: string
    createdAt: string
    members: Array<{
      id: string
      role: string
      user: {
        id: string
        name: string
        role: string
        email: string
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
  PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending' },
  AWAITING_RESPONSE: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: MessageSquare, label: 'Awaiting Response' },
  ACCEPTED: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Accepted' },
  PANEL_CREATED: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Users, label: 'Panel Created' },
  MEDIATION_IN_PROGRESS: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Scale, label: 'Mediation in Progress' },
  RESOLVED: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Resolved' },
  UNRESOLVED: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Unresolved' },
  REJECTED: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Rejected' }
}

const caseTypeConfig = {
  FAMILY: { label: 'Family Dispute', color: 'bg-pink-100 text-pink-800' },
  BUSINESS: { label: 'Business Dispute', color: 'bg-blue-100 text-blue-800' },
  CRIMINAL: { label: 'Criminal Matter', color: 'bg-red-100 text-red-800' },
  PROPERTY: { label: 'Property Dispute', color: 'bg-green-100 text-green-800' },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-800' }
}

const responseConfig = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Response' },
  ACCEPTED: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
  REJECTED: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
}

export default function CaseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchCaseDetails()
    }
  }, [params.id])

  const fetchCaseDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/cases/${params.id}`)
      setCaseDetails(response.data.case)
    } catch (error: any) {
      console.error('Error fetching case details:', error)
      setError(error.response?.data?.message || 'Failed to load case details')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadDocument = async (documentId: string, filename: string) => {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
    }
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

  if (error || !caseDetails) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Case</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'Case not found'}</p>
          <button
            onClick={() => router.push('/cases')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const StatusIcon = statusConfig[caseDetails.status as keyof typeof statusConfig]?.icon || Clock
  const statusInfo = statusConfig[caseDetails.status as keyof typeof statusConfig] || statusConfig.PENDING
  const caseTypeInfo = caseTypeConfig[caseDetails.caseType as keyof typeof caseTypeConfig] || caseTypeConfig.OTHER
  const responseInfo = responseConfig[caseDetails.oppositePartyResponse as keyof typeof responseConfig] || responseConfig.PENDING

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/cases')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Cases
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Case Details</h1>
              <p className="text-sm text-gray-500">Case ID: {caseDetails.id}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {statusInfo.label}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${caseTypeInfo.color}`}>
              {caseTypeInfo.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Information */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{caseDetails.issueDescription}</p>
                </div>

                {caseDetails.isCourtPending && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">Court Case Pending</h3>
                        <div className="mt-2 text-sm text-yellow-700 space-y-1">
                          {caseDetails.caseNumber && <p>Case Number: {caseDetails.caseNumber}</p>}
                          {caseDetails.firNumber && <p>FIR Number: {caseDetails.firNumber}</p>}
                          {caseDetails.courtPoliceStation && <p>Court/Police Station: {caseDetails.courtPoliceStation}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-gray-900">{new Date(caseDetails.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <p className="text-gray-900">{new Date(caseDetails.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {caseDetails.mediationStartDate && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mediation Start</label>
                      <p className="text-gray-900">{new Date(caseDetails.mediationStartDate).toLocaleDateString()}</p>
                    </div>
                    {caseDetails.mediationEndDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mediation End</label>
                        <p className="text-gray-900">{new Date(caseDetails.mediationEndDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                )}

                {caseDetails.resolutionDetails && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Details</label>
                    <p className="text-gray-900 bg-green-50 p-3 rounded-md border border-green-200">{caseDetails.resolutionDetails}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
              
              {caseDetails.documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {caseDetails.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{document.filename}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(document.fileSize)} • {new Date(document.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadDocument(document.id, document.filename)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Case Updates Timeline */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Timeline</h2>
              
              <div className="flow-root">
                <ul className="-mb-8">
                  {caseDetails.caseUpdates.map((update, index) => {
                    const UpdateIcon = statusConfig[update.status as keyof typeof statusConfig]?.icon || Clock
                    const updateStatusInfo = statusConfig[update.status as keyof typeof statusConfig] || statusConfig.PENDING
                    
                    return (
                      <li key={update.id}>
                        <div className="relative pb-8">
                          {index !== caseDetails.caseUpdates.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${updateStatusInfo.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 bg-')}`}>
                              <UpdateIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{updateStatusInfo.label}</p>
                                <p className="text-sm text-gray-500">{update.description}</p>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                <time>{new Date(update.createdAt).toLocaleString()}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Parties Involved */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Parties Involved</h2>
              
              <div className="space-y-4">
                {/* Plaintiff */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Plaintiff</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{caseDetails.plaintiff.name}</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3 h-3" />
                        <span>{caseDetails.plaintiff.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3 h-3" />
                        <span>{caseDetails.plaintiff.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opposite Party */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Opposite Party</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    {caseDetails.defendant ? (
                      <>
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{caseDetails.defendant.name}</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-3 h-3" />
                            <span>{caseDetails.defendant.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-3 h-3" />
                            <span>{caseDetails.defendant.phone}</span>
                          </div>
                        </div>
                      </>
                    ) : caseDetails.oppositePartyDetails ? (
                      <>
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{caseDetails.oppositePartyDetails.name}</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          {caseDetails.oppositePartyDetails.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-3 h-3" />
                              <span>{caseDetails.oppositePartyDetails.email}</span>
                            </div>
                          )}
                          {caseDetails.oppositePartyDetails.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3 h-3" />
                              <span>{caseDetails.oppositePartyDetails.phone}</span>
                            </div>
                          )}
                          {caseDetails.oppositePartyDetails.address && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-3 h-3" />
                              <span>{caseDetails.oppositePartyDetails.address}</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No opposite party details available</p>
                    )}
                  </div>
                </div>

                {/* Response Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Response Status</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${responseInfo.color}`}>
                    {responseInfo.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Panel Information */}
            {caseDetails.panel && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Panel Members</h2>
                
                <div className="space-y-3">
                  {caseDetails.panel.members.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                        <p className="text-xs text-gray-500">{member.role.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  Panel created on {new Date(caseDetails.panel.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                {caseDetails.status === 'ACCEPTED' && (
                  <button
                    onClick={() => router.push(`/cases/${caseDetails.id}/agreement`)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Agreement
                  </button>
                )}
                
                <button
                  onClick={() => window.print()}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Print Case Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}