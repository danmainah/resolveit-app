import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'AWAITING_RESPONSE':
      return 'bg-blue-100 text-blue-800'
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800'
    case 'PANEL_CREATED':
      return 'bg-purple-100 text-purple-800'
    case 'MEDIATION_IN_PROGRESS':
      return 'bg-indigo-100 text-indigo-800'
    case 'RESOLVED':
      return 'bg-green-100 text-green-800'
    case 'UNRESOLVED':
      return 'bg-red-100 text-red-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusText(status: string) {
  switch (status) {
    case 'PENDING':
      return 'Pending Review'
    case 'AWAITING_RESPONSE':
      return 'Awaiting Response'
    case 'ACCEPTED':
      return 'Accepted'
    case 'PANEL_CREATED':
      return 'Panel Created'
    case 'MEDIATION_IN_PROGRESS':
      return 'In Mediation'
    case 'RESOLVED':
      return 'Resolved'
    case 'UNRESOLVED':
      return 'Unresolved'
    case 'REJECTED':
      return 'Rejected'
    default:
      return status
  }
}

export function getCaseTypeColor(type: string) {
  switch (type) {
    case 'FAMILY':
      return 'bg-pink-100 text-pink-800'
    case 'BUSINESS':
      return 'bg-blue-100 text-blue-800'
    case 'CRIMINAL':
      return 'bg-red-100 text-red-800'
    case 'PROPERTY':
      return 'bg-green-100 text-green-800'
    case 'OTHER':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function validateEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhone(phone: string) {
  const re = /^\+?[\d\s\-\(\)]{10,15}$/
  return re.test(phone)
}

export function generateInitials(name: string) {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}