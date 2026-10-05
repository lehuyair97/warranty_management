import { EmployeeRole, TicketStatus } from '../constants';
import {
  checkCanTransitionStatus,
  checkTechnicianAssignmentViolation,
  checkTicketProcessViolation,
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

describe('TicketFlowHelper - Assignment & Process Role Rules', () => {
  const manager = { id: 1, role: EmployeeRole.MANAGER };
  const receptionist = { id: 2, role: EmployeeRole.RECEPTIONIST };
  const tech1 = { id: 7, role: EmployeeRole.TECHNICIAN };
  const tech2 = { id: 8, role: EmployeeRole.TECHNICIAN };

  describe('checkTechnicianAssignmentViolation', () => {
    it('allows managers and receptionists to assign any technician anytime', () => {
      expect(checkTechnicianAssignmentViolation(manager, null, 7)).toBeNull();
      expect(checkTechnicianAssignmentViolation(manager, 7, 8)).toBeNull();
      expect(checkTechnicianAssignmentViolation(receptionist, null, 7)).toBeNull();
      expect(checkTechnicianAssignmentViolation(receptionist, 7, 8)).toBeNull();
    });

    it('allows a technician to self-assign an unassigned ticket', () => {
      expect(checkTechnicianAssignmentViolation(tech1, null, 7)).toBeNull();
      expect(checkTechnicianAssignmentViolation(tech1, undefined, 7)).toBeNull();
    });

    it('forbids a technician from assigning tickets to another technician', () => {
      expect(checkTechnicianAssignmentViolation(tech1, null, 8)).toBe(
        'Kỹ thuật viên chỉ có thể tự nhận phiếu cho chính mình.',
      );
    });

    it('forbids a technician from reassigning an already assigned ticket', () => {
      expect(checkTechnicianAssignmentViolation(tech1, 7, 7)).toBe(
        'Phiếu này đã có kỹ thuật viên phụ trách. Chỉ Lễ tân hoặc Quản lý mới có quyền điều phối lại.',
      );
      expect(checkTechnicianAssignmentViolation(tech1, 8, 7)).toBe(
        'Phiếu này đã có kỹ thuật viên phụ trách. Chỉ Lễ tân hoặc Quản lý mới có quyền điều phối lại.',
      );
    });
  });

  describe('checkTicketProcessViolation', () => {
    it('allows managers and receptionists to process and update any ticket', () => {
      expect(checkTicketProcessViolation(manager, 7, 8)).toBeNull();
      expect(checkTicketProcessViolation(receptionist, null, 7)).toBeNull();
    });

    it('allows technician to process their assigned ticket', () => {
      expect(checkTicketProcessViolation(tech1, 7, undefined)).toBeNull();
      expect(checkTicketProcessViolation(tech1, 7, 7)).toBeNull();
    });

    it('forbids technician from processing tickets assigned to another technician', () => {
      expect(checkTicketProcessViolation(tech1, 8, undefined)).toBe(
        'Bạn không phải là kỹ thuật viên được phân công cho phiếu này.',
      );
    });

    it('forbids technician from changing technician during process update', () => {
      expect(checkTicketProcessViolation(tech1, 7, 8)).toBe(
        'Kỹ thuật viên không có quyền thay đổi người phụ trách phiếu sửa chữa.',
      );
    });
  });
});


