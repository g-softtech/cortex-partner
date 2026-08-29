import { describe, it, expect } from 'vitest';
import { assessmentSchema } from '@/lib/validations/assessment';
import { ProjectStatus, OpportunityStatus } from '@prisma/client';

describe('Assessment Validation', () => {
  it('validates a complete valid assessment', () => {
    const validData = {
      partnerPrice: '50000',
      estimatedTimeline: '6 months',
      scope: 'Full stack web application',
      adminNotes: 'Looks like a solid proposal.',
      opportunityStatus: OpportunityStatus.HIGH,
      newStatus: ProjectStatus.PRICED,
    };

    const result = assessmentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid status transition', () => {
    const invalidData = {
      partnerPrice: '50000',
      opportunityStatus: OpportunityStatus.HIGH,
      // Status not allowed in assessment schema enum mapping
      newStatus: 'SOME_FAKE_STATUS', 
    };

    const result = assessmentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('allows empty adminNotes', () => {
    const data = {
      partnerPrice: '1000',
      adminNotes: '',
      opportunityStatus: OpportunityStatus.HIGH,
      newStatus: ProjectStatus.PRICED,
    };

    const result = assessmentSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
