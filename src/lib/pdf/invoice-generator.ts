// src/lib/pdf/invoice-generator.ts
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

// Typage pour jsPDF avec autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface InvoiceData {
  id: string
  number: string
  date: Date
  dueDate: Date
  status: string
  totalAmount: any // Decimal from Prisma
  taxRate: any // Decimal from Prisma
  taxAmount: any // Decimal from Prisma
  notes?: string | null
  client: {
    id: string
    user: { name: string | null; email: string | null }
    phone?: string | null
    address?: string | null
    city?: string | null
    postalCode?: string | null
  }
  items: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: any // Decimal from Prisma
    totalPrice: any // Decimal from Prisma
  }>
  professional: {
    user: { name: string | null; email: string | null }
    phone?: string | null
    address?: string | null
    city?: string | null
    postalCode?: string | null
    invoiceSettings?: {
      businessName?: string | null
      address?: string | null
      taxNumber?: string | null
      iban?: string | null
      swift?: string | null
      paymentTerms?: string | null
      notes?: string | null
      logoUrl?: string | null
    } | null
  }
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  let yPosition = margin

  // Helper function pour convertir hex vers RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result 
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [37, 99, 235] // Couleur par défaut (bleu)
  }

  // Couleurs
  const primaryColor = '#2563eb' // Blue-600
  const darkGray = '#374151' // Gray-700
  const lightGray = '#9ca3af' // Gray-400

  const primaryRgb = hexToRgb(primaryColor)
  const darkGrayRgb = hexToRgb(darkGray)
  const lightGrayRgb = hexToRgb(lightGray)

  // Helper function pour ajouter du texte avec retour à la ligne
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return y + (lines.length * fontSize * 0.35) // Approximation de la hauteur
  }

  // En-tête avec logo (espace réservé)
  doc.setFillColor(248, 250, 252) // Gray-50
  doc.rect(0, 0, pageWidth, 60, 'F')

  // Logo et nom de l'entreprise
  doc.setTextColor(primaryColor)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  const businessName = invoice.professional.invoiceSettings?.businessName || invoice.professional.user.name || 'Mon Entreprise'
  doc.text(businessName, margin, 25)

  // FACTURE (titre)
  doc.setTextColor(darkGray)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', pageWidth - margin - 40, 25, { align: 'right' })

  // Numéro de facture
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${invoice.number}`, pageWidth - margin - 40, 35, { align: 'right' })

  // Date de facture
  doc.setFontSize(10)
  doc.setTextColor(lightGray)
  doc.text(`Date : ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, pageWidth - margin - 40, 42, { align: 'right' })
  doc.text(`Échéance : ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, pageWidth - margin - 40, 48, { align: 'right' })

  yPosition = 80

  // Informations du professionnel (Expéditeur)
  doc.setTextColor(darkGray)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('EXPÉDITEUR', margin, yPosition)
  
  yPosition += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(businessName, margin, yPosition)
  
  if (invoice.professional.invoiceSettings?.address) {
    yPosition += 5
    yPosition = addWrappedText(invoice.professional.invoiceSettings.address, margin, yPosition, 80)
  }
  
  if (invoice.professional.user.email) {
    yPosition += 3
    doc.text(invoice.professional.user.email, margin, yPosition)
  }
  
  if (invoice.professional.phone) {
    yPosition += 5
    doc.text(`Tél : ${invoice.professional.phone}`, margin, yPosition)
  }
  
  if (invoice.professional.invoiceSettings?.taxNumber) {
    yPosition += 5
    doc.text(`N° TVA : ${invoice.professional.invoiceSettings.taxNumber}`, margin, yPosition)
  }

  // Informations du client (Destinataire)
  let clientY = 80
  doc.setTextColor(darkGray)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DESTINATAIRE', pageWidth - margin - 80, clientY, { align: 'left' })
  
  clientY += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (invoice.client.user.name) {
    doc.text(invoice.client.user.name, pageWidth - margin - 80, clientY, { align: 'left' })
    clientY += 5
  }
  
  if (invoice.client.address) {
    const clientAddress = `${invoice.client.address}${invoice.client.postalCode && invoice.client.city ? `\n${invoice.client.postalCode} ${invoice.client.city}` : ''}`
    clientY = addWrappedText(clientAddress, pageWidth - margin - 80, clientY, 80)
  }
  
  if (invoice.client.user.email) {
    clientY += 3
    doc.text(invoice.client.user.email, pageWidth - margin - 80, clientY, { align: 'left' })
  }
  
  if (invoice.client.phone) {
    clientY += 5
    doc.text(`Tél : ${invoice.client.phone}`, pageWidth - margin - 80, clientY, { align: 'left' })
  }

  // Position pour le tableau (après les informations)
  yPosition = Math.max(yPosition, clientY) + 20

  // Tableau des prestations
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${parseFloat(item.unitPrice.toString()).toFixed(2)} €`,
    `${parseFloat(item.totalPrice.toString()).toFixed(2)} €`
  ])

  doc.autoTable({
    startY: yPosition,
    head: [['Description', 'Qté', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkGrayRgb
    },
    columnStyles: {
      0: { cellWidth: 80 }, // Description
      1: { cellWidth: 20, halign: 'center' }, // Quantité
      2: { cellWidth: 35, halign: 'right' }, // Prix unitaire
      3: { cellWidth: 35, halign: 'right' }, // Total
    },
    margin: { left: margin, right: margin }
  })

  // Position après le tableau
  yPosition = (doc as any).lastAutoTable.finalY + 10

  // Totaux
  const subtotal = parseFloat(invoice.totalAmount.toString()) - parseFloat(invoice.taxAmount.toString())
  const taxRate = parseFloat(invoice.taxRate.toString())
  const taxAmount = parseFloat(invoice.taxAmount.toString())
  const total = parseFloat(invoice.totalAmount.toString())

  const totalsX = pageWidth - margin - 60
  const totalsWidth = 50

  // Ligne de séparation
  doc.setDrawColor(...lightGrayRgb)
  doc.line(totalsX - 10, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  doc.setTextColor(darkGray)
  doc.setFontSize(10)

  // Sous-total HT
  doc.text('Sous-total HT :', totalsX, yPosition, { align: 'left' })
  doc.text(`${subtotal.toFixed(2)} €`, pageWidth - margin, yPosition, { align: 'right' })
  yPosition += 6

  // TVA
  if (taxRate > 0) {
    doc.text(`TVA (${taxRate}%) :`, totalsX, yPosition, { align: 'left' })
    doc.text(`${taxAmount.toFixed(2)} €`, pageWidth - margin, yPosition, { align: 'right' })
    yPosition += 6
  }

  // Total TTC
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Total TTC :', totalsX, yPosition, { align: 'left' })
  doc.text(`${total.toFixed(2)} €`, pageWidth - margin, yPosition, { align: 'right' })

  // Notes
  if (invoice.notes) {
    yPosition += 20
    doc.setTextColor(darkGray)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes :', margin, yPosition)
    yPosition += 6
    doc.setFont('helvetica', 'normal')
    yPosition = addWrappedText(invoice.notes, margin, yPosition, pageWidth - 2 * margin, 9)
  }

  // Conditions de paiement
  if (invoice.professional.invoiceSettings?.paymentTerms) {
    yPosition += 15
    doc.setTextColor(darkGray)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Conditions de paiement :', margin, yPosition)
    yPosition += 6
    doc.setFont('helvetica', 'normal')
    yPosition = addWrappedText(invoice.professional.invoiceSettings.paymentTerms, margin, yPosition, pageWidth - 2 * margin, 9)
  }

  // Informations bancaires
  if (invoice.professional.invoiceSettings?.iban) {
    yPosition += 15
    doc.setTextColor(darkGray)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Informations bancaires :', margin, yPosition)
    yPosition += 6
    doc.setFont('helvetica', 'normal')
    doc.text(`IBAN : ${invoice.professional.invoiceSettings.iban}`, margin, yPosition)
    if (invoice.professional.invoiceSettings.swift) {
      yPosition += 5
      doc.text(`BIC/SWIFT : ${invoice.professional.invoiceSettings.swift}`, margin, yPosition)
    }
  }

  // Pied de page
  doc.setTextColor(lightGray)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const footerText = `Facture générée le ${new Date().toLocaleDateString('fr-FR')} par SereniBook`
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}