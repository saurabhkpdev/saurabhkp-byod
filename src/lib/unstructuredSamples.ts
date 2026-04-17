export const UNSTRUCTURED_SAMPLE_DOCUMENTS: Record<string, { file: string; label: string }> = {
  'lease-extraction': {
    file: '/samples/lease-agreement-sample.txt',
    label: 'lease-agreement-sample.txt',
  },
  'invoice-extraction': {
    file: '/samples/invoice-sample.txt',
    label: 'invoice-sample.txt',
  },
  'contract-extraction': {
    file: '/samples/contract-sample.txt',
    label: 'contract-sample.txt',
  },
  'resume-parser': {
    file: '/samples/resume-sample.txt',
    label: 'resume-sample.txt',
  },
  'medical-records': {
    file: '/samples/medical-record-sample.txt',
    label: 'medical-record-sample.txt',
  },
};

export const UNSTRUCTURED_SAMPLE_ROWS: Record<string, Record<string, unknown>[]> = {
  'lease-extraction': [
    {
      landlord_name: 'Acme Property Management LLC',
      tenant_name: 'Sarah Johnson',
      property_address: '456 Oak Avenue, Apt 3B, San Francisco, CA 94110',
      lease_start_date: '2024-04-01',
      lease_end_date: '2025-03-31',
      monthly_rent: 3200,
      security_deposit: 4800,
      lease_term_months: 12,
    },
  ],
  'invoice-extraction': [
    {
      invoice_number: 'INV-2024-00892',
      vendor_name: 'TechSupply Co.',
      bill_to: 'Globex Corporation',
      issue_date: '2024-02-14',
      due_date: '2024-03-15',
      subtotal: 3443.87,
      tax_amount: 284.12,
      total_amount: 3772.99,
      currency: 'USD',
    },
  ],
  'contract-extraction': [
    {
      contract_title: 'Service Agreement',
      party_a: 'Northwind Solutions Ltd.',
      party_b: 'Vertex Health Group',
      effective_date: '2024-01-01',
      expiration_date: '2025-12-31',
      contract_value: 250000,
      governing_law: 'California',
      termination_notice_days: 30,
    },
  ],
  'resume-parser': [
    {
      candidate_name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '(650) 555-0188',
      location: 'San Jose, CA',
      current_title: 'Senior Software Engineer',
      current_company: 'Stripe',
      years_experience: 8,
      education: 'B.S. Computer Science, University of California, Berkeley',
      skills: 'TypeScript, Python, Go, React, Node.js, PostgreSQL',
    },
  ],
  'medical-records': [
    {
      patient_id: 'MRN-00478291',
      patient_name: 'Robert Martinez',
      date_of_birth: '1978-09-22',
      visit_date: '2024-03-08',
      provider_name: 'Dr. Emily Park, MD',
      chief_complaint: 'Persistent fatigue and intermittent headaches for the past 3 weeks',
      diagnoses: 'Essential hypertension (I10), Vitamin D deficiency (E55.9), Tension-type headache (G44.209)',
      prescriptions: 'Lisinopril 10mg, Vitamin D3 2000 IU, Acetaminophen 500mg',
      next_appointment: '2024-04-19',
    },
  ],
};
