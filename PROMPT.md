# PRIMEFLOW System Prompt & Product Specification

The application functions as a complete accounting, invoicing, and financial document management system without acting as a payment processor.

---

## Document Upload & Certified Document Delivery

The system must allow users to upload, generate, certify, and securely deliver financial documents.

### Document Uploads

Users can upload:

* Invoices
* Receipts
* Purchase Orders
* Credit Notes
* Quotations
* Contracts
* Delivery Notes
* Warranty Documents
* Bank Statements
* Expense Receipts
* Tax Documents
* Images (JPG, PNG, WebP)
* PDF documents
* Microsoft Word documents
* Microsoft Excel spreadsheets

Each uploaded document should support:

* Drag-and-drop uploads
* File preview
* Version history
* Search by filename, client, invoice number, or date
* Tags and categories
* Secure cloud storage
* Download and printing
* Replace or archive files
* Access permissions based on user roles

---

## Certified Copies

Users can generate a certified copy of any invoice, receipt, quotation, or financial document.

Certified copies should include:

* Company logo
* Company details
* Unique certification number
* Original document number
* Date and time certified
* "Certified True Copy" watermark
* Digital certification statement
* Name of the staff member who certified the document
* Company signature (uploaded image)
* Optional company stamp or seal
* QR code linking to the document verification page
* Tamper-evident verification hash

The certified copy should be exported as a professionally formatted PDF.

---

## Email Delivery

Users can email documents directly from the application.

Supported documents include:

* Invoices
* Receipts
* Certified Copies
* Quotations
* Credit Notes
* Statements of Account
* Purchase Orders
* Custom Reports

Email features:

* Multiple recipients (To, CC, BCC)
* Custom subject line
* Rich text email editor
* Company-branded email templates
* Attach multiple documents
* Include download links or PDF attachments
* Schedule emails for future delivery
* Save draft emails
* Resend previously sent emails
* Automatic email history
* Delivery status tracking
* Read/open tracking (where supported)
* Email reminders for overdue invoices
* Bulk email selected invoices or statements

---

## Email Templates

Provide customizable templates for:

* New Invoice
* Invoice Reminder
* Receipt
* Certified Invoice
* Certified Receipt
* Statement of Account
* Quotation
* Credit Note
* Welcome Email
* Thank You for Payment

Allow administrators to edit templates using placeholders such as:

* Client Name
* Company Name
* Invoice Number
* Invoice Date
* Due Date
* Outstanding Balance
* Total Amount
* Staff Name
* Company Contact Information

---

## Document Verification

The system should include a public verification page where recipients can verify the authenticity of a certified document by entering or scanning:

* Certification Number
* Invoice Number
* QR Code

The verification page should display:

* Verification status (Valid, Invalid, Revoked)
* Company name
* Client name (optional)
* Invoice number
* Certification date
* Document type
* Document status
* Digital verification hash
* Timestamp of certification

This feature provides recipients with confidence that the document they received is authentic and has not been altered.
