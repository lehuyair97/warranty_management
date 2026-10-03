import { TicketStatus } from '../constants';
import {
  checkCanTransitionStatus,
  formatTicketCode,
  maskPhoneNumber,
  parseTicketCode,
} from './ticket-flow.helper';

describe('TicketFlowHelper - checkCanTransitionStatus', () => {
  it('should allow transition to the same status (idempotent)', () => {
    expect(checkCanTransitionStatus(TicketStatus.RECEIVED, TicketStatus.RECEIVED)).toBe(true);
    expect(checkCanTransitionStatus(TicketStatus.REPAIRING, TicketStatus.REPAIRING)).toBe(true);
  });

  it('should allow valid forward transitions', () => {
    expect(checkCanTransitionStatus(TicketStatus.RECEIVED, TicketStatus.INSPECTING)).toBe(true);
    expect(checkCanTransitionStatus(TicketStatus.INSPECTING, TicketStatus.REPAIRING)).toBe(true);
    expect(checkCanTransitionStatus(TicketStatus.INSPECTING, TicketStatus.WAITING_FOR_PARTS)).toBe(true);
    expect(checkCanTransitionStatus(TicketStatus.WAITING_FOR_PARTS, TicketStatus.REPAIRING)).toBe(true);
    expect(checkCanTransitionStatus(TicketStatus.REPAIRING, TicketStatus.COMPLETED)).toBe(true);
    expect(checkCanTransitionStatus(TicketStatus.COMPLETED, TicketStatus.DELIVERED)).toBe(true);
  });

  it('should allow cancellation from early and active states', () => {
    expect(checkCanTransitionStatus(TicketStatus.RECEIVED, TicketStatus.CANCELLED)).toBe(true);
    expect(checkCanTransitionStatus(TicketStatus.INSPECTING, TicketStatus.CANCELLED)).toBe(true);
    expect(checkCanTransitionStatus(TicketStatus.REPAIRING, TicketStatus.CANCELLED)).toBe(true);
  });

  it('should disallow invalid backward or terminal state transitions', () => {
    // Cannot reopen delivered tickets
    expect(checkCanTransitionStatus(TicketStatus.DELIVERED, TicketStatus.REPAIRING)).toBe(false);
    expect(checkCanTransitionStatus(TicketStatus.DELIVERED, TicketStatus.RECEIVED)).toBe(false);

    // Cannot transition from cancelled
    expect(checkCanTransitionStatus(TicketStatus.CANCELLED, TicketStatus.RECEIVED)).toBe(false);

    // Cannot jump straight from received to delivered
    expect(checkCanTransitionStatus(TicketStatus.RECEIVED, TicketStatus.DELIVERED)).toBe(false);
  });
});

describe('TicketFlowHelper - Code & Phone Utilities', () => {
  it('should parse ticket code correctly', () => {
    expect(parseTicketCode('10')).toBe(10);
    expect(parseTicketCode('TK-0010')).toBe(10);
    expect(parseTicketCode('tk-0025')).toBe(25);
    expect(parseTicketCode('#99')).toBe(99);
    expect(parseTicketCode('invalid')).toBeNull();
    expect(parseTicketCode('')).toBeNull();
  });

  it('should format ticket code with 4 digit padding', () => {
    expect(formatTicketCode(5)).toBe('TK-0005');
    expect(formatTicketCode(120)).toBe('TK-0120');
    expect(formatTicketCode(10500)).toBe('TK-10500');
  });

  it('should mask phone number for privacy', () => {
    expect(maskPhoneNumber('0901234567')).toBe('09****4567');
    expect(maskPhoneNumber('0987654321')).toBe('09****4321');
    expect(maskPhoneNumber('123')).toBe('123');
  });
});

