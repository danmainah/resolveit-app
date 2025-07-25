'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { FileText, Upload, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'

const schema = yup.object({
  caseType: yup.string().required('Case type is required').oneOf(['FAMILY', 'BUSINESS', 'CRIMINAL', 'PROPERTY', 'OTHER']),
  issueDescription: yup.string().required('Issue description is required').min(50, 'Description must be at least 50 characters').max(2000, 'Description too long'),
  oppositeParty: yup.object({
    name: yup.string().required('Opposite party name is required').min(2, 'Name too short'),
    email: yup.string().email('Invalid email').optional(),
    phone: yup.string().matches(/^\+?[\d\s\-\(\)]{10,15}$/, 'Invalid phone number').optional(),
    address: yup.string().optional(),
  }),
  isCourtPending: yup.boolean().required(),
  caseNumber: yup.string().when('isCourtPending', {
    is: true,
    then: (schema) => schema.required('Case number is required when case is pending in court'),
    otherwise: (schema) => schema.optional(),
  }),
  firNumber: yup.string().optional(),
  courtPoliceStation: yup.string().when('isCourtPending', {
    is: true,
    then: (schema) => schema.required('Court/Police station is required when case is pending'),
    otherwise: (schema) => schema.optional(),
  }),
})

type FormData = yup.InferType<typeof schema>

