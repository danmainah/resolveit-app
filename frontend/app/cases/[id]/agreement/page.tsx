'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { FileText, Edit, Save, Download, Users, CheckCircle, Clock } from 'lucide-react'

interface AgreementTemplate {
  id: string
  name: string
  description: string
  content: string
  category: string
}

interface Agreement {
  id: string
  caseId: string
  content: string
  status: 'DRAFT' | 'PENDING_SIGNATURES' | 'SIGNED' | 'EXECUTED'
  createdAt: string
  signedAt?: string
  template: AgreementTemplate
  signatures: {
    id: string
    userId: string
    signedAt: string
    user: { name: string; email: string }
  }[]
  case: {
    plaintiff: { id: string; name: string; email: string }
    defendant?: { id: string; name: string; email: string }
  }
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_SIGNATURES: 'bg-yellow-100 text-yellow-800',
  SIGNED: 'bg-green-100 text-green-800',
  EXECUTED: 'bg-blue-100 text-blue-800'
}

export default function AgreementPage() {
  const params = useParams()
  const router = useRouter()
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [templates, setTemplates] = useState<AgreementTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [agreementContent, setAgreementContent] = useState('')
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (params.id) {
      fetchAgreement()
      if (user?.role === 'ADMIN') {
        fetchTemplates()
      }
    }
  }, [params.id, user])

  const fetchAgreement = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreements/case/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAgreement(data)
        setAgreementContent(data.content)
      } else if (response.status === 404) {
        // No agreement exists yet
        setAgreement(null)
      }
    } catch (error) {
      console.error('Error fetching agreement:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreements/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const createAgreement = async () => {
    if (!selectedTemplate) return

    setSaving(true)
    try {
      const template = templates.find(t => t.id === selectedTemplate)
      if (!template) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          caseId: params.id,
          templateId: selectedTemplate,
          content: template.content
        })
      })
      
      if (response.ok) {
        await fetchAgreement()
        setEditing(true)
      }
    } catch (error) {
      console.error('Error creating agreement:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveAgreement = async () => {
    if (!agreement) return

    setSaving(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreements/${agreement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: agreementContent
        })
      })
      
      if (response.ok) {
        await fetchAgreement()
        setEditing(false)
      }
    } catch (error) {
      console.error('Error saving agreement:', error)
    } finally {
      setSaving(false)
    }
  }

  const signAgreement = async () => {
    if (!agreement) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreements/${agreement.id}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        await fetchAgreement()
      } else {
        const error = await response.json()
        alert(error.message)
      }
    } catch (error) {
      console.error('Error signing agreement:', error)
    }
  }

  const canEdit = () => {
    if (!agreement || !user) return false
    return (agreement.status === 'DRAFT' || agreement.status === 'PENDING_SIGNATURES') &&
           (user.role === 'ADMIN' || 
            agreement.case.plaintiff.id === user.id || 
            agreement.case.defendant?.id === user.id)
  }

  const canSign = () => {
    if (!agreement || !user) return false
    const hasSignature = agreement.signatures.some(sig => sig.userId === user.id)
    return !hasSignature && 
           (agreement.case.plaintiff.id === user.id || agreement.case.defendant?.id === user.id)
  }

  const getRequiredSignatures = () => {
    if (!agreement) return []
    const required = [agreement.case.plaintiff]
    if (agreement.case.defendant) {
      required.push(agreement.case.defendant)
    }
    return required
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Case Agreement</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Back to Case
          </button>
        </div>

        {!agreement ? (
          /* Create New Agreement */
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Agreement Created</h3>
              <p className="text-gray-600 mb-6">
                Create a formal agreement based on the mediation outcome.
              </p>

              {user?.role === 'ADMIN' && templates.length > 0 && (
                <div className="max-w-md mx-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Agreement Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
                  >
                    <option value="">Choose a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.category}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={createAgreement}
                    disabled={!selectedTemplate || saving}
                    className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Agreement'}
                  </button>
                </div>
              )}

              {user?.role !== 'ADMIN' && (
                <p className="text-sm text-gray-500">
                  Only administrators can create agreements.
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Existing Agreement */
          <>
            {/* Agreement Header */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {agreement.template.name}
                  </h2>
                  <p className="text-gray-600">{agreement.template.description}</p>
                </div>
                
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[agreement.status]}`}>
                    {agreement.status.replace('_', ' ')}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {new Date(agreement.createdAt).toLocaleDateString()}
                  </p>
                  {agreement.signedAt && (
                    <p className="text-sm text-gray-500">
                      Signed {new Date(agreement.signedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {canEdit() && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Agreement
                  </button>
                )}
                
                {editing && (
                  <>
                    <button
                      onClick={saveAgreement}
                      disabled={saving}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false)
                        setAgreementContent(agreement.content)
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {canSign() && (
                  <button
                    onClick={signAgreement}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sign Agreement
                  </button>
                )}

                <button
                  onClick={() => {
                    // TODO: Implement PDF download
                    alert('PDF download functionality to be implemented')
                  }}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>

            {/* Agreement Content */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agreement Content</h3>
              
              {editing ? (
                <textarea
                  value={agreementContent}
                  onChange={(e) => setAgreementContent(e.target.value)}
                  rows={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter agreement content..."
                />
              ) : (
                <div 
                  className="prose max-w-none whitespace-pre-wrap"
                  style={{ fontFamily: 'monospace' }}
                >
                  {agreement.content}
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Signatures</h3>
              
              <div className="space-y-4">
                {getRequiredSignatures().map((person) => {
                  const signature = agreement.signatures.find(sig => sig.userId === person.id)
                  return (
                    <div key={person.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{person.name}</p>
                          <p className="text-sm text-gray-500">{person.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {signature ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600">Signed</p>
                              <p className="text-xs text-gray-500">
                                {new Date(signature.signedAt).toLocaleString()}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Clock className="w-5 h-5 text-yellow-500" />
                            <div className="text-right">
                              <p className="text-sm font-medium text-yellow-600">Pending</p>
                              <p className="text-xs text-gray-500">Awaiting signature</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}