export default function RegisterCasePage() {
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<File[]>([])
  const { user } = useAuth()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      isCourtPending: false,
    },
  })

  const isCourtPending = watch('isCourtPending')

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov', 'audio/mp3', 'audio/wav', 'audio/m4a', 'application/pdf']
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type`)
        return false
      }
      
      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large (max 10MB)`)
        return false
      }
      
      return true
    })

    if (documents.length + validFiles.length > 10) {
      toast.error('Maximum 10 files allowed')
      return
    }

    setDocuments(prev => [...prev, ...validFiles])
  }

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: FormData) => {
    if (!user?.isVerified) {
      toast.error('Your account must be verified to register a case')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      
      // Append form data
      formData.append('caseType', data.caseType)
      formData.append('issueDescription', data.issueDescription)
      formData.append('oppositeParty[name]', data.oppositeParty.name)
      if (data.oppositeParty.email) formData.append('oppositeParty[email]', data.oppositeParty.email)
      if (data.oppositeParty.phone) formData.append('oppositeParty[phone]', data.oppositeParty.phone)
      if (data.oppositeParty.address) formData.append('oppositeParty[address]', data.oppositeParty.address)
      formData.append('isCourtPending', data.isCourtPending.toString())
      if (data.caseNumber) formData.append('caseNumber', data.caseNumber)
      if (data.firNumber) formData.append('firNumber', data.firNumber)
      if (data.courtPoliceStation) formData.append('courtPoliceStation', data.courtPoliceStation)

      // Append documents
      documents.forEach(doc => {
        formData.append('documents', doc)
      })

      const response = await api.post('/cases/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success('Case registered successfully!')
      router.push(`/cases/${response.data.case.id}`)
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to register case'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!user?.isVerified) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Verification Required</h2>
          <p className="text-gray-600 mb-6">
            Your account must be verified by an administrator before you can register cases.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Register New Case</h1>
          <p className="text-gray-600 mt-2">
            Provide detailed information about your dispute to begin the mediation process.
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Case Type */}
            <div>
              <label htmlFor="caseType" className="block text-sm font-medium text-gray-700 mb-2">
                Case Type *
              </label>
              <select
                {...register('caseType')}
                className={`input ${errors.caseType ? 'input-error' : ''}`}
              >
                <option value="">Select case type</option>
                <option value="FAMILY">Family Dispute</option>
                <option value="BUSINESS">Business Dispute</option>
                <option value="CRIMINAL">Criminal Matter</option>
                <option value="PROPERTY">Property Dispute</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.caseType && (
                <p className="mt-1 text-sm text-danger-600">{errors.caseType.message}</p>
              )}
            </div>

            {/* Issue Description */}
            <div>
              <label htmlFor="issueDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Issue Description * (50-2000 characters)
              </label>
              <textarea
                {...register('issueDescription')}
                rows={6}
                className={`input resize-none ${errors.issueDescription ? 'input-error' : ''}`}
                placeholder="Provide a detailed description of the dispute, including relevant background information, key events, and what resolution you are seeking..."
              />
              {errors.issueDescription && (
                <p className="mt-1 text-sm text-danger-600">{errors.issueDescription.message}</p>
              )}
            </div>

            {/* Opposite Party Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Opposite Party Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="oppositePartyName" className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    {...register('oppositeParty.name')}
                    type="text"
                    className={`mt-1 input ${errors.oppositeParty?.name ? 'input-error' : ''}`}
                    placeholder="Enter opposite party name"
                  />
                  {errors.oppositeParty?.name && (
                    <p className="mt-1 text-sm text-danger-600">{errors.oppositeParty.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="oppositePartyEmail" className="block text-sm font-medium text-gray-700">
                    Email (Optional)
                  </label>
                  <input
                    {...register('oppositeParty.email')}
                    type="email"
                    className={`mt-1 input ${errors.oppositeParty?.email ? 'input-error' : ''}`}
                    placeholder="Enter email address"
                  />
                  {errors.oppositeParty?.email && (
                    <p className="mt-1 text-sm text-danger-600">{errors.oppositeParty.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="oppositePartyPhone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    {...register('oppositeParty.phone')}
                    type="tel"
                    className={`mt-1 input ${errors.oppositeParty?.phone ? 'input-error' : ''}`}
                    placeholder="Enter phone number"
                  />
                  {errors.oppositeParty?.phone && (
                    <p className="mt-1 text-sm text-danger-600">{errors.oppositeParty.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="oppositePartyAddress" className="block text-sm font-medium text-gray-700">
                    Address (Optional)
                  </label>
                  <input
                    {...register('oppositeParty.address')}
                    type="text"
                    className={`mt-1 input ${errors.oppositeParty?.address ? 'input-error' : ''}`}
                    placeholder="Enter address"
                  />
                  {errors.oppositeParty?.address && (
                    <p className="mt-1 text-sm text-danger-600">{errors.oppositeParty.address.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Court/Police Pending */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Legal Status</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    {...register('isCourtPending')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    This case is currently pending in a court or police station
                  </label>
                </div>

                {isCourtPending && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label htmlFor="caseNumber" className="block text-sm font-medium text-gray-700">
                        Case Number *
                      </label>
                      <input
                        {...register('caseNumber')}
                        type="text"
                        className={`mt-1 input ${errors.caseNumber ? 'input-error' : ''}`}
                        placeholder="Enter case number"
                      />
                      {errors.caseNumber && (
                        <p className="mt-1 text-sm text-danger-600">{errors.caseNumber.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="firNumber" className="block text-sm font-medium text-gray-700">
                        FIR Number (Optional)
                      </label>
                      <input
                        {...register('firNumber')}
                        type="text"
                        className={`mt-1 input ${errors.firNumber ? 'input-error' : ''}`}
                        placeholder="Enter FIR number"
                      />
                      {errors.firNumber && (
                        <p className="mt-1 text-sm text-danger-600">{errors.firNumber.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="courtPoliceStation" className="block text-sm font-medium text-gray-700">
                        Court/Police Station Name *
                      </label>
                      <input
                        {...register('courtPoliceStation')}
                        type="text"
                        className={`mt-1 input ${errors.courtPoliceStation ? 'input-error' : ''}`}
                        placeholder="Enter court or police station name"
                      />
                      {errors.courtPoliceStation && (
                        <p className="mt-1 text-sm text-danger-600">{errors.courtPoliceStation.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Document Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Supporting Documents</h3>
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf"
                    onChange={handleDocumentChange}
                    className="hidden"
                    id="document-upload"
                  />
                  <label
                    htmlFor="document-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload documents (images, videos, audio, PDF)
                      </p>
                      <p className="text-xs text-gray-500">Max 10 files, 10MB each</p>
                    </div>
                  </label>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                    {documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-danger-500 hover:text-danger-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Registering...
                  </>
                ) : (
                  'Register Case'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